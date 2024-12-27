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


        let setBusinessPublicKey = function (SystemAccessToken, wabaid, userid, phonenumberid2, callback) {
            userService.checkwabaBusinessPublicKey(wabaid, (err, checkwabaBusinessPublicKeyresult) => {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    if (checkwabaBusinessPublicKeyresult[0].c === 1) {
                        userService.GetpublicKeyfromdb(wabaid, (err, GetpublicKeyfromdbresult) => {
                            if (err) {
                                console.log(err);
                                callback(err);
                            } else {
                            
                                let publickey1 = GetpublicKeyfromdbresult[0].business_public_key;
                               
                                whatsappService.SetBusinessPublicKey(SystemAccessToken, phonenumberid2, publickey1, (err, result) => {
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
                                        callback(null, result);
                                    }
                                }); 
                            }
                        });
                    }
                    if (checkwabaBusinessPublicKeyresult[0].c === 0) {
                        const { generateKeyPair } = require('crypto');
                        generateKeyPair('rsa', {
                            modulusLength: 2048,
                            publicKeyEncoding: { type: 'spki', format: 'pem' },
                            privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
                        },
                            (err, publicKey, privateKey) => {
                                console.log(" generateKeyPair_err-----", err);
                                
                                whatsappService.SetBusinessPublicKey(SystemAccessToken, phonenumberid2, publicKey, (err, result) => {
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
                                        
                                        userService.SetBusinessPublicKeyStatus(wabaid, userid, publicKey, privateKey, (err, SetBusinessPublicKeyStatusresult) => {
                                            if (err) {
                                                console.log(err);
                                                callback(err);
                                            } else {
                                                console.log("Update status", SetBusinessPublicKeyStatusresult);
                                                callback(null, result);
                                                
                                            }
                                        });
                                    }
                                });
                            });
                    }
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
