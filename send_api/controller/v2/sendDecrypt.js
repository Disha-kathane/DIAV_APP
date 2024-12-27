const async = require('async');
const axios = require('axios');
const http = require('http');
const https = require('https');
const httpUrl = require('url');
const {
    errorLogger,
    infoLogger
} = require('../../applogger1');
const validator = require('validator');
const botUtils = require('../../utils/bot1');
const crypto = require('crypto');
const idfcService = require('../../services/v2/idfc');
const sendService = require('../../services/v2/send');
const TokenGenerator = require('uuid-token-generator');
const responseHelper = require('../../utils/responseHelper');
const validateMediaUrl = require('../../utils/validate');
const jwt = require('jsonwebtoken');
const util = require('util');
const {
    json
} = require('body-parser');
module.exports = async (req, res) => {
    try {
        let enc_Payload = req.body;
        let flag = 0;
        let HelperResult = null;
        const validatedToken = async () => {
            try {
                if (
                    !req.headers.authorization ||
                    !req.headers.authorization.startsWith('Bearer') ||
                    !req.headers.authorization.split(' ')[1]
                ) {
                    HelperResult = responseHelper("WA037", "Authtoken is required");
                    return res.send(HelperResult);
                }
                let theToken = req.headers.authorization.split(' ')[1];
                if (theToken) {
                    let result = await idfcService.fetchAccessToken('', theToken);
                    if (result) {
                        if (!result.length) {
                            HelperResult = responseHelper("WA038", "Token does not exist.");
                            return res.send(HelperResult);
                        }
                        jwt.verify(theToken, 'the-super-strong-secrect', (tokenerr, verifiedJwt) => {
                            if (tokenerr) {
                                idfcService.updateTokenStatus(result[0].user_id, (updateerr, updateres) => {
                                    if (updateerr) {
                                        console.log("db error", updateerr);
                                    }
                                    if (updateres) {
                                        console.log("no error", updateres);
                                    }
                                });
                                HelperResult = responseHelper("WA039", "Authtoken Expired");
                                return res.send(HelperResult);
                            } else {
                                flag = 1;
                            }
                        });
                    }
                }
            } catch (error) {
                HelperResult = responseHelper("WA100", error.message);
                return res.send(HelperResult);
            }
        };
        const sendMsg = async (validatedTokenResult) => {
            if (flag == 1) {
                try {
                    let encryptedMsg = enc_Payload.enc_request;
                    let original_phrase;
                    let HelperResult;
                    if (encryptedMsg.length == 0) {
                        HelperResult = responseHelper("WA042", "Encryption payload is required");
                        return res.send(HelperResult);
                    }
                    try {
                        let key = "d1e0v1e4l2o0p2m2e1n0t1a4p2i0o2f2";
                        let output = Buffer.from(encryptedMsg, "utf-8");
                        let base64Encoded = output.toString("base64");
                        let iv = (Buffer.from(base64Encoded, 'base64').slice(0, 16));
                        const decrypter = crypto.createDecipheriv("aes-256-cbc", key, iv);
                        let decryptedMsg = decrypter.update(encryptedMsg, "hex", "utf8");
                        decryptedMsg += decrypter.final("utf8");
                        decryptedMsg = decryptedMsg.substring(decryptedMsg.indexOf('{'), decryptedMsg.length).trim();
                        original_phrase = decryptedMsg;
                    } catch (error) {
                        return res.send({
                            code: "WA045",
                            status: 'FAILED',
                            message: error,
                            data: {}
                        });
                    }
                    let userId = null;
                    let wanumber = null;
                    let countryCode = null;
                    let wabaCountryCode = null;
                    let wabaCountryCodeNumeric = null;
                    let maxTextLength = 4096;
                    let error = false;
                    let objMessage = null;
                    let setflag = 0;
                    let msgType = null;
                    let apiKey = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
                    let messageObj = JSON.parse(original_phrase);
                    let isMediaID = -1;
                    let fileName = null;
                    let s3MediaUrl = null;
                    let mediaType = null;
                    let bodyContent = null;
                    let mediaSize = null;
                    const validateApiKey = async () => {
                        try {
                            let result = await sendService.getApiKey(apiKey);
                            if (result.length > 0 && result != null) {
                                if (result[0].userstatus == 1) {
                                    if (result[0].account_type == 0) {
                                        userId = result[0].userid;
                                        return userId;
                                    } else if (result[0].account_type == 1) {
                                        if (result[0].balance_amt > 0) {
                                            userId = result[0].userid;
                                            return userId;
                                        } else {
                                            return res.send(responseHelper("WA036"));
                                        }
                                    }
                                } else {
                                    return res.send(responseHelper("WA001"));
                                }
                            } else {
                                return res.send(responseHelper("WA002"));
                            }
                        } catch (error) {
                            return res.send(responseHelper("WA100", "Request Failed"));
                        }
                    };
                    const wabaInfo = async (userid) => {
                        try {
                            let wabanumber;
                            if (typeof messageObj.from == undefined || validator.isEmpty(messageObj.from + '') || messageObj.from == null) {
                                error = true;
                                return res.send(responseHelper("WA003"));
                            } else {
                                wabanumber = messageObj.from.replace("+", "");
                            }
                            let apikeyResult = await sendService.validateApikeyWithUser(userid, wabanumber);
                            if (apikeyResult.length === 0) {
                                return res.send(responseHelper("WA046"));
                            } else {
                                userid = apikeyResult[0].userid;
                                let SystemAccessToken;
                                let phone_number_id = apikeyResult[0].phone_number_id;
                                if (phone_number_id != '' && phone_number_id != null && phone_number_id != undefined) {
                                    setflag = 1;
                                    let AuthResult = await sendService.getSystemAccessToken();
                                    if (AuthResult.length > 0) {
                                        SystemAccessToken = AuthResult[0].VALUE;
                                    }
                                    let getSpecificWabaInfoResult = await sendService.getSpecificWabaInfo(userid, wabanumber);
                                    if (getSpecificWabaInfoResult.length > 0) {
                                        getSpecificWabaInfoResult[0].authtoken = SystemAccessToken;
                                        return getSpecificWabaInfoResult;
                                    }
                                } else {
                                    let getSpecificWabaInfoResult = await sendService.getSpecificWabaInfo(userid, wabanumber);
                                    if (getSpecificWabaInfoResult.length > 0) {
                                        return getSpecificWabaInfoResult;
                                    }
                                }

                            }
                        } catch (error) {
                            return res.send(responseHelper("WA100", "Request Failed"));
                        }
                    };
                    const validatePayload = async (wabaInfoResult) => {
                        try {
                            if (typeof messageObj.to == undefined || validator.isEmpty(messageObj.to + '') || messageObj.to == null) {
                                error = true;
                                return res.send(responseHelper("WA003"));
                            } else {
                                wanumber = messageObj.to;
                                let tmpWaNumber = wanumber.toString().replace(/^91/g, '');
                                if (!tmpWaNumber.startsWith('9') &&
                                    !tmpWaNumber.startsWith('8') &&
                                    !tmpWaNumber.startsWith('7') &&
                                    !tmpWaNumber.startsWith('6')) {
                                    countryCode = botUtils.getCountryCode(wanumber);
                                    countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
                                    console.log(countryCode, countryCodeNumeric);
                                } else {
                                    if (botUtils.isMobileInternational(wanumber)) {
                                        countryCode = botUtils.getCountryCode(wanumber);
                                        countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
                                    }
                                }
                            }
                            if (typeof messageObj.type == undefined || validator.isEmpty(messageObj.type + '') || messageObj.type == null) {
                                error = true;
                                return res.send(responseHelper("WA005"));
                            }
                            if (typeof messageObj.message == undefined || messageObj.message == null || messageObj.message.length == 0 || Object.keys(messageObj.message).length == 0) {
                                error = true;
                                return res.send(responseHelper("WA006"));
                            }
                            if (!error) {
                                objMessage = messageObj.message;
                                msgType = messageObj.type.toLowerCase();
                                let regex = new RegExp('[^.]+$');
                                // console.log("msgType==============", msgType)
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
                                                    return res.send(responseHelper("WA007"));
                                                } else if (!validator.isURL(objMessage.url + '')) {
                                                    error = true;
                                                    return res.send(responseHelper("WA008"));
                                                } else {
                                                    isMediaID = 0;
                                                }
                                            }
                                            if (!objMessage.hasOwnProperty('url')) {
                                                if (typeof objMessage.id == undefined && !validator.isEmpty(objMessage.id + '')) {
                                                    error = false;
                                                    return res.send(responseHelper("WA009"));
                                                } else {
                                                    isMediaID = 1;
                                                }
                                            }
                                            if (isMediaID == 0) {
                                                let tempUrlSize = await validateMediaUrl.fileSize(objMessage.url);
                                                let extension = objMessage.url.match(regex);
                                                if (msgType == "document") {
                                                    if (tempUrlSize.urlFileSizeinMB > 100) {
                                                        return res.send(responseHelper("WA039"));
                                                    } else {
                                                        mediaType = 0;
                                                    }
                                                }
                                                if (msgType == "image") {
                                                    if (extension[0] == 'png' || extension[0] == 'jpg' || extension[0] == 'jpeg') {
                                                        if (tempUrlSize.urlFileSizeinMB > 5) {
                                                            return res.send(responseHelper("WA038"));
                                                        } else {
                                                            mediaType = 1;
                                                        }
                                                    } else {
                                                        return res.send(responseHelper("WA011"));
                                                    }
                                                }
                                                if (msgType == "video") {
                                                    if (extension[0] == 'mp4' || extension[0] == '3gp' || extension[0] == '3gpp') {
                                                        if (tempUrlSize.urlFileSizeinMB > 16) {
                                                            return res.send(responseHelper("WA042"));
                                                        } else {
                                                            mediaType = 2;
                                                        }
                                                    } else {
                                                        return res.send(responseHelper("WA012"));
                                                    }
                                                }
                                                if (msgType == "audio") {
                                                    //extension[0] == 'opus' is restricted at our end
                                                    if (extension[0] == 'mp4' || extension[0] == 'mp3' || extension[0] == 'mpeg' || extension[0] == 'wav' || extension[0] == 'amr' || extension[0] == 'aac') {
                                                        if (tempUrlSize.urlFileSizeinMB > 16) {
                                                            return res.send(responseHelper("WA043"));
                                                        }
                                                        else if (messageObj.message.hasOwnProperty('caption') || messageObj.message.hasOwnProperty('filename')) {
                                                            return res.send(responseHelper("WA040"));
                                                        }
                                                        else {
                                                            mediaType = 3;
                                                        }
                                                    } else {
                                                        return res.send(responseHelper("WA013"));
                                                    }
                                                }
                                                return ([1, mediaType, wabaInfoResult]);
                                            }
                                            if (isMediaID == 1) {
                                                let result = await sendService.fetchMediaFileName(objMessage.id);
                                                if (result.length > 0) {
                                                    switch (result[0].mediatype) {
                                                        case 0:
                                                        case 1:
                                                        case 2:
                                                        case 3:
                                                            mediaType = result[0].mediatype;
                                                            fileName = result[0].medianame;
                                                            s3MediaUrl = result[0].mediaurl;
                                                            return ([1, mediaType, wabaInfoResult]);
                                                    }
                                                } else {
                                                    return res.send(responseHelper("WA014"));
                                                }
                                            }
                                        } catch (error) {
                                            return res.send(responseHelper("WA101"));
                                        }
                                    case "text":
                                        try {
                                            if (typeof objMessage.text == undefined || validator.isEmpty(objMessage.text + '') || objMessage.text == null) {
                                                error = true;
                                                return res.send(responseHelper("WA015"));
                                            } else if (typeof objMessage.text != undefined && (objMessage.text + '').length > maxTextLength) {
                                                error = true;
                                                return res.send(responseHelper("WA016"));
                                            } else {
                                                return ([1, 4, wabaInfoResult]);
                                            }
                                        } catch (error) {
                                            return res.send(responseHelper("WA101"));
                                        }
                                    case "location":
                                        try {
                                            if (typeof objMessage.latitude == undefined || validator.isEmpty(objMessage.latitude + '') || objMessage.latitude == null) {
                                                error = true;
                                                return res.send(responseHelper("WA017"));
                                            } else if (typeof objMessage.longitude == undefined || validator.isEmpty(objMessage.longitude + '') || objMessage.longitude == null) {
                                                error = true;
                                                return res.send(responseHelper("WA018"));
                                            } else if (typeof objMessage.address == undefined || validator.isEmpty(objMessage.address + '') || objMessage.address == null) {
                                                error = true;
                                                return res.send(responseHelper("WA019"));
                                            } else if (typeof objMessage.name == undefined || validator.isEmpty(objMessage.name + '') || objMessage.name == null) {
                                                error = true;
                                                return res.send(responseHelper("WA020"));
                                            } else {
                                                let regex = new RegExp('^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$');
                                                let latitude = objMessage.latitude.match(regex);
                                                let longitude = objMessage.longitude.match(regex);
                                                if (latitude[0] != 0 && longitude[0] != 0) {
                                                    return ([1, 5, wabaInfoResult]);
                                                } else {
                                                    error = true;
                                                    return res.send(responseHelper("WA021"));
                                                }
                                            }
                                        } catch (error) {
                                            return res.send(responseHelper("WA101"));
                                        }
                                    case "contact":
                                        try {
                                            if (typeof objMessage.contacts == undefined || validator.isEmpty(objMessage.contacts + '')) {
                                                error = true;
                                                return res.send(responseHelper("WA022"));
                                            } else if (objMessage.contacts.name == undefined || validator.isEmpty(objMessage.contacts.name + '')) {
                                                error = true;
                                                return res.send(responseHelper("WA023"));
                                            } else if (objMessage.contacts.name.first_name == undefined || validator.isEmpty(objMessage.contacts.name.first_name + '')) {
                                                error = true;
                                                return res.send(responseHelper("WA024"));
                                            } else if (objMessage.contacts.name.last_name == undefined || validator.isEmpty(objMessage.contacts.name.last_name + '')) {
                                                error = true;
                                                return res.send(responseHelper("WA025"));
                                            } else {
                                                return ([1, 6, wabaInfoResult]);
                                            }
                                        } catch (error) {
                                            error = true;
                                            return res.send(responseHelper("WA101"));
                                        }
                                    case "sticker":
                                        try {
                                            let extension = objMessage.url.match(regex);
                                            let tempUrlSize = await validateMediaUrl.fileSize(objMessage.url);
                                            if (typeof objMessage.url == undefined || validator.isEmpty(objMessage.url + '')) {
                                                error = true;
                                                return res.send(responseHelper("WA026"));
                                            } else {
                                                if (extension[0] == 'webp') {
                                                    if (tempUrlSize.urlFileSizeinKB > 100) {
                                                        return res.send(responseHelper("WA044"));
                                                    } else {
                                                        return ([1, 7, wabaInfoResult]);
                                                    }
                                                } else {
                                                    return res.send(responseHelper("WA041"));
                                                }
                                            }
                                        } catch (error) {
                                            return res.send(responseHelper("WA101"));
                                        }
                                    case "template":
                                        try {
                                            if (typeof objMessage.templateid == undefined || validator.isEmpty(objMessage.templateid + '')) {
                                                error = true;
                                                return res.send(responseHelper("WA027"));
                                            } else {
                                                return ([0, 8, wabaInfoResult]);
                                            }
                                        } catch (error) {
                                            return res.send(responseHelper("WA101"));
                                        }
                                    case "interactive":
                                        try {
                                            if (typeof objMessage.interactive == undefined || validator.isEmpty(objMessage.interactive + '') || Object.keys(objMessage.interactive).length == 0) {
                                                error = true;
                                                return res.send(responseHelper("WA033"));
                                            } else {
                                                return ([1, 9, wabaInfoResult]);
                                            }
                                        } catch (error) {
                                            return res.send(responseHelper("WA101"));
                                        }
                                }
                            }
                        } catch (error) {
                            return res.send(responseHelper("WA100", "Request Failed"));
                        }
                    };
                    const validateTemplate = async (validatePayloadResult) => {
                        try {
                            let isTemplate = validatePayloadResult[0];
                            let msgType = validatePayloadResult[1];
                            let wabaInfoResult = validatePayloadResult[2];
                            if (isTemplate == 1) {
                                switch (msgType) {
                                    case 0:
                                    case 1:
                                    case 2:
                                    case 3:
                                        return ([msgType, wabaInfoResult, '']);
                                    case 4:
                                        return ([msgType, wabaInfoResult, '']);
                                    case 5:
                                        return ([msgType, wabaInfoResult, '']);
                                    case 6:
                                        return ([msgType, wabaInfoResult, '']);
                                    case 7:
                                        return ([msgType, wabaInfoResult, '']);
                                    case 9:
                                        return ([msgType, wabaInfoResult, '']);
                                }
                            } else {
                                switch (msgType) {
                                    case 8:
                                        let result = await sendService.getTemplate(messageObj.message.templateid);
                                        if (result.length > 0) {
                                            return ([msgType, wabaInfoResult, result]);
                                        } else {
                                            return res.send(responseHelper("WA028"));
                                        }
                                }
                            }
                        } catch (error) {
                            return res.send(responseHelper("WA100", "Request Failed"));
                        }
                    };
                    const createPayload = async (validateTemplateResult) => {
                        try {
                            let msgType = validateTemplateResult[0];
                            let wabaInfoResult = validateTemplateResult[1];
                            let templateResult = validateTemplateResult[2];
                            let to = messageObj.to.replace("+", "");
                            let messagePayload = {};
                            switch (msgType) {
                                case 0:
                                    messagePayload = {
                                        "to": to,
                                        "type": "document",
                                        "recipient_type": "individual"
                                    };
                                    if (setflag == 1) {
                                        messagePayload.messaging_product = "whatsapp";
                                    }
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
                                    return ([messagePayload, wabaInfoResult, msgType]);
                                case 1:
                                    messagePayload = {
                                        "to": to,
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
                                    return ([messagePayload, wabaInfoResult, msgType]);
                                case 2:
                                    messagePayload = {
                                        "to": to,
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
                                    return ([messagePayload, wabaInfoResult, msgType]);
                                case 3:
                                    messagePayload = {
                                        "to": to,
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
                                    return ([messagePayload, wabaInfoResult, msgType]);
                                case 4:
                                    messagePayload = {
                                        "to": to,
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
                                    return ([messagePayload, wabaInfoResult, msgType]);
                                case 5:
                                    messagePayload = {
                                        "to": to,
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
                                    return ([messagePayload, wabaInfoResult, msgType]);
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
                                            "to": to,
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
                                                return res.send(responseHelper("WA029"));
                                            } else {
                                                let phoneObj = {
                                                    "phone": messageObj.message.contacts.phones[i].phone,
                                                    "type": messageObj.message.contacts.phones[i].type
                                                };
                                                messagePayload.contacts[0].phones.push(phoneObj);
                                                bodyContent.body[0].phones.push(phoneObj);
                                            }
                                        }
                                    } else {
                                        return res.send(responseHelper("WA030"));
                                    }
                                    return ([messagePayload, wabaInfoResult, msgType]);
                                case 7:
                                    messagePayload = {
                                        "to": to,
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
                                        messagePayload.sticker.assign = {
                                            "provider": {
                                                "name": ""
                                            }
                                        };
                                    }
                                    bodyContent = {
                                        "body": "<a href='" + messageObj.message.url + "'>Media</a>"
                                    };
                                    return ([messagePayload, wabaInfoResult, msgType]);
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
                                                let placeholderLength;
                                                if (templateResult[0].placeholders != null) {
                                                    placeholderLength = templateResult[0].placeholders.split(",");
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
                                                            tempContent = tempContent.replace('{{' + i + '}}', x);
                                                            i++;
                                                        }
                                                        bodyContent = {
                                                            "body": tempContent
                                                        };
                                                    } else {
                                                        return res.send(responseHelper("WA031"));
                                                    }
                                                } else {
                                                    return res.send(responseHelper("WA031"));
                                                }
                                            } else {
                                                bodyContent = {
                                                    "body": templateResult[0].body_message.toString()
                                                };
                                            }
                                        } else {
                                            bodyContent = {
                                                "body": templateResult[0].body_message.toString()
                                            };
                                        }
                                        if (templateResult[0].head_mediatype != '') {
                                            let regex = new RegExp('[^.]+$');
                                            let extension = objMessage.url.match(regex);
                                            let tempUrlSize = await validateMediaUrl.fileSize(objMessage.url);
                                            let component_header = {
                                                "type": "header",
                                                "parameters": []
                                            };
                                            if (templateResult[0].head_mediatype == 0) {
                                                if (tempUrlSize.urlFileSizeinMB > 100) {
                                                    return res.send(responseHelper("WA039"));
                                                }
                                                component_header.parameters.push({
                                                    "type": "document",
                                                    "document": {
                                                        "link": messageObj.message.url,
                                                        "filename": messageObj.message.filename != undefined ? messageObj.message.filename : ""
                                                    }
                                                });
                                            }
                                            if (templateResult[0].head_mediatype == 1) {
                                                if (extension[0] == 'png' || extension[0] == 'jpg' || extension[0] == 'jpeg') {
                                                    if (tempUrlSize.urlFileSizeinMB > 5) {
                                                        return res.send(responseHelper("WA038"));
                                                    }
                                                    component_header.parameters.push({
                                                        "type": "image",
                                                        "image": {
                                                            "link": messageObj.message.url
                                                        }
                                                    });
                                                } else {
                                                    return res.send(responseHelper("WA011"));
                                                }
                                            }
                                            if (templateResult[0].head_mediatype == 2) {
                                                if (extension[0] == 'mp4' || extension[0] == '3gp' || extension[0] == '3gpp') {
                                                    if (tempUrlSize.urlFileSizeinMB > 16) {
                                                        return res.send(responseHelper("WA042"));
                                                    }
                                                    component_header.parameters.push({
                                                        "type": "video",
                                                        "video": {
                                                            "link": messageObj.message.url
                                                        }
                                                    });
                                                } else {
                                                    return res.send(responseHelper("WA012"));
                                                }
                                            }
                                            messagePayload.template.components.push(component_header);
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
                                                                return res.send(responseHelper("WA035"));
                                                            }
                                                        }
                                                        component_button.parameters = tempArr;
                                                        messagePayload.template.components.push(component_button);
                                                    }
                                                    if (callToActionArr[i].visit_website.web_url_option == 0) {
                                                    }
                                                }
                                            }
                                        }
                                        if (templateResult[0].button_option != '' && templateResult[0].button_option == 1) {
                                            let quickReplyArr = messageObj.message.buttons;
                                            if (quickReplyArr != undefined) {
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
                                            } else {
                                                return res.send(responseHelper("WA037"));
                                            }
                                        }
                                    } else {
                                        if (messageObj.message.hasOwnProperty('url')) {
                                            return res.send(responseHelper("WA101"));
                                        }
                                        if (messageObj.message.placeholders != undefined) {
                                            if (messageObj.message.placeholders.length > 0) {
                                                let placeholderLength;
                                                if (templateResult[0].placeholders != null) {
                                                    placeholderLength = templateResult[0].placeholders.split(",");
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
                                                            tempContent = tempContent.replace('{{' + i + '}}', x);
                                                            i++;
                                                        }
                                                        bodyContent = {
                                                            "body": tempContent
                                                        };
                                                    } else {
                                                        return res.send(responseHelper("WA031"));
                                                    }
                                                } else {
                                                    return res.send(responseHelper("WA031"));
                                                }
                                            } else {
                                                bodyContent = {
                                                    "body": templateResult[0].body_message.toString()
                                                };
                                            }
                                        } else {
                                            bodyContent = {
                                                "body": templateResult[0].body_message.toString()
                                            };
                                        }
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
                                                return res.send(responseHelper("WA034"));
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
                                                                return res.send(responseHelper("WA035"));
                                                            }
                                                        }
                                                        component_button.parameters = tempArr;
                                                        messagePayload.template.components.push(component_button);
                                                    }
                                                }
                                            }
                                        }
                                        if (templateResult[0].button_option != '' && templateResult[0].button_option == 1) {
                                            let quickReplyArr = messageObj.message.buttons;
                                            if (messageObj.message.buttons[0].type == 'quick_reply') {
                                                if (quickReplyArr != undefined) {
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
                                                } else {
                                                    return res.send(responseHelper("WA037"));
                                                }
                                            } else {
                                                return res.send(responseHelper("WA101"));
                                            }
                                        }
                                    }
                                    return ([messagePayload, wabaInfoResult, msgType]);
                                case 9:
                                    messagePayload = {
                                        "to": to,
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
                                    return ([messagePayload, wabaInfoResult, msgType]);
                            }
                        } catch (error) {
                            return res.send(responseHelper("WA100", "Request Failed"));
                        }
                    };
                    const checkSubscription = async (createPayloadResult) => {
                        try {
                            let messagePayload = createPayloadResult[0];
                            let wabaInfoResult = createPayloadResult[1];
                            let msgType = createPayloadResult[2];
                            if (wabaInfoResult.length > 0) {
                                try {
                                    let result = await sendService.checkSubscription(messagePayload.to, wabaInfoResult[0].wanumber);
                                    if (result == 0) {
                                        let direction = 1;
                                        let waMessageId = null;
                                        let errorCode = 100;
                                        let errorDesc = 'No subscription found for the mobile number';
                                        try {
                                            let Insertresult = await sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, JSON.stringify(messageObj), bodyContent, countryCodeNumeric);
                                            let id = Insertresult.insertId;
                                            try {
                                                let UpdateResult = await sendService.updateUnsubscribedMessageAPI(id, countryCodeNumeric);
                                                return UpdateResult;
                                            } catch (error) {
                                                return res.send(responseHelper("WA100", error.message));
                                            }
                                        } catch (error) {
                                            return res.send(responseHelper("WA100", error.message));
                                        }
                                    } else {
                                        return ([messagePayload, wabaInfoResult, msgType]);
                                    }
                                } catch (error) {
                                    console.log('Record shifted to sent master');
                                    return res.send(responseHelper("WA032", 'No subscription found for the mobile number ' + messagePayload.to));
                                }
                            } else {
                                return res.send(responseHelper("WA100", "Invalid WABA APIKey"));
                            }
                        } catch (error) {
                            return res.send(responseHelper("WA100", "Request Failed"));
                        }
                    };
                    const sendMessage = async (checkSubscriptionResult) => {
                        try {
                            let messagePayload = checkSubscriptionResult[0];
                            let wabaInfoResult = checkSubscriptionResult[1];
                            let msgType = checkSubscriptionResult[2];
                            if (setflag == 0) {
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
                                    if (typeof response.messages != undefined) {
                                        let errorCode = null;
                                        let errorDesc = null;
                                        let waMessageId1 = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                                        sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId1, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, messageObj, bodyContent, countryCodeNumeric).then((result) => {
                                            errorLogger.info("**********************************************************");
                                            errorLogger.info("REQUEST_BODY: " + JSON.stringify(req.body));
                                            errorLogger.info("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                            errorLogger.info("MESSAGE_ID: " + waMessageId1);
                                            errorLogger.info("**********************************************************");
                                            return res.send({
                                                code: "200",
                                                status: 'SUCCESS',
                                                message: 'Message Processed Successfully',
                                                data: {
                                                    messageid: waMessageId1
                                                }
                                            });
                                        }).catch((err) => {
                                            errorLogger.error("**********************************************************");
                                            errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
                                            errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                            errorLogger.error("MESSAGE_ID: " + waMessageId1);
                                            errorLogger.error("ERROR: " + err);
                                            errorLogger.error("**********************************************************");
                                            HelperResult = responseHelper("WA100", err.message);
                                            return res.send(HelperResult);
                                        });
                                    } else {
                                        return res.send(responseHelper("WA100", JSON.stringify(response)));
                                    }
                                }).catch((err) => {
                                    errorLogger.error("**********************************************************");
                                    errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
                                    errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                    errorLogger.error("MESSAGE_ID: " + null);
                                    errorLogger.error("ERROR: " + err);
                                    errorLogger.error("**********************************************************");
                                    if (err.response != undefined) {
                                        let WhatsAppErr = err.response.data.errors;
                                        let WhatsAppErrCode = err.response.data.errors[0].code;
                                        let WhatsAppErrDetails = err.response.data.errors[0].details;
                                        return res.send(responseHelper(WhatsAppErrCode, WhatsAppErrDetails));
                                    } else {
                                        return res.send(responseHelper("WA100", "Request Failed"));
                                    }
                                });
                            } else {
                                let direction = 1;
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
                                    if (typeof response.messages != undefined) {
                                        let errorCode = null;
                                        let errorDesc = null;
                                        let waMessageId2 = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                                        sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId2, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, messageObj, bodyContent, countryCodeNumeric).then((result) => {
                                            errorLogger.info("**********************************************************");
                                            errorLogger.info("REQUEST_BODY: " + JSON.stringify(req.body));
                                            errorLogger.info("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                            errorLogger.info("MESSAGE_ID: " + waMessageId2);
                                            errorLogger.info("**********************************************************");
                                            return res.send({
                                                code: "200",
                                                status: 'SUCCESS',
                                                message: 'Message Processed Successfully',
                                                data: {
                                                    messageid: waMessageId2
                                                }
                                            });
                                        }).catch((err) => {
                                            errorLogger.error("**********************************************************");
                                            errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
                                            errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                            errorLogger.error("MESSAGE_ID: " + waMessageId2);
                                            errorLogger.error("ERROR: " + err);
                                            errorLogger.error("**********************************************************");
                                            return res.send(responseHelper("WA100", err.message));
                                        });
                                    } else {
                                        return res.send(responseHelper("WA100", JSON.stringify(response)));
                                    }
                                }).catch((err) => {
                                    errorLogger.error("**********************************************************");
                                    errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
                                    errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                    errorLogger.error("MESSAGE_ID: " + null);
                                    errorLogger.error("ERROR: " + err);
                                    errorLogger.error("**********************************************************");
                                    if (err.response != undefined) {
                                        let WhatsAppErr = err.response.data.error;
                                        let WhatsAppErrCode = err.response.data.error.code;
                                        let WhatsAppErrDetails = err.response.data.error.message;
                                        return res.send(responseHelper(WhatsAppErrCode, WhatsAppErrDetails));
                                    } else {
                                        return res.send(responseHelper("WA100", "Request Failed"));
                                    }
                                });
                            }
                        } catch (error) {
                            errorLogger.error(JSON.stringify(error));
                            return res.send(responseHelper("WA100", "Request Failed"));
                        }
                    };
                    await (async () => {
                        try {
                            const validateApiKeyResult = await validateApiKey();
                            const wabaResult = await wabaInfo(validateApiKeyResult);
                            const validatePayloadResult = await validatePayload(wabaResult);
                            const validateTemplateResult = await validateTemplate(validatePayloadResult);
                            const createPayloadResult = await createPayload(validateTemplateResult);
                            const checkSubscriptionResult = await checkSubscription(createPayloadResult);
                            const sendMessageResult = await sendMessage(checkSubscriptionResult);
                        } catch (error) {
                            return res.send(responseHelper("WA100", "Request Failed"));
                        }
                    })();
                } catch (error) {
                    HelperResult = responseHelper("WA100", error.message != undefined ? error.message : 'Request Failed');
                    return res.send(HelperResult);
                }
            }
        };
        await (async () => {
            try {
                const validatedTokenResult = await validatedToken();
                const sendMsgRseult = await sendMsg(validatedTokenResult);
            } catch (error) {
                errorLogger.error(JSON.stringify(error));
                HelperResult = responseHelper("WA100", error.message != undefined ? error.message : 'Request Failed');
                return res.send(HelperResult);
            }
        })();
    } catch (error) {
        errorLogger.error(JSON.stringify(error));
        HelperResult = responseHelper("WA100", error.message != undefined ? error.message : 'Request Failed');
        return res.send(HelperResult);
    }
};