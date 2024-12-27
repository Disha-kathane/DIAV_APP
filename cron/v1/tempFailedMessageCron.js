const async = require('async');
const { errorLogger, infoLogger } = require('../../applogger');
const botUtils = require('../../utils/bot');
const cron = require('node-cron');
const sendService = require('../../services/v1/send');
// const CRON_VAL = '*/1 * * * *';
const CRON_VAL = '*/10 * * * * *';
let isrunning = true;
const IS_OPTIN = 2;

function fetchPlaceholders(placeholders) {
    var placeholderArr = JSON.parse(placeholders);
    var tempArr = [];
    for (var i = 0; i < placeholderArr.length; i++) {
        tempArr.push({
            "type": "text",
            "text": placeholderArr[i] != null ? placeholderArr[i].toString() : ''
        });
    }

    return tempArr;
}

module.exports = cron.schedule(CRON_VAL, async function () {
    try {

        if (isrunning) {
            isrunning = false;

            let msg_retry_count = null;

            let fetchMessageConfig = (done) => {
                sendService.fetchMessageConfig((err, result) => {
                    msg_retry_count = parseInt(result[0].retry_count);
                    done(err, parseInt(result[0].retry_count));
                });
            }

            let fetchMessages = (retry_count, done) => {
                sendService.fetchFailedMessages_7(retry_count, (err, result) => {
                    if (err) {
                        //console.log(err);
                        return done({
                            code: 'WA001', status: 'SUCCESS', message: 'No Records Found'
                        });
                    } else {
                        if (result.length > 0) {
                            done(null, result);
                        }
                        else {
                            return done({
                                code: 'WA002', status: 'SUCCESS', message: 'No Records Found'
                            });
                        }
                    }
                });
            };

            let processMessage = (msgResult, done) => {
                for (let index = 0; index < msgResult.length; index++) {

                    msgResult[index].mobileno = msgResult[index].mobileno.replace(/\+/g, '');
                    msgResult[index].mobileno = msgResult[index].mobileno.replace(/\'/g, '');
                    msgResult[index].mobileno = msgResult[index].mobileno.replace(/\ /g, '');
                    msgResult[index].mobileno = msgResult[index].mobileno.replace(/\-/g, '');
                    msgResult[index].mobileno = msgResult[index].mobileno.replace(/\//g, '');

                    let bodyContent = null;

                    let objMsg = {};
                    let direction = 1;
                    let wabaCountryCode;
                    let wabaCountryCodeNumeric;

                    if (msgResult[index].placeholders != null) {
                        let _x = msgResult[index].placeholders.toString().indexOf("'[");
                        if (_x == 0) {
                            msgResult[index].placeholders = msgResult[index].placeholders.toString().replace("'[", "[");
                        }
            
                        _x = msgResult[index].placeholders.toString().lastIndexOf("]'");
                        if (_x != -1) {
                            msgResult[index].placeholders = msgResult[index].placeholders.toString().replace("]'", "]");
                        }
                    }

                    switch (msgResult[index].messagetype) {

                        case 0: // DOCUMENT
                            if (msgResult[index].mediaflag == 1) {
                                if (msgResult[index].placeholders != '' && Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                    let tempArr = fetchPlaceholders(msgResult[index].placeholders);
            
                                    let i = 1;
                                    bodyContent = msgResult[index].body_message.toString();
                                    for (let j = 0; j < tempArr.length; j++) {
                                        let x = tempArr[j].text;
                                        //console.log(x, '{{' + i + '}}');
                                        bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                        i++;
                                    }
            
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "document",
                                                    "document": {
                                                        "id": msgResult[index].media,
                                                        "caption": "",
                                                        "filename": msgResult[index].filename
                                                    }
                                                }]
                                            },
                                            {
                                                "type": "body",
                                                "parameters": tempArr
                                            }
                                            ]
                                        }
                                    };
                                } else {
                                    bodyContent = msgResult[index].body_message.toString();
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //  "policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "document",
                                                    "document": {
                                                        "id": msgResult[index].media,
                                                        "caption": "",
                                                        "filename": msgResult[index].filename
                                                    }
                                                }]
                                            }]
                                        }
                                    };
                                }
            
                                if (msgResult[index].button_option == 0 && msgResult[index].button_option != '') {
                                    let callToActionArr = JSON.parse(msgResult[index].button_option_string);
                                    for (let i = 0; i < callToActionArr.length; ++i) {
                                        if (msgResult[index].dynamic_url_placeholder.length > 0) {
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
                                                    "text": msgResult[index].dynamic_url_placeholder
                                                });
            
                                                component_button.parameters = tempArr;
                                                objMsg.template.components.push(component_button);
                                            }
                                        }
                                    }
                                }
            
                                if (msgResult[index].button_option == 1 && msgResult[index].button_option != '') {
                                    let quickReplyArr = JSON.parse(msgResult[index].button_option_string);
            
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
                                        objMsg.template.components.push(component_button);
                                    }
                                }
                            }
                            if (msgResult[index].mediaflag == 2) {
                                if (msgResult[index].placeholders != '' && Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                    let tempArr = fetchPlaceholders(msgResult[index].placeholders);
                                    let i = 1;
                                    bodyContent = msgResult[index].body_message.toString();
                                    for (let j = 0; j < tempArr.length; j++) {
                                        let x = tempArr[j].text;
                                        //console.log(x, '{{' + i + '}}');
                                        bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                        i++;
                                    }
            
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "document",
                                                    "document": {
                                                        "link": msgResult[index].media,
                                                        "caption": "",
                                                        "filename": msgResult[index].filename
                                                    }
                                                }]
                                            },
                                            {
                                                "type": "body",
                                                "parameters": tempArr
                                            }
                                            ]
                                        }
                                    };
                                } else {
                                    bodyContent = msgResult[index].body_message.toString();
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "document",
                                                    "document": {
                                                        "link": msgResult[index].media,
                                                        "caption": "",
                                                        "filename": msgResult[index].filename
                                                    }
                                                }]
                                            }]
                                        }
                                    };
                                }
            
                                if (msgResult[index].button_option == 0 && msgResult[index].button_option != '') {
                                    let callToActionArr = JSON.parse(msgResult[index].button_option_string);
                                    for (let i = 0; i < callToActionArr.length; ++i) {
                                        if (msgResult[index].dynamic_url_placeholder.length > 0) {
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
                                                    "text": msgResult[index].dynamic_url_placeholder
                                                });
            
                                                component_button.parameters = tempArr;
                                                objMsg.template.components.push(component_button);
                                            }
                                        }
                                    }
                                }
                                if (msgResult[index].button_option == 1 && msgResult[index].button_option != '') {
                                    let quickReplyArr = JSON.parse(msgResult[index].button_option_string);
            
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
                                        objMsg.template.components.push(component_button);
                                    }
                                }
                            }
                            break;
                        case 1: // IMAGE
            
                            if (msgResult[index].mediaflag == 1) {
                                if (msgResult[index].placeholders != '' && Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                    let tempArr = fetchPlaceholders(msgResult[index].placeholders);
            
                                    let i = 1;
                                    bodyContent = msgResult[index].body_message.toString();
                                    for (let j = 0; j < tempArr.length; j++) {
                                        let x = tempArr[j].text;
                                        //console.log(x, '{{' + i + '}}');
                                        bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                        i++;
                                    }
            
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "image",
                                                    "image": {
                                                        "id": msgResult[index].media,
                                                        "caption": ""
                                                        // "filename": msgResult[index].filename
                                                    }
                                                }]
                                            },
                                            {
                                                "type": "body",
                                                "parameters": tempArr
                                            }
                                            ]
                                        }
                                    };
            
                                } else {
                                    bodyContent = msgResult[index].body_message.toString();
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "image",
                                                    "image": {
                                                        "id": msgResult[index].media,
                                                        "caption": ""
                                                        //"filename": msgResult[index].filename
                                                    }
                                                }]
                                            }]
                                        }
                                    };
                                }
                                if (msgResult[index].button_option == 0 && msgResult[index].button_option != '') {
                                    let callToActionArr = JSON.parse(msgResult[index].button_option_string);
                                    for (let i = 0; i < callToActionArr.length; ++i) {
                                        if (msgResult[index].dynamic_url_placeholder.length > 0) {
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
                                                    "text": msgResult[index].dynamic_url_placeholder
                                                });
            
                                                component_button.parameters = tempArr;
                                                objMsg.template.components.push(component_button);
                                            }
                                        }
                                    }
                                }
                                if (msgResult[index].button_option == 1 && msgResult[index].button_option != '') {
                                    let quickReplyArr = JSON.parse(msgResult[index].button_option_string);
            
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
                                        objMsg.template.components.push(component_button);
                                    }
                                }
                            }
                            if (msgResult[index].mediaflag == 2) {
                                if (msgResult[index].placeholders != '' && Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                    let tempArr = fetchPlaceholders(msgResult[index].placeholders);
                                    let i = 1;
                                    bodyContent = msgResult[index].body_message.toString();
                                    for (let j = 0; j < tempArr.length; j++) {
                                        let x = tempArr[j].text;
                                        //console.log(x, '{{' + i + '}}');
                                        bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                        i++;
                                    }
            
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "image",
                                                    "image": {
                                                        "link": msgResult[index].media,
                                                        "caption": ""
                                                        // "filename": msgResult[index].filename
                                                    }
                                                }]
                                            },
                                            {
                                                "type": "body",
                                                "parameters": tempArr
                                            }
                                            ]
                                        }
                                    };
                                } else {
                                    bodyContent = msgResult[index].body_message.toString();
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                // "policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "image",
                                                    "image": {
                                                        "link": msgResult[index].media,
                                                        "caption": ""
                                                        //"filename": msgResult[index].filename
                                                    }
                                                }]
                                            }]
                                        }
                                    };
                                }
            
                                if (msgResult[index].button_option == 0 && msgResult[index].button_option != '') {
                                    let callToActionArr = JSON.parse(msgResult[index].button_option_string);
                                    for (let i = 0; i < callToActionArr.length; ++i) {
                                        if (msgResult[index].dynamic_url_placeholder.length > 0) {
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
                                                    "text": msgResult[index].dynamic_url_placeholder
                                                });
            
                                                component_button.parameters = tempArr;
                                                objMsg.template.components.push(component_button);
                                            }
                                        }
                                    }
                                }
            
                                if (msgResult[index].button_option == 1 && msgResult[index].button_option != '') {
                                    let quickReplyArr = JSON.parse(msgResult[index].button_option_string);
            
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
                                        objMsg.template.components.push(component_button);
                                    }
                                }
                            }
                            break;
                        case 2: // VIDEO
            
                            if (msgResult[index].mediaflag == 1) {
                                if (msgResult[index].placeholders != '' && Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                    let tempArr = fetchPlaceholders(msgResult[index].placeholders);
            
                                    let i = 1;
                                    bodyContent = msgResult[index].body_message.toString();
                                    for (let j = 0; j < tempArr.length; j++) {
                                        let x = tempArr[j].text;
                                        //console.log(x, '{{' + i + '}}');
                                        bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                        i++;
            
                                    }
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                // "policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "video",
                                                    "video": {
                                                        "id": msgResult[index].media
                                                        // "filename": msgResult[index].filename
                                                    }
                                                }]
                                            },
                                            {
                                                "type": "body",
                                                "parameters": tempArr
                                            }
                                            ]
                                        }
                                    };
                                } else {
                                    bodyContent = msgResult[index].body_message.toString();
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "video",
                                                    "video": {
                                                        "id": msgResult[index].media
                                                        //"filename": msgResult[index].filename
                                                    }
                                                }]
                                            }]
                                        }
                                    };
                                }
            
                                if (msgResult[index].button_option == 0 && msgResult[index].button_option != '') {
                                    let callToActionArr = JSON.parse(msgResult[index].button_option_string);
                                    for (let i = 0; i < callToActionArr.length; ++i) {
                                        if (msgResult[index].dynamic_url_placeholder.length > 0) {
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
                                                    "text": msgResult[index].dynamic_url_placeholder
                                                });
            
                                                component_button.parameters = tempArr;
                                                objMsg.template.components.push(component_button);
                                            }
                                        }
                                    }
                                }
                                if (msgResult[index].button_option == 1 && msgResult[index].button_option != '') {
                                    let quickReplyArr = JSON.parse(msgResult[index].button_option_string);
            
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
                                        objMsg.template.components.push(component_button);
                                    }
                                }
                            }
                            if (msgResult[index].mediaflag == 2) {
                                if (msgResult[index].placeholders != '' && Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                    let tempArr = fetchPlaceholders(msgResult[index].placeholders);
                                    let i = 1;
                                    bodyContent = msgResult[index].body_message.toString();
                                    for (let j = 0; j < tempArr.length; j++) {
                                        let x = tempArr[j].text;
                                        //console.log(x, '{{' + i + '}}');
                                        bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                        i++;
                                    }
            
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "video",
                                                    "video": {
                                                        "link": msgResult[index].media
                                                        // "filename": msgResult[index].filename
                                                    }
                                                }]
                                            },
                                            {
                                                "type": "body",
                                                "parameters": tempArr
                                            }
                                            ]
                                        }
                                    };
                                } else {
                                    bodyContent = msgResult[index].body_message.toString();
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "header",
                                                "parameters": [{
                                                    "type": "video",
                                                    "video": {
                                                        "link": msgResult[index].media
                                                        // "filename": msgResult[index].filename
                                                    }
                                                }]
                                            }]
                                        }
                                    };
                                }
                                if (msgResult[index].button_option == 0 && msgResult[index].button_option != '') {
                                    let callToActionArr = JSON.parse(msgResult[index].button_option_string);
                                    for (let i = 0; i < callToActionArr.length; ++i) {
                                        if (msgResult[index].dynamic_url_placeholder.length > 0) {
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
                                                    "text": msgResult[index].dynamic_url_placeholder
                                                });
            
                                                component_button.parameters = tempArr;
                                                objMsg.template.components.push(component_button);
                                            }
                                        }
                                    }
                                }
                                if (msgResult[index].button_option == 1 && msgResult[index].button_option != '') {
                                    let quickReplyArr = JSON.parse(msgResult[index].button_option_string);
            
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
                                        objMsg.template.components.push(component_button);
                                    }
                                }
                            }
                            break;
                        case 4: //TEXT MESSAGE
            
                            if (msgResult[index].mediaflag == 0) {
                                if (msgResult[index].placeholders != '' && Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                    let tempArr = fetchPlaceholders(msgResult[index].placeholders);
            
                                    let i = 1;
                                    bodyContent = msgResult[index].body_message.toString();
                                    for (let j = 0; j < tempArr.length; j++) {
                                        let x = tempArr[j].text;
                                        //console.log(x, '{{' + i + '}}');
                                        bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                        i++;
                                    }
            
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": [{
                                                "type": "body",
                                                "parameters": tempArr
                                            }]
                                        }
                                    }
                                } else {
                                    bodyContent = msgResult[index].body_message.toString();
                                    objMsg = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": msgResult[index].mobileno,
                                        "type": "template",
                                        "template": {
                                            //"namespace": msgResult[index].namespace,
                                            "language": {
                                                //"policy": "deterministic",
                                                "code": msgResult[index].language
                                            },
                                            "name": msgResult[index].templatetitle,
                                            "components": []
                                        }
                                    }
                                }
                                if (msgResult[index].placeholder_template_type == 1) {
                                    let tmpHeader = {
                                        "type": "header",
                                        "parameters": [{
                                            "type": "text",
                                            "text": msgResult[index].header_placeholder
                                        }]
                                    };
            
                                    if (msgResult[index].button_option == 0 && msgResult[index].button_option != '') {
                                        let callToActionArr = JSON.parse(msgResult[index].button_option_string);
                                        for (let i = 0; i < callToActionArr.length; ++i) {
                                            if (msgResult[index].dynamic_url_placeholder.length > 0) {
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
                                                        "text": msgResult[index].dynamic_url_placeholder
                                                    });
            
                                                    component_button.parameters = tempArr;
                                                    objMsg.template.components.push(component_button);
                                                }
                                            }
                                        }
                                    }
                                    if (msgResult[index].button_option == 1 && msgResult[index].button_option != '') {
                                        let quickReplyArr = JSON.parse(msgResult[index].button_option_string);
            
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
                                            objMsg.template.components.push(component_button);
                                        }
                                    }
                                    objMsg.template.components.push(tmpHeader);
                                }
                                if (msgResult[index].placeholder_template_type == 2) {
                                    let tmpHeader = {
                                        "type": "header",
                                        "parameters": [{
                                            "type": "text",
                                            "text": msgResult[index].header_placeholder
                                        }]
                                    };
            
                                    objMsg.template.components.push(tmpHeader);
                                }
                                if (msgResult[index].placeholder_template_type == 4) {
                                    if (msgResult[index].button_option == 0 && msgResult[index].button_option != '') {
                                        let callToActionArr = JSON.parse(msgResult[index].button_option_string);
                                        for (let i = 0; i < callToActionArr.length; ++i) {
                                            if (msgResult[index].dynamic_url_placeholder.length > 0) {
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
                                                        "text": msgResult[index].dynamic_url_placeholder
                                                    });
            
                                                    component_button.parameters = tempArr;
                                                    objMsg.template.components.push(component_button);
                                                }
                                            }
                                        }
                                    }
                                    if (msgResult[index].button_option == 1 && msgResult[index].button_option != '') {
                                        let quickReplyArr = JSON.parse(msgResult[index].button_option_string);
            
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
                                            objMsg.template.components.push(component_button);
                                        }
                                    }
                                }
                            }
                            break;
                    }

                    async.waterfall([
                        function (cb) {
                            if (botUtils.isMobileInternational(msgResult[index].mobileno)) {
                                wabaCountryCode = botUtils.getCountryCode(msgResult[index].mobileno);
                                wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(msgResult[index].mobileno);
                            }

                            // sendService.getNotificationRate(wabaCountryCodeNumeric, msgResult[index].userid, function (err, result) {
                            //     cb(err, result, wabaCountryCodeNumeric);
                            // });
                            let failed_rate = 0;
                            cb(null, failed_rate, wabaCountryCodeNumeric);
                        },
                        function (rate, countrycode, cb) {
                            sendService.checkIfPresentInSentMaster(msgResult[index].mobileno, msgResult[index].campaignid, (err, result) => {
                                console.log('checkIfPresentInSentMaster========>' + result[0].c);
                                if (result[0].c > 0) {
                                    cb(null, rate, countrycode, result[0].c);
                                }
                                else {
                                    cb(null, rate, countrycode, 0);
                                }
                            }); ``
                        },
                        function (rate, countrycode, count, cb) {
                            if (count == 0) {
                                let errorCode = null;
                                let errorDesc = null;
                                let waMessageId = null;
                                if (msgResult[index].isoptin == IS_OPTIN) {
                                    errorCode = 101;
                                    errorDesc = 'Message Failed due to Non-Whatsapp Mobile Number';
                                }
                                else if (msgResult[index].retrycount == msg_retry_count && msgResult[index].senderrorcode == 0) {
                                    errorCode = 102;
                                    errorDesc = 'Message Failed due to Maximum Retry Attempted';
                                }
                                else if (msgResult[index].retrycount == msg_retry_count && msgResult[index].senderrorcode == 400) {
                                    errorCode = 102;
                                    errorDesc = msgResult[index].error;
                                }else{
                                    errorCode = msgResult[index].senderrorcode;
                                    errorDesc = msgResult[index].error;
                                }

                                let readstatus = 1;

                                sendService.insertFailedMessageInSentMaster_7(msgResult[index].id, msgResult[index].botid, msgResult[index].userid, msgResult[index].mobileno, objMsg, waMessageId, msgResult[index].messagetype, msgResult[index].campaignid, msgResult[index].contactno, msgResult[index].msg_setting_id, direction, errorCode, errorDesc, bodyContent, msgResult[index].appid, rate, countrycode, readstatus, msgResult[index].fbtrace_id,msgResult[index].retrycount, function (err, result) {
                                    if (err) {
                                        if (msgResult[index].mobileno.length > 12) {
                                            sendService.insertInvalidContact(msgResult[index].mobileno, msgResult[index].campaignid, msgResult[index].userid, (err, result) => {
                                                cb(err, result);
                                            });
                                        }
                                        console.log('insertFailedMessageInSentMaster err====================>' + err);
                                    }
                                    else {
                                        let insertdata = {
                                            'inserting failed ': {
                                                id: msgResult[index].id,
                                                botid: msgResult[index].botid,
                                                userid: msgResult[index].userid,
                                                mobileno: msgResult[index].mobileno,
                                                objmsg: JSON.stringify(objMsg),
                                                messageid: waMessageId,
                                                messagetype: msgResult[index].messagetype,
                                                campaignid: msgResult[index].campaignid,
                                                contactno: msgResult[index].contactno,
                                                msg_setting_id: msgResult[index].msg_setting_id,
                                                direction: direction,
                                                errcode: errorCode,
                                                errordesc: errorDesc,
                                                bodyContent: bodyContent,
                                                appid: msgResult[index].appid,
                                                rate: rate,
                                                countrycode: countrycode,
                                                readstatus: readstatus
                                            }
                                        };
                                        errorLogger.info(insertdata);
                                        errorLogger.info('insertFailedMessageInSentMaster result====================>' + JSON.stringify(result));
                                        console.log('insertFailedMessageInSentMaster result====================>' + JSON.stringify(result));
                                        cb(null, result);
                                    }
                                });
                            }
                            else {
                                cb(null, count);
                            }
                        },
                        function (result, cb) {
                            sendService.deleteMessageFromRequestMaster(0, msgResult[index].id, function (err, result) {
                                if (err) {
                                    console.log('deleteMessageFromRequestMaster err====================>' + err);
                                }
                                else {
                                    console.log('deleteMessageFromRequestMaster result====================>' + JSON.stringify(result));
                                }
                                cb(err, result);
                            });
                        }
                    ], function (err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Record shifted to sent master(1)');
                        }
                    });

                    if (index == (msgResult.length - 1)) {
                        console.log(index, " = ", msgResult.length - 1);

                        done(null, {
                            code: 200,
                            status: 'SUCCESS',
                            message: 'Messages Shifted Successfully'
                        });
                    }
                }
            };

            async.waterfall([
                fetchMessageConfig,
                fetchMessages,
                processMessage
            ], function (err, result) {
                if (err) {
                    //console.log(err);
                    if (err.code == 'WA001' || err.code == 'WA002') {
                        let waitingTime = 5000;
                        console.log('Waiting for ' + waitingTime + 'ms');
                        setTimeout(() => {
                            isrunning = true;
                        }, waitingTime);
                    }
                } else {
                    // console.log(result);
                    console.log('index =============================================================' + isrunning);
                    isrunning = true;
                }
            });
        }
    }
    catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
});
