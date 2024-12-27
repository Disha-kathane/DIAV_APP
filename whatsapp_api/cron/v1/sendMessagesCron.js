const botUtils = require('../../utils/bot');
const timeUtils = require('../../utils/time');
const whatsappService = require('../../services/v1/whatsapp');
const responseHelper = require('../../utils/responseHelper');
const contactService = require('../../services/v1/contacts');
const userService = require('../../services/v1/users');
const templateService = require('../../services/v1/template')
const config = require('../../config');
const csvtojson = require('csvtojson');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
var infoLogger = appLoggers.infoLogger;
const fs = require('fs/promises');
const mimeTypes = require('mime-types');
const _ = require('lodash');
const xlsx = require('xlsx');
const { template } = require('lodash');
const axios = require('axios');
const { connectLogger } = require('log4js');
const { default: async } = require('async');
const cron = require('node-cron');

const sendService = require('../../services/v1/send');

const batchSize = 35;

const sendMessages = async (retry) => {
    try {

        const [ oneCampaign ] = await templateService.selectCampaignId(1, 6);
        if(!oneCampaign){
            console.log('No campaign files to send Messages');
            return;
        }
        let result;
        if (typeof retry != 'number') {
            retry = 0;
        };

        const { userId, campaignId } = oneCampaign;

        const campainDetails = await templateService.getCampaignDetails(userId, campaignId, 6);

        const wabaNumber = campainDetails.contactno;

        const countRunningCampaign = await contactService.getRunningCampaignCount(wabaNumber);
        // Query
        if (countRunningCampaign != 0) {
            console.log('Already campaigns are running against this wabaNumber');
            return;
        }

        
        let templateDetails  = await templateService.getTemplateDetails(campainDetails.templateid, userId);
        await templateService.updateCampaignDetails(7, campaignId);

        result = await contactService.selectFromRequestMaster(userId, campaignId);
        //console.log('Campaign Started', campaignId, result.length, batchSize);
        console.log('\x1b[33m%s\x1b[0m', `SEND Campaign ${campaignId} Started | Count: ${result.length} | Batch Size: ${batchSize} \n`);

        //console.log(result);
        
        if(!(result.length)){
            console.log('No data to process');
            await templateService.updateCampaignDetails(7, campaignId);
            return;
        }

        const iteratorLength = (result.length % batchSize) == 0 ? (result.length / batchSize): (result.length / batchSize) + 1;

        for (let idx = 0; idx < parseInt(iteratorLength); idx++) {
            setTimeout(async () => {
                let msgResult = result.splice(0, batchSize);
                
                await Promise.all(msgResult.map((oneMessageResult, index) => {
                    try {
                    // msgResult.forEach((_, msgIndex) => {
                        // console.log('data: ', index);
                        if (msgResult[index] && msgResult[index].placeholders) {
                            let _x = msgResult[index].placeholders.toString().indexOf("'[");
                            if (_x == 0) {
                                msgResult[index].placeholders = msgResult[index].placeholders.toString().replace("'[", "[");
                            }

                            _x = msgResult[index].placeholders.toString().lastIndexOf("]'");
                            if (_x != -1) {
                                msgResult[index].placeholders = msgResult[index].placeholders.toString().replace("]'", "]");
                            }
                        }
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
                                    // console.log('msgResult[index].placeholders: ' + Array.isArray(JSON.parse(msgResult[index].placeholders)));
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
                                                    "type": "body",
                                                    "parameters": tempArr
                                                }]
                                            }
                                        }
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
                    // })

                        sendService.checkSubscription(msgResult[index].mobileno, msgResult[index].contactno, (err, result) => {
                            if (result == 0) {
                                let waMessageId = null;
                                let errorCode = 100;
                                let errorDesc = 'No subscription found for the mobile number ' + msgResult[index].mobileno;
                                async.waterfall([
                                    function (done) {
                                        sendService.insertMessageInSentMaster(msgResult[index].id, msgResult[index].botid, msgResult[index].userid, msgResult[index].mobileno, JSON.stringify(objMsg), waMessageId, msgResult[index].messagetype, msgResult[index].campaignid, msgResult[index].contactno, msgResult[index].msg_setting_id, direction, errorCode, errorDesc, bodyContent, msgResult[index].appid, (err, result) => {
                                            done(err, result);
                                        });
                                    },
                                    function (result, done) {
                                        sendService.updateMessageInRequestMaster(1, errorDesc, msgResult[index].id, (err, result) => {
                                            done(err, result);
                                        });
                                    },
                                    function (result, done) {
                                        sendService.updateUnsubscribedMessage(msgResult[index].id, (err, result) => {
                                            done(err, result);
                                        });
                                    }
                                ], (err, result) => {
                                    if (err) {
                                        //console.log(err);
                                    } else {
                                        //console.log('Record shifted to sent master');
                                        errorLogger.info("*********************************************************");
                                        errorLogger.info("MOBILE_NO: " + msgResult[index].mobileno);
                                        errorLogger.info("WABA_NUMBER: " + msgResult[index].contactno);
                                        errorLogger.info("MESSAGE_PAYLOAD: " + JSON.stringify(objMsg));
                                        errorLogger.info("MESSAGE_ID: " + waMessageId);
                                        errorLogger.info("ERROR: " + errorDesc);
                                        errorLogger.info("*********************************************************");
                                    }
                                });
                            } else {
                                botUtils.callWhatsAppApi(oneMessageResult.wabaurl, api, objMsg, httpMethod, requestType, apiHeaders).then(function (response) {
                                    // console.log("send response: " + index);
                                    if (typeof response.messages != undefined) {
                                        let errorCode = null;
                                        let errorDesc = null;
                                        let waMessageId = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                                        // console.log(waMessageId);
                                        async.waterfall([
                                            function (done) {
                                                sendService.updateMessageInRequestMaster(1, 'Message Sent Successfully', oneMessageResult.id, (err, result) => {
                                                    done(err, result);
                                                });
                                            },
                                            function (result, done) {
                                                sendService.insertMessageInSentMaster(oneMessageResult.id, oneMessageResult.botid, oneMessageResult.userid, oneMessageResult.mobileno, JSON.stringify(objMsg), waMessageId, oneMessageResult.messagetype, oneMessageResult.campaignid, oneMessageResult.contactno, oneMessageResult.msg_setting_id, direction, errorCode, errorDesc, bodyContent, oneMessageResult.appid, (err, result) => {
                                                    done(err, result);
                                                });
                                            }, function (result, done) {
                                                sendService.deleteMessageFromRequestMaster(1, oneMessageResult.id, (err, result) => {
                                                    done(err, result);
                                                });
                                            }
                                        ], (err, result) => {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                //console.log('Record shifted to sent master');
                                                errorLogger.info("*********************************************************");
                                                errorLogger.info("MOBILE_NO: " + oneMessageResult.mobileno);
                                                errorLogger.info("WABA_NUMBER: " + oneMessageResult.contactno);
                                                errorLogger.info("MESSAGE_PAYLOAD: " + JSON.stringify(objMsg));
                                                errorLogger.info("MESSAGE_ID: " + waMessageId);
                                                errorLogger.info("ERROR: " + errorDesc);
                                                errorLogger.info("*********************************************************");
                                            }
                                        });
                                    } else {
                                        console.log('error maybe');
                                        sendService.updateRetryMessageInRequestMaster(0, JSON.stringify(response), oneMessageResult.id, (err, result) => {
                                            //console.log(err, result);
                                        });
                                    }
                                }).catch(function (err) {
                                    //console.log('caught error', err);
                                    //console.log('\x1b[31m%s\x1b[0m', `Number ${objMsg} Failed\n`);
                                    sendService.updateRetryMessageInRequestMaster(0, err.message, oneMessageResult.id, (err, result) => {
                                        //console.log(err, result);
                                        errorLogger.info("*********************************************************");
                                        errorLogger.info("MOBILE_NO: " + oneMessageResult.mobileno);
                                        errorLogger.info("WABA_NUMBER: " + oneMessageResult.contactno);
                                        errorLogger.info("MESSAGE_PAYLOAD: " + JSON.stringify(objMsg));
                                        errorLogger.info("MESSAGE_ID: " + null);
                                        errorLogger.info("ERROR: " + err);
                                        errorLogger.info("*********************************************************");
                                    });
                                });

                                //console.log(index, (msgResult.length - 1));
                                if (index == (msgResult.length - 1)) {
                                // console.log(`Batch ${idx + 1}: Completed`);
                                    console.log('\x1b[36m%s\x1b[0m', `Send Batch ${idx + 1} Completed | Time: ${new Date().toLocaleString()}\n`);
                                }

                            }
                        })
                    } catch (error) {
                        console.log(error);
                        errorLogger.error(JSON.stringify(error));
                    }
                }));
                
                //console.log((idx + 1), parseInt(iteratorLength));
                if ((idx + 1) == parseInt(iteratorLength)) {
                    const retryOne = await contactService.selectFromRequestMaster(userId, campaignId);
                    console.log('failedRecords: ', retryOne.length);
                    if(retryOne && retryOne.length && retry < 1){
                        // await whatsappService.callBroadCastAPI(apiKey, campaignId, ++req.body.retry);
                        await templateService.updateCampaignDetails(6, campaignId);
                        console.log('\x1b[36m%s\x1b[0m', `Retrying ${retryOne.length} records | Round ${retry}\n`);
                        await sendMessages(++retry);
                    } else {
                    // save in send master
                        // const failedNumbers = await contactService.selectFromRequestMaster(userId, campaignId);
                        if(retryOne && retryOne.length){
                            const errorcode = 408;
                            const errormessage = 'TimeOut' ;
                            const createDate = new Date();
                            await contactService.insertIntoRetrySendMaster(retryOne, errorcode, errormessage, createDate, userId, campaignId, campainDetails.contactno);
                            await contactService.deleteRetryContactsFRM(retryOne, userId, campaignId);
                            await templateService.updateCampaignDetails(8, campaignId);
                            console.log('Send Campaign Completed:', campaignId);     
                        }
                    }  
                }
                    // });
            }, idx * 1000)
        }

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        //return;
        //return responseHelper(500, error.messagetype, null, error);
    }
}

// sendMessages()
//     .then(resp => console.log('success'))
//     .catch(console.log);

// module.exports = cron.schedule('*/30 * * * * *', () => {}, {
//     scheduled: false
// })


module.exports = cron.schedule('*/30 * * * * *', sendMessages, { scheduled: false });