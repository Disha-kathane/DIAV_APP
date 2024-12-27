const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const async = require('async');

var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = (req, res) => {
    try {
        console.log(JSON.stringify(req.body));
        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let ResponseId = req.body.ResponseId;

        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        if (!req.headers.wanumber) {
            return {
                code: 'WA002',
                status: 'FAILED',
                message: 'Wanumber Key is required',
                data: {}
            };
        }
        if (!req.body.ResponseId) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'ResponseId is required',
                data: {}
            };
        }

        let getusers = function (callback) {
            userService.getUserId(apikeys, wanumber, (err, result) => {
                if (err) {
                    console.log('getUserId error==============>' + err);
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    userid = result[0].userid;
                    // console.log({userid},{wanumber})
                    callback(null, userid, wanumber, ResponseId);

                } else {
                    res.send({
                        code: 'WA006',
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: {}
                    });
                }
            });
        };

        let getwabaid = function (userid, wanumber, ResponseId, callback) {

            userService.getWabaId(userid, wanumber, (err, result) => {
                if (err) {
                    console.log('getWabaId error==============>' + err);
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    wabaid = result[0].whatsapp_business_account_id;
                    callback(null, wabaid, ResponseId);
                }
            });
        };

        let getusersetting = function (wabaid, ResponseId, callback) {
            userService.getAccessToken((err, result) => {
                if (err) {
                    console.log('getAccessToken error==============>' + err);
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    SystemAccessToken = result[0].value;
                    callback(null, SystemAccessToken, wabaid, ResponseId);
                }

            });
        };

        let fetchtemplateid = function (SystemAccessToken, wabaid, ResponseId, callback) {
            // console.log({ResponseId})
            userService.fetchtemplateId(ResponseId, (err, result) => {
                if (err) {
                    let tempError = err.response.data.error.error_user_msg;
                    return callback(tempError);
                }
                if (result != undefined) {
                    console.log("data-------------->", result);
                    callback(null, result);
                }
            });
        };

        async.waterfall([getusers, getwabaid, getusersetting, fetchtemplateid], function (err, result) {
            if (err) {
                console.log('retriveTemplate err==============>' + JSON.stringify(err));

                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : err
                });
            } else {
                console.log('retriveTemplate result==============>' + JSON.stringify(result));
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'Template Id fetch Successfully',
                    data: result
                });
            }
        });

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));

    }
};