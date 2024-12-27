const async = require('async');
const { errorLogger, infoLogger } = require('../../applogger');
const botUtils = require('../../utils/bot');
const validator = require('validator');
const sendService = require('../../services/v1/send');
const metricService = require('../../services/v1/metric');
const whatsappService = require('../../services/v1/whatsapp');
const moment = require('moment');

module.exports = async (req, res) => {
    try {
        let apiKey = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
        let wanumber = (typeof req.body.wanumber != undefined) ? req.body.wanumber + '' : '';
        let startdate = (typeof req.body.start != undefined) ? req.body.start + '' : '';
        let enddate = (typeof req.body.end != undefined) ? req.body.end + '' : '';
        let country_code = (typeof req.body.countrycode != undefined) ? req.body.countrycode + '' : '';;
        let data = [];

        let validateMobileNumber = (done) => {
            let isMobileError = false;

            if (Object.keys(wanumber).length > 0) {
                wanumber = wanumber.split(",");
                wanumber.forEach((entry, index) => {
                    if (botUtils.isMobileInternational(entry)) {
                        isMobileError = true;
                    }
                });
            }
            else {
                return done({
                    code: 'WA001',
                    status: 'FAILED',
                    message: 'Mobile number object is invalid'
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

        let validateCountryCode = (cc, done) => {
            let isCCError = false;

            if (Object.keys(country_code).length > 0) {
                country_code = country_code.split(",");
                country_code.forEach((entry, index) => {
                    if (entry.length > 0) {
                        isCCError = true;
                    }

                    if (isCCError && index == country_code.length - 1) {
                        done(null, cc);
                    }
                });
            }
            else {
                country_code = '[]';
                done(null, cc);
            }
        }

        let validateDate = (cc, done) => {
            startdate = new Date(startdate.concat('T00:00:00'));
            enddate = new Date(enddate.concat('T00:00:00'));
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
                        code: err.errno,
                        status: 'FAILED',
                        message: err.code
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
                        code: err.errno,
                        status: 'FAILED',
                        message: err.code
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
                    return done({
                        code: err.errno,
                        status: 'FAILED',
                        message: err.code
                    });
                }
                else {
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
                }
            });
        }

        let fetchMetric = (access_token, wabainfo, done) => {
            let fields = 'analytics.start(' + startdate + ').end(' + enddate + ').granularity(DAY).phone_numbers(' + wanumber + ').country_codes(' + country_code + ')';
            console.log(fields);
            whatsappService.getMetrics(fields, access_token, wabainfo.wabaid, (err, result) => {
                if (err) {
                    return done({
                        code: err.errno,
                        status: 'FAILED',
                        message: err.code
                    });
                }
                else {
                    if (result.analytics != undefined) {
                        if (result.analytics.data_points != undefined) {
                            let tmpData = result.analytics.data_points;

                            if (tmpData.length > 0) {

                                tmpData.forEach((item, index) => {
                                    let sdate = new Date(parseInt(item.start) * 1000);
                                    let edate = new Date(parseInt(item.end) * 1000);

                                    data.push({
                                        start_date: moment(sdate).format().replace('T', ' ').replace('+05:30', ''),
                                        end_date: moment(edate).format().replace('T', ' ').replace('+05:30', ''),
                                        msg_sent: item.sent,
                                        msg_delivered: item.delivered
                                    });

                                    if (index == tmpData.length - 1) {
                                        done(null, data);
                                    }
                                });
                            }

                        }
                    }
                }
            });
        }

        async.waterfall([
            validateMobileNumber, validateCountryCode, validateDate, validateApiKey, getSystemAccessToken, getWabaInfo, fetchMetric
        ], (err, result) => {
            if (err) {
                console.log(err);
                res.send(err);
                return;
            } else {
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

        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}