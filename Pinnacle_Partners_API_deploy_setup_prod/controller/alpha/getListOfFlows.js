
const whatsappService = require('../../services/v1/whatsapp.js');
const userService = require('../../services/v1/userStat.js');
const async = require('async');
var appLoggers = require('../../applogger.js');
const { response } = require('express');
var errorLogger = appLoggers.errorLogger;

//Create template api on whatsapp bussiness account

module.exports = (req, res) => {

    try {

        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;

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
        let GetListOfFlows = function (SystemAccessToken, wabaid, userid, callback) {
            whatsappService.GetListOfFlows1(SystemAccessToken, wabaid, (err, result) => {
                if (err) {
                    console.log({
                        err
                    });
                    return callback(err);
                }
                else {

                    {
                        callback(null, result.data.data);
                    }
                }
            });
        };

        async.waterfall([getusers, getwabaid, getusersetting, GetListOfFlows], function (err, result) {
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
                    message: 'Sucessfully loaded business public key',
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
