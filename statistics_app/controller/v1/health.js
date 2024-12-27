const userService = require('../../services/v1/userStat');
const whatsappService = require('../../services/v1/whatsapp');
const async = require('async');
var validator = require('validator');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');
const {
    callWebhook
} = require('../../utils/bot');


module.exports = async (req, res) => {
    try {
        // console.log(req.body);
        errorLogger.info(req.body);
        let apikeys = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
        let wanumber = (typeof req.body.wanumber != undefined) ? req.body.wanumber + '' : '';
        // wanumber = wanumber.replace("+", "");
        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: []
            };
        }

        if (wanumber.length == 0) {
            return {
                code: 'WA004',
                status: 'FAILED',
                message: 'Mobile Number is required',
                data: []
            };
        }

        let getusers = function (callback) {
            userService.getUserId(apikeys, (err, result) => {
                if (err) {
                    return callback(err.message);
                }
                if (result != null && result.length > 0) {
                    userid = result[0].userid;
                    callback(null, userid);

                } else {
                    res.send({
                        code: 'WA002',
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: []
                    });
                }
            });
        }

        let getusersetting = function (userid, callback) {
            userService.getUserSettings(userid, wanumber, (err, result) => {
                // console.log("In get settings", result);
                if (err) {
                    return callback(err.message);
                }
                if (result != undefined && result != null && result.length > 0) {
                    let authtoken = result[0].authtoken;
                    let waurl = result[0].waurl;
                    callback(null, authtoken, waurl);
                } else {
                    res.send({
                        code: 'WA003',
                        status: 'FAILED',
                        message: 'Correct Mobile Number is required',
                        data: []
                    });

                }
            });
        }

        let gethealth = function (authtoken, waurl, callback) {
            whatsappService.getHealth(authtoken, waurl, '/v1/health', (err, result) => {
                // console.log("In get health", result);
                if (err) {
                    return callback(err.message);
                }
                if (result.health.gateway_status != undefined) {
                    wastatus = result.health.gateway_status
                    // console.log('wastatus', wastatus);
                    callback(null, wastatus);

                } else if (result.health.gateway_status == undefined) {
                    let data = result.health;
                    Object.keys(data).forEach(function (key) {
                        var value = data[key];
                        if (value.role == 'coreapp') {
                            wastatus = value.gateway_status;
                            // console.log(wastatus);
                            return;
                        }
                    });
                    //console.log(wastatus);
                    callback(null, wastatus);
                }
            });
        }

        async.waterfall([getusers, getusersetting, gethealth], function (err, result) {
            // console.log("data", result);
            if (err) {
                errorLogger.error(err);
                res.status(err.response != undefined && err.response.status != undefined ? err.response.status : 200);
                res.send({
                    code: 200,
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : 'The specified WABA might be offline or out of service',
                    data: [{
                        health: 'disconnected'
                    }]
                });
                return;
            } else {
                errorLogger.info(result);
                res.send({
                    code: 200,
                    status: 'success',
                    message: 'Health fetched Successfully',
                    data: [{
                        health: result
                    }]
                });
            }
        });
    } catch (error) {
        //console.log("thrwo err", error);
        errorLogger.error(JSON.stringify(error));
        res.status(500);
        res.send({
            code: 'WA101',
            status: 'FAILED',
            message: error.message != undefined ? error.message : 'Request Failed',
            data: []
        });
        // return error;
    }
}