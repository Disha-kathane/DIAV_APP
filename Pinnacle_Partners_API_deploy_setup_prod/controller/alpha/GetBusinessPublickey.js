const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const async = require('async');
var appLoggers = require('../../applogger.js');
const wabot_db = require('../../db/database');
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

        let getphonenumberid = function (callback) {
            userService.phonenumberid1(wanumber, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    let phonenumberid2 = result[0].phone_number_id;
                    callback(null, wanumber, phonenumberid2);
                } else {
                    res.send({
                        code: 'WA001',
                        status: 'FAILED',
                        message: 'invalid number',
                        data: {}
                    });
                }
            });
        };

        let getusers = function (wanumber, phonenumberid2, callback,) {
            userService.getUserId1(apikeys, wanumber, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    userid = result[0].userid;
                    callback(null, userid, wanumber, phonenumberid2);

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
        let getwabaid = function (userid, wanumber, phonenumberid2, callback) {
            console.log({ getwabaid });
            userService.getWabaId(userid, wanumber, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    wabaid = result[0].whatsapp_business_account_id;
                    callback(null, wabaid, userid, phonenumberid2);

                }
            });
        };


        let getusersetting = function (wabaid, userid, phonenumberid2, callback) {
            userService.getAccessToken((err, result) => {
                if (err) {
                    console.log({
                        err
                    });
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    SystemAccessToken = result[0].value;
                    callback(null, SystemAccessToken, wabaid, userid, phonenumberid2);
                }

            });
        };

        let GetBusinessPublicKey1 = function (SystemAccessToken, wabaid, userid, phonenumberid2, callback) {
            whatsappService.GetBusinessPublicKey(SystemAccessToken, phonenumberid2, (err, result) => {
                if (err) {
                    console.log(err.response.data.error.message);
                    return callback(err);
                }
                else {
                    console.log(result.data);
                    callback(null, result.data.data);
                }
            });
        };

        async.waterfall([getphonenumberid, getusers, getwabaid, getusersetting, GetBusinessPublicKey1], function (err, result) {
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

