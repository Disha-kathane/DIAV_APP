const async = require('async');
const botUtils = require('../../utils/bot');
const validator = require('validator');
const sendService = require('../../services/v1/send');
const metricService = require('../../services/v1/metric');
const whatsappService = require('../../services/v1/whatsapp');
const moment = require('moment');

const {
    errorLogger,
    infoLogger
} = require('../../applogger');

module.exports = async (req, res) => {
    try {
        errorLogger.info(req.body);
        let apiKey = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
        let wanumber = (typeof req.body.wanumber != undefined) ? req.body.wanumber + '' : '';
        let startdate = (typeof req.body.start != undefined) ? req.body.start + '' : '';
        let enddate = (typeof req.body.end != undefined) ? req.body.end + '' : '';
        let data = [];

        let validateMobileNumber = (done) => {
            let isMobileError = false;
            if (wanumber == undefined || wanumber.length == 0) {
                done(null, wanumber);
            }
            else {
                if (Object.keys(wanumber).length > 0) {
                    wanumber = wanumber.split(",");
                    wanumber.forEach((entry, index) => {
                        if (botUtils.isMobileInternational(entry)) {
                            isMobileError = true;
                        }
                    });
                }
                if (isMobileError) {
                    done(null, '1');
                }
                else {
                    return done({
                        code: 'WA001',
                        status: 'FAILED',
                        message: 'Mobile number is invalid'
                    });
                }
            }
        }

        let validateDate = (cc, done) => {
            startdate = new Date(startdate.concat('T00:00:00'));
            enddate = new Date(enddate.concat('T23:59:59'));
            if (!botUtils.isValidDate(startdate)) {
                return done({
                    code: 'WA002',
                    status: 'FAILED',
                    message: 'Start date is invalid'
                });
            }
            else if (!botUtils.isValidDate(enddate)) {
                return done({
                    code: 'WA003',
                    status: 'FAILED',
                    message: 'End date is invalid'
                });
            }
            else {
                startdate = startdate.getTime() / 1000;
                enddate = enddate.getTime() / 1000;
                done(null, cc);
            }
        }

        let validateApiKey = (cc, done) => {
            sendService.getApiKey(apiKey, (err, result) => {
                if (err) {
                    return done({
                        message: err.message
                    });
                } else {
                    if (result != null && result.length > 0) {
                        if (result[0].userstatus == 1) {
                            done(null, result[0].userid);
                        } else {
                            return done({
                                code: 'WA004',
                                status: 'FAILED',
                                message: 'User is Inactive'
                            });
                        }
                    }
                    else {
                        return done({
                            code: 'WA005',
                            status: 'FAILED',
                            message: 'Authentication Failed'
                        });
                    }
                }
            });
        }

        let getSystemAccessToken = (user_id, done) => {
            metricService.getSystemAccessToken((err, result) => {
                if (err) {
                    return done({
                        message: err.message
                    });
                }
                else {
                    done(null, user_id, result[0].value);
                }
            });
        }

        let getWabaInfo = (user_id, access_token, done) => {
            metricService.getWabaInfo(user_id, (err, result) => {
                if (err) {
                    // return done({
                    //     message: err.message
                    // });
                    done(err);

                }

                if (result.length > 0) {
                    done(null, access_token, result[0]);
                }
                else {
                    return done({
                        code: 'WA006',
                        status: 'FAILED',
                        message: 'No Waba ID Found'
                    });
                }

            });
        }

        let fetchMetric = (access_token, wabainfo, done) => {
            let fields = 'conversation_analytics.start(' + startdate + ').end(' + enddate + ').granularity(DAILY).phone_numbers( [' + wanumber + ']).dimensions(["conversation_type", "COUNTRY","conversation_direction", "phone"])';
            //console.log(fields);
            whatsappService.getConversationMetrics(fields, access_token, wabainfo.wabaid, (err, result) => {
                if (err) {
                    // console.log(JSON.stringify(err));
                    res.status(err.response.status);
                    return done({
                        code: 'WA100',
                        status: 'FAILED',
                        message: err.message
                    });
                }
                else {
                    // console.log("getConversationMetrics", JSON.stringify(result));
                    if (result.conversation_analytics != undefined) {
                        if (result.conversation_analytics.data != undefined) {
                            let tmpData = result.conversation_analytics.data[0].data_points;
                            console.log(tmpData);

                            if (tmpData.length > 0) {

                                tmpData.forEach((item, index) => {
                                    let sdate = new Date(parseInt(item.start) * 1000);
                                    let edate = new Date(parseInt(item.end) * 1000);

                                    data.push({
                                        start_date: moment(sdate).format().replace('T', ' ').replace('+05:30', ''),
                                        end_date: moment(edate).format().replace('T', ' ').replace('+05:30', ''),
                                        conversation: item.conversation,
                                        phone_number: item.phone_number,
                                        country: item.country,
                                        conversation_type: item.conversation_type,
                                        conversation_direction: item.conversation_direction,
                                        cost: item.cost
                                    });

                                    if (index == tmpData.length - 1) {
                                        done(null, data);
                                    }
                                });
                            }

                        }
                    } else {
                        done(null, data)
                    }
                }
            });
        }

        async.waterfall([
            validateMobileNumber, validateDate, validateApiKey, getSystemAccessToken, getWabaInfo, fetchMetric
        ], (err, result) => {
            // console.log("fetched ", result);
            errorLogger.error(err);
            if (err) {
                //console.log(err);
                res.send(err);
                return;
            } else {
                errorLogger.info(result);
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'Metrics Fetched Successfully',
                    data: result
                });
            }
        });
    }
    catch (error) {
        errorLogger.error(JSON.stringify(error));
        res.status(500);
        res.send({
            code: 'WA101',
            status: 'FAILED',
            message: error.message != undefined ? error.message : 'Request Failed',
            data: []
        });
    }
}