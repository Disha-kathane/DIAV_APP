const sendController = require('../../controller/v1/send');
const waCallbackController = require('../../controller/v1/wacallback');
const multer = require('fastify-multer');
const fs = require('fs');
const FormData = require('form-data');
const mime = require('mime-types');
const fastJson = require('fast-json-stringify');
const async = require('async');
const { errorLogger, infoLogger } = require('../../applogger');
const botUtils = require('../../utils/bot');
const validator = require('validator');
const sendService = require('../../services/v1/send');

const userService = require('../../services/v1/users');
const mediaController = require('../../controller/v1/media');
const getMediaController = require('../../controller/v1/getmedia');

const stringify = fastJson({
    title: 'Optin Response',
    type: 'object',
    properties: {
        code: { type: 'string' },
        status: { type: 'string', format: 'string' },
        message: { type: 'string', format: 'string' },
        data:
        {
            type: 'object',
            properties: {
                messageid: { type: 'string', format: 'string' }
            }
        }
    }
})

module.exports = (upload) => {
    const mediaOpts = {
        preHandler: [
            upload.fields([{
                name: 'sheet',
                maxCount: 1
            }])
        ],
        handler: mediaController
    }
    const getMediaOpts = {
        handler: getMediaController
    }
    const sendOpts = {
        handler: sendController
    }

    const waCallbackOpts = {
        handler: waCallbackController
    };

    const sendSchema = {
        schema: {
            description: 'This API is used for sending text messages to a Whatsapp subscriber.',
            tags: ['Sending Text Message'],
            body: {
                type: 'object',
                properties: {
                    from: {
                        type: 'string',
                        description: 'This is Whatsapp Business Account Mobile Number'
                    },
                    to: {
                        type: 'string',
                        description: 'This is recipient\'s Whatsapp Mobile Number'
                    },
                    type: {
                        type: 'string',
                        description: 'This is message type for eg. text, video, image, document, interactive'
                    },
                    message: {
                        type: 'object',
                        properties: {
                            text: {
                                type: 'string',
                                description: 'This is message type for eg. text, video, image, document, interactive'
                            }
                        }
                    }
                }
            },
            response: {
                200: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        code: { type: 'number' },
                        status: { type: 'string', format: 'string' },
                        message: { type: 'string', format: 'string' },
                        data:
                        {
                            type: 'object',
                            properties: {
                                messageid: { type: 'string', format: 'string' }
                            }
                        }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    };

    const sendMediaSchema = {
        schema: {
            description: 'This API is used for sending text messages to a Whatsapp subscriber.',
            tags: ['Sending Text Message'],
            body: {
                type: 'object',
                properties: {
                    from: { type: 'string' },
                    to: { type: 'string' },
                    type: { type: 'string' },
                    message: {
                        type: 'object',
                        properties: {
                            text: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                200: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        code: { type: 'number' },
                        status: { type: 'string', format: 'string' },
                        message: { type: 'string', format: 'string' },
                        data:
                        {
                            type: 'object',
                            properties: {
                                messageid: { type: 'string', format: 'string' }
                            }
                        }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    };

    const sendApi = async (req, res) => {
        try {
            let userId;
            let wanumber;
            let countryCode;
            let wabaCountryCode;
            let wabaCountryCodeNumeric;
            let maxTextLength = 4000;
            let error = false;
            let objMessage;
            let msgType;
            let apiKey = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
            let messageObj = req.body;
            console.log('SEND_API_PAYLOAD : ' + JSON.stringify(messageObj));
            let isMediaID = -1;
            let fileName;
            let mediaType;

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
                                // if (result[0].billing_type == 0) {
                                //     userId = result[0].userid;
                                //     done(null, result);
                                // } else if (result[0].billing_type == 1) {
                                //     if (result[0].balance_amt > 0) {
                                //         userId = result[0].userid;
                                //         done(null, result);
                                //     }
                                //     else {
                                //         return done({
                                //             code: 'WA036',
                                //             status: 'FAILED',
                                //             message: 'Insufficient Balance',
                                //             data: {}
                                //         });
                                //     }
                                // }

                                if (result[0].account_type == 0) {
                                    userId = result[0].userid;
                                    done(null, result);
                                } else if (result[0].account_type == 1) {
                                    if (result[0].balance_amt > 0) {
                                        userId = result[0].userid;
                                        done(null, result);
                                    }
                                    else {
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
            }

            let wabaInfo = (result, done) => {
                let wabanumber;
                // console.log('from: ' + messageObj.from);
                if (typeof messageObj.from == undefined || validator.isEmpty(messageObj.from + '') || messageObj.from == null) {
                    error = true;
                    return done({
                        code: 'WA003',
                        status: 'FAILED',
                        message: 'Mobile number is required',
                        data: {}
                    });
                }
                else {
                    wabanumber = messageObj.from;
                    let tmpWabaNumber = wabanumber.replace(/^91/g, '');
                    console.log('tmpWabaNumber=============>' + tmpWabaNumber);
                    if (!tmpWabaNumber.startsWith('9') ||
                        !tmpWabaNumber.startsWith('8') ||
                        !tmpWabaNumber.startsWith('7') ||
                        !tmpWabaNumber.startsWith('6')) {
                        wabaCountryCode = botUtils.getCountryCode(wabanumber);
                        wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(wabanumber);
                    }
                    else {
                        if (botUtils.isMobileInternational(wabanumber)) {
                            wabaCountryCode = botUtils.getCountryCode(wabanumber);
                            wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(wabanumber);
                        }
                        else {
                            return done({
                                code: 'WA004',
                                status: 'FAILED',
                                message: 'Mobile number must contain Country Code',
                                data: {}
                            });
                        }
                    }
                }

                sendService.getSpecificWabaInfo(result[0].userid, wabanumber, (err, result) => {
                    console.log(JSON.stringify(result));
                    if (err) {

                        return done({
                            code: err.errno,
                            status: 'FAILED',
                            message: err.code,
                            data: {}
                        });
                    }
                    else {
                        done(null, result);
                    }
                });
            }

            let validatePayload = (wabaInfoResult, done) => {
                if (typeof messageObj.to == undefined || validator.isEmpty(messageObj.to + '') || messageObj.to == null) {
                    error = true;
                    return done({
                        code: 'WA003',
                        status: 'FAILED',
                        message: 'Mobile number is required',
                        data: {}
                    });
                }
                else {
                    wanumber = messageObj.to;
                    // if (botUtils.isMobileInternational(wanumber)) {
                    //     countryCode = botUtils.getCountryCode(wanumber);
                    //     countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
                    // }
                    // else {
                    //     return done({
                    //         code: 'WA004',
                    //         status: 'FAILED',
                    //         message: 'Mobile number must contain Country Code',
                    //         data: {}
                    //     });
                    // }
                    let tmpWaNumber = wanumber.replace(/^91/g, '');
                    console.log('tmpWaNumber=============>' + tmpWaNumber);
                    if (!tmpWaNumber.startsWith('9') ||
                        !tmpWaNumber.startsWith('8') ||
                        !tmpWaNumber.startsWith('7') ||
                        !tmpWaNumber.startsWith('6')) {
                        countryCode = botUtils.getCountryCode(wanumber);
                        countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
                    }
                    else {
                        if (botUtils.isMobileInternational(wanumber)) {
                            countryCode = botUtils.getCountryCode(wanumber);
                            countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
                        }
                        else {
                            return done({
                                code: 'WA004',
                                status: 'FAILED',
                                message: 'Mobile number must contain Country Code',
                                data: {}
                            });
                        }
                    }
                }
                // console.log('validatePayload: ' + JSON.stringify(messageObj.message));
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
                            if (!objMessage.hasOwnProperty('id')) {
                                if (typeof objMessage.url == undefined || validator.isEmpty(objMessage.url + '')) {
                                    error = true;
                                    return done({
                                        code: 'WA007',
                                        status: 'FAILED',
                                        message: 'Media URL is required',
                                        data: {}
                                    });
                                }
                                else if (!validator.isURL(objMessage.url + '')) {
                                    // || objMessage.url.indexOf('https:')  || objMessage.url.indexOf('http:')
                                    error = true;
                                    return done({
                                        code: 'WA008',
                                        status: 'FAILED',
                                        message: 'Media URL is invalid',
                                        data: {}
                                    });
                                }
                                else {
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
                                }
                                else {
                                    isMediaID = 1;
                                }
                            }

                            if (isMediaID == 0) {
                                let regex = new RegExp('[^.]+$');
                                let extension = objMessage.url.match(regex);

                                if (msgType == "document") {
                                    mediaType = 0;
                                    // if (extension[0] == 'pdf') {
                                    //     mediaType = 0;
                                    // }
                                    // else {
                                    //     return done({
                                    //         code: 'WA010',
                                    //         status: 'FAILED',
                                    //         message: 'Invalid Document Format',
                                    //         data: {}
                                    //     });
                                    // }
                                }
                                if (msgType == "image") {
                                    if (extension[0] == 'png' || extension[0] == 'jpg' || extension[0] == 'jpeg') {
                                        mediaType = 1;
                                    }
                                    else {
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
                                    }
                                    else {
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
                                    }
                                    else {
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
                                    }
                                    else {
                                        if (result.length > 0) {
                                            switch (result[0].mediatype) {
                                                case 0:
                                                case 1:
                                                case 2:
                                                case 3:
                                                    mediaType = result[0].mediatype;
                                                    fileName = result[0].medianame;
                                                    done(null, 1, mediaType, wabaInfoResult);
                                                    break;
                                            }
                                        }
                                        else {
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
                            break;
                        case "text":
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
                            }
                            else {
                                done(null, 1, 4, wabaInfoResult);
                            }
                            break;
                        case "location":
                            if (typeof objMessage.latitude == undefined || validator.isEmpty(objMessage.latitude + '') || objMessage.latitude == null) {
                                error = true;
                                return done({
                                    code: 'WA017',
                                    status: 'FAILED',
                                    message: 'Latitude is required',
                                    data: {}
                                });
                            }
                            else if (typeof objMessage.longitude == undefined || validator.isEmpty(objMessage.longitude + '') || objMessage.longitude == null) {
                                error = true;
                                return done({
                                    code: 'WA018',
                                    status: 'FAILED',
                                    message: 'Longitude is required',
                                    data: {}
                                });
                            }
                            else if (typeof objMessage.address == undefined || validator.isEmpty(objMessage.address + '') || objMessage.address == null) {
                                error = true;
                                return done({
                                    code: 'WA019',
                                    status: 'FAILED',
                                    message: 'Address is required',
                                    data: {}
                                });
                            }
                            else if (typeof objMessage.name == undefined || validator.isEmpty(objMessage.name + '') || objMessage.name == null) {
                                error = true;
                                return done({
                                    code: 'WA020',
                                    status: 'FAILED',
                                    message: 'Name is required',
                                    data: {}
                                });
                            }
                            else {
                                let regex = new RegExp('^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$');
                                let latitude = objMessage.latitude.match(regex);
                                let longitude = objMessage.longitude.match(regex);
                                if (latitude[0] != 0 && longitude[0] != 0) {
                                    done(null, 1, 5, wabaInfoResult);
                                }
                                else {
                                    error = true;
                                    return done({
                                        code: 'WA021',
                                        status: 'FAILED',
                                        message: 'Latitude / Longitude is invalid',
                                        data: {}
                                    });
                                }
                            }

                            break;
                        case "contact":
                            if (typeof objMessage.contacts == undefined || validator.isEmpty(objMessage.contacts + '')) {
                                error = true;
                                return done({
                                    code: 'WA022',
                                    status: 'FAILED',
                                    message: 'Contacts body is required',
                                    data: {}
                                });
                            }
                            else if (objMessage.contacts.name == undefined || validator.isEmpty(objMessage.contacts.name + '')) {
                                error = true;
                                return done({
                                    code: 'WA023',
                                    status: 'FAILED',
                                    message: 'Name body is required',
                                    data: {}
                                });
                            }
                            else if (objMessage.contacts.name.first_name == undefined || validator.isEmpty(objMessage.contacts.name.first_name + '')) {
                                error = true;
                                return done({
                                    code: 'WA024',
                                    status: 'FAILED',
                                    message: 'First Name is required',
                                    data: {}
                                });
                            }
                            else if (objMessage.contacts.name.last_name == undefined || validator.isEmpty(objMessage.contacts.name.last_name + '')) {
                                error = true;
                                return done({
                                    code: 'WA025',
                                    status: 'FAILED',
                                    message: 'Last Name is required',
                                    data: {}
                                });
                            }
                            else {
                                done(null, 1, 6, wabaInfoResult);
                            }
                            break;
                        case "sticker":
                            if (typeof objMessage.url == undefined || validator.isEmpty(objMessage.url + '')) {
                                error = true;
                                return done({
                                    code: 'WA026',
                                    status: 'FAILED',
                                    message: 'Sticker URL is required',
                                    data: {}
                                });
                            }
                            else {
                                done(null, 1, 7, wabaInfoResult);
                            }
                            break;
                        case "template":
                            if (typeof objMessage.templateid == undefined || validator.isEmpty(objMessage.templateid + '')) {
                                error = true;
                                return done({
                                    code: 'WA027',
                                    status: 'FAILED',
                                    message: 'Template ID is required',
                                    data: {}
                                });
                            }
                            else {
                                done(null, 0, 8, wabaInfoResult);
                            }
                            break;
                        case "interactive":
                            if (typeof objMessage.interactive == undefined || validator.isEmpty(objMessage.interactive + '') || Object.keys(objMessage.interactive).length == 0) {
                                error = true;
                                return done({
                                    code: 'WA033',
                                    status: 'FAILED',
                                    message: 'Interactive body is required',
                                    data: {}
                                });
                            }
                            else {
                                done(null, 1, 9, wabaInfoResult);
                            }
                            break;
                    }
                }
            }

            let validateTemplate = (isTemplate, msgType, wabaInfoResult, done) => {
                if (isTemplate == 1) {
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
                }
                else {
                    switch (msgType) {
                        case 8:
                            sendService.getTemplate(messageObj.message.templateid, (err, result) => {
                                if (err) {
                                    return done({
                                        code: err.errno,
                                        status: 'FAILED',
                                        message: err.code,
                                        data: {}
                                    });
                                }
                                else {
                                    if (result.length > 0) {
                                        done(null, msgType, wabaInfoResult, result);
                                    }
                                    else {
                                        return done({
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
            }

            let createPayload = (msgType, wabaInfoResult, templateResult, done) => {
                let messagePayload = {};
                switch (msgType) {
                    case 0:
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "document",
                            "recipient_type": "individual"
                        };
                        if (isMediaID == 0) {
                            messagePayload.document = {
                                "provider": {
                                    "name": ""
                                },
                                "link": messageObj.message.url,
                                "filename": messageObj.message.filename,
                                "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
                            };
                        }
                        if (isMediaID == 1) {
                            messagePayload.document = {
                                "id": messageObj.message.id,
                                "filename": fileName
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
                        if (isMediaID == 0) {
                            messagePayload.image = {
                                "provider": {
                                    "name": ""
                                },
                                "link": messageObj.message.url,
                                "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
                            };
                        }
                        if (isMediaID == 1) {
                            messagePayload.image = {
                                "id": messageObj.message.id
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
                        if (isMediaID == 0) {
                            messagePayload.video = {
                                "provider": {
                                    "name": ""
                                },
                                "link": messageObj.message.url,
                                "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
                            };
                        }
                        if (isMediaID == 1) {
                            messagePayload.video = {
                                "id": messageObj.message.id
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
                        if (isMediaID == 0) {
                            messagePayload.audio = {
                                "provider": {
                                    "name": ""
                                },
                                "link": messageObj.message.url
                            };
                        }
                        if (isMediaID == 1) {
                            messagePayload.audio = {
                                "id": messageObj.message.id
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
                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 6:
                        if (messageObj.message.contacts.phones.length > 0) {
                            messagePayload = {
                                "to": messageObj.to,
                                "type": "contacts",
                                "recipient_type": "individual",
                                "contacts": [
                                    {
                                        "name": {
                                            "first_name": messageObj.message.contacts.name.first_name,
                                            "formatted_name": messageObj.message.contacts.name.first_name,
                                            "last_name": messageObj.message.contacts.name.last_name
                                        },
                                        "phones": []
                                    }
                                ]
                            };
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
                                }
                            }
                            // console.log(JSON.stringify(messagePayload));
                        }
                        else {
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
                                "provider": {
                                    "name": ""
                                },
                                "link": messageObj.message.url
                            }
                        };
                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                    case 8:
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "template",
                            "template": {
                                "namespace": wabaInfoResult[0].hsmnamespace,
                                "language": {
                                    "policy": "deterministic",
                                    "code": templateResult[0].langcode
                                },
                                "name": templateResult[0].temptitle,
                                "components": []
                            }
                        };
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
                            if (messageObj.message.placeholders != undefined) {
                                if (messageObj.message.placeholders.length > 0) {
                                    let placeholderLength = templateResult[0].placeholders.split(",");
                                    if (placeholderLength.length == messageObj.message.placeholders.length) {
                                        let tempArr = botUtils.fetchPlaceholders(JSON.stringify(messageObj.message.placeholders));
                                        let component_body = {
                                            "type": "body",
                                            "parameters": tempArr
                                        }
                                        messagePayload.template.components.push(component_body);
                                    }
                                    else {
                                        return done({
                                            code: "WA031",
                                            status: 'FAILED',
                                            message: "Placeholder count mismatch",
                                            data: {}
                                        });
                                    }
                                } else {

                                }
                            }

                            // console.log('i am here ========================> ' + templateResult[0].placeholder_template_type);
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
                                }
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
                            if (templateResult[0].footer_text != '' && templateResult[0].footer_text.length > 0) {
                                let component_header = {
                                    "type": "footer",
                                    "parameters": [
                                        {
                                            "type": "text",
                                            "text": templateResult[0].footer_text
                                        }
                                    ]
                                }
                                messagePayload.template.components.push(component_header);
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
                                        }
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
					    "index":i,
                                            "parameters": tempArr
                                        }

                                        if (callToActionArr[i].visit_website.web_url_option == 1) {

                                            for (let k = 0; k < messageObj.message.buttons.length; k++) {
                                                if (messageObj.message.buttons[k].placeholder != undefined &&
                                                    messageObj.message.buttons[k].placeholder.length > 0) {
                                                    tempArr.push({
                                                        "type": "text",
                                                        "text": messageObj.message.buttons[k].placeholder
                                                    });
                                                    break;
                                                }
                                                else {
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

                                for (let i = 0; i < quickReplyArr.length; ++i) {
                                    let tempArr = [];
                                    let component_button = {
                                        "type": "button",
                                        "sub_type": "quick_reply",
                                        "index": i,
                                        "parameters": tempArr
                                    }

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
                        else {
                            if (messageObj.message.placeholders != undefined) {
                                if (messageObj.message.placeholders.length > 0) {
                                    let placeholderLength = templateResult[0].placeholders.split(",");
                                    // console.log('Length ======================>' + placeholderLength.length, messageObj.message.placeholders.length);

                                    if (placeholderLength.length == messageObj.message.placeholders.length) {
                                        let tempArr = botUtils.fetchPlaceholders(JSON.stringify(messageObj.message.placeholders));
                                        let component_body = {
                                            "type": "body",
                                            "parameters": tempArr
                                        }
                                        messagePayload.template.components.push(component_body);
                                    }
                                    else {
                                        return done({
                                            code: "WA031",
                                            status: 'FAILED',
                                            message: "Placeholder count mismatch",
                                            data: {}
                                        });
                                    }
                                } else {

                                }
                            }

                            // console.log('placeholder_template_type=========================>' + templateResult[0].placeholder_template_type);
                            if (templateResult[0].placeholder_template_type != '' &&
                                (templateResult[0].placeholder_template_type == 1 || templateResult[0].placeholder_template_type == 2) &&
                                templateResult[0].head_text_title != '' &&
                                templateResult[0].head_text_title.length > 0) {
                                if (messageObj.message.header != undefined && messageObj.message.header.length > 0) {
                                    let component_header = {
                                        "type": "header",
                                        "parameters": [
                                            {
                                                "type": "text",
                                                "text": messageObj.message.header
                                            }
                                        ]
                                    }
                                    messagePayload.template.components.push(component_header);
                                }
                                else {
                                    return done({
                                        code: "WA034",
                                        status: 'FAILED',
                                        message: "Header is missing",
                                        data: {}
                                    });
                                }
                            }


                            if (templateResult[0].footer_text != '' && templateResult[0].footer_text.length > 0) {
                                let component_header = {
                                    "type": "footer",
                                    "parameters": [
                                        {
                                            "type": "text",
                                            "text": templateResult[0].footer_text
                                        }
                                    ]
                                }
                                messagePayload.template.components.push(component_header);
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
                                        }
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
                                        }

                                        if (callToActionArr[i].visit_website.web_url_option == 1) {

                                            for (let k = 0; k < messageObj.message.buttons.length; k++) {
                                                if (messageObj.message.buttons[k].placeholder != undefined &&
                                                    messageObj.message.buttons[k].placeholder.length > 0) {
                                                    tempArr.push({
                                                        "type": "text",
                                                        "text": messageObj.message.buttons[k].placeholder
                                                    });
                                                    break;
                                                }
                                                else {
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

                                for (let i = 0; i < quickReplyArr.length; ++i) {
                                    let tempArr = [];
                                    let component_button = {
                                        "type": "button",
                                        "sub_type": "quick_reply",
                                        "index": i,
                                        "parameters": tempArr
                                    }

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
                        // console.log('interactive : ' + JSON.stringify(wabaInfoResult));
                        messagePayload = {
                            "to": messageObj.to,
                            "type": "interactive",
                            "recipient_type": "individual",
                            "interactive": messageObj.message.interactive
                        };
                        done(null, messagePayload, wabaInfoResult, msgType);
                        break;
                }
            }

            let checkSubscription = (messagePayload, wabaInfoResult, msgType, done) => {
                sendService.checkSubscription(messagePayload.to, wabaInfoResult[0].wanumber, (err, result) => {
                    if (err) {
                        return done({
                            code: err.errno,
                            status: 'FAILED',
                            message: err.code,
                            data: {}
                        });
                    }
                    else if (result == 0) {
                        let direction = 1;
                        let waMessageId = null;
                        let errorCode = 100;
                        let errorDesc = 'No subscription found for the mobile number ' + messagePayload.to;
                        // console.log(errorDesc);
                        async.waterfall([
                            function (done) {
                                sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, JSON.stringify(messageObj), function (err, result) {
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
                    }
                    else {
                        done(null, messagePayload, wabaInfoResult, msgType);
                    }
                });
            }

            let sendMessage = (messagePayload, wabaInfoResult, msgType, done) => {
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
                console.log(JSON.stringify(messagePayload));


                botUtils.callWhatsAppApi(wabaInfoResult[0].waurl, api, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
                    console.log(response);
                    if (typeof response.messages != undefined) {
                        let errorCode = null;
                        let errorDesc = null;
                        waMessageId = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                        sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, messageObj, (error, result) => {
                            if (error) {
                                errorLogger.error("**********************************************************");
                                errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
                                errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                errorLogger.error("MESSAGE_ID: " + waMessageId);
                                errorLogger.error("ERROR: " + error);
                                errorLogger.error("**********************************************************");
                                console.log(error);
                                return done({
                                    code: 'WA100',
                                    status: 'FAILED',
                                    message: error,
                                    data: {}
                                });
                            } else {
                                errorLogger.info("**********************************************************");
                                errorLogger.info("REQUEST_BODY: " + JSON.stringify(req.body));
                                errorLogger.info("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                                errorLogger.info("MESSAGE_ID: " + waMessageId);
                                errorLogger.info("**********************************************************");

                                done(null, {
                                    code: 200,
                                    status: 'SUCCESS',
                                    message: 'Message Processed Successfully',
                                    data:
                                    {
                                        messageid: waMessageId
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
                    // console.log(err);
                    errorLogger.error("**********************************************************");
                    errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
                    errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
                    errorLogger.error("MESSAGE_ID: " + null);
                    errorLogger.error("ERROR: " + err);
                    errorLogger.error("**********************************************************");

                    return done({
                        code: 'WA100',
                        status: 'FAILED',
                        message: err,
                        data: {}
                    });
                });
            }

            async.waterfall([
                validateApiKey, wabaInfo, validatePayload, validateTemplate, createPayload, checkSubscription, sendMessage
            ], (err, result) => {
                if (err) {
                    res.header('Content-Type', 'application/json');
                    res.send(stringify(err));
                    return;
                } else {
                    res.header('Content-Type', 'application/json');
                    res.send(stringify(result));
                }
            });
        }
        catch (error) {
            console.log(error);
            errorLogger.error(JSON.stringify(error));
            return error;
        }
    };

    const optinSchema = {
        schema: {
            description: 'This API is used for performing Optin for a Whatsapp subscriber.',
            tags: ['Perform Optin'],
            body: {
                type: 'object',
                properties: {
                    from: { type: 'string' },
                    contact: { type: 'string' }
                }
            },
            response: {
                200: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: '200' },
                        status: { type: 'string', format: 'string' },
                        message: { type: 'string', format: 'string' },
                        data: {}
                    }
                },
                WA001: {
                    description: 'User is Inactive',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'WA001' },
                        status: { type: 'string', format: 'string', description: 'FAILED' },
                        message: { type: 'string', format: 'string', description: 'User is Inactive' },
                        data: {}
                    }
                },
                WA002: {
                    description: 'Authentication Failed',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'WA002' },
                        status: { type: 'string', format: 'string', description: 'FAILED' },
                        message: { type: 'string', format: 'string', description: 'Authentication Failed' },
                        data: {}
                    }
                },
                WA003: {
                    description: 'Mobile number(from or to) is required',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'WA003' },
                        status: { type: 'string', format: 'string', description: 'FAILED' },
                        message: { type: 'string', format: 'string', description: 'Mobile number(from or to) is required' },
                        data: {}
                    }
                },
                WA004: {
                    description: 'Mobile number(from or to) must contain country code',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'WA004' },
                        status: { type: 'string', format: 'string', description: 'FAILED' },
                        message: { type: 'string', format: 'string', description: 'Mobile number(from or to) must contain country code' },
                        data: {}
                    }
                },
                WA100: {
                    description: 'Something went wrong(number between 1 to 3)',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'WA100' },
                        status: { type: 'string', format: 'string', description: 'FAILED' },
                        message: { type: 'string', format: 'string', description: 'Something went wrong(number between 1 to 3)' },
                        data: {}
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    };

    const optinApi = async (req, res) => {
        try {
            let apiKey = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
            let messageObj = req.body;
            console.log('OPTIN_API_PAYLOAD : ' + JSON.stringify(messageObj));
            let from = (typeof req.body.from != undefined) ? req.body.from + '' : '';
            let to = (typeof req.body.contact != undefined) ? req.body.contact + '' : '';
            let userId;

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
            }

            let wabaInfo = (result, done) => {
                let wabanumber;
                console.log('from: ' + from);
                console.log('to: ' + to);
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
                    console.log('tmpWabaNumber=============>' + tmpWabaNumber);
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
                    console.log('tmpToNumber=============>' + tmpToNumber);
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
            }

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
                            console.log('checkOptinContact result:' + JSON.stringify(result[0].wastatus));

                            return done({
                                code: 200,
                                message: result[0].wastatus == 1 ? 'valid' : 'invalid',
                                status: 'SUCCESS',
                                data: {}
                            });
                        }
                        else {
                            done(null, wabaInfo);
                        }
                    }
                });
            }

            let doOptin = (wabaInfo, done) => {
                //console.log('user details : ' + JSON.stringify(wabaInfo));

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
                    console.log('Optin Response====================>' + JSON.stringify(response));
                    if (typeof response.contacts != undefined) {
                        let status;
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
                                done(null, {
                                    code: 200,
                                    status: 'SUCCESS',
                                    message: status == 1 ? 'valid' : 'invalid',
                                    data: {}
                                });
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
                    console.log('Optin Error====================>' + JSON.stringify(EvalError));
                    return done({
                        code: 'WA100',
                        status: 'FAILED',
                        message: 'Something went wrong(3)',
                        data: {}
                    });
                });
            }

            async.waterfall([
                validateApiKey,
                wabaInfo,
                checkOptin,
                doOptin
            ], (err, result) => {
                if (err) {
                    res.header('Content-Type', 'application/json');
                    res.send(stringify(err));
                    return;
                } else {
                    res.header('Content-Type', 'application/json');
                    res.send(stringify(result));
                }
            });
        }
        catch (error) {
            // console.log(error);
            errorLogger.error(JSON.stringify(error));
            return error;
        }
    };

    const optoutSchema = {
        schema: {
            description: 'This API is used for performing Optout for a Whatsapp subscriber.',
            tags: ['Perform Optout'],
            body: {
                type: 'object',
                properties: {
                    from: { type: 'string' },
                    contact: { type: 'string' }
                }
            },
            response: {
                200: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: '200' },
                        status: { type: 'string', format: 'string' },
                        message: { type: 'string', format: 'string' },
                        data: {}
                    }
                },
                WA001: {
                    description: 'API Key is required',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'WA001' },
                        status: { type: 'string', format: 'string', description: 'FAILED' },
                        message: { type: 'string', format: 'string', description: 'API Key is required' },
                        data: {}
                    }
                },
                WA002: {
                    description: 'from number is required',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'WA002' },
                        status: { type: 'string', format: 'string', description: 'FAILED' },
                        message: { type: 'string', format: 'string', description: 'from number is required' },
                        data: {}
                    }
                },
                WA003: {
                    description: 'to number is required',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'WA003' },
                        status: { type: 'string', format: 'string', description: 'FAILED' },
                        message: { type: 'string', format: 'string', description: 'to number is required' },
                        data: {}
                    }
                },
                WA004: {
                    description: 'Correct API Key is required',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'WA004' },
                        status: { type: 'string', format: 'string', description: 'FAILED' },
                        message: { type: 'string', format: 'string', description: 'Correct API Key is required' },
                        data: {}
                    }
                },
                WA005: {
                    description: 'No Record Found',
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'WA005' },
                        status: { type: 'string', format: 'string', description: 'FAILED' },
                        message: { type: 'string', format: 'string', description: 'No Record Found' },
                        data: {}
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    };

    const optoutApi = async (req, res) => {
        try {
            let apikeys = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
            let contactno = (typeof req.body.from != undefined) ? req.body.from + '' : '';
            let wanumber = (typeof req.body.contact != undefined) ? req.body.contact + '' : '';
            let appendcontactno = '+' + contactno;
            if (!req.headers.apikey) {
                return {
                    code: 'WA001',
                    status: 'FAILED',
                    message: 'API Key is required',
                    data: {}
                };
            }
            if (!req.body.from) {
                return {
                    code: 'WA002',
                    status: 'FAILED',
                    message: 'from number is required',
                    data: {}
                }
            }
            if (!req.body.contact) {
                return {
                    code: 'WA003',
                    status: 'FAILED',
                    message: 'to number is required',
                    data: {}
                }
            }

            let getusers = function (callback) {
                userService.getOptoutUserId(apikeys, (err, result) => {
                    if (err) {
                        return callback('error===========>' + err.message);
                    }
                    if (result != null && result.length > 0) {
                        userid = result[0].userid;
                        callback(null, userid);

                    } else {
                        res.send({
                            code: 'WA004',
                            status: 'FAILED',
                            message: 'Correct API Key is required',
                            data: {}
                        });
                    }
                });
            }

            let deletecontact = function (userid, callback) {
                userService.deleteContact(userid, appendcontactno, wanumber, (err, result) => {
                    if (err) {
                        callback(err);
                    } else {
                        let rows = result.affectedRows;
                        if (rows == 0) {
                            callback(res.send({
                                code: 'WA005',
                                status: 'FAILED',
                                message: 'No Record Found',
                                data: {}
                            }))
                        } else {
                            callback(null, result);
                        }
                    }
                })
            }

            async.waterfall([getusers, deletecontact], function (err, result) {
                if (err) {
                    res.send(err);
                } else {
                    errorLogger.info(result);
                    res.send({
                        code: 200,
                        status: 'SUCCESS',
                        message: 'Whatsapp Number Opted Out Successfully',
                        data: {}
                    });
                }
            })
        } catch (error) {
            console.log(error);
            errorLogger.error(JSON.stringify(err));
            return error;
        }
    };

    const mediaSchema = {
        schema: {
            description: 'This API is used for uploading file to get media id.',
            tags: ['Upload Media'],
            consumes: ['multipart/form-data'],
            body: {
                type: 'object',
                properties: {
                    sheet: { isFileType: true }
                }
            },
            response: {
                200: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        code: { type: 'number' },
                        status: { type: 'string', format: 'string' },
                        message: { type: 'string', format: 'string' },
                        data:
                        {
                            type: 'object',
                            properties: {
                                messageid: { type: 'string', format: 'string' }
                            }
                        }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    };

    const mediaApi = async (req, res) => {
        try {
            let apikeys = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
            let FilePath = req.files.sheet[0].path;
            let data = new FormData();
            data.append('sheet', fs.createReadStream(FilePath));
            console.log(data);
            if (!req.headers.apikey) {
                return {
                    code: 'WA001',
                    status: 'FAILED',
                    message: 'API Key is required',
                    data: []
                };
            }

            if (FilePath.length < 0) {
                return {
                    code: 'WA002',
                    status: 'FAILED',
                    message: 'File is required',
                    data: []
                }
            }

            let getusers = function (callback) {
                userService.getOptoutUserId(apikeys, (err, result) => {
                    if (err) {
                        callback(err);
                    }
                    if (result != null && result.length > 0) {
                        userid = result[0].userid;
                        callback(null, userid);

                    } else {
                        res.send({
                            code: 'WA002',
                            status: 'FAILED',
                            message: 'Correct API Key is required',
                            data: []
                        });
                    }
                });
            }


            let getusersetting = function (userid, callback) {
                userService.getMediaUserSettings(userid, '', (err, result) => {
                    if (err) {
                        return callback(err.message);
                    }
                    if (result != undefined && result != null && result.length > 0) {
                        let authtoken = result[0].authtoken;
                        let waurl = result[0].waurl;
                        callback(null, authtoken, waurl, data);
                    }

                });
            }

            let getmedia = function (authtoken, waurl, data, callback) {
                //  console.log("i m in getmedia",data)
                let FileType = (mime.lookup(FilePath));
                const apiHeaders = [{
                    'headerName': 'Authorization',
                    'headerVal': 'Bearer ' + authtoken
                },
                {
                    'headerName': 'Content-Type',
                    'headerVal': FileType
                }
                ];

                utils.uploadWhatsappMedia(waurl, data, apiHeaders).then((response) => {
                    let result = response.media[0].id;
                    callback(null, result);
                }).catch((error) => {
                    if (error) {
                        console.log(error);
                        callback(error.message);
                    }
                });
            }


            async.waterfall([getusers, getusersetting, getmedia], function (err, result) {
                //console.log("data", result);
                if (err) {
                    errorLogger.error(err);
                    res.status(err.response != undefined && err.response.status != undefined ? err.response.status : 200);
                    res.send({
                        code: 'WA100',
                        status: 'FAILED',
                        message: err.message != undefined ? err.message : 'The specified WABA might be offline or out of service',
                        data: []
                    });
                    return;
                } else {
                    errorLogger.info(result);
                    res.send({
                        code: 200,
                        status: 'success',
                        message: 'Media fetched Successfully',
                        data: [{
                            MediaId: result
                        }]
                    });
                }
            });

        } catch (error) {

            errorLogger.error(JSON.stringify(error));
            res.status(500);
            res.send({
                code: 'WA101',
                status: 'FAILED',
                message: error.message != undefined ? error.message : 'Request Failed',
                data: []
            });
        }
    };

    return (fastify, opts, done) => {
        // fastify.post('/send', sendOpts);

        fastify.post('/optin', optinSchema, optinApi);
        fastify.post('/optout', optoutSchema, optoutApi);
        fastify.post('/send', sendSchema, sendApi);
        // fastify.post('/media', mediaSchema, mediaApi);
        fastify.post('/media', mediaOpts);
        fastify.get('/media/:mediaid', getMediaOpts);
        done();
    }
}
