
const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const fs = require('fs');
const async = require('async');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

//Create template api on whatsapp bussiness account

module.exports = (req, res) => {

    try {
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

        if (flowid == "") {
            return {
                code: 'WA005',
                status: 'FAILED',
                message: 'flowid is invalid',
                data: {}
            };

        }


        let getusers = function (callback) {
            userService.getUserId1(apikeys, wanumber, (err, result) => {
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

        let depricateflow1 = function (SystemAccessToken, wabaid, userid, callback) {
            whatsappService.depricateflow(SystemAccessToken, flowid, (err, result) => {
                if (err) {
                    console.log({
                        err
                    });
                    let temp = err.response.data.error.error_user_msg;
                    return callback(temp);
                } else {
                    userService.UpdateWhatsappFlowStatustoDepricate(flowid, (err, UpdateWhatsappFlowStatustoDepricateresult) => {
                        if (err) {
                            console.log(err);
                            callback(err);
                        } else {

                            callback(null, result.data);
                            console.log("Flow Depricated successfully", UpdateWhatsappFlowStatustoDepricateresult);
                        }
                    });
                }

            });
        };

        async.waterfall([getusers, getwabaid, getusersetting, depricateflow1], function (err, result) {
            if (err) {
                console.log(err);
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : err,

                });
            } else {
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'Sucessfully Depricated Flow ',
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

};
