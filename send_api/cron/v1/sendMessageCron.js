const async = require('async');
const { errorLogger, infoLogger } = require('../../applogger');
const botUtils = require('../../utils/bot');
const cron = require('node-cron');
const sendService = require('../../services/v1/send');
const CRON_VAL = '*/5 * * * * *';

module.exports = cron.schedule(CRON_VAL, async function () {
    try {
        let fetchMessages = (done) => {
            sendService.fetchMessages(function (err, result) {
                if (err) {
                    //console.log(err);
                    return done({
                        code: 'WA001', status: 'SUCCESS', message: 'No Records Found'
                    });
                } else {
                    done(null, result);
                }
            });
        };

        let processMessage = (msgResult, done) => {
            for (let index = 0; index < msgResult.length; index++) {
                let bodyContent = null;

                let objMsg = {};
                let direction = 1;
                let api = '/v1/messages';
                let httpMethod = 1;
                let requestType = 1;
                let contentLength = Buffer.byteLength(JSON.stringify(objMsg));
                let apiHeaders = [{
                    'headerName': 'Authorization',
                    'headerVal': 'Bearer ' + msgResult[index].accesstoken
                }, {
                    'headerName': 'content-length',
                    'headerVal': contentLength
                }];
                //console.log(JSON.stringify(objMsg));

                switch (msgResult[index].messagetype) {
                    //0=>'Document', 1=>'Image', 2=>'Video', 3=>'Audio', 4=>'Text', 5=>'Location', 6=>'Contact', 7=>'Sticker',8=>'Template'
                    case 0: // DOCUMENT
                        if (msgResult[index].mediaflag == 1) {
                            if (Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                let tempArr = botUtils.fetchPlaceholders(msgResult[index].placeholders);

                                let i = 1;
                                bodyContent = msgResult[index].body_message.toString();
                                for (let j = 0; j < tempArr.length; j++) {
                                    let x = tempArr[j].text;
                                    //console.log(x, '{{' + i + '}}');
                                    bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                    i++;
                                }

                                //console.log(bodyContent);

                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
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
                                        }]
                                    }
                                };
                            }
                            else {
                                bodyContent = msgResult[index].body_message.toString();
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
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
                            if (Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                let tempArr = botUtils.fetchPlaceholders(msgResult[index].placeholders);
                                let i = 1;
                                bodyContent = msgResult[index].body_message.toString();
                                for (let j = 0; j < tempArr.length; j++) {
                                    let x = tempArr[j].text;
                                    //console.log(x, '{{' + i + '}}');
                                    bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                    i++;
                                }

                                //console.log(bodyContent);

                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
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
                                        }]
                                    }
                                };
                            }
                            else {
                                bodyContent = msgResult[index].body_message.toString();
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
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
                            if (Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                let tempArr = botUtils.fetchPlaceholders(msgResult[index].placeholders);

                                let i = 1;
                                bodyContent = msgResult[index].body_message.toString();
                                for (let j = 0; j < tempArr.length; j++) {
                                    let x = tempArr[j].text;
                                    //console.log(x, '{{' + i + '}}');
                                    bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                    i++;
                                }

                                //console.log(bodyContent);

                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "image",
                                                "image": {
                                                    "id": msgResult[index].media,
                                                    "caption": "",
                                                    "filename": msgResult[index].filename
                                                }
                                            }]
                                        },
                                        {
                                            "type": "body",
                                            "parameters": tempArr
                                        }]
                                    }
                                };
                            }
                            else {
                                bodyContent = msgResult[index].body_message.toString();
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "image",
                                                "image": {
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
                            if (Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                let tempArr = botUtils.fetchPlaceholders(msgResult[index].placeholders);
                                let i = 1;
                                bodyContent = msgResult[index].body_message.toString();
                                for (let j = 0; j < tempArr.length; j++) {
                                    let x = tempArr[j].text;
                                    //console.log(x, '{{' + i + '}}');
                                    bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                    i++;
                                }

                                //console.log(bodyContent);
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "image",
                                                "image": {
                                                    "link": msgResult[index].media,
                                                    "caption": "",
                                                    "filename": msgResult[index].filename
                                                }
                                            }]
                                        },
                                        {
                                            "type": "body",
                                            "parameters": tempArr
                                        }]
                                    }
                                };
                            }
                            else {
                                bodyContent = msgResult[index].body_message.toString();
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "image",
                                                "image": {
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
                            //console.log('msgResult[index].placeholders: ' + msgResult[index].placeholders);
                            if (Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                let tempArr = botUtils.fetchPlaceholders(msgResult[index].placeholders);

                                let i = 1;
                                bodyContent = msgResult[index].body_message.toString();
                                for (let j = 0; j < tempArr.length; j++) {
                                    let x = tempArr[j].text;
                                    //console.log(x, '{{' + i + '}}');
                                    bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                    i++;
                                }

                                //console.log(bodyContent);

                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "video",
                                                "video": {
                                                    "id": msgResult[index].media,
                                                    "caption": "",
                                                    "filename": msgResult[index].filename
                                                }
                                            }]
                                        },
                                        {
                                            "type": "body",
                                            "parameters": tempArr
                                        }]
                                    }
                                };
                            }
                            else {
                                bodyContent = msgResult[index].body_message.toString();
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "video",
                                                "video": {
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
                            if (Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                let tempArr = botUtils.fetchPlaceholders(msgResult[index].placeholders);
                                let i = 1;
                                bodyContent = msgResult[index].body_message.toString();
                                for (let j = 0; j < tempArr.length; j++) {
                                    let x = tempArr[j].text;
                                    //console.log(x, '{{' + i + '}}');
                                    bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                    i++;
                                }

                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "video",
                                                "video": {
                                                    "link": msgResult[index].media,
                                                    "caption": "",
                                                    "filename": msgResult[index].filename
                                                }
                                            }]
                                        },
                                        {
                                            "type": "body",
                                            "parameters": tempArr
                                        }]
                                    }
                                };
                            }
                            else {
                                bodyContent = msgResult[index].body_message.toString();
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "video",
                                                "video": {
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
                    case 3: // AUDIO

                        if (msgResult[index].mediaflag == 1) {
                            if (Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                let tempArr = botUtils.fetchPlaceholders(msgResult[index].placeholders);

                                let i = 1;
                                bodyContent = msgResult[index].body_message.toString();
                                for (let j = 0; j < tempArr.length; j++) {
                                    let x = tempArr[j].text;
                                    //console.log(x, '{{' + i + '}}');
                                    bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                    i++;
                                }

                                //console.log(bodyContent);

                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "audio",
                                                "audio": {
                                                    "id": msgResult[index].media,
                                                    "caption": "",
                                                    "filename": msgResult[index].filename
                                                }
                                            }]
                                        },
                                        {
                                            "type": "body",
                                            "parameters": tempArr
                                        }]
                                    }
                                };
                            }
                            else {
                                bodyContent = msgResult[index].body_message.toString();
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "audio",
                                                "audio": {
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
                            if (Array.isArray(JSON.parse(msgResult[index].placeholders))) {
                                let tempArr = botUtils.fetchPlaceholders(msgResult[index].placeholders);
                                let i = 1;
                                bodyContent = msgResult[index].body_message.toString();
                                for (let j = 0; j < tempArr.length; j++) {
                                    let x = tempArr[j].text;
                                    //console.log(x, '{{' + i + '}}');
                                    bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                    i++;
                                }

                                //console.log(bodyContent);
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "audio",
                                                "audio": {
                                                    "link": msgResult[index].media,
                                                    "caption": "",
                                                    "filename": msgResult[index].filename
                                                }
                                            }]
                                        },
                                        {
                                            "type": "body",
                                            "parameters": tempArr
                                        }]
                                    }
                                };
                            }
                            else {
                                bodyContent = msgResult[index].body_message.toString();
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "header",
                                            "parameters": [{
                                                "type": "audio",
                                                "audio": {
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
                    case 4: // TEXT MESSAGE

                        if (msgResult[index].mediaflag == 0) {
                            console.log('msgResult[index].placeholders: '+Array.isArray(JSON.parse(msgResult[index].placeholders)));
                            if (Array.isArray(JSON.parse(msgResult[index].placeholders))){
                                let tempArr = botUtils.fetchPlaceholders(msgResult[index].placeholders);

                                let i = 1;
                                bodyContent = msgResult[index].body_message.toString();
                                for (let j = 0; j < tempArr.length; j++) {
                                    let x = tempArr[j].text;
                                    //console.log(x, '{{' + i + '}}');
                                    bodyContent = bodyContent.replace('{{' + i + '}}', x);
                                    i++;
                                }
    
                                //console.log(bodyContent);
    
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
                                            "code": msgResult[index].language
                                        },
                                        "name": msgResult[index].templatetitle,
                                        "components": [{
                                            "type": "body",
                                            "parameters": tempArr
                                        }]
                                    }
                                }
                            }
                            else{
                                bodyContent = msgResult[index].body_message.toString();
                                objMsg = {
                                    "to": msgResult[index].mobileno,
                                    "type": "template",
                                    "template": {
                                        "namespace": msgResult[index].namespace,
                                        "language": {
                                            "policy": "deterministic",
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
                                    "parameters": [
                                        {
                                            "type": "text",
                                            "text": msgResult[index].header_placeholder
                                        }
                                    ]
                                };

                                if (msgResult[index].button_option == 0 && msgResult[index].button_option != '') {
                                    let callToActionArr = JSON.parse(msgResult[index].button_option_string);
                                    for (let i = 0; i < callToActionArr.length; ++i) {
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
                                    "parameters": [
                                        {
                                            "type": "text",
                                            "text": msgResult[index].header_placeholder
                                        }
                                    ]
                                };

                                objMsg.template.components.push(tmpHeader);
                            }
                            if (msgResult[index].placeholder_template_type == 4) {
                                if (msgResult[index].button_option == 0 && msgResult[index].button_option != '') {
                                    let callToActionArr = JSON.parse(msgResult[index].button_option_string);
                                    for (let i = 0; i < callToActionArr.length; ++i) {
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

                sendService.checkSubscription(msgResult[index].mobileno, msgResult[index].contactno, (err, result) => {
                    if (result == 0) {
                        let waMessageId = null;
                        let errorCode = 100;
                        let errorDesc = 'No subscription found for the mobile number ' + msgResult[index].mobileno;
                        async.waterfall([
                            function (done) {
                                sendService.insertMessageInSentMaster(msgResult[index].id, msgResult[index].botid, msgResult[index].userid, msgResult[index].mobileno, JSON.stringify(objMsg), waMessageId, msgResult[index].messagetype, msgResult[index].campaignid, msgResult[index].contactno, msgResult[index].msg_setting_id, direction, errorCode, errorDesc, bodyContent, msgResult[index].appid, function (err, result) {
                                    done(err, result);
                                });
                            },
                            function (result, done) {
                                sendService.updateMessageInRequestMaster(1, errorDesc, msgResult[index].id, function (err, result) {
                                    done(err, result);
                                });
                            },
                            function (result, done) {
                                sendService.updateUnsubscribedMessage(msgResult[index].id, function (err, result) {
                                    done(err, result);
                                });
                            }
                        ], function (err, result) {
                            if (err) {
                                //console.log(err);
                            } else {
                                //console.log('Record shifted to sent master');
                            }
                        });
                    }
                    else {
                        botUtils.callWhatsAppApi(msgResult[index].wabaurl, api, objMsg, httpMethod, requestType, apiHeaders).then(function (response) {
                            // //console.log("send response: " + index);
                            if (typeof response.messages != undefined) {
                                let waMessageId = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                                console.log(waMessageId);
                                async.waterfall([
                                    function (done) {
                                        let errorCode = null;
                                        let errorDesc = null;
                                        sendService.insertMessageInSentMaster(msgResult[index].id, msgResult[index].botid, msgResult[index].userid, msgResult[index].mobileno, JSON.stringify(objMsg), waMessageId, msgResult[index].messagetype, msgResult[index].campaignid, msgResult[index].contactno, msgResult[index].msg_setting_id, direction, errorCode, errorDesc, bodyContent, msgResult[index].appid, function (err, result) {
                                            done(err, result);
                                        });
                                    },
                                    function (result, done) {
                                        sendService.updateMessageInRequestMaster(1, 'Message Sent Successfully', msgResult[index].id, function (err, result) {
                                            done(err, result);
                                        });
                                    }
                                    , function (result, done) {
                                        sendService.deleteMessageFromRequestMaster(1, msgResult[index].id, function (err, result) {
                                            done(err, result);
                                        });
                                    }
                                ], function (err, result) {
                                    if (err) {
                                        //console.log(err);
                                    } else {
                                        //console.log('Record shifted to sent master');
                                    }
                                });
                            } else {
                                sendService.updateMessageInRequestMaster(0, JSON.stringify(response), msgResult[index].id, function (err, result) {
                                    //console.log(err, result);
                                });
                            }
                        }).catch(function (err) {
                            console.log(err);
                            sendService.updateMessageInRequestMaster(0, err.message, msgResult[index].id, function (err, result) {
                                //console.log(err, result);
                            });
                        });
                        if (index == (msgResult.length - 1)) {
                            done(null, {
                                code: 200,
                                status: 'SUCCESS',
                                message: 'Messages Processed Successfully'
                            });
                        }
                    }
                });
            }
        };

        async.waterfall([
            fetchMessages,
            processMessage
        ], function (err, result) {
            if (err) {
                //console.log(err);
            } else {
                //console.log(result);
            }
        });
    }
    catch (error) {
        //console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
});