
const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const fs = require('fs');
const async = require('async');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
//Create template api on whatsapp bussiness account

module.exports = (req, res) => {
    try {
        console.log('flows_TEMPLATE : ' + JSON.stringify(req.body));
        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let flowid = req.body.flowid;
        let name = req.body.name;
        let asset_type = req.body.asset_type;
        let file = req.files.file[0].path;

        console.log('FILE_PATH : ' + file);

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
        if (name != "flow.json") {
            return {
                code: 'WA005',
                status: 'FAILED',
                message: 'name is invalid',
                data: {}
            };

        }
        if (asset_type != "FLOW_JSON") {
            return {
                code: 'WA005',
                status: 'FAILED',
                message: 'asset_type is invalid',
                data: {}
            };

        }



        if (req.files.file[0].path == 0) {
            return {
                code: 'WA005',
                status: 'FAILED',
                message: 'file is required',
                data: {}
            };

        }

        let getusers = function (callback) {
            // console.log({getusers})
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
            console.log({ getwabaid });
            userService.getWabaId(userid, wanumber, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    wabaid = result[0].whatsapp_business_account_id;
                    console.log(userid, wabaid, "---------------------------------------------");
                    callback(null, wabaid, userid);

                }
            });
        };

        let getusersetting = function (wabaid, userid, callback) {
            console.log({ getusersetting });
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

        let createFlow2 = function (SystemAccessToken, wabaid, userid, callback) {
            // console.log({ SystemAccessToken, wabaid, userid });
            whatsappService.messageFlowJSON(SystemAccessToken, flowid, name, asset_type, file, (err, result) => {
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
                    // console.log(JSON.stringify(result));
                    callback(null, result);
                }

            });
        };

        async.waterfall([getusers, getwabaid, getusersetting, createFlow2], function (err, result) {


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
                    message: 'JSON Uploaded Successfully',
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



