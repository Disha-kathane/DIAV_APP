const async = require('async');
let axios = require('axios');
let http = require('http');
let https = require('https');
let httpUrl = require('url');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');
const sendService = require('../../services/v1/send');
const validator = require('validator');
const botUtils = require('../../utils/bot');
const crypto = require('crypto');
const userService = require('../../services/v1/users');
// const validator = require("email-validator");
const TokenGenerator = require('uuid-token-generator');
const jwt = require('jsonwebtoken');
const util = require('util');
const {
    json
} = require('body-parser');

// New send api to decrypt the encrypted message created by sneha 10/11/2022
module.exports = (req, res) => {
    let enc_Payload = req.body;
    let validatedToken = (callback) => {
        try {
            if (
                !req.headers.authorization ||
                !req.headers.authorization.startsWith('Bearer') ||
                !req.headers.authorization.split(' ')[1]
            ) {
                return res.send({
                    code: "WA037",
                    status: "FAILED",
                    message: "Authtoken is required",
                    data: {}
                });
            }
            let theToken = req.headers.authorization.split(' ')[1];
            if (theToken) {
                userService.fetchAccessToken('', theToken, (err, result) => {
                    // user does not exists
                    if (err) {
                        return res.send({
                            code: "WA100",
                            status: "FAILED",
                            msg: err,
                            data: {}
                        });
                    }
                    if (result) {
                        if (!result.length) {
                            return res.send({
                                code: "WA038",
                                status: "FAILED",
                                message: 'Token does not exist.',
                                data: {}
                            });
                        }

                        jwt.verify(theToken, 'the-super-strong-secrect', (tokenerr, verifiedJwt) => {
                            if (tokenerr) {
                                console.log({ tokenerr })
                                userService.updateTokenStatus(result[0].user_id, (updateerr, updateres) => {
                                    if (updateerr) {
                                        console.log("db error");
                                    }
                                    if (updateres) {
                                        console.log("no error");
                                    }
                                });
                                res.send({
                                    code: "WA039",
                                    status: "FAILED",
                                    message: "Authtoken Expired",
                                    data: {}
                                });
                            } else {
                                callback(null, enc_Payload);
                            }
                        });
                    }
                });
            }
        } catch (error) {
            //console.log(error);
            errorLogger.error(JSON.stringify(error));
            res.status(500);
            return res.send({
                code: 'WA100',
                status: 'FAILED',
                message: error.message != undefined ? error.message : 'Request Failed',
                data: {}
            });

        }

    };


    const sendCloudApi2 = (enc_Payload, callback) => {
        try {
            let encryptedMsg = enc_Payload.enc_request;
            let original_phrase = null;
            if (encryptedMsg.length == 0) {
                return res.send({
                    code: 'WA040',
                    status: 'FAILED',
                    message: 'Encryption payload is required',
                    data: {}
                });
            }
            try {
                let key = "d1e0v1e4l2o0p2m2e1n0t1a4p2i0o2f2";
                let output = Buffer.from(encryptedMsg, "utf-8");
                let base64Encoded = output.toString("base64");
                let iv = (Buffer.from(base64Encoded, 'base64').slice(0, 16))
                const decrypter = crypto.createDecipheriv("aes-256-cbc", key, iv);
                let decryptedMsg = decrypter.update(encryptedMsg, "hex", "utf8");
                decryptedMsg += decrypter.final("utf8");
                decryptedMsg = decryptedMsg.substring(decryptedMsg.indexOf('{'), decryptedMsg.length).trim();
                original_phrase = decryptedMsg;
                // const ENC_KEY = "d1e0v1e4l2o0p2m2e1n0t1a4p2i0o2f2"; // set random encryption key
                // const decrypter = crypto.createDecipher("aes-256-cbc", ENC_KEY);
                // let decryptedMsg = decrypter.update(encryptedMsg, "hex", "utf8");
                // decryptedMsg += decrypter.final("utf8");
                // original_phrase = decryptedMsg
            } catch (error) {
                console.log("DecryptionError==================", error)
                return res.send({
                    code: "WA041",
                    status: 'FAILED',
                    message: error,
                    data: {}
                });

            }
            console.log("original_phrase=============", original_phrase);
            let userId = null;
            let wanumber = null;
            let countryCode = null;
            let wabaCountryCode = null;
            let wabaCountryCodeNumeric = null;
            let maxTextLength = 4000;
            let error = false;
            let objMessage = null;
            let setflag = 0;
            let msgType = null;
            let apiKey = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
            var messageObj = JSON.parse(original_phrase);
            let isMediaID = -1;
            let fileName = null;
            let s3MediaUrl = null;
            let mediaType = null;
            let bodyContent = null;

            let validateApiKey = (done) => {
                sendService.getApiKey(apiKey, (err, result) => {
                    if (err) {
                        return done({
                            code: err.errno,
                            status: 'FAILED',
                            message: err.code,
                            data: {}
                        });
                    } else {
                        //edited by sneha 10/11/2022 as there was callback hell in previous send api
                        if (result != null && result.length > 0) {
                            if (result[0].userstatus == 1) {
                                if (result[0].account_type == 0) {
                                    userId = result[0].userid;
                                    done(null, result);
                                } else if (result[0].account_type == 1) {
                                    if (result[0].balance_amt > 0) {
                                        userId = result[0].userid;
                                        done(null, result);

                                    } else {
                                        return {
                                            code: 'WA036',
                                            status: 'FAILED',
                                            message: 'Insufficient Balance',
                                            data: {}
                                        };
                                    }
                                }

                            } else {
                                return done({
                                    code: 'WA001',
                                    status: 'FAILED',
                                    message: 'User is Inactive',
                                    data: {}
                                });
                            }
                        } else {
                            return done({
                                code: 'WA002',
                                status: 'FAILED',
                                message: 'Authentication Failed',
                                data: {}
                            });
                        }
                    }
                });
            };

            let wabaInfo = (result1, done) => {
                let wabanumber = null;
                if (typeof messageObj.from == undefined || validator.isEmpty(messageObj.from + '') || messageObj.from == null) {
                    error = true;
                    return done({
                        code: 'WA003',
                        status: 'FAILED',
                        message: 'Mobile number is required',
                        data: {}
                    });
                } else {
                    wabanumber = messageObj.from;
                }

                sendService.checkWanumber(wabanumber, (err, result) => {
                    console.log({
                        wabanumber
                    });
                    if (result.length > 0) {
                        let phone_number_id = result[0].phone_number_id;
                        if (phone_number_id != '' && phone_number_id != null && phone_number_id != undefined) {
                            setflag = 1;
                            sendService.getSystemAccessToken((err, result) => {
                                let SystemAccessToken = result[0].VALUE;

                                sendService.getSpecificWabaInfo(result1[0].userid, wabanumber, (err, getSpecificWabaInfoResult) => {
                                    if (err) {
                                        return done({
                                            code: err.errno,
                                            status: 'FAILED',
                                            message: err.code,
                                            data: {}
                                        });
                                    } else {

                                        getSpecificWabaInfoResult[0].authtoken = SystemAccessToken;
                                        done(null, getSpecificWabaInfoResult);

                                    }
                                });

                            });
                        } else {
                            sendService.getSpecificWabaInfo(result1[0].userid, wabanumber, (err, getSpecificWabaInfoResult) => {
                                if (err) {
                                    return done({
                                        code: err.errno,
                                        status: 'FAILED',
                                        message: err.code,
                                        data: {}
                                    });
                                } else {
                                    // console.log("getSpecificWabaInfoResult on cloud", getSpecificWabaInfoResult)
                                    done(null, getSpecificWabaInfoResult);

                                }
                            });
                        }
                    } else {
                        return done({
                            code: 'WA100',
                            status: 'FAILED',
                            message: 'Wabanumber Not Found',
                            data: {}
                        });
                    }

                });


            };


            let validatePayload = (wabaInfoResult, done) => {
                // console.log("wabaInfoResult", wabaInfoResult)
                if (typeof messageObj.to == undefined || validator.isEmpty(messageObj.to + '') || messageObj.to == null) {
                    error = true;
                    return done({
                        code: 'WA003',
                        status: 'FAILED',
                        message: 'Mobile number is required',
                        data: {}
                    });
                } else {
                    wanumber = messageObj.to;
                    console.log({
                        wanumber
                    });
                    // let tmpWaNumber = wanumber.replace(/^91/g, '');
                    let tmpWaNumber = wanumber.replace("+91", '');
                    console.log({
                        tmpWaNumber
                    });

                    if (!tmpWaNumber.startsWith('9') ||
                        !tmpWaNumber.startsWith('8') ||
                        !tmpWaNumber.startsWith('7') ||
                        !tmpWaNumber.startsWith('6')) {
                        countryCode = botUtils.getCountryCode(wanumber);
                        countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
                    } else {
                        if (botUtils.isMobileInternational(wanumber)) {
                            countryCode = botUtils.getCountryCode(wanumber);
                            countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
                        } else {
                            return done({
                                code: 'WA004',
                                status: 'FAILED',
                                message: 'Mobile number must contain Country Code',
                                data: {}
                            });
                        }
                    }
                }
                //  console.log('validatePayload: ' + JSON.stringify(messageObj.message));
                if (typeof messageObj.type == undefined || validator.isEmpty(messageObj.type + '') || messageObj.type == null) {
                    error = true;
                    return done({
                        code: 'WA005',
                        status: 'FAILED',
                        message: 'Message type is required',
                        data: {}
                    });
                }
                if (typeof messageObj.message == undefined || messageObj.message == null || messageObj.message.length == 0 || Object.keys(messageObj.message).length == 0) {
                    error = true;
                    return done({
                        code: 'WA006',
                        status: 'FAILED',
                        message: 'Message is required',
                        data: {}
                    });
                }
                if (!error) {
                    objMessage = messageObj.message;
                    msgType = messageObj.type.toLowerCase();
                    //0=>'Document', 1=>'Image', 2=>'Video', 3=>'Audio', 4=>'Text', 5=>'Location', 6=>'Contact', 7=>'Sticker',8=>'Template'
                    switch (msgType) {
                        case "document":
                        case "image":
                        case "video":
                        case "audio":
                            try {
                                if (!objMessage.hasOwnProperty('id')) {
                                    if (typeof objMessage.url == undefined || validator.isEmpty(objMessage.url + '')) {
                                        error = true;
                                        return done({
                                            code: 'WA007',
                                            status: 'FAILED',
                                            message: 'Media URL is required',
                                            data: {}
                                        });
                                    } else if (!validator.isURL(objMessage.url + '')) {
                                        // || objMessage.url.indexOf('https:')  || objMessage.url.indexOf('http:')
                                        error = true;
                                        return done({
                                            code: 'WA008',
                                            status: 'FAILED',
                                            message: 'Media URL is invalid',
                                            data: {}
                                        });
                                    } else {
                                        isMediaID = 0;
                                    }
                                }
                                if (!objMessage.hasOwnProperty('url')) {
                                    if (typeof objMessage.id == undefined && !validator.isEmpty(objMessage.id + '')) {
                                        error = false;
                                        return done({
                                            code: 'WA009',
                                            status: 'FAILED',
                                            message: 'Media ID is invalid',
                                            data: {}
                                        });
                                    } else {
                                        isMediaID = 1;
                                    }
                                }

                                if (isMediaID == 0) {
                                    let regex = new RegExp('[^.]+$');
                                    let extension = objMessage.url.match(regex);

                                    if (msgType == "document") {
                                        mediaType = 0;

                                    }
                                    if (msgType == "image") {
                                        if (extension[0] == 'png' || extension[0] == 'jpg' || extension[0] == 'jpeg') {
                                            mediaType = 1;
                                        } else {
                                            return done({
                                                code: 'WA011',
                                                status: 'FAILED',
                                                message: 'Invalid Image Format',
                                                data: {}
                                            });
                                        }
                                    }
                                    if (msgType == "video") {
                                        if (extension[0] == 'mp4' || extension[0] == '3gp' || extension[0] == '3gpp') {
                                            mediaType = 2;
                                        } else {
                                            return done({
                                                code: 'WA012',
                                                status: 'FAILED',
                                                message: 'Invalid Video Format',
                                                data: {}
                                            });
                                        }
                                    }
                                    if (msgType == "audio") {
                                        if (extension[0] == 'mp3' || extension[0] == 'mpeg' || extension[0] == 'wav' || extension[0] == 'amr' || extension[0] == 'aac') {
                                            mediaType = 3;
                                        } else {
                                            return done({
                                                code: 'WA013',
                                                status: 'FAILED',
                                                message: 'Invalid Audio Format',
                                                data: {}
                                            });
                                        }
                                    }
                                    console.log(mediaType);
                                    done(null, 1, mediaType, wabaInfoResult);
                                }
                                if (isMediaID == 1) {
                                    sendService.fetchMediaFileName(objMessage.id, (err, result) => {
                                        if (err) {
                                            return done({
                                                code: err.errno,
                                                status: 'FAILED',
                                                message: err.code,
                                                data: {}
                                            });
                                        } else {
                                            if (result.length > 0) {
                                                switch (result[0].mediatype) {
                                                    case 0:
                                                    case 1:
                                                    case 2:
                                                    case 3:
                                                        mediaType = result[0].mediatype;
                                                        fileName = result[0].medianame;
                                                        s3MediaUrl = result[0].mediaurl;
                                                        done(null, 1, mediaType, wabaInfoResult);
                                                        break;
                                                }
                                            } else {
                                                return done({
                                                    code: "WA014",
                                                    status: 'FAILED',
                                                    message: 'Media ID is invalid',
                                                    data: {}
                                                });
                                            }
                                        }
                                    });
                                }
                            } catch (err) {
                                return done({
                                    code: 'WA101',
                                    status: 'FAILED',
                                    message: 'Invalid Payload',
                                    data: {}
                                });
                            }

                            break;
                        case "text":
                            try {
                                if (typeof objMessage.text == undefined || validator.isEmpty(objMessage.text + '') || objMessage.text == null) {
                                    error = true;
                                    return done({
                                        code: 'WA015',
                                        status: 'FAILED',
                                        message: 'Text is required',
                                        data: {}
                                    });
                                } else if (typeof objMessage.text != undefined && (objMessage.text + '').length > maxTextLength) {
                                    error = true;
                                    return done({
                                        code: 'WA016',
                                        status: 'FAILED',
                                        message: 'Text cannot exceed 4000 characters',
                                        data: {}
                                    });
                                } else {
                                    done(null, 1, 4, wabaInfoResult);
                                }
                            } catch (err) {
                                return done({
                                    code: 'WA101',
                                    status: 'FAILED',
                                    message: 'Invalid Payload',
                                    data: {}
                                });
                            }

                            break;
                        case "location":
                            try {
                                if (typeof objMessage.latitude == undefined || validator.isEmpty(objMessage.latitude + '') || objMessage.latitude == null) {
                                    error = true;
                                    return done({
                                        code: 'WA017',
                                        status: 'FAILED',
                                        message: 'Latitude is required',
                                        data: {}
                                    });
                                } else if (typeof objMessage.longitude == undefined || validator.isEmpty(objMessage.longitude + '') || objMessage.longitude == null) {
                                    error = true;
                                    return done({
                                        code: 'WA018',
                                        status: 'FAILED',
                                        message: 'Longitude is required',
                                        data: {}
                                    });
                                } else if (typeof objMessage.address == undefined || validator.isEmpty(objMessage.address + '') || objMessage.address == null) {
                                    error = true;
                                    return done({
                                        code: 'WA019',
                                        status: 'FAILED',
                                        message: 'Address is required',
                                        data: {}
                                    });
                                } else if (typeof objMessage.name == undefined || validator.isEmpty(objMessage.name + '') || objMessage.name == null) {
                                    error = true;
                                    return done({
                                        code: 'WA020',
                                        status: 'FAILED',
                                        message: 'Name is required',
                                        data: {}
                                    });
                                } else {
                                    let regex = new RegExp('^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$');
                                    let latitude = objMessage.latitude.match(regex);
                                    let longitude = objMessage.longitude.match(regex);
                                    if (latitude[0] != 0 && longitude[0] != 0) {
                                        done(null, 1, 5, wabaInfoResult);
                                    } else {
                                        error = true;
                                        return done({
                                            code: 'WA021',
                                            status: 'FAILED',
                                            message: 'Latitude / Longitude is invalid',
                                            data: {}
                                        });
                                    }
                                }
                            } catch (err) {
                                return done({
                                    code: 'WA101',
                                    status: 'FAILED',
                                    message: 'Invalid Payload',
                                    data: {}
                                });
                            }

                            break;
                        case "contact":
                            try {
                                if (typeof objMessage.contacts == undefined || validator.isEmpty(objMessage.contacts + '')) {
                                    error = true;
                                    return done({
                                        code: 'WA022',
                                        status: 'FAILED',
                                        message: 'Contacts body is required',
                                        data: {}
                                    });
                                } else if (objMessage.contacts.name == undefined || validator.isEmpty(objMessage.contacts.name + '')) {
                                    error = true;
                                    return done({
                                        code: 'WA023',
                                        status: 'FAILED',
                                        message: 'Name body is required',
                                        data: {}
                                    });
                                } else if (objMessage.contacts.name.first_name == undefined || validator.isEmpty(objMessage.contacts.name.first_name + '')) {
                                    error = true;
                                    return done({
                                        code: 'WA024',
                                        status: 'FAILED',
                                        message: 'First Name is required',
                                        data: {}
                                    });
                                } else if (objMessage.contacts.name.last_name == undefined || validator.isEmpty(objMessage.contacts.name.last_name + '')) {
                                    error = true;
                                    return done({
                                        code: 'WA025',
                                        status: 'FAILED',
                                        message: 'Last Name is required',
                                        data: {}
                                    });
                                } else {
                                    done(null, 1, 6, wabaInfoResult);
                                }
                            } catch (err) {
                                error = true;
                                return done({
                                    code: 'WA101',
                                    status: 'FAILED',
                                    message: 'Invalid Payload',
                                    data: {}
                                });
                            }
                            break;
                        case "sticker":
                            try {
                                if (typeof objMessage.url == undefined || validator.isEmpty(objMessage.url + '')) {
                                    error = true;
                                    return done({
                                        code: 'WA026',
                                        status: 'FAILED',
                                        message: 'Sticker URL is required',
                                        data: {}
                                    });
                                } else {
                                    done(null, 1, 7, wabaInfoResult);
                                }
                            } catch (err) {
                                return done({
                                    code: 'WA101',
                                    status: 'FAILED',
                                    message: 'Invalid Payload',
                                    data: {}
                                });
                            }
                            break;
                        case "template":
                            try {
                                if (typeof objMessage.templateid == undefined || validator.isEmpty(objMessage.templateid + '')) {
                                    error = true;
                                    return done({
                                        code: 'WA027',
                                        status: 'FAILED',
                                        message: 'Template ID is required',
                                        data: {}
                                    });
                                } else {
                                    done(null, 0, 8, wabaInfoResult);
                                }
                            } catch (err) {
                                return done({
                                    code: 'WA101',
                                    status: 'FAILED',
                                    message: 'Invalid Payload',
                                    data: {}
                                });
                            }
                            break;
                        case "interactive":
                            try {
                                if (typeof objMessage.interactive == undefined || validator.isEmpty(objMessage.interactive + '') || Object.keys(objMessage.interactive).length == 0) {
                                    error = true;
                                    return done({
                                        code: 'WA033',
                                        status: 'FAILED',
                                        message: 'Interactive body is required',
                                        data: {}
                                    });
                                } else {
                                    done(null, 1, 9, wabaInfoResult);
                                }
                            } catch (err) {
                                return done({
                                    code: 'WA101',
                                    status: 'FAILED',
                                    message: 'Invalid Payload',
                                    data: {}
                                });
                            }
                            break;
                    }
                }
            };

            let validateTemplate = (isTemplate, msgType, wabaInfoResult, done) => {
                if (isTemplate == 1) {
                    switch (msgType) {
                        case 0:
                        case 1:
                        case 2:
                        case 3:
                            console.log(isMediaID);
                            done(null, msgType, wabaInfoResult, '');
                            break;
                        case 4:
                            done(null, msgType, wabaInfoResult, '');
                            break;
                        case 5:
                            done(null, msgType, wabaInfoResult, '');
                            break;
                        case 6:
                            done(null, msgType, wabaInfoResult, '');
                            break;
                        case 7:
                            done(null, msgType, wabaInfoResult, '');
                            break;
                        case 9:
                            console.log('validateTemplate: ' + JSON.stringify(wabaInfoResult));
                            done(null, msgType, wabaInfoResult, '');
                            break;
                    }
                } else {
                    switch (msgType) {
                        case 8:
                            sendService.getTemplate(messageObj.message.templateid, (err, result) => {
                                if (err) {
                                    return res.send({
                                        code: err.errno,
                                        status: 'FAILED',
                                        message: err.code,
                                        data: {}
                                    });
                                } else {
                                    if (result.length > 0) {
                                        done(null, msgType, wabaInfoResult, result);
                                    } else {
                                        return res.send({
                                            code: "WA028",
                                            status: 'FAILED',
                                            message: 'Template ID is invalid',
                                            data: {}
                                        });
                                    }
                                }
                            });
                            break;
                    }
                }
            };




            let createPayload = (msgType, wabaInfoResult, templateResult, done) => {
                let messagePayload = {};
                switch (msgType) {
                    case 0:
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "document",
                            "recipient_type": "individual"
                        };
                        if (setflag == 1) {
                            messagePayload.messaging_product = "whatsapp";

                        }
                        console.log("cloud message paylaod", messagePayload);
                        if (setflag == 0) {
                            messagePayload.document = {
                                "provider": {
                                    "name": ""
                                }
                            };
                        }
                        if (isMediaID == 0) {
                            messagePayload.document = {

                                "link": messageObj.message.url,
                                "filename": messageObj.message.filename,
                                "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
                            };

                            bodyContent = {
                                "body": "<a href='" + messageObj.message.url + "'>Media</a>"
                            };
                        }
                        if (isMediaID == 1) {
                            messagePayload.document = {
                                "id": messageObj.message.id,
                                "filename": fileName
                            };

                            bodyContent = {
                                "body": "<a href='" + s3MediaUrl + "'>Media</a>"
                            };
                        }

                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 1:
                        console.log('Caption : ' + messageObj.message.caption);

                        messagePayload = {
                            "to": messageObj.to,
                            "type": "image",
                            "recipient_type": "individual"
                        };
                        if (setflag == 1) {
                            messagePayload.messaging_product = "whatsapp";
                        }
                        if (setflag == 0) {
                            messagePayload.image = {
                                "provider": {
                                    "name": ""
                                }
                            };
                        }
                        if (isMediaID == 0) {
                            messagePayload.image = {
                                "link": messageObj.message.url,
                                "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
                            };

                            bodyContent = {
                                "body": "<a href='" + messageObj.message.url + "'>Media</a>"
                            };

                            let tmpCaption = null;

                            if (messageObj.message.caption != undefined) {
                                tmpCaption = messageObj.message.caption;
                            }

                            if (tmpCaption != undefined && tmpCaption != null) {
                                bodyContent.caption = tmpCaption;
                            }
                        }
                        if (isMediaID == 1) {
                            messagePayload.image = {
                                "id": messageObj.message.id
                            };

                            bodyContent = {
                                "body": "<a href='" + s3MediaUrl + "'>Media</a>"
                            };
                        }

                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 2:
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "video",
                            "recipient_type": "individual"
                        };
                        if (setflag == 1) {
                            messagePayload.messaging_product = "whatsapp";
                        }
                        if (setflag == 0) {
                            messagePayload.video = {
                                "provider": {
                                    "name": ""
                                }
                            };
                        }
                        if (isMediaID == 0) {
                            messagePayload.video = {
                                "link": messageObj.message.url,
                                "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
                            };

                            bodyContent = {
                                "body": "<a href='" + messageObj.message.url + "'>Media</a>"
                            };

                            let tmpCaption = null;

                            if (messageObj.message.caption != undefined) {
                                tmpCaption = messageObj.message.caption;
                            }

                            if (tmpCaption != undefined && tmpCaption != null) {
                                bodyContent.caption = tmpCaption;
                            }
                        }
                        if (isMediaID == 1) {
                            messagePayload.video = {
                                "id": messageObj.message.id
                            };

                            bodyContent = {
                                "body": "<a href='" + s3MediaUrl + "'>Media</a>"
                            };
                        }

                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 3:
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "audio",
                            "recipient_type": "individual"
                        };
                        if (setflag == 1) {
                            messagePayload.messaging_product = "whatsapp";
                        }
                        if (setflag == 0) {
                            messagePayload.audio = {
                                "provider": {
                                    "name": ""
                                }

                            };
                        }
                        if (isMediaID == 0) {
                            messagePayload.audio = {

                                "link": messageObj.message.url
                            };

                            bodyContent = {
                                "body": "<a href='" + messageObj.message.url + "'>Media</a>"
                            };
                        }
                        if (isMediaID == 1) {
                            messagePayload.audio = {
                                "id": messageObj.message.id
                            };

                            bodyContent = {
                                "body": "<a href='" + s3MediaUrl + "'>Media</a>"
                            };
                        }

                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 4:
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "text",
                            "recipient_type": "individual",
                            "text": {
                                "body": messageObj.message.text
                            }
                        };

                        if (setflag == 1) {
                            messagePayload.messaging_product = "whatsapp";
                        }

                        bodyContent = {
                            "body": messageObj.message.text
                        };

                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 5:
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "location",
                            "location": {
                                "longitude": messageObj.message.longitude,
                                "latitude": messageObj.message.latitude,
                                "name": messageObj.message.name,
                                "address": messageObj.message.address
                            }
                        };
                        if (setflag == 1) {
                            messagePayload.messaging_product = "whatsapp";
                        }

                        bodyContent = {
                            "body": {
                                "latitude": messageObj.message.latitude,
                                "longitude": messageObj.message.longitude
                            }
                        };

                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 6:
                        if (messageObj.message.contacts.phones.length > 0) {

                            bodyContent = {
                                "body": [{
                                    "addresses": [],
                                    "emails": [],
                                    "ims": [],
                                    "name": {
                                        "first_name": messageObj.message.contacts.name.first_name,
                                        "formatted_name": messageObj.message.contacts.name.first_name,
                                        "last_name": messageObj.message.contacts.name.last_name
                                    },
                                    "org": {},
                                    "phones": [],
                                    "urls": []
                                }]
                            };

                            messagePayload = {
                                "to": messageObj.to,
                                "type": "contacts",
                                "recipient_type": "individual",
                                "contacts": [{
                                    "name": {
                                        "first_name": messageObj.message.contacts.name.first_name,
                                        "formatted_name": messageObj.message.contacts.name.first_name,
                                        "last_name": messageObj.message.contacts.name.last_name
                                    },
                                    "phones": []
                                }]
                            };
                            if (setflag == 1) {
                                messagePayload.messaging_product = "whatsapp";
                            }
                            for (let i = 0; i < messageObj.message.contacts.phones.length; ++i) {
                                if (typeof messageObj.message.contacts.phones[i].phone == undefined ||
                                    validator.isEmpty(messageObj.message.contacts.phones[i].phone + '') ||
                                    messageObj.message.contacts.phones[i].phone == null) {
                                    error = true;
                                    return done({
                                        code: 'WA029',
                                        status: 'FAILED',
                                        message: 'Mobile number is required'
                                    });
                                } else {
                                    let phoneObj = {
                                        "phone": messageObj.message.contacts.phones[i].phone,
                                        "type": messageObj.message.contacts.phones[i].type
                                    };
                                    messagePayload.contacts[0].phones.push(phoneObj);
                                    bodyContent.body[0].phones.push(phoneObj);
                                }
                            }
                            console.log(JSON.stringify(messagePayload));
                        } else {
                            return done({
                                code: "WA030",
                                status: 'FAILED',
                                message: "Phone is required",
                                data: {}
                            });
                        }
                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 7:
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "sticker",
                            "recipient_type": "individual",
                            "sticker": {
                                "link": messageObj.message.url
                            }
                        };
                        if (setflag == 1) {
                            messagePayload.messaging_product = "whatsapp";
                        }
                        if (setflag == 0) {
                            messagePayload.sticker = {
                                "provider": {
                                    "name": ""
                                }
                            };
                        }

                        bodyContent = {
                            "body": "<a href='" + messageObj.message.url + "'>Media</a>"
                        };

                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 8:
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "template",
                            "template": {
                                "language": {
                                    "code": templateResult[0].langcode
                                },
                                "name": templateResult[0].temptitle,
                                "components": []
                            }
                        };
                        if (setflag == 1) {
                            messagePayload.messaging_product = "whatsapp";
                        }
                        if (setflag == 0) {
                            messagePayload.template.namespace = wabaInfoResult[0].hsmnamespace;
                            messagePayload.template.language.policy = "deterministic";
                        }

                        if (templateResult[0].head_temptype != '' && templateResult[0].head_temptype == 1) {
                            if (messageObj.message.placeholders != undefined) {
                                if (messageObj.message.placeholders.length > 0) {
                                    let placeholderLength = templateResult[0].placeholders.split(",");
                                    if (placeholderLength.length == messageObj.message.placeholders.length) {
                                        let tempArr = botUtils.fetchPlaceholders(JSON.stringify(messageObj.message.placeholders));
                                        let component_body = {
                                            "type": "body",
                                            "parameters": tempArr
                                        };
                                        messagePayload.template.components.push(component_body);

                                        let i = 1;
                                        let tempContent = templateResult[0].body_message.toString();
                                        for (let j = 0; j < tempArr.length; j++) {
                                            let x = tempArr[j].text;
                                            //console.log(x, '{{' + i + '}}');
                                            tempContent = tempContent.replace('{{' + i + '}}', x);
                                            i++;
                                        }
                                        bodyContent = {
                                            "body": tempContent
                                        };

                                    } else {
                                        return done({
                                            code: "WA031",
                                            status: 'FAILED',
                                            message: "Placeholder count mismatch",
                                            data: {}
                                        });
                                    }
                                } else {
                                    bodyContent = {
                                        "body": templateResult[0].body_message.toString()
                                    };
                                }
                            }

                            console.log('i am here ========================> ' + templateResult[0].placeholder_template_type);
                            // if (templateResult[0].placeholder_template_type != '' &&
                            //     (templateResult[0].placeholder_template_type == 1 || templateResult[0].placeholder_template_type == 2)
                            //      &&
                            //     templateResult[0].head_text_title != '' &&
                            //     templateResult[0].head_text_title.length > 0
                            //     ) 

                            if (templateResult[0].head_mediatype != '') {
                                let component_header = {
                                    "type": "header",
                                    "parameters": []
                                };
                                if (templateResult[0].head_mediatype == 0) {
                                    component_header.parameters.push({
                                        "type": "document",
                                        "document": {
                                            "link": messageObj.message.url,
                                            "filename": messageObj.message.filename != undefined ? messageObj.message.filename : ""
                                        }
                                    });
                                }
                                if (templateResult[0].head_mediatype == 1) {
                                    component_header.parameters.push({
                                        "type": "image",
                                        "image": {
                                            "link": messageObj.message.url
                                        }
                                    });
                                }
                                if (templateResult[0].head_mediatype == 2) {
                                    component_header.parameters.push({
                                        "type": "video",
                                        "video": {
                                            "link": messageObj.message.url
                                        }
                                    });
                                }
                                messagePayload.template.components.push(component_header);
                            }

                            if (setflag == 0) {
                                if (templateResult[0].footer_text != '' && templateResult[0].footer_text.length > 0) {
                                    let component_header = {
                                        "type": "footer",
                                        "parameters": [{
                                            "type": "text",
                                            "text": templateResult[0].footer_text
                                        }]
                                    };
                                    messagePayload.template.components.push(component_header);
                                }
                            }


                            if (templateResult[0].button_option != '' && templateResult[0].button_option == 0) {
                                let callToActionArr = JSON.parse(templateResult[0].button_option_string);
                                for (let i = 0; i < callToActionArr.length; i++) {
                                    if (callToActionArr[i].call_phone != null && callToActionArr[i].call_phone != undefined) {
                                        let tempArr = [];
                                        let component_button = {
                                            "type": "button",
                                            "sub_type": "url",
                                            "index": i,
                                            "parameters": tempArr
                                        };
                                        tempArr.push({
                                            "type": "text",
                                            "text": callToActionArr[i].call_phone.phone_button_text
                                        });
                                        // modified by khushal dt 19-01-2022
                                        //component_button.parameters = tempArr;
                                        //messagePayload.template.components.push(component_button);
                                    }
                                    if (callToActionArr[i].visit_website != null && callToActionArr[i].visit_website != undefined) {
                                        let tempArr = [];
                                        let component_button = {
                                            "type": "button",
                                            "sub_type": "url",
                                            //"index": i + 1,
                                            "index": i,
                                            "parameters": tempArr
                                        };

                                        if (callToActionArr[i].visit_website.web_url_option == 1 && messageObj.message.buttons != undefined) {

                                            for (let k = 0; k < messageObj.message.buttons.length; k++) {
                                                if (messageObj.message.buttons[k].placeholder != undefined &&
                                                    messageObj.message.buttons[k].placeholder.length > 0) {
                                                    tempArr.push({
                                                        "type": "text",
                                                        "text": messageObj.message.buttons[k].placeholder
                                                    });
                                                    break;
                                                } else {
                                                    return done({
                                                        code: "WA035",
                                                        status: 'FAILED',
                                                        message: "Dynamic URL Placeholder is missing",
                                                        data: {}
                                                    });
                                                }
                                            }


                                            component_button.parameters = tempArr;
                                            messagePayload.template.components.push(component_button);
                                        }
                                        if (callToActionArr[i].visit_website.web_url_option == 0) {
                                            // tempArr.push({
                                            //     "type": "text",
                                            //     "text": callToActionArr[i].visit_website.web_button_text
                                            // });
                                            // component_button.parameters = tempArr;
                                            // messagePayload.template.components.push(component_button);
                                        }
                                    }
                                }
                            }
                            if (templateResult[0].button_option != '' && templateResult[0].button_option == 1) {
                                let quickReplyArr = messageObj.message.buttons;
                                for (let i = 0; i < quickReplyArr.length; ++i) {
                                    let tempArr = [];
                                    let component_button = {
                                        "type": "button",
                                        "sub_type": "quick_reply",
                                        "index": i,
                                        "parameters": tempArr
                                    };

                                    if (quickReplyArr[i].parameters != undefined) {
                                        tempArr.push({
                                            "type": "payload",
                                            "payload": quickReplyArr[i].parameters[0].payload
                                        });
                                        component_button.parameters = tempArr;
                                    }

                                    messagePayload.template.components.push(component_button);
                                }
                            }
                        } else {
                            if (messageObj.message.placeholders != undefined) {
                                if (messageObj.message.placeholders.length > 0) {
                                    let placeholderLength = templateResult[0].placeholders.split(",");
                                    // console.log('Length ======================>' + placeholderLength.length, messageObj.message.placeholders.length);

                                    if (placeholderLength.length == messageObj.message.placeholders.length) {
                                        let tempArr = botUtils.fetchPlaceholders(JSON.stringify(messageObj.message.placeholders));
                                        let component_body = {
                                            "type": "body",
                                            "parameters": tempArr
                                        };
                                        messagePayload.template.components.push(component_body);

                                        let i = 1;
                                        let tempContent = templateResult[0].body_message.toString();
                                        for (let j = 0; j < tempArr.length; j++) {
                                            let x = tempArr[j].text;
                                            //console.log(x, '{{' + i + '}}');
                                            tempContent = tempContent.replace('{{' + i + '}}', x);
                                            i++;
                                        }
                                        bodyContent = {
                                            "body": tempContent
                                        };
                                    } else {
                                        return done({
                                            code: "WA031",
                                            status: 'FAILED',
                                            message: "Placeholder count mismatch",
                                            data: {}
                                        });
                                    }
                                } else {
                                    bodyContent = {
                                        "body": templateResult[0].body_message.toString()
                                    };
                                }
                            }

                            console.log('placeholder_template_type=========================>' + templateResult[0].placeholder_template_type);
                            if (templateResult[0].placeholder_template_type != '' &&
                                (templateResult[0].placeholder_template_type == 1 || templateResult[0].placeholder_template_type == 2) &&
                                templateResult[0].head_text_title != '' &&
                                templateResult[0].head_text_title.length > 0) {
                                if (messageObj.message.header != undefined && messageObj.message.header.length > 0) {
                                    let component_header = {
                                        "type": "header",
                                        "parameters": [{
                                            "type": "text",
                                            "text": messageObj.message.header
                                        }]
                                    };
                                    messagePayload.template.components.push(component_header);
                                } else {
                                    return done({
                                        code: "WA034",
                                        status: 'FAILED',
                                        message: "Header is missing",
                                        data: {}
                                    });
                                }
                            }

                            if (setflag == 0) {
                                if (templateResult[0].footer_text != null && templateResult[0].footer_text.length > 0 && templateResult[0].footer_text != '') {
                                    let component_header = {
                                        "type": "footer",
                                        "parameters": [{
                                            "type": "text",
                                            "text": templateResult[0].footer_text
                                        }]
                                    };
                                    messagePayload.template.components.push(component_header);
                                }

                            }
                            if (templateResult[0].button_option != '' && templateResult[0].button_option == 0) {
                                let callToActionArr = JSON.parse(templateResult[0].button_option_string);

                                for (let i = 0; i < callToActionArr.length; ++i) {
                                    if (callToActionArr[i].call_phone != null && callToActionArr[i].call_phone != undefined) {
                                        let tempArr = [];
                                        let component_button = {
                                            "type": "button",
                                            "sub_type": "url",
                                            "index": i,
                                            "parameters": tempArr
                                        };
                                        tempArr.push({
                                            "type": "text",
                                            "text": callToActionArr[i].call_phone.phone_button_text
                                        });
                                    }
                                    if (callToActionArr[i].visit_website != null && callToActionArr[i].visit_website != undefined) {
                                        let tempArr = [];
                                        let component_button = {
                                            "type": "button",
                                            "sub_type": "url",
                                            "index": i,
                                            "parameters": tempArr
                                        };

                                        if (callToActionArr[i].visit_website.web_url_option == 1 && messageObj.message.buttons != undefined) {

                                            for (let k = 0; k < messageObj.message.buttons.length; k++) {
                                                if (messageObj.message.buttons[k].placeholder != undefined &&
                                                    messageObj.message.buttons[k].placeholder.length > 0) {
                                                    tempArr.push({
                                                        "type": "text",
                                                        "text": messageObj.message.buttons[k].placeholder
                                                    });
                                                    break;
                                                } else {
                                                    return done({
                                                        code: "WA035",
                                                        status: 'FAILED',
                                                        message: "Dynamic URL Placeholder is missing",
                                                        data: {}
                                                    });
                                                }
                                            }

                                            component_button.parameters = tempArr;
                                            messagePayload.template.components.push(component_button);
                                        }
                                        if (callToActionArr[i].visit_website.web_url_option == 0) {
                                            // tempArr.push({
                                            //     "type": "text",
                                            //     "text": callToActionArr[i].visit_website.web_button_text
                                            // });
                                            // component_button.parameters = tempArr;
                                            // messagePayload.template.components.push(component_button);
                                        }
                                    }
                                }
                            }
                            if (templateResult[0].button_option != '' && templateResult[0].button_option == 1) {
                                let quickReplyArr = messageObj.message.buttons;
                                for (let i = 0; i < quickReplyArr.length; ++i) {
                                    let tempArr = [];
                                    let component_button = {
                                        "type": "button",
                                        "sub_type": "quick_reply",
                                        "index": i,
                                        "parameters": tempArr
                                    };

                                    if (quickReplyArr[i].parameters != undefined) {
                                        tempArr.push({
                                            "type": "payload",
                                            "payload": quickReplyArr[i].parameters[0].payload
                                        });
                                        component_button.parameters = tempArr;
                                    }

                                    messagePayload.template.components.push(component_button);
                                }
                            }
                        }
                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 9:
                        console.log('interactive : ' + JSON.stringify(wabaInfoResult));
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "interactive",
                            "recipient_type": "individual",
                            "interactive": messageObj.message.interactive
                        };
                        if (setflag == 1) {
                            messagePayload.messaging_product = "whatsapp";
                        }
                        bodyContent = {
                            "body": messageObj.message.interactive.body.text
                        };
                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                }

                messagePayload.to = messagePayload.to.replace("+", '');

            };




            let checkSubscription = (messagePayload, wabaInfoResult, msgType, done) => {
                // console.log('checkSubscription===========================>' + JSON.stringify(wabaInfoResult));
                if (wabaInfoResult.length > 0) {
                    sendService.checkSubscription(messagePayload.to, wabaInfoResult[0].wanumber, (err, result) => {
                        if (err) {
                            return done({
                                code: err.errno,
                                status: 'FAILED',
                                message: err.code,
                                data: {}
                            });
                        } else if (result == 0) {
                            let direction = 1;
                            let waMessageId = null;
                            let errorCode = 100;
                            let errorDesc = 'No subscription found for the mobile number';
                            // console.log(errorDesc);
                            async.waterfall([
                                function (done) {
                                    sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, JSON.stringify(messageObj), bodyContent, countryCodeNumeric, function (err, result) {
                                        console.log('result.insertId: ' + result.insertId);
                                        done(err, result.insertId);
                                    });
                                },
                                function (id, done) {
                                    sendService.updateUnsubscribedMessageAPI(id, countryCodeNumeric, function (err, result) {
                                        done(err, result);
                                    });
                                }
                            ], function (err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('Record shifted to sent master');
                                    return done({
                                        code: 'WA032',
                                        status: 'FAILED',
                                        message: 'No subscription found for the mobile number ' + messagePayload.to,
                                        data: {}
                                    });
                                }
                            });
                        } else {
                            done(null, messagePayload, wabaInfoResult, msgType);
                        }
                    });
                } else {
                    return done({
                        code: 'WA100',
                        status: 'FAILED',
                        message: 'Invalid WABA APIKey',
                        data: {}
                    });
                }
            };

            let sendMessage = (messagePayload, wabaInfoResult, msgType, done) => {
                if (setflag == 0) {
                    console.log("inside premises send message", setflag);
                    let direction = 1;
                    let api = '/v1/messages';
                    let httpMethod = 1;
                    let requestType = 1;
                    let contentLength = Buffer.byteLength(JSON.stringify(messagePayload));
                    let apiHeaders = [{
                        'headerName': 'Authorization',
                        'headerVal': 'Bearer ' + wabaInfoResult[0].authtoken
                    }, {
                        'headerName': 'content-length',
                        'headerVal': contentLength
                    }];


                    botUtils.callWhatsAppApi(wabaInfoResult[0].waurl, api, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
                        console.log(response);
                        if (typeof response.messages != undefined) {
                            let errorCode = null;
                            let errorDesc = null;
                            let waMessageId1 = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                            console.log("wamessageid1",
                                waMessageId1
                            );
                            sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId1, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, messageObj, bodyContent, countryCodeNumeric, (error, result) => {
                                if (error) {
                                    errorLogger.error("**********************************************************");
                                    errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
                                    errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                    errorLogger.error("MESSAGE_ID: " + waMessageId1);
                                    errorLogger.error("ERROR: " + error);
                                    errorLogger.error("**********************************************************");
                                    return done({
                                        code: 'WA100',
                                        status: 'FAILED',
                                        message: error.message,
                                        data: {}
                                    });
                                } else {

                                    errorLogger.info("**********************************************************");
                                    errorLogger.info("REQUEST_BODY: " + JSON.stringify(req.body));
                                    errorLogger.info("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                    errorLogger.info("MESSAGE_ID: " + waMessageId1);
                                    errorLogger.info("**********************************************************");

                                    done(null, {
                                        code: "200",
                                        status: 'SUCCESS',
                                        message: 'Message Processed Successfully',
                                        data: {
                                            messageid: waMessageId1
                                        }
                                    });
                                }
                            });
                        } else {
                            return done({
                                code: 'WA100',
                                status: 'FAILED',
                                message: JSON.stringify(response),
                                data: {}
                            });
                        }
                    }).catch((err) => {
                        //added for non whatsapp number on 7/8/2022
                        if (err.response.data.errors[0].code == '1006') {
                            return done({
                                code: 'WA102',
                                status: 'FAILED',
                                message: 'Non WhatsApp Number',
                                data: {}
                            });
                        }
                        // End.........................//
                        errorLogger.error("**********************************************************");
                        errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
                        errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                        errorLogger.error("MESSAGE_ID: " + null);
                        errorLogger.error("ERROR: " + err);
                        errorLogger.error("**********************************************************");
                        return done({

                            code: 'WA100',
                            status: 'FAILED',
                            message: err.message,
                            data: {}
                        });
                    });
                } else {
                    console.log("inside cloud send message", setflag);
                    let direction = 1;
                    // let api = '/v1/messages';
                    let httpMethod = 1;
                    let requestType = 1;
                    let contentLength = Buffer.byteLength(JSON.stringify(messagePayload));
                    let apiHeaders = [{
                        'headerName': 'Authorization',
                        'headerVal': 'Bearer ' + wabaInfoResult[0].authtoken
                    }, {
                        'headerName': 'content-length',
                        'headerVal': contentLength
                    }];


                    botUtils.callWhatsAppApi1(wabaInfoResult[0].waurl, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
                        // console.log(response);
                        if (typeof response.messages != undefined) {
                            let errorCode = null;
                            let errorDesc = null;
                            let waMessageId2 = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                            console.log("wamessageid2",
                                waMessageId2
                            );
                            sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId2, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, messageObj, bodyContent, countryCodeNumeric, (error, result) => {
                                if (error) {
                                    errorLogger.error("**********************************************************");
                                    errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
                                    errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                    errorLogger.error("MESSAGE_ID: " + waMessageId2);
                                    errorLogger.error("ERROR: " + error);
                                    errorLogger.error("**********************************************************");
                                    return done({
                                        code: 'WA1001',
                                        status: 'FAILED',
                                        message: error.message,
                                        data: {}
                                    });
                                } else {
                                    errorLogger.info("**********************************************************");
                                    errorLogger.info("REQUEST_BODY: " + JSON.stringify(req.body));
                                    errorLogger.info("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                    errorLogger.info("MESSAGE_ID: " + waMessageId2);
                                    errorLogger.info("**********************************************************");

                                    done(null, {
                                        code: "200",
                                        status: 'SUCCESS',
                                        message: 'Message Processed Successfully',
                                        data: {
                                            messageid: waMessageId2
                                        }
                                    });
                                }
                            });
                        } else {
                            return done({
                                code: 'WA1002',
                                status: 'FAILED',
                                message: JSON.stringify(response),
                                data: {}
                            });
                        }
                    }).catch((err) => {
                        // console.log(err)
                        //added for non whatsapp number cloud on 10/6/2022
                        if (err.response.data.error.code == 131009) {

                            let tempError = null;
                            if (err.response.data.error != undefined && err.response.data.error.error_data != undefined) {
                                tempError = err.response.data.error.error_data.details;
                            } else if (err.response.data.error != undefined && err.response.data.error.message != undefined) {
                                tempError = err.response.data.error.message;
                            }

                            return done({
                                code: 'WA102',
                                status: 'FAILED',
                                message: tempError,
                                data: {}
                            });
                        }
                        //End...........................//
                        errorLogger.error("**********************************************************");
                        errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
                        errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                        errorLogger.error("MESSAGE_ID: " + null);
                        errorLogger.error("ERROR: " + err);
                        errorLogger.error("**********************************************************");

                        return done({
                            code: 'WA1003',
                            status: 'FAILED',
                            message: err.message,
                            data: {}
                        });
                    });
                }


            };

            async.waterfall([
                validateApiKey, wabaInfo, validatePayload, validateTemplate, createPayload, checkSubscription, sendMessage
            ], (err, result) => {
                if (err) {
                    res.header('Content-Type', 'application/json');
                    res.send(err);
                    return;
                } else {
                    res.header('Content-Type', 'application/json');
                    res.send(result);
                }
            });
        } catch (error) {
            // console.log(error);
            errorLogger.error(JSON.stringify(error));
            // return error;
            res.status(500);
            return res.send({
                code: 'WA100',
                status: 'FAILED',
                message: error.message != undefined ? error.message : 'Request Failed',
                data: {}
            });
        }
    };


    async.waterfall([validatedToken, sendCloudApi2], function (err, result) {
        if (err) {
            return err.message;
        } else {
            return result;
        }
    });
};