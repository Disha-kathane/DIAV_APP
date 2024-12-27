const async = require('async');
let axios = require('axios');
let http = require('http');
let https = require('https');
const { nextTick, send } = require('process');
let httpUrl = require('url');
const { errorLogger, infoLogger } = require('../../applogger');
const sendService = require('../../services/v1/send');
const validator = require('validator');
const botUtils = require('../../utils/bot');

module.exports = async (req, res) => {
    async.waterfall([
        (done) => {
            sendService.checkWanumber(req.body.from, (err, checkWanumberResult) => {
                if (err) {
                    done(err);
                } else {
                    // console.log({ checkWanumberResult });
                    if (checkWanumberResult.length > 0) {
                        if (checkWanumberResult[0].phone_number_id != '' && (checkWanumberResult[0].phone_number_id != null && checkWanumberResult[0].phone_number_id != undefined)) {
                            done(null, 1);
                        } else {
                            done(null, 0);
                        }
                    } else {
                        return done({
                            code: 'WA100',
                            status: 'FAILED',
                            message: 'Wabanumber Not Found',
                            data: {}
                        });
                    }
                }
            });
        },
        (iscloud, done) => {
            if (iscloud == 0) {
                // optin(req.headers.apikey, req, (err, result) => {
                //     if (err) {
                //         done(err);
                //     } else {
                //         done(null, result);
                //     }
                // });
                done(null, iscloud);
            } else {
                done(null, iscloud);
            }
        },
        (optinresponse, done) => {
            sendMsg(req.headers.apikey, req.body, req, (err, result) => {
                if (err) {
                    done(err);
                } else {
                    done(null, result);
                }
            });
        }
    ], (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
};

function getClientIP(req) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}


let optin = (apiKey, req, next) => {
    try {
        let messageObj = req.body;
        // console.log('OPTIN_API_PAYLOAD : ' + JSON.stringify(messageObj));
        let from = (typeof req.body.from != undefined) ? req.body.from + '' : '';
        let to = (typeof req.body.to != undefined) ? req.body.to + '' : '';
        let userId = null;

        from = from.replace(/ /g, '');
        from = from.replace(/\+/g, '');
        to = to.replace(/ /g, '');
        to = to.replace(/\+/g, '');

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
                    if (result != null && result.length > 0) {
                        if (result[0].userstatus == 1) {
                            userId = result[0].userid;
                            done(null, result);
                        } else {
                            return done({
                                code: 'WA001',
                                status: 'FAILED',
                                message: 'User is Inactive',
                                data: {}
                            });
                        }
                    }
                    else {
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

        let wabaInfo = (result, done) => {
            let wabanumber = null;
            // console.log('from: ' + from);
            // console.log('to: ' + to);
            if (typeof from == undefined || validator.isEmpty(from + '') || from == null) {
                error = true;
                return done({
                    code: 'WA003',
                    status: 'FAILED',
                    message: 'Mobile number(from or to) is required',
                    data: {}
                });
            }
            else {
                // if (botUtils.isMobileInternational(from)) {
                //     wabaCountryCode = botUtils.getCountryCode(from);
                //     wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(from);
                // }
                // else {
                //     return done({
                //         code: 'WA004',
                //         status: 'FAILED',
                //         message: 'Mobile number(from or to) must contain country code',
                //         data: {}
                //     });
                // }

                let tmpWabaNumber = from.replace(/^91/g, '');
                // console.log('tmpWabaNumber=============>' + tmpWabaNumber);
                if (!tmpWabaNumber.startsWith('9') ||
                    !tmpWabaNumber.startsWith('8') ||
                    !tmpWabaNumber.startsWith('7') ||
                    !tmpWabaNumber.startsWith('6')) {
                    wabaCountryCode = botUtils.getCountryCode(from);
                    wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(from);
                }
                else {
                    if (botUtils.isMobileInternational(from)) {
                        wabaCountryCode = botUtils.getCountryCode(from);
                        wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(from);
                    }
                    else {
                        return done({
                            code: 'WA004',
                            status: 'FAILED',
                            message: 'Mobile number(from) must contain Country Code',
                            data: {}
                        });
                    }
                }
            }

            if (typeof to == undefined || validator.isEmpty(to + '') || to == null) {
                error = true;
                return done({
                    code: 'WA003',
                    status: 'FAILED',
                    message: 'Mobile number(from or to) is required',
                    data: {}
                });
            }
            else {
                // if (botUtils.isMobileInternational(to)) {
                //     wabaCountryCode = botUtils.getCountryCode(to);
                //     wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(to);
                // }
                // else {
                //     return done({
                //         code: 'WA004',
                //         status: 'FAILED',
                //         message: 'Mobile number(from or to) must contain country code',
                //         data: {}
                //     });
                // }

                let tmpToNumber = from.replace(/^91/g, '');
                // console.log('tmpToNumber=============>' + tmpToNumber);
                if (!tmpToNumber.startsWith('9') ||
                    !tmpToNumber.startsWith('8') ||
                    !tmpToNumber.startsWith('7') ||
                    !tmpToNumber.startsWith('6')) {
                    wabaCountryCode = botUtils.getCountryCode(to);
                    wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(to);
                }
                else {
                    if (botUtils.isMobileInternational(to)) {
                        wabaCountryCode = botUtils.getCountryCode(to);
                        wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(to);
                    }
                    else {
                        return done({
                            code: 'WA004',
                            status: 'FAILED',
                            message: 'Mobile number(to) must contain Country Code',
                            data: {}
                        });
                    }
                }
            }

            sendService.getSpecificWabaInfo(result[0].userid, from, (err, result) => {
                if (err) {
                    console.log(err);
                    return done({
                        code: err.errno,
                        status: 'FAILED',
                        message: err.code,
                        data: {}
                    });
                }
                else {
                    if (result.length > 0) {
                        done(null, result);
                    }
                    else {
                        return done({
                            code: 'WA005',
                            status: 'FAILED',
                            message: 'from number is invalid or not found',
                            data: {}
                        });
                    }
                }
            });
        };

        let checkOptin = (wabaInfo, done) => {
            sendService.checkOptinContactStatus_Mod(from, to, (err, result) => {
                if (err) {
                    console.log('checkOptinContact err:' + JSON.stringify(err));
                    return done({
                        code: err.errno,
                        status: 'FAILED',
                        message: err.code,
                        data: {}
                    });
                }
                else {
                    if (result.length > 0) {
                        //added by  on 7/7/2022 for non whatsapp number
                        // console.log('checkOptinContact result :' + JSON.stringify(result[0].wastatus));
                        if (result[0].wastatus != 1) {
                            return done({
                                code: 'WA102',
                                status: 'FAILED',
                                message: 'Non WhatsApp Number',
                                data: {}
                            });

                        } else {
                            return done(null, null, 1); // 1 means already opted in for 7days
                        }

                    }
                    else {
                        done(null, wabaInfo, 0); // 0 means previous opt in expired
                    }
                }
            });
        };

        let doOptin = (wabaInfo, flag, done) => {
            //console.log('user details : ' + JSON.stringify(wabaInfo));
            if (flag == 0) {
                const api = '/v1/contacts';
                const objData = {
                    "blocking": "wait",
                    "contacts": ['+' + to]
                };
                const httpMethod = 1;
                const requestType = 1;
                const contentLength = Buffer.byteLength(JSON.stringify(objData));
                const apiHeaders = [{
                    'headerName': 'Authorization',
                    'headerVal': 'Bearer ' + wabaInfo[0].authtoken
                }, {
                    'headerName': 'content-length',
                    'headerVal': contentLength
                }];

                botUtils.callWhatsAppApi(wabaInfo[0].waurl, api, objData, httpMethod, requestType, apiHeaders).then((response) => {
                    // console.log('Optin Response====================>' + JSON.stringify(response));
                    if (typeof response.contacts != undefined) {
                        let status = null;
                        if (response.contacts[0].status == 'valid') {
                            status = 1;
                        }
                        if (response.contacts[0].status == 'invalid') {
                            status = 2;
                        }

                        sendService.insertOptinContacts_Mod(to, '+' + from, userId, 0, status, (err, result) => {
                            if (err) {
                                console.log(err);
                                return done({
                                    code: 'WA100',
                                    status: 'FAILED',
                                    message: 'Something went wrong(1)',
                                    data: {}
                                });
                            }
                            else {
                                //added by  on 7/7/2022 for non whatsapp number
                                // console.log('checkOptinContact result :' + JSON.stringify(status));
                                if (status != 1) {
                                    return done({
                                        code: 'WA102',
                                        status: 'FAILED',
                                        message: 'Non WhatsApp Number',
                                        data: {}
                                    });

                                } else {
                                    return done(null, 200);
                                }

                            }
                        });

                    }
                    else {
                        return done({
                            code: 'WA100',
                            status: 'FAILED',
                            message: 'Something went wrong(2)',
                            data: {}
                        });
                    }
                }).catch((err) => {
                    // console.log({ err });
                    // console.log('Optin Error====================>' + JSON.stringify(err));
                    return done({
                        code: 'WA100',
                        status: 'FAILED',
                        message: 'Something went wrong(3)',
                        data: {}
                    });
                });
            } else {
                return done(null, 200);
            }
        };

        async.waterfall([
            validateApiKey,
            wabaInfo,
            checkOptin,
            doOptin
        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
            }
        });
    }
    catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        next(error);
    }
};

let sendMsg = (apiKey, messageObj, req, next) => {
    try {
        console.log('sendMessage API Payload : ' + JSON.stringify(messageObj) + ', Req IP : ' + getClientIP(req));
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
        let isMediaID = -1;
        let fileName = null;
        let s3MediaUrl = null;
        let mediaType = null;
        let bodyContent = null;
        let category = null;
        let categoryId = 0;
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
                    // console.log({ result });
                    if (result != null && result.length > 0) {
                        if (result[0].userstatus == 1) {
                            userId = result[0].userid;

                            if (result[0].account_type == 0) {
                                userId = result[0].userid;
                                done(null, result);
                            } else if (result[0].account_type == 1) {
                                if (result[0].balance_amt > 0) {
                                    userId = result[0].userid;
                                    done(null, result);

                                } else {
                                    return done({
                                        code: 'WA036',
                                        status: 'FAILED',
                                        message: 'Insufficient Balance',
                                        data: {}
                                    });
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
            // console.log(result1)
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
                if (result.length > 0) {
                    // apikey = result1[0].apikey;
                    let phone_number_id = result[0].phone_number_id;
                    // console.log({})
                    if (phone_number_id != '' && phone_number_id != null && phone_number_id != undefined) {
                        //console.log(phone_number_id)
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
                                    if (getSpecificWabaInfoResult != undefined && getSpecificWabaInfoResult[0] != undefined) {
                                        getSpecificWabaInfoResult[0].authtoken = SystemAccessToken;
                                        done(null, getSpecificWabaInfoResult);
                                    }
                                    else {
                                        return done({
                                            code: 'WA100',
                                            status: 'FAILED',
                                            message: 'Wabanumber Not Found',
                                            data: {}
                                        });
                                    }
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
                let tmpWaNumber = wanumber.toString().replace(/^91/g, '');

                if (!tmpWaNumber.startsWith('9') &&
                    !tmpWaNumber.startsWith('8') &&
                    !tmpWaNumber.startsWith('7') &&
                    !tmpWaNumber.startsWith('6')) {
                    countryCode = botUtils.getCountryCode(wanumber);
                    countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
                } else {

                    if (botUtils.isMobileInternational(wanumber)) {
                        countryCode = botUtils.getCountryCode(wanumber);
                        countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
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
                                // console.log(mediaType);
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
                                    message: 'Text cannot exceed 4096 characters',
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
                category = 'service';
                categoryId = 2;
                switch (msgType) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        // console.log(isMediaID);
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
                        // console.log('validateTemplate: ' + JSON.stringify(wabaInfoResult));
                        done(null, msgType, wabaInfoResult, '');
                        break;
                }
            } else {
                switch (msgType) {
                    case 8:
                        sendService.getTemplate(messageObj.message.templateid, (err, result) => {
                            // console.log("getTemplateerr===================", err);
                            if (err) {
                                // return done({
                                //     code: "WA100",
                                //     status: 'FAILED',
                                //     message: err.message,
                                //     data: {}
                                // });
                                return {
                                    code: 'WA100',
                                    status: 'FAILED',
                                    message: "Something went wrong",
                                    data: []
                                };
                            }
                            if (result.length > 0) {
                                done(null, msgType, wabaInfoResult, result);
                            } else {
                                return done({
                                    code: "WA028",
                                    status: 'FAILED',
                                    message: 'Template ID is invalid',
                                    data: {}
                                });
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
                    // console.log("cloud message paylaod", messagePayload)
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
                    // console.log('Caption : ' + messageObj.message.caption);

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
                        // console.log(JSON.stringify(messagePayload));
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
                    category = templateResult[0].category;
                    categoryId = 1;
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
                        // console.log('TEMPLATE RESULT :' + messageObj.to + ' ' + templateResult[0].body_message);
                    }
                    if (setflag == 0) {
                        messagePayload.template.namespace = wabaInfoResult[0].hsmnamespace;
                        messagePayload.template.language.policy = "deterministic";
                    }
                    // if (templateResult[0].head_temptype != '' && templateResult[0].head_temptype == 0) {
                    //     if (messageObj.message.placeholders.length > 0) {
                    //         let placeholderLength = templateResult[0].placeholders.split(",");
                    //         console.log('Length ======================>' + placeholderLength.length, messageObj.message.placeholders.length);

                    //         if (placeholderLength.length == messageObj.message.placeholders.length) {
                    //             let tempArr = botUtils.fetchPlaceholders(JSON.stringify(messageObj.message.placeholders));
                    //             let component_body = {
                    //                 "type": "body",
                    //                 "parameters": tempArr
                    //             }
                    //             messagePayload.template.components.push(component_body);
                    //         }
                    //         else {
                    //             return done({
                    //                 code: "WA031",
                    //                 status: 'FAILED',
                    //                 message: "Placeholder count mismatch",
                    //                 data: {}
                    //             });
                    //         }
                    //     } else {

                    //     }


                    //     console.log('placeholder_template_type=========================>' + templateResult[0].placeholder_template_type);
                    //     if (templateResult[0].placeholder_template_type != '' &&
                    //         (templateResult[0].placeholder_template_type == 1 || templateResult[0].placeholder_template_type == 2) &&
                    //         templateResult[0].head_text_title != '' &&
                    //         templateResult[0].head_text_title.length > 0) {
                    //         if (messageObj.message.header != undefined && messageObj.message.header.length > 0) {
                    //             let component_header = {
                    //                 "type": "header",
                    //                 "parameters": [
                    //                     {
                    //                         "type": "text",
                    //                         "text": messageObj.message.header
                    //                     }
                    //                 ]
                    //             }
                    //             messagePayload.template.components.push(component_header);
                    //         }
                    //         else {
                    //             return done({
                    //                 code: "WA034",
                    //                 status: 'FAILED',
                    //                 message: "Header is missing",
                    //                 data: {}
                    //             });
                    //         }
                    //     }


                    //     if (templateResult[0].footer_text != '' && templateResult[0].footer_text.length > 0) {
                    //         let component_header = {
                    //             "type": "footer",
                    //             "parameters": [
                    //                 {
                    //                     "type": "text",
                    //                     "text": templateResult[0].footer_text
                    //                 }
                    //             ]
                    //         }
                    //         messagePayload.template.components.push(component_header);
                    //     }
                    //     if (templateResult[0].button_option != '' && templateResult[0].button_option == 0) {
                    //         let callToActionArr = JSON.parse(templateResult[0].button_option_string);

                    //         for (let i = 0; i < callToActionArr.length; ++i) {
                    //             if (callToActionArr[i].call_phone != null && callToActionArr[i].call_phone != undefined) {
                    //                 let tempArr = [];
                    //                 let component_button = {
                    //                     "type": "button",
                    //                     "sub_type": "url",
                    //                     "index": i,
                    //                     "parameters": tempArr
                    //                 }
                    //                 tempArr.push({
                    //                     "type": "text",
                    //                     "text": callToActionArr[i].call_phone.phone_button_text
                    //                 });
                    //                 component_button.parameters = tempArr;
                    //                 messagePayload.template.components.push(component_button);
                    //             }
                    //             if (callToActionArr[i].visit_website != null && callToActionArr[i].visit_website != undefined) {
                    //                 let tempArr = [];
                    //                 let component_button = {
                    //                     "type": "button",
                    //                     "sub_type": "url",
                    //                     "index": i,
                    //                     "parameters": tempArr
                    //                 }

                    //                 if (callToActionArr[i].visit_website.web_url_option == 1) {

                    //                     for (let k = 0; k < messageObj.message.buttons.length; k++) {
                    //                         if (messageObj.message.buttons[k].placeholder != undefined &&
                    //                             messageObj.message.buttons[k].placeholder.length > 0) {
                    //                             tempArr.push({
                    //                                 "type": "text",
                    //                                 "text": messageObj.message.buttons[k].placeholder
                    //                             });
                    //                             break;
                    //                         }
                    //                         else {
                    //                             return done({
                    //                                 code: "WA035",
                    //                                 status: 'FAILED',
                    //                                 message: "Dynamic URL Placeholder is missing",
                    //                                 data: {}
                    //                             });
                    //                         }
                    //                     }

                    //                     component_button.parameters = tempArr;
                    //                     messagePayload.template.components.push(component_button);
                    //                 }
                    //                 if (callToActionArr[i].visit_website.web_url_option == 0) {
                    //                     tempArr.push({
                    //                         "type": "text",
                    //                         "text": callToActionArr[i].visit_website.web_button_text
                    //                     });
                    //                     component_button.parameters = tempArr;
                    //                     messagePayload.template.components.push(component_button);
                    //                 }
                    //             }
                    //         }
                    //     }
                    //     if (templateResult[0].button_option != '' && templateResult[0].button_option == 1) {
                    //         let quickReplyArr = JSON.parse(templateResult[0].button_option_string);

                    //         for (let i = 0; i < quickReplyArr.length; ++i) {
                    //             let tempArr = [];
                    //             let component_button = {
                    //                 "type": "button",
                    //                 "sub_type": "quick_reply",
                    //                 "index": i,
                    //                 "parameters": tempArr
                    //             }
                    //             tempArr.push({
                    //                 "type": "payload",
                    //                 "payload": quickReplyArr[i].quick_reply
                    //             });
                    //             component_button.parameters = tempArr;
                    //             messagePayload.template.components.push(component_button);
                    //         }
                    //     }
                    // }
                    if (templateResult[0].head_temptype != '' && templateResult[0].head_temptype == 1) {
                        // console.log('HEAD TEMPTYPE RESULT 1 :' + messageObj.to + ' ' + JSON.stringify(templateResult[0].body_message));
                        // console.log('HEAD TEMPTYPE RESULT 1 :' + messageObj.to + ' ' + JSON.stringify(messageObj.message.placeholders));
                        if (messageObj.message.placeholders != undefined) {
                            if (messageObj.message.placeholders.length > 0) {
                                let placeholderLength = null;
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
                                            //console.log(x, '{{' + i + '}}');
                                            tempContent = tempContent.replace('{{' + i + '}}', x);
                                            i++;
                                        }
                                        bodyContent = {
                                            "body": tempContent
                                        };
                                        // console.log('BODYCONTENT RESULT 1_1 :'+messageObj.to+' '+JSON.stringify(bodyContent));
                                    } else {
                                        return done({
                                            code: "WA031",
                                            status: 'FAILED',
                                            message: "Placeholder count mismatch",
                                            data: {}
                                        });
                                    }
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
                                // console.log('BODYCONTENT RESULT 1_2 :' + messageObj.to + ' ' + JSON.stringify(bodyContent));
                            }
                        } else {
                            bodyContent = {
                                "body": templateResult[0].body_message.toString()
                            };
                        }

                        // console.log('i am here ========================> ' + templateResult[0].placeholder_template_type);
                        // if (templateResult[0].placeholder_template_type != '' &&
                        //     (templateResult[0].placeholder_template_type == 1 || templateResult[0].placeholder_template_type == 2)
                        //      &&
                        //     templateResult[0].head_text_title != '' &&
                        //     templateResult[0].head_text_title.length > 0
                        //     ) 

                        if (templateResult[0].head_mediatype != '' && messageObj.message.url != undefined) {
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
                        else if (templateResult[0].head_mediatype != '' && messageObj.message.id != undefined) {
                            let component_header = {
                                "type": "header",
                                "parameters": []
                            };
                            if (templateResult[0].head_mediatype == 0) {
                                component_header.parameters.push({
                                    "type": "document",
                                    "document": {
                                        "id": messageObj.message.id,
                                        "filename": messageObj.message.filename != undefined ? messageObj.message.filename : ""
                                    }
                                });
                            }
                            if (templateResult[0].head_mediatype == 1) {
                                component_header.parameters.push({
                                    "type": "image",
                                    "image": {
                                        "id": messageObj.message.id
                                    }
                                });
                            }
                            if (templateResult[0].head_mediatype == 2) {
                                component_header.parameters.push({
                                    "type": "video",
                                    "video": {
                                        "id": messageObj.message.id
                                    }
                                });
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


                        if (templateResult[0].button_option != '' && templateResult[0].button_option == 0 && templateResult[0].button_option_string != '' && templateResult[0].button_option_string.length > 0) {
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
                                // if (callToActionArr[i].visit_website != null && callToActionArr[i].visit_website != undefined) {
                                //     let tempArr = [];
                                //     let component_button = {
                                //         "type": "button",
                                //         "sub_type": "url",
                                //         "index": i + 1,
                                //         "parameters": tempArr
                                //     }
                                //     tempArr.push({
                                //         "type": "text",
                                //         "text": callToActionArr[i].visit_website.web_button_text
                                //     });
                                //     component_button.parameters = tempArr;
                                //     messagePayload.template.components.push(component_button);
                                // }
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
                        if (templateResult[0].button_option != '' && templateResult[0].button_option == 1 && templateResult[0].button_option_string != '' && templateResult[0].button_option_string.length > 0) {
                            // let quickReplyArr = JSON.parse(templateResult[0].button_option_string);

                            // for (let i = 0; i < quickReplyArr.length; ++i) {
                            //     let tempArr = [];
                            //     let component_button = {
                            //         "type": "button",
                            //         "sub_type": "quick_reply",
                            //         "index": i,
                            //         "parameters": tempArr
                            //     }
                            //     tempArr.push({
                            //         "type": "payload",
                            //         "payload": quickReplyArr[i].quick_reply
                            //     });
                            //     component_button.parameters = tempArr;
                            //     messagePayload.template.components.push(component_button);
                            // }

                            let quickReplyArr = messageObj.message.buttons;
                            if (quickReplyArr != undefined && messageObj.message.buttons[0].type == 'quick_reply') {
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
                                    return done({
                                        code: "WA031",
                                        status: 'FAILED',
                                        message: "Quick reply count mismatch",
                                        data: {}
                                    });
                                }
                            }
                            else {
                                console.log("i m here 2");
                                // return done({
                                //     code: "WA100",
                                //     status: 'FAILED',
                                //     message: "Invalid Payload",
                                //     data: {}
                                // });

                                return done({
                                    code: "WA031",
                                    status: 'FAILED',
                                    message: "Quick reply count mismatch",
                                    data: {}
                                });
                            }
                        }
                    } else {
                        if (messageObj.message.placeholders != undefined) {
                            if (messageObj.message.placeholders.length > 0) {
                                let placeholderLength = null;
                                if (templateResult[0].placeholders != null) {
                                    placeholderLength = templateResult[0].placeholders.split(",");
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
                            // console.log('BODYCONTENT RESULT 2 :' + messageObj.to + ' ' + JSON.stringify(bodyContent));
                        } else {
                            bodyContent = {
                                "body": templateResult[0].body_message.toString()
                            };
                        }

                        // console.log('placeholder_template_type=========================>' + templateResult[0].placeholder_template_type);
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

                        // if (templateResult[0].footer_text != '' && templateResult[0].footer_text.length > 0) {
                        //     let component_header = {
                        //         "type": "footer",
                        //         "parameters": [{
                        //             "type": "text",
                        //             "text": templateResult[0].footer_text
                        //         }]
                        //     }
                        //     messagePayload.template.components.push(component_header);
                        // }
                        if (templateResult[0].button_option != '' && templateResult[0].button_option == 0 && templateResult[0].button_option_string != '' && templateResult[0].button_option_string.length > 0) {
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
                                    // modified by khushal dt 19-01-2022
                                    //component_button.parameters = tempArr;
                                    //messagePayload.template.components.push(component_button);
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
                        if (templateResult[0].button_option != '' && templateResult[0].button_option == 1 && templateResult[0].button_option_string != '' && templateResult[0].button_option_string.length > 0) {
                            // let quickReplyArr = JSON.parse(templateResult[0].button_option_string);

                            // for (let i = 0; i < quickReplyArr.length; ++i) {
                            //     let tempArr = [];
                            //     let component_button = {
                            //         "type": "button",
                            //         "sub_type": "quick_reply",
                            //         "index": i,
                            //         "parameters": tempArr
                            //     }
                            //     tempArr.push({
                            //         "type": "payload",
                            //         "payload": quickReplyArr[i].quick_reply
                            //     });
                            //     component_button.parameters = tempArr;
                            //     messagePayload.template.components.push(component_button);
                            // }

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
                                return done({
                                    code: "WA031",
                                    status: 'FAILED',
                                    message: "Quick reply count mismatch",
                                    data: {}
                                });
                            }
                        }
                    }
                    done(null, messagePayload, wabaInfoResult, msgType);
                    break;
                case 9:
                    // console.log('interactive : ' + JSON.stringify(wabaInfoResult));
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
            messagePayload.to = messagePayload.to.toString().replace("+", '');
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
                                sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, JSON.stringify(messageObj), bodyContent, countryCodeNumeric,category,categoryId, function (err, result) {
                                    // console.log('result.insertId: ' + result.insertId);
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
                                // console.log('Record shifted to sent master');
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
                // console.log("inside send message", setflag)
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
                // console.log(JSON.stringify(messagePayload));

                botUtils.callWhatsAppApi(wabaInfoResult[0].waurl, api, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
                    // console.log(response);
                    if (typeof response.messages != undefined) {
                        let errorCode = null;
                        let errorDesc = null;
                        let waMessageId1 = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                        // console.log("wamessageid", waMessageId1)
                        sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId1, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, messageObj, bodyContent, countryCodeNumeric,category,categoryId, (error, result) => {
                            if (error) {
                                errorLogger.error("**********************************************************");
                                errorLogger.error("REQUEST_BODY: " + JSON.stringify(messageObj));
                                errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                errorLogger.error("MESSAGE_ID: " + waMessageId1);
                                errorLogger.error("ERROR: " + error);
                                errorLogger.error("**********************************************************");
                                console.log(error);
                                return done({
                                    code: 'WA100',
                                    status: 'FAILED',
                                    message: 'Something went wrong',
                                    data: {}
                                });
                            } else {

                                errorLogger.info("**********************************************************");
                                errorLogger.info("REQUEST_BODY: " + JSON.stringify(messageObj));
                                errorLogger.info("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                errorLogger.info("MESSAGE_ID: " + waMessageId1);
                                errorLogger.info("**********************************************************");

                                done(null, {
                                    code: 200,
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
                    if (err.response.data.errors[0].code == '1006' || err.response.data.errors[0].code == '1013') {
                        return done({
                            code: 'WA102',
                            status: 'FAILED',
                            message: 'Non WhatsApp Number',
                            data: {}
                        });
                    }
                    // End.........................//
                    errorLogger.error("**********************************************************");
                    errorLogger.error("REQUEST_BODY: " + JSON.stringify(messageObj));
                    errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                    errorLogger.error("MESSAGE_ID: " + null);
                    errorLogger.error("ERROR: " + err);
                    errorLogger.error("**********************************************************");

                    return done({

                        code: 'WA100',
                        status: 'FAILED',
                        message: err.response.data.errors[0].details,
                        data: {}
                    });
                });
            } else {

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
                        sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId2, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, messageObj, bodyContent, countryCodeNumeric,category,categoryId, (error, result) => {
                            if (error) {
                                errorLogger.error("**********************************************************");
                                errorLogger.error("REQUEST_BODY: " + JSON.stringify(messageObj));
                                errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                errorLogger.error("MESSAGE_ID: " + waMessageId2);
                                errorLogger.error("ERROR: " + error);
                                errorLogger.error("**********************************************************");
                                console.log(error);
                                return done({
                                    code: 'WA100',
                                    status: 'FAILED',
                                    message: 'Something went wrong',
                                    data: {}
                                });
                            } else {
                                errorLogger.info("**********************************************************");
                                errorLogger.info("REQUEST_BODY: " + JSON.stringify(messageObj));
                                errorLogger.info("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                errorLogger.info("MESSAGE_ID: " + waMessageId2);
                                errorLogger.info("**********************************************************");

                                done(null, {
                                    code: 200,
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
                            code: 'WA100',
                            status: 'FAILED',
                            message: JSON.stringify(response),
                            data: {}
                        });
                    }
                }).catch((err) => {
                    // console.log(err)
                    //added for non whatsapp number on 10/6/2022
                    if (err.code != undefined) {
                        console.log('inside.....................');
                        return done({
                            code: 'WA100',
                            status: 'FAILED',
                            message: err.message,
                            data: {}
                        });
                    }
                    else if (err.response != undefined && err.response.data != undefined && err.response.data.error.code == 100) {

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
                    errorLogger.error("REQUEST_BODY: " + JSON.stringify(messageObj));
                    errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                    errorLogger.error("MESSAGE_ID: " + null);
                    errorLogger.error("ERROR: " + err);
                    errorLogger.error("**********************************************************");

                    return done({
                        code: 'WA100',
                        status: 'FAILED',
                        message: err.response.data.error,
                        data: {}
                    });
                });
            }


        };

        async.waterfall([
            validateApiKey, wabaInfo, validatePayload, validateTemplate, createPayload, checkSubscription, sendMessage
        ], (err, result) => {

            userId = null;
            wanumber = null;
            countryCode = null;
            wabaCountryCode = null;
            wabaCountryCodeNumeric = null;
            maxTextLength = 0;
            error = false;
            objMessage = null;
            setflag = 0;
            msgType = null;
            isMediaID = -1;
            fileName = null;
            s3MediaUrl = null;
            mediaType = null;
            bodyContent = null;

            if (err) {
                next(err);
            } else {
                next(null, result);
            }
        });
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        next(error);
    }
};