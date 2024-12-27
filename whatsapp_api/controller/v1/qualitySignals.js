const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const appLoggers = require('../../applogger.js');
const async = require('async');
let errorLogger = appLoggers.errorLogger;

module.exports = async(req, res) => {
    try {

        if (!req.headers.apikey) {
            return {
                code: 403,
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        const headers = req.headers;
        const apikeys = (typeof headers.apikey != 'undefined') ? headers.apikey + '' : '';
        let getusers = (callback) => {
            userService.getUserId(apikeys, (err, result) => {
                if (err) {
                    callback(err);
                }

                if (result.length > 0) {
                    const userid = result[0].userid;
                    callback(null, userid);

                } else {
                    res.send({
                        code: 400,
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: {}
                    });
                }
            });
        }
        let getwabaid = (userid, callback) => {
            userService.getWabaId(userid, (err, [result]) => {
                if (err) {
                    callback(err);
                } else {
                    const wabaId = result.whatsapp_business_account_id;
                    callback(null, wabaId)
                }
            });
        }

        let getaccesstoken = (wabaId, callback) => {
            userService.getAccessToken((err, [result]) => {
                if (err) {
                    callback(err);
                } else {
                    const SystemToken = result.value;
                    callback(null, SystemToken, wabaId)

                }
            });
        }

        let getqualitysignal = (SystemToken, wabaId, callback) => {
            whatsappService.getQualitySignal(SystemToken, wabaId, (err, result) => {
                let tempdata = [];
                if (err) {
                    callback(err);
                } else {
                    console.log(result.data);
                    result.data.forEach((entry, index) => {
                        tempdata.push({
                            'name': entry.verified_name,
                            'status':entry.code_verification_status,
                            'phone':entry.display_phone_number.replace(/\s/g, ''),
                            'rating':entry.quality_rating
                        });

                        if (index == result.data.length - 1) {
                            callback(null, tempdata);
                        }
                    });
                }
            });
        }

        async.waterfall([getusers, getwabaid, getaccesstoken, getqualitysignal], function (err, result) {
            if (err) {
                res.send({
                    code: '100',
                    status: 'FAILED',
                    message: err.code
                });
            } else {
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'Successfully Done',
                    data: result
                });
            }
        });

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}