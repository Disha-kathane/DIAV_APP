const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const fs = require('fs');
const async = require('async');
var appLoggers = require('../../applogger.js');
const wabot_db = require('../../db/database');
const { log } = require('console');
var errorLogger = appLoggers.errorLogger;

//Create template api on whatsapp bussiness account

module.exports = (req, res) => {

    try {

        // console.log('Set Business Public Key  : ' + JSON.stringify(req.body));
        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        // let phonenumberid = req.body.phonenumberid;
        let business_public_key = req.body.business_public_key;



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

        if (business_public_key == "") {
            return {
                code: 'WA005',
                status: 'FAILED',
                message: 'business Public Key is invalid',
                data: {}
            };

        }
        // if (phonenumberid == "") {
        //     return {
        //         code: 'WA005',
        //         status: 'FAILED',
        //         message: 'business Public Key is invalid',
        //         data: {}
        //     };

        // }

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
            // console.log({ getwabaid });
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
            // console.log({ getusersetting });
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

        let setBusinessPublicKey = function (SystemAccessToken, wabaid, userid, phonenumberid2, callback) {

            whatsappService.SetBusinessPublicKey(SystemAccessToken, phonenumberid2, business_public_key, (err, result) => {
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
                    userService.SetBusinessPublicKeyStatus(wanumber, phonenumberid2, wabaid, userid, business_public_key, (err, SetBusinessPublicKeyStatusresult) => {
                        if (err) {
                            console.log(err);
                            callback(err);
                        } else {

                            callback(null, result);
                            console.log("Update status", SetBusinessPublicKeyStatusresult);
                        }
                    });
                }
            });
        };

        async.waterfall([getphonenumberid, getusers, getwabaid, getusersetting, setBusinessPublicKey], function (err, result) {
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
                    message: 'Sucessfully uploaded business public key',
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