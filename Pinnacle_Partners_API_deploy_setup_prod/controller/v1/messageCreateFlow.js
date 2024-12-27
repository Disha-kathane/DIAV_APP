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
        let name = req.body.name;
        let categories = req.body.categories;
        let clone_flow_id = req.body.clone_flow_id;
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

        if (req.body.categories.length == 0) {
            return {
                code: 'WA005',
                status: 'FAILED',
                message: 'Category is required',
                data: {}
            };

        }
        if (req.body.name == "") {
            return {
                code: 'WA005',
                status: 'FAILED',
                message: 'name is required',
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
        let createFlow = function (SystemAccessToken, wabaid, userid, callback) {
            // console.log({ SystemAccessToken, wabaid, userid });
            whatsappService.messageFlow(SystemAccessToken, wabaid, name, categories, clone_flow_id, (err, result) => {
                if (err) {
                    console.log("err-------------------------------------------------> ", err);
                    let tempError = null;
                    if (err.response.data.error.error_user_msg != undefined) {
                        tempError = err.response.data.error.error_user_msg;
                    }
                    else if (err.response.data.error.message != undefined) {
                        tempError = err.response.data.error.message;
                    } else {
                        tempError = err;
                    }
                    // console.log(tempError);
                    callback(tempError);
                } else {
                    userService.insertWhatsappFlow(userid, wanumber, name, JSON.stringify(categories), 0, result.id, (err, insertWhatsappFlowresult) => {
                        if (err) {
                            console.log(err);
                            callback(err);
                        } else {

                            callback(null, result);
                            // console.log("inserted d/ata", insertWhatsappFlowresult);
                        }
                    });

                }

            });
        };

        async.waterfall([getusers, getwabaid, getusersetting, createFlow], function (err, result) {

            if (err) {
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : err,

                }
                );
            } else {
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'FLOW Generated Successfully',
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

