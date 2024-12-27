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
        let templatetype = req.body.templatetype;
        let mediatype = null;

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
        if (!req.body.templatetype) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'Template Type is required',
                data: {}
            };
        }

        if (templatetype.toString().toLowerCase() == "DOCUMENT".toString().toLowerCase()) {
            mediatype = 0;
        }
        if (templatetype.toString().toLowerCase() == "IMAGE".toString().toLowerCase()) {
            mediatype = 1;
        }
        if (templatetype.toString().toLowerCase() == "VIDEO".toString().toLowerCase()) {
            mediatype = 2;
        }
        if (templatetype.toString().toLowerCase() == "TEXT".toString().toLowerCase()) {
            mediatype = 0;
        }
        if (templatetype.toString().toLowerCase() == "CAROUSEL".toString().toLowerCase()) {
            mediatype = 6;
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
                    callback(null, userid, wanumber);

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

        let getwabaid = function (userid, wanumber, callback) {

            userService.getWabaId(userid, wanumber, (err, result) => {
                if (err) {
                    console.log('getWabaId error==============>' + err);
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    wabaid = result[0].whatsapp_business_account_id;
                    callback(null, userid, wabaid);
                }
            });
        };

        let getusersetting = function (userid, wabaid, callback) {
            userService.getAccessToken((err, result) => {
                if (err) {
                    console.log('getAccessToken error==============>' + err);
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    SystemAccessToken = result[0].value;
                    callback(null, SystemAccessToken, userid, wabaid);
                }

            });
        };

        let fetchtemplateid = function (SystemAccessToken, userid, wabaid, callback) {
            // console.log({ResponseId})
            userService.fetchalltemplateinfo(userid, mediatype, (err, result) => {
                if (err) {
                    console.log(err);
                    let tempError = err.response.data.error.error_user_msg;
                    return callback(tempError);
                }
                else if (result != undefined && result.length > 0) {
                    console.log("data-------------->", result);
                    callback(null, result);
                } else {
                    return callback('Template not found');
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
                    message: 'Template Information fetch Successfully',
                    data: result
                });
            }
        });

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
    }
};