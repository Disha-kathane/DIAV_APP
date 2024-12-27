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
            // console.log({getusers})
            userService.phonenumberid1(wanumber, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    // console.log(result[0].phone_number_id);
                    let phonenumberid2 = result[0].phone_number_id;
                    // console.log(phonenumberid2);
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
            // console.log({getusers})
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
                    // console.log(userid, wabaid, "---------------------------------------------");
                    callback(null, wabaid, userid, phonenumberid2);

                }
            });
        };


        let getusersetting = function (wabaid, userid, phonenumberid2, callback) {
            // console.log({ getusersetting })
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
        // console.log("111----------------------------------------------------__--_" + phonenumberid2);

        let GetBusinessPublicKey1 = function (SystemAccessToken, wabaid, userid, phonenumberid2, callback) {

            userService.GetprivateKeyfromdb(wabaid, (err, GetBusinessPublicKeyStatusresult) => {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    let privatekey = GetBusinessPublicKeyStatusresult
                    if (privatekey.length > 0) {
                        callback(null, GetBusinessPublicKeyStatusresult[0]);
                    } else {
                        console.log("whatsapp business encryption keys not genrated");
                        return callback("whatsapp business encryption keys not genrated");
                    }
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
                    message: 'Sucessfully loaded business private key',
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

