const async = require('async');
const { errorLogger, infoLogger } = require('../../applogger');
const botUtils = require('../../utils/bot');
const validator = require('validator');
const sendService = require('../../services/v1/send');

module.exports = async (req, res) => {
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
        console.log(JSON.stringify(messageObj));
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
            console.log(messageObj.from);
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

            sendService.getSpecificWabaInfo(result[0].userid, wabanumber, (err, result) => {
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

            if (typeof messageObj.type == undefined || validator.isEmpty(messageObj.type + '') || messageObj.type == null) {
                error = true;
                return done({
                    code: 'WA005',
                    status: 'FAILED',
                    message: 'Message type is required',
                    data: {}
                });
            }
            if (typeof messageObj.message == undefined || messageObj.message == null || messageObj.message.length == 0) {
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
                            else if (!validator.isURL(objMessage.url + '') || objMessage.url.indexOf('https:')) {
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
                                if (extension[0] == 'pdf') {
                                    mediaType = 0;
                                }
                                else {
                                    return done({
                                        code: 'WA010',
                                        status: 'FAILED',
                                        message: 'Document must have .pdf extension',
                                        data: {}
                                    });
                                }
                            }
                            if (msgType == "image") {
                                if (extension[0] == 'png' || extension[0] == 'jpg' || extension[0] == 'jpeg') {
                                    mediaType = 1;
                                }
                                else {
                                    return done({
                                        code: 'WA011',
                                        status: 'FAILED',
                                        message: 'Image must have .png/.jpg extension',
                                        data: {}
                                    });
                                }
                            }
                            if (msgType == "video") {
                                if (extension[0] == 'mp4') {
                                    mediaType = 2;
                                }
                                else {
                                    return done({
                                        code: 'WA012',
                                        status: 'FAILED',
                                        message: 'Video must have .mp4 extension',
                                        data: {}
                                    });
                                }
                            }
                            if (msgType == "audio") {
                                if (extension[0] == 'mp3') {
                                    mediaType = 3;
                                }
                                else {
                                    return done({
                                        code: 'WA013',
                                        status: 'FAILED',
                                        message: 'Audio must have .mp3 extension',
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
                        "recipient_type": "individual",
                        "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
                    };
                    if (isMediaID == 0) {
                        messagePayload.document = {
                            "provider": {
                                "name": ""
                            },
                            "link": messageObj.message.url,
                            "filename": messageObj.message.filename
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
                    messagePayload = {
                        "to": messageObj.to,
                        "type": "image",
                        "recipient_type": "individual",
                        "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
                    };
                    if (isMediaID == 0) {
                        messagePayload.image = {
                            "provider": {
                                "name": ""
                            },
                            "link": messageObj.message.url
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
                        "recipient_type": "individual",
                        "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
                    };
                    if (isMediaID == 0) {
                        messagePayload.video = {
                            "provider": {
                                "name": ""
                            },
                            "link": messageObj.message.url
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
                        console.log(JSON.stringify(messagePayload));
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
                    if (templateResult[0].head_temptype == 0) {
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


                        if (templateResult[0].head_text_title != null && templateResult[0].head_text_title.length > 0) {
                            let component_header = {
                                "type": "header",
                                "parameters": [
                                    {
                                        "type": "text",
                                        "text": templateResult[0].head_text_title
                                    }
                                ]
                            }
                            messagePayload.template.components.push(component_header);
                        }
                        if (templateResult[0].footer_text != null && templateResult[0].footer_text.length > 0) {
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
                        if (templateResult[0].button_option == 0) {
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
                                    component_button.parameters = tempArr;
                                    messagePayload.template.components.push(component_button);
                                }
                                if (callToActionArr[i].visit_website != null && callToActionArr[i].visit_website != undefined) {
                                    let tempArr = [];
                                    let component_button = {
                                        "type": "button",
                                        "sub_type": "url",
                                        "index": i,
                                        "parameters": tempArr
                                    }
                                    tempArr.push({
                                        "type": "text",
                                        "text": callToActionArr[i].visit_website.web_button_text
                                    });
                                    component_button.parameters = tempArr;
                                    messagePayload.template.components.push(component_button);
                                }
                            }
                        }
                        if (templateResult[0].button_option == 1) {
                            let quickReplyArr = JSON.parse(templateResult[0].button_option_string);

                            for (let i = 0; i < quickReplyArr.length; ++i) {
                                let tempArr = [];
                                let component_button = {
                                    "type": "button",
                                    "sub_type": "quick_reply",
                                    "index": i,
                                    "parameters": tempArr
                                }
                                tempArr.push({
                                    "type": "payload",
                                    "payload": quickReplyArr[i].quick_reply
                                });
                                component_button.parameters = tempArr;
                                messagePayload.template.components.push(component_button);
                            }
                        }
                    }
                    if (templateResult[0].head_temptype == 1) {
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


                        if (templateResult[0].head_text_title != null && templateResult[0].head_text_title.length > 0) {
                            let component_header = {
                                "type": "header",
                                "parameters": []
                            }
                            if (templateResult[0].head_mediatype == 0) {
                                component_header.parameters.push({
                                    "type": "document",
                                    "document": {
                                        "link": templateResult[0].head_media_url
                                    }
                                });
                            }
                            if (templateResult[0].head_mediatype == 1) {
                                component_header.parameters.push({
                                    "type": "image",
                                    "image": {
                                        "link": templateResult[0].head_media_url
                                    }
                                });
                            }
                            if (templateResult[0].head_mediatype == 2) {
                                component_header.parameters.push({
                                    "type": "video",
                                    "video": {
                                        "link": templateResult[0].head_media_url
                                    }
                                });
                            }
                            messagePayload.template.components.push(component_header);
                        }
                        if (templateResult[0].footer_text != null && templateResult[0].footer_text.length > 0) {
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

                        if (templateResult[0].button_option == 0) {
                            let callToActionArr = JSON.parse(templateResult[0].button_option_string);

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
                                component_button.parameters = tempArr;
                                messagePayload.template.components.push(component_button);
                            }
                            if (callToActionArr[i].visit_website != null && callToActionArr[i].visit_website != undefined) {
                                let tempArr = [];
                                let component_button = {
                                    "type": "button",
                                    "sub_type": "url",
                                    "index": i,
                                    "parameters": tempArr
                                }
                                tempArr.push({
                                    "type": "text",
                                    "text": callToActionArr[i].visit_website.web_button_text
                                });
                                component_button.parameters = tempArr;
                                messagePayload.template.components.push(component_button);
                            }
                        }
                        if (templateResult[0].button_option == 1) {
                            let quickReplyArr = JSON.parse(templateResult[0].button_option_string);

                            for (let i = 0; i < quickReplyArr.length; ++i) {
                                let tempArr = [];
                                let component_button = {
                                    "type": "button",
                                    "sub_type": "quick_reply",
                                    "index": i,
                                    "parameters": tempArr
                                }
                                tempArr.push({
                                    "type": "payload",
                                    "payload": quickReplyArr[i].quick_reply
                                });
                                component_button.parameters = tempArr;
                                messagePayload.template.components.push(component_button);
                            }
                        }
                    }
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
                    console.log(errorDesc);
                    async.waterfall([
                        function (done) {
                            sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, JSON.stringify(messageObj), function (err, result) {
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
            console.log(messagePayload);


            botUtils.callWhatsAppApi(wabaInfoResult[0].waurl, api, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
                console.log(response);
                if (typeof response.messages != undefined) {
                    let errorCode = null;
                    let errorDesc = null;
                    waMessageId = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                    sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, messageObj, (error, result) => {
                        if (error) {
                            console.log(error);
                            return done({
                                code: 'WA100',
                                status: 'FAILED',
                                message: error,
                                data: {}
                            });
                        } else {
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
                res.send(err);
                return;
            } else {
                res.send(result);
            }
        });
    }
    catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}