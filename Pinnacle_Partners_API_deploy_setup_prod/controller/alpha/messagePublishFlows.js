
const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const fs = require('fs');
const async = require('async');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
//Create template api on whatsapp bussiness account
module.exports = (req, res) => {
    try {
        // console.log('flows_TEMPLATE : ' + JSON.stringify(req.body));
        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let flowid = req.body.flowid;

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


        let getusers = function (callback) {
            // console.log({getusers})
            userService.getUserId(apikeys, wanumber, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    userid = result[0].userid;
                    callback(null, userid, wanumber);

                } else {
                    res.send({
                        code: 'WA001',
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: {}
                    });
                }
            });
        };

        let getwabaid = function (userid, wanumber, callback) {
            // console.log({getwabaid})
            userService.getWabaId(userid, wanumber, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    wabaid = result[0].whatsapp_business_account_id;
                    callback(null, wabaid, userid);
                }
            });
        };

        let getusersetting = function (wabaid, userid, callback) {
            // console.log({getusersetting})
            userService.getAccessToken((err, result) => {
                if (err) {
                    console.log({
                        err
                    });
                    return callback(err);
                }

                if (result != null && result.length > 0) {
                    SystemAccessToken = result[0].value;
                    callback(null, SystemAccessToken, wabaid, userid);
                }

            });
        };

        let createFlow1 = function (SystemAccessToken, wabaid, userid, callback) {
            console.log({ SystemAccessToken, wabaid, userid });
            whatsappService.messageFlow1(SystemAccessToken, flowid, (err, result) => {
                if (err) {
                    console.log(err);
                    let tempError = null;
                    if (err.response.data.error.error_user_msg != undefined) {
                        tempError = err.response.data.error.error_user_msg;
                    }
                    else if (err.response.data.error.message != undefined) {
                        tempError = err.response.data.error.message;
                    } else {
                        tempError = err;
                    }
                    console.log(tempError);
                    callback(tempError);
                } else {
                    console.log(JSON.stringify(result));
                    userService.UpdateWhatsappFlowStatus(flowid, (err, UpdateWhatsappFlowStatusresult) => {
                        if (err) {
                            console.log(err);
                            callback(err);
                        } else {

                            callback(null, result);
                            console.log("Update status", UpdateWhatsappFlowStatusresult);
                        }
                    });

                }

            });
        };

        async.waterfall([getusers, getwabaid, getusersetting, createFlow1], function (err, result) {

            if (err) {
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : err,

                }, console.log(err, "1")
                );
            } else {
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'FLOW Published Successfully',
                    data: result
                });
            }
        });
    } catch (error) {
        console.log('API_ERROR===========>' + error);
        errorLogger.error(JSON.stringify(error));
        res.send({
            code: 'WA100',
            status: 'FAILED',
            message: error != null ? '' + error : 'Invalid Request'
        });
    }

}



