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
        let templateid = req.body.templateid;

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
        if (!req.body.templateid) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'Template Id is required',
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
                    callback(null, userid, wanumber, templateid);

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

        let getwabaid = function (userid, wanumber, templateid, callback) {

            userService.getWabaId(userid, wanumber, (err, result) => {
                if (err) {
                    console.log('getWabaId error==============>' + err);
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    wabaid = result[0].whatsapp_business_account_id;
                    callback(null, wabaid, templateid);
                }
            });
        };

        let getusersetting = function (wabaid, templateid, callback) {
            userService.getAccessToken((err, result) => {
                if (err) {
                    console.log('getAccessToken error==============>' + err);
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    SystemAccessToken = result[0].value;
                    callback(null, SystemAccessToken, wabaid, templateid);
                }

            });
        };

        let fetchtemplateid = function (SystemAccessToken, wabaid, templateid, callback) {
            // console.log({ResponseId})
            userService.fetchtemplateIdinfo(templateid, (err, result) => {
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
                result[0].body_message = result[0].body_message.toString('utf8');
                result[0].head_text_title = result[0].head_text_title != undefined && result[0].head_text_title != null ? result[0].head_text_title.toString('utf8') : "";
                result[0].head_temptype = result[0].head_temptype != undefined && result[0].head_temptype == 1 ? "media" : "text";
                switch (result[0].head_mediatype) {
                    case "0":
                        result[0].head_mediatype = "document";
                        break;
                    case "1":
                        result[0].head_mediatype = "image";
                        break;
                    case "2":
                        result[0].head_mediatype = "video";
                        break;
                    case "4":
                    case null:
                        result[0].head_mediatype = "text";
                        break;
                    case "5":
                        result[0].head_mediatype = "location";
                }

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