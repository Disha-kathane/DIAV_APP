const whatsappService = require('../../services/v1/whatsapp.js');
const userService = require('../../services/v1/userStat.js');
const fs = require('fs');
const async = require('async');
var appLoggers = require('../../applogger.js');
var mime = require('mime-types');
const {
    Console
} = require('console');

const AWS = require('aws-sdk');
const path = require('path');
const { stringify } = require('querystring');

const s3 = new AWS.S3({
    accessKeyId: 'AKIAS2AEXDPLMUXEV5QS',
    secretAccessKey: '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'
});
const BUCKET_NAME = "whatsappdata";
const params = {
    Bucket: BUCKET_NAME,
    CreateBucketConfiguration: {
        LocationConstraint: "ap-south-1"
    }
};
var errorLogger = appLoggers.errorLogger;

//Create template api on whatsapp bussiness account
module.exports = (req, res) => {
    try {
        console.log(req.body);
        // console.log('MESSAGE_TEMPLATE : ' + JSON.stringify(req.body));
        let objData = null;
        let components = [];
        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let name = req.body.name;
        let language = req.body.language;
        let category = req.body.category;
        let ComponentsData = req.body.components;
        // let ComponentsData = req.body.components != undefined ? JSON.parse(req.body.components) : null;
        // let filepath = req.files.media != undefined ? req.files.media[0].path : null;
        let head_temptype = null;
        let tempid;
        let botid;
        let head_text_title = null;
        let head_mediatype = null;
        let head_media_url;
        let head_media_filename = null;
        let body_message;
        let bodyplaceholders = null;
        let urlplaceholder = null;
        let footer_text = null;
        let button_option = null;
        let headerplaceholder = null;
        let request_to_admin = 0;
        let status = 0;
        let placeholder_template_type;
        let is_email_sent = 0;
        let button_option_string = [];
        let sample_content = {};
        let sample_content1 = {};
        let marketing_opt_out = 0;
        let marketing_consent = 0;
        let flowid1 = null;
        let carousel_payload = [];
        let quick_reply = carousel_payload.button;
        let visit_website = carousel_payload.button;
        let allow_category_change = req.body.allow_category_change;
        let category_change;

        let type_of_marketing = null;
        let marketing_template_format;
        //  head_media_url111;

        // let carousel_payload = [];

        if (category === "MARKETING") {
            type_of_marketing = 1;
        } else {
            type_of_marketing = 0;
        }
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
        if (!req.body.name) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'Template name is required',
                data: {}
            };

        }
        if (!req.body.language) {
            return {
                code: 'WA004',
                status: 'FAILED',
                message: 'Language is required',
                data: {}
            };

        }
        if (!req.body.category) {
            return {
                code: 'WA005',
                status: 'FAILED',
                message: 'Category is required',
                data: {}
            };

        }
        if (allow_category_change === true) {

            // console.log(allow_category_change, "allow_category_change ---- true ");
            category_change = '1';
        } if (allow_category_change === false) {
            // console.log(allow_category_change, "allow_category_change ---- false ");
            category_change = '0';
        } if (!allow_category_change) {
            category_change = null;
        }
        let getusers = function (callback) {
            // console.log({getusers})
            userService.getUserId(apikeys, wanumber, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    userid = result[0].userid;
                    console.log(userid, "userid--------------------------------------");
                    callback(null, userid, wanumber);

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
        let getwabaid = function (userid, wanumber, callback) {
            // console.log({getwabaid})
            userService.getWabaId(userid, wanumber, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    wabaid = result[0].whatsapp_business_account_id;
                    callback(null, wabaid, userid);
                }
            });
        };
        let getusersetting = function (wabaid, userid, callback) {
            userService.getAccessToken((err, result) => {
                if (err) {
                    console.log({
                        err
                    });
                    return callback(err);
                }

                if (result != null && result.length > 0) {
                    SystemAccessToken = result[0].value;
                    callback(null, SystemAccessToken, wabaid, userid);
                }

            });
        };
        let createpayload = function (access_token, wabaid, userid, callback) {
            if (ComponentsData.length > 0) {
                // console.log(ComponentsData.type,"console.log(ComponentsData.forEach().type);");
                let isComponentEmpty = true;
                ComponentsData.forEach((entry) => {
                    console.log(entry);
                    if (Object.keys(entry).length == 0) {
                        isComponentEmpty = false;
                        return;
                    }
                });

                if (isComponentEmpty == true) {

                    if (ComponentsData.findIndex(x => x.type.toLowerCase() === "body") > -1) {
                        let bodyindex = ComponentsData.findIndex(x => x.type.toLowerCase() === "body");
                        body_message = ComponentsData[bodyindex].text;
                        bodyplaceholders = ComponentsData[bodyindex].example != undefined ? ComponentsData[bodyindex].example.body_text[0] : null;
                        sample_content.body_content = bodyplaceholders;

                        if (body_message.match(/\{\w+\}/g) != null) {
                            bodyplaceholders = body_message.match(/\{\w+\}/g).map(s => s.slice(1, -1));
                            bodyplaceholders = bodyplaceholders.map(Number).filter((value, index, self) => self.indexOf(value) === index).toString();
                            console.log({ bodyplaceholders });
                        }

                        components.push({
                            type: 'BODY',
                            // type: body_type,
                            text: ComponentsData[bodyindex].text,
                            example: ComponentsData[bodyindex].example
                        });
                    }
                    if (ComponentsData.findIndex(x => x.type.toLowerCase() === "footer") > -1) {
                        let footerindex = ComponentsData.findIndex(x => x.type.toLowerCase() === "footer");
                        // footer_type = ComponentsData[footerindex].type;
                        footer_text = ComponentsData[footerindex].text;
                        if (footer_text == 'Not interested? Tap Stop promotions') {
                            marketing_opt_out = 1;
                            marketing_consent = 1;
                        }
                        components.push({
                            type: 'FOOTER',
                            // type: footer_type,
                            text: ComponentsData[footerindex].text
                        });

                    }
                    if (ComponentsData.findIndex(x => x.type.toLowerCase() === "carousel") > -1) {
                        let carouselindex = ComponentsData.findIndex(x => x.type.toLowerCase() === "carousel");
                        components.push({
                            // "type": "CAROUSEL",
                            "type": ComponentsData[carouselindex].type,
                            "cards": []
                        });
                        for (let i = 0; i < ComponentsData[carouselindex].cards.length; i++) {
                            if (ComponentsData[carouselindex].cards[i].components.findIndex(x => x.type.toLowerCase() === "body") > -1
                            ) {
                                let carouselbodyindex = ComponentsData[carouselindex].cards[i].components.findIndex(x => x.type.toLowerCase() === "body");
                                body_type1 = ComponentsData[carouselindex].cards[i].components[carouselbodyindex].type;
                                body_message = ComponentsData[carouselindex].cards[i].components[carouselbodyindex].text;
                                body_message1 = ComponentsData[carouselindex].cards[i].components[carouselbodyindex].example;
                                bodyplaceholdersS = body_message1 != undefined ? body_message1.body_text[0] : null;
                                bodyplaceholdersS1 = body_message1 != undefined ? body_message1.body_text[0] : null;
                                if (body_message.match(/\{\w+\}/g) != null) {
                                    bodyplaceholdersS = body_message.match(/\{\w+\}/g).map(s => s.slice(1, -1));
                                    bodyplaceholdersS = bodyplaceholdersS.map(Number).filter((value, index, self) => self.indexOf(value) === index).toString();
                                }
                                components[1].cards.push({
                                    "components": [
                                        {
                                            type: 'BODY',
                                            text: body_message,
                                            example: body_message1
                                        }
                                    ]
                                });
                            }
                            if (ComponentsData[carouselindex].cards[i].components.findIndex(x => x.type.toLowerCase() === "buttons") > -1) {
                                let carouselbuttonindex = ComponentsData[carouselindex].cards[i].components.findIndex(x => x.type.toLowerCase() === "buttons");
                                let ComponentsData1 = ComponentsData[carouselindex].cards[i].components[carouselbuttonindex];
                                let urldata = ComponentsData1.buttons;
                                components[1].cards[i].components.push({
                                    // type: 'BUTTONS',
                                    type: ComponentsData1.type,
                                    buttons: urldata
                                });
                                if (urldata.findIndex(x => x.type.toLowerCase() === "quick_reply") > -1) {
                                    quick_reply = {
                                        "button_text": urldata[0].text
                                    };
                                }
                                if (urldata.findIndex(x => x.type.toLowerCase() === "url") > -1) {
                                    urlindex = urldata.findIndex(x => x.type.toLowerCase() === "url");
                                    urlplaceholder = urldata[urlindex].example != undefined ? urldata[urlindex].example[0] : null;
                                    sample_content.dynamic_url = urldata[urlindex].example != null ? urldata[urlindex].example : null;
                                    if (urlplaceholder != null && urlplaceholder.length > 0) {
                                        visit_website = {
                                            "button_text": urldata[urlindex].text,
                                            "button_url": urldata[urlindex].url,
                                            "url_sample_content": urldata[urlindex].example[0]
                                        };
                                    } else {
                                        visit_website = {
                                            "button_text": urldata[urlindex].text,
                                            "button_url": urldata[urlindex].url,
                                            "url_sample_content": null
                                        };
                                    }
                                }
                                // if (urldatafindIndex(x => x.type.toLowerCase() === "phone_number") > -1) {
                                //     phone_number = {
                                //         "phone_button_text": urldata[urlindex].text,
                                //         "phone_number": urldata[urlindex].phone_number
                                //     };
                                // }
                            }
                            if (ComponentsData[carouselindex].cards[i].components.findIndex(x => x.type.toLowerCase() === "header") > -1) {
                                let carouselheaderindex = ComponentsData[carouselindex].cards[i].components.findIndex(x => x.type.toLowerCase() === "header");
                                let ComponentsData1 = ComponentsData[carouselindex].cards[i].components[carouselheaderindex];
                                let headerindex = (ComponentsData1.format.toLowerCase() === "header");
                                let hasImage = (ComponentsData1.format.toLowerCase() === "image");
                                let hasVideo = (ComponentsData1.format.toLowerCase() === "video");

                                if (hasImage) {
                                    if (ComponentsData1.example != undefined) {
                                        if (ComponentsData1.example.header_handle != undefined) {
                                            header_handlerquery = ComponentsData1.example.header_handle[0]
                                            userService.get_URL_headerhandel(header_handlerquery, (err, result) => {
                                                if (err) {
                                                    console.log(err);

                                                } else {
                                                    head_media_url111 = result[0];
                                                    head_media_url221 = result;
                                                    // console.log("head_media_url111",head_media_url221);
                                                    if (head_media_url221.length > 0) {
                                                        if (head_media_url111.mime_type === "image/jpeg" || head_media_url111.mime_type === "image/jpg" || head_media_url111.mime_type === "image/png") {
                                                            head_media_url1 = head_media_url111.url
                                                            sample_content.header_content = null;
                                                            sample_content.dynamic_url = null;
                                                            head_temptype = 1;
                                                            head_mediatype = "6";
                                                            head_mediatypec = "1";
                                                            button_option_string = null;

                                                            components[1].cards[i].components.push({
                                                                type: ComponentsData1.type,
                                                                format: ComponentsData1.format,
                                                                example:
                                                                    ComponentsData1.example
                                                            });

                                                            carousel_payload.push({
                                                                "media_type": head_mediatypec,
                                                                "media_url": head_media_url1,
                                                                "body": body_message,
                                                                "body_sample_content": bodyplaceholdersS1,
                                                                "buttons": { visit_website, quick_reply, }
                                                            });
                                                            // console.log(carousel_payload, "carousel_payloadcarousel_payloadcarousel_payload");
                                                            objData = {
                                                                access_token,
                                                                name,
                                                                language,
                                                                category,
                                                                allow_category_change,
                                                                components: components
                                                            };

                                                            let imagedata = {
                                                                wabaid,
                                                                userid,
                                                                head_media_url,
                                                                head_media_filename,
                                                                head_temptype,
                                                                head_mediatype,
                                                                body_message,
                                                                body_message1,
                                                                button_option,
                                                                head_text_title,
                                                                footer_text,
                                                                button_option,
                                                                request_to_admin,
                                                                sample_content,
                                                                placeholder_template_type,
                                                                name,
                                                                language,
                                                                category,
                                                                button_option_string,
                                                                status,
                                                                bodyplaceholders,
                                                                urlplaceholder,
                                                                headerplaceholder,
                                                                is_email_sent,
                                                                marketing_opt_out,
                                                                marketing_consent
                                                            };
                                                            if (i == ComponentsData[carouselindex].cards.length - 1) {
                                                                callback(null, objData, imagedata);
                                                            }
                                                        } else {
                                                            res.send({
                                                                code: "WA100",
                                                                status: 'failed',
                                                                message: 'Proper hearder handler required',

                                                            });
                                                        }
                                                    }
                                                    else {
                                                        // console.log("outside image simple temp check");
                                                        res.send({
                                                            code: "WA100",
                                                            status: 'Failed',
                                                            message: 'Correct Header Handle is Required Image for card ' + i,

                                                        });
                                                    }
                                                }
                                            });

                                        } else {
                                            res.send({
                                                code: "WA100",
                                                status: 'Failed',
                                                message: 'Header Handle is Required for Image carousel',
                                            });
                                        }
                                    } else {
                                        res.send({
                                            code: "WA100",
                                            status: 'Failed',
                                            message: 'Example is Required for Header Image carousel',
                                        });
                                    }

                                }
                                else if (hasVideo) {
                                    if (ComponentsData1.example != undefined) {
                                        if (ComponentsData1.example.header_handle != undefined) {
                                            header_handlerquery = ComponentsData1.example.header_handle[0]

                                            userService.get_URL_headerhandel(header_handlerquery, (err, result) => {
                                                if (err) {
                                                    console.log(err);

                                                } else {
                                                    head_media_url111 = result[0];
                                                    head_media_url221 = result;
                                                    // console.log("head_media_url111",head_media_url221);
                                                    if (head_media_url221.length > 0) {

                                                        if (head_media_url111.mime_type === "video/mp4") {


                                                            head_media_url1 = head_media_url111.url
                                                            sample_content.header_content = null;
                                                            sample_content.dynamic_url = null;
                                                            head_temptype = 1;
                                                            head_mediatype = "6";
                                                            head_mediatypec = "2";
                                                            button_option_string = null;

                                                            components[1].cards[i].components.push({
                                                                type: ComponentsData1.type,
                                                                format: ComponentsData1.format,
                                                                example: ComponentsData1.example
                                                            });
                                                            carousel_payload.push({
                                                                "media_type": head_mediatypec,
                                                                "media_url": head_media_url1,
                                                                "body": body_message,
                                                                "body_sample_content": bodyplaceholdersS1,
                                                                "buttons": { visit_website, quick_reply }


                                                            });
                                                            // console.log(carousel_payload, "carousel_payloadcarousel_payloadcarousel_payload");
                                                            objData = {
                                                                access_token,
                                                                name,
                                                                language,
                                                                category,
                                                                allow_category_change,
                                                                components: components
                                                            };
                                                            let videodata = {
                                                                wabaid,
                                                                userid,
                                                                head_media_url,
                                                                head_media_filename,
                                                                head_temptype,
                                                                head_mediatype,
                                                                body_message,
                                                                body_message1,
                                                                button_option,
                                                                head_text_title,
                                                                footer_text,
                                                                button_option,
                                                                request_to_admin,
                                                                sample_content,
                                                                placeholder_template_type,
                                                                name,
                                                                language,
                                                                category,
                                                                button_option_string,
                                                                status,
                                                                bodyplaceholders,
                                                                urlplaceholder,
                                                                headerplaceholder,
                                                                is_email_sent,
                                                                marketing_opt_out,
                                                                marketing_consent
                                                            };
                                                            if (i == ComponentsData[carouselindex].cards.length - 1) {
                                                                callback(null, objData, videodata);
                                                            }
                                                        }
                                                        else {
                                                            // console.log("outside image simple temp check");
                                                            res.send({
                                                                code: "WA100",
                                                                status: 'Failed',
                                                                message: 'Correct Header Handle is Required Video for card ' + i,

                                                            });
                                                        }
                                                    } else {
                                                        res.send({
                                                            code: "WA100",
                                                            status: 'failed',
                                                            message: 'Proper hearder handler required',

                                                        });
                                                    }
                                                }
                                            });
                                        } else {
                                            res.send({
                                                code: "WA100",
                                                status: 'Failed',
                                                message: 'Header Handle is Required for Video carousel',
                                            });
                                        }
                                    } else {
                                        res.send({
                                            code: "WA100",
                                            status: 'Failed',
                                            message: 'Example is Required for Header Video carousel',
                                        });
                                    }
                                }
                            }
                        }
                    }
                    // }
                    if (ComponentsData.findIndex(x => x.type.toLowerCase() === "limited_time_offer") > -1) {
                        // console.log("inside limited_time_offer");
                        let LTOindex = ComponentsData.findIndex(x => x.type.toLowerCase() === "limited_time_offer"); //lto template
                        components.push({
                            type: "limited_time_offer",
                            // type: ComponentsData[LTOindex].type,
                            limited_time_offer: ComponentsData[LTOindex].limited_time_offer,
                        });
                    }
                    if (ComponentsData.findIndex(x => x.type.toLowerCase() === "buttons") > -1) {

                        let buttonindex = ComponentsData.findIndex(x => x.type.toLowerCase() === "buttons");
                        // console.log("buttonindex=============== ", buttonindex);
                        let urldata = ComponentsData[buttonindex].buttons;
                        let button_type = ComponentsData[buttonindex].type;
                        components.push({
                            type: 'BUTTONS',
                            // type: button_type,
                            buttons: urldata
                        });
                        for (let i = 0; i < urldata.length; i++) {
                            // console.log(urldata[i]);
                            if (urldata[i].type.toLowerCase() === "quick_reply") {
                                let tmpButtonBody = {
                                    "quick_reply": urldata[i].text
                                };
                                button_option_string.push(tmpButtonBody);
                            }
                            if (urldata[i].type.toLowerCase() === "url") {
                                urlplaceholder = urldata[i].example != undefined ? urldata[i].example[0] : null;
                                sample_content.dynamic_url = urldata[i].example != null ? urldata[i].example : null;
                                if (urlplaceholder != null && urlplaceholder.length > 0) {
                                    button_option_string.push({
                                        "visit_website": {
                                            "web_button_text": urldata[i].text,
                                            "web_url_option": "1",
                                            "web_url": urldata[i].url
                                        }
                                    });
                                } else {
                                    button_option_string.push({
                                        "visit_website": {
                                            "web_button_text": urldata[i].text,
                                            "web_url_option": "0",
                                            "web_url": urldata[i].url
                                        }
                                    });
                                }
                            }
                            if (urldata[i].type.toLowerCase() === "phone_number") {
                                button_option_string.push({
                                    "call_phone": {
                                        "phone_button_text": urldata[i].text,
                                        "phone_number": urldata[i].phone_number
                                    }
                                });
                            }
                            if (urldata[i].type.toLowerCase() === "copy_code") {
                                button_option = 0;
                                insideurlindex1 = urldata.findIndex(x => x.type.toLowerCase() === "copy_code");
                                button_option_string.push({
                                    "copy_offer_code": {
                                        "offer_button_text": "Copy_code",
                                        "offer_code": urldata[i].example,
                                    }
                                });
                            }
                            if (urldata[i].type.toLowerCase() === "mpm") {

                                type_of_marketing = 2;
                                marketing_template_format = 2;

                                button_option = 0;
                                insideurlindex2 = urldata.findIndex(x => x.type.toLowerCase() === "mpm");
                                button_option_string.push({
                                    "launch_catalogue": {
                                        "catalogue_button_text": "View items",
                                        "catalogue_name": ""
                                    }
                                    // "type": urldata[insideurlindex2].type,
                                    // "text": urldata[insideurlindex2].text,
                                });
                            }
                            if (urldata[i].type.toLowerCase() === "catalog") {

                                type_of_marketing = 2;
                                marketing_template_format = 1;

                                button_option = 0;
                                insideurlindexcatalog = urldata.findIndex(x => x.type.toLowerCase() === "catalog");
                                button_option_string.push({
                                    "launch_catalogue": {
                                        "catalogue_button_text": "View catalog",
                                        "catalogue_name": ""
                                    }
                                    // "type": urldata[insideurlindex2].type,
                                    // "text": urldata[insideurlindex2].text,
                                });
                            }
                            if (urldata[i].type.toLowerCase() === "flow") {
                                // console.log("flows==================================+++++++++++++++===========");
                                insideurlindexflow = urldata.findIndex(x => x.type.toLowerCase() === "flow");
                                flowid1 = urldata[insideurlindexflow].flow_id;
                                // components.push({
                                //     type: 'BUTTONS',
                                //     buttons: urldata[insideurlindexflow]
                                // });
                                let tmpButtonBody = {
                                    type: 'BUTTONS',
                                    buttons: urldata[insideurlindexflow]
                                };
                                button_option_string.push(tmpButtonBody);
                                // console.log(flowid1);
                            }
                        }
                    }
                    if (ComponentsData.findIndex(x => x.type.toLowerCase() === "header") > -1) {

                        let headerindex = ComponentsData.findIndex(x => x.type.toLowerCase() === "header");

                        if (ComponentsData[headerindex].format != undefined) {


                            ComponentsData1 = ComponentsData[headerindex].format
                            let hasImage = (ComponentsData1.toLowerCase() === "image");
                            let hasText = (ComponentsData1.toLowerCase() === "text");
                            let hasVideo = (ComponentsData1.toLowerCase() === "video");
                            let hasDocument = (ComponentsData1.toLowerCase() === "document");
                            let hasLocation = (ComponentsData1.toLowerCase() === "location");

                            if (hasImage) {

                                if (ComponentsData[headerindex].example != undefined) {
                                    if (ComponentsData[headerindex].example.header_handle != undefined) {
                                        header_handlerquery = ComponentsData[headerindex].example.header_handle[0];
                                        // header_handlerquery = console.log(header_handlerquery, "header_handlerquery");
                                        userService.get_URL_headerhandel(header_handlerquery, (err, result) => {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                head_media_url111 = result[0];
                                                head_media_url221 = result;
                                                if (head_media_url221.length > 0) {
                                                    if (head_media_url111.mime_type === "image/jpeg" || head_media_url111.mime_type === "image/jpg" || head_media_url111.mime_type === "image/png") {

                                                        head_media_url = head_media_url111.url

                                                        sample_content.header_content = null;
                                                        head_temptype = 1;
                                                        head_mediatype = 1;
                                                        {
                                                            headerew = ComponentsData[headerindex].example
                                                            components.push({
                                                                type: ComponentsData[headerindex].type,
                                                                format: ComponentsData[headerindex].format,
                                                                example:
                                                                    headerew
                                                            });

                                                            objData = {
                                                                access_token,
                                                                name,
                                                                language,
                                                                category,
                                                                allow_category_change,
                                                                components: components

                                                            };

                                                            let imagedata = {
                                                                wabaid,
                                                                userid,
                                                                head_media_url,
                                                                head_media_filename,
                                                                head_temptype,
                                                                head_mediatype,
                                                                body_message,
                                                                button_option,
                                                                head_text_title,
                                                                footer_text,
                                                                button_option,
                                                                request_to_admin,
                                                                sample_content,
                                                                placeholder_template_type,
                                                                name,
                                                                language,
                                                                category,
                                                                button_option_string,
                                                                status,
                                                                bodyplaceholders,
                                                                urlplaceholder,
                                                                headerplaceholder,
                                                                is_email_sent,
                                                                marketing_opt_out,
                                                                marketing_consent

                                                            };
                                                            callback(null, objData, imagedata);
                                                        }
                                                    }
                                                    else {
                                                        // console.log("outside image simple temp check");
                                                        res.send({
                                                            code: "WA100",
                                                            status: 'Failed',
                                                            message: 'Correct Header Handle is Required for image',

                                                        });
                                                    }

                                                } else {
                                                    res.send({
                                                        code: "WA100",
                                                        status: 'failed',
                                                        message: 'Proper hearder handler required',

                                                    });
                                                }
                                            }
                                        });
                                    } else {
                                        res.send({
                                            code: "WA100",
                                            status: 'Failed',
                                            message: 'Header Handle is Required for Image',
                                        });
                                    }
                                } else {
                                    res.send({
                                        code: "WA100",
                                        status: 'Failed',
                                        message: 'Example is Required for Header Image',
                                    });
                                }
                                // if (ComponentsData[headerindex].example != undefined) {
                                //     if (ComponentsData[headerindex].example.header_handle != undefined) {   } else {
                                //         res.send({
                                //             code: "WA100",
                                //             status: 'Failed',
                                //             message: 'Header Handle is Required for Image',
                                //         });
                                //     }
                                // } else {
                                //     res.send({
                                //         code: "WA100",
                                //         status: 'Failed',
                                //         message: 'Example is Required for Header Image',
                                //     });
                                // }
                            }
                            else if (hasVideo) {
                                if (ComponentsData[headerindex].example != undefined) {
                                    if (ComponentsData[headerindex].example.header_handle != undefined) {
                                        header_handlerquery = ComponentsData[headerindex].example.header_handle[0];
                                        userService.get_URL_headerhandel(header_handlerquery, (err, result) => {
                                            if (err) {
                                                console.log(err);

                                            } else {




                                                head_media_url111 = result[0];
                                                head_media_url221 = result;
                                                // console.log("head_media_url111",head_media_url221);
                                                if (head_media_url221.length > 0) {
                                                    if (head_media_url111.mime_type === "video/mp4") {


                                                        head_media_url = head_media_url111.url

                                                        sample_content.header_content = null;
                                                        head_temptype = 1;
                                                        head_mediatype = 2;
                                                        headerew = ComponentsData[headerindex].example

                                                        components.push({
                                                            type: ComponentsData[headerindex].type,
                                                            format: ComponentsData[headerindex].format,
                                                            example:
                                                                headerew

                                                        });

                                                        objData = {
                                                            access_token,
                                                            name,
                                                            language,
                                                            category,
                                                            allow_category_change,
                                                            components: JSON.stringify(components)

                                                        };

                                                        let videodata = {
                                                            wabaid,
                                                            userid,
                                                            head_media_url,
                                                            head_media_filename,
                                                            head_temptype,
                                                            head_mediatype,
                                                            body_message,
                                                            button_option,
                                                            head_text_title,
                                                            footer_text,
                                                            button_option,
                                                            request_to_admin,
                                                            sample_content,
                                                            placeholder_template_type,
                                                            name,
                                                            language,
                                                            category,
                                                            button_option_string,
                                                            status,
                                                            bodyplaceholders,
                                                            urlplaceholder,
                                                            headerplaceholder,
                                                            is_email_sent,
                                                            marketing_opt_out,
                                                            marketing_consent
                                                        };

                                                        callback(null, objData, videodata);
                                                    }
                                                    else {
                                                        // console.log("outside image simple temp check");
                                                        res.send({
                                                            code: "WA100",
                                                            status: 'Failed',
                                                            message: 'Correct Header Handle is Required for video',

                                                        });
                                                    }

                                                } else {
                                                    res.send({
                                                        code: "WA100",
                                                        status: 'failed',
                                                        message: 'Proper hearder handler required',

                                                    });
                                                }
                                            }
                                        });
                                    } else {
                                        res.send({
                                            code: "WA100",
                                            status: 'Failed',
                                            message: 'Header Handle is Required for Video',
                                        });
                                    }
                                } else {
                                    res.send({
                                        code: "WA100",
                                        status: 'Failed',
                                        message: 'Example is Required for Header Video',
                                    });
                                }

                            }
                            else if (hasDocument) {
                                if (ComponentsData[headerindex].example != undefined) {
                                    if (ComponentsData[headerindex].example.header_handle != undefined) {
                                        header_handlerquery = ComponentsData[headerindex].example.header_handle[0];

                                        userService.get_URL_headerhandel(header_handlerquery, (err, result) => {
                                            if (err) {
                                                console.log(err);

                                            } else {
                                                head_media_url111 = result[0];
                                                head_media_url221 = result;
                                                // console.log("head_media_url111",head_media_url221);
                                                if (head_media_url221.length > 0) {

                                                    head_media_url = head_media_url111.url

                                                    sample_content.header_content = null;
                                                    head_temptype = 1;
                                                    head_mediatype = 0;
                                                    headerew = ComponentsData[headerindex].example

                                                    components.push({
                                                        type: ComponentsData[headerindex].type,
                                                        format: ComponentsData[headerindex].format,
                                                        example: headerew
                                                    });

                                                    objData = {
                                                        access_token,
                                                        name,
                                                        language,
                                                        category,
                                                        allow_category_change,
                                                        components: JSON.stringify(components)
                                                    };

                                                    let documentdata = {
                                                        wabaid,
                                                        userid,
                                                        head_media_url,
                                                        head_media_filename,
                                                        head_temptype,
                                                        head_mediatype,
                                                        body_message,
                                                        button_option,
                                                        head_text_title,
                                                        footer_text,
                                                        button_option,
                                                        request_to_admin,
                                                        sample_content,
                                                        placeholder_template_type,
                                                        name,
                                                        language,
                                                        category,
                                                        button_option_string,
                                                        status,
                                                        bodyplaceholders,
                                                        urlplaceholder,
                                                        headerplaceholder,
                                                        is_email_sent,
                                                        marketing_opt_out,
                                                        marketing_consent
                                                    };
                                                    callback(null, objData, documentdata);
                                                    // }
                                                } else {
                                                    res.send({
                                                        code: "WA100",
                                                        status: 'failed',
                                                        message: 'Proper hearder handler required',

                                                    });
                                                }
                                            }
                                        });
                                    } else {
                                        res.send({
                                            code: "WA100",
                                            status: 'Failed',
                                            message: 'Header Handle is Required for Document',
                                        });
                                    }
                                } else {
                                    res.send({
                                        code: "WA100",
                                        status: 'Failed',
                                        message: 'Example is Required for Header Document',
                                    });
                                }

                            }
                            else if (hasLocation) {
                                // console.log("inside location");
                                head_temptype = 1;
                                head_mediatype = 5;
                                components.push({
                                    type: 'HEADER',
                                    format: 'LOCATION',
                                });

                                objData = {
                                    access_token,
                                    name,
                                    language,
                                    category,
                                    allow_category_change,
                                    components: JSON.stringify(components)

                                };

                                let locationdata = {
                                    wabaid,
                                    userid,
                                    head_media_url,
                                    head_media_filename,
                                    head_temptype,
                                    head_mediatype,
                                    body_message,
                                    button_option,
                                    head_text_title,
                                    footer_text,
                                    button_option,
                                    request_to_admin,
                                    sample_content,
                                    placeholder_template_type,
                                    name,
                                    language,
                                    category,
                                    button_option_string,
                                    status,
                                    bodyplaceholders,
                                    urlplaceholder,
                                    headerplaceholder,
                                    is_email_sent,
                                    marketing_opt_out,
                                    marketing_consent
                                };
                                callback(null, objData, locationdata);
                            }
                            else if (hasText) {
                                // console.log("inside else part");
                                head_temptype = 0;
                                headerplaceholder = ComponentsData[headerindex].example != undefined ? ComponentsData[headerindex].example.header_text : null;
                                sample_content.header_content = ComponentsData[headerindex].example != null ? ComponentsData[headerindex].example.header_text : null;
                                // console.log(ComponentsData[headerindex],"++++++++++++++++++++++++++++++++++++++++++++++++");
                                // console.log    (ComponentsData[headerindex].text,)
                                // console.log( ComponentsData[headerindex].example,)

                                components.push({
                                    type: 'HEADER',
                                    format: ComponentsData[headerindex].format,
                                    text: ComponentsData[headerindex].text,
                                    example: ComponentsData[headerindex].example
                                });

                                objData = {
                                    access_token,
                                    name,
                                    language,
                                    category,
                                    allow_category_change,
                                    components: components

                                };

                                head_text_title = ComponentsData[headerindex].text;
                                let textdata = {
                                    wabaid,
                                    userid,
                                    head_media_url,
                                    head_media_filename,
                                    head_temptype,
                                    head_mediatype,
                                    body_message,
                                    button_option,
                                    head_text_title,
                                    footer_text,
                                    button_option,
                                    request_to_admin,
                                    sample_content,
                                    name,
                                    language,
                                    category,
                                    placeholder_template_type,
                                    button_option_string,
                                    status,
                                    bodyplaceholders,
                                    urlplaceholder,
                                    headerplaceholder,
                                    is_email_sent,
                                    marketing_opt_out,
                                    marketing_consent
                                };
                                callback(null, objData, textdata);
                            }
                        } else {
                            res.send({
                                code: "WA100",
                                status: 'Failed',
                                message: 'Format is Required for Header',
                            });
                        }
                    }
                    if (ComponentsData.findIndex(x => x.type.toLowerCase() === "header") === -1 && ComponentsData.findIndex(x => x.type.toLowerCase() === "carousel") === -1) {
                        // console.log("inside else part2");
                        objData = {
                            access_token,
                            name,
                            language,
                            category,
                            allow_category_change,
                            components: components

                        };
                        head_temptype = null;
                        let textdata = {
                            wabaid,
                            userid,
                            head_media_url,
                            head_media_filename,
                            head_temptype,
                            head_mediatype,
                            body_message,
                            button_option,
                            head_text_title,
                            footer_text,
                            button_option,
                            request_to_admin,
                            sample_content,
                            placeholder_template_type,
                            name,
                            language,
                            category,
                            button_option_string,
                            status,
                            bodyplaceholders,
                            urlplaceholder,
                            headerplaceholder,
                            is_email_sent,
                            marketing_opt_out,
                            marketing_consent
                        };

                        callback(null, objData, textdata);
                    }

                } else {
                    callback('Empty object is not allowed inside Components');
                }

            }
            else {
                res.send({
                    code: 'WA007',
                    status: 'FAILED',
                    message: 'Components are required',
                    data: {}
                });
            }

        };
        let createtemplate = function (objData, data, callback) {
            wabaid = data.wabaid;
            // console.log({data})
            whatsappService.messageTemplate(objData, wabaid, (err, result) => {
                if (err) {
                    console.log({ err });
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


                    if (data.bodyplaceholders != null && data.urlplaceholder == null && data.headerplaceholder == null) {
                        data.placeholder_template_type = 3;
                    } else if (data.bodyplaceholders != null && data.urlplaceholder != null && data.headerplaceholder != null) {
                        data.placeholder_template_type = 1;
                    } else if (data.bodyplaceholders != null && data.urlplaceholder == null && data.headerplaceholder != null) {
                        data.placeholder_template_type = 2;
                    } else if (data.bodyplaceholders != null && data.urlplaceholder != null && data.headerplaceholder == null) {
                        data.placeholder_template_type = 4;
                    } else if (data.bodyplaceholders == null && data.urlplaceholder != null && data.headerplaceholder == null) {
                        data.placeholder_template_type = 4;
                    } else if (data.bodyplaceholders == null && data.urlplaceholder == null && data.headerplaceholder != null) {
                        data.placeholder_template_type = 2;
                    } else if (data.bodyplaceholders == null && data.urlplaceholder == null && data.headerplaceholder == null) {
                        data.placeholder_template_type = 0;
                    } else if (data.bodyplaceholders == null && data.urlplaceholder != null && data.headerplaceholder != null) {
                        data.placeholder_template_type = 1;
                    }

                    if (data.sample_content.body_content == undefined) {
                        data.sample_content.body_content = null;
                    }
                    if (data.sample_content.header_content == undefined) {
                        data.sample_content.header_content = null;
                    }
                    if (data.sample_content.dynamic_url == undefined) {
                        data.sample_content.dynamic_url = null;
                    }

                    console.log({
                        sample_content
                    });

                    // write that for loop here
                    for (obj in data) {
                        if (data[obj] == undefined) {
                            data[obj] = null;
                        }
                    };

                    userService.insertTemplateDetailsV2(result, data, flowid1, carousel_payload, category_change, type_of_marketing, marketing_template_format, head_media_url, (err, insertTemplateresult) => {
                        if (err) {
                            console.log(err);
                        } else {
                            // console.log(result);
                            console.log("inserted data", insertTemplateresult);

                        }
                    });
                    callback(null, result);
                }

            });
        };
        async.waterfall([getusers, getwabaid, getusersetting, createpayload, createtemplate], function (err, result) {

            if (err) {
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : err
                });
            } else {
                let status = 0;
                let eventstatus = result.status;
                if (eventstatus.toLowerCase() === "REJECTED".toLowerCase()) {
                    console.log(eventstatus);
                    status = 2;
                }
                else if (eventstatus.toLowerCase() === "APPROVED".toLowerCase()) {
                    status = 1;
                }
                else if (eventstatus.toLowerCase() === "FLAGGED".toLowerCase()) {
                    status = 5;
                }
                else if (eventstatus.toLowerCase() === "BAD REQUEST".toLowerCase()) {
                    status = 3;
                }
                else if (eventstatus.toLowerCase() === "INVALID REQUEST".toLowerCase()) {
                    status = 4;
                }
                else if (eventstatus.toLowerCase() === "IN REVIEW".toLowerCase()) {
                    status = 6;
                }
                else if (eventstatus.toLowerCase() === "ACTIVE - QUALITY PENDING".toLowerCase()) {
                    status = 7;
                }
                else if (eventstatus.toLowerCase() === "ACTIVE - HIGH QUALITY".toLowerCase()) {
                    status = 8;
                }
                else if (eventstatus.toLowerCase() === "ACTIVE - MEDIUM QUALITY".toLowerCase()) {
                    status = 9;
                }
                else if (eventstatus.toLowerCase() === "ACTIVE - LOW QUALITY".toLowerCase()) {
                    status = 10;
                }
                else if (eventstatus.toLowerCase() === "PAUSED".toLowerCase()) {
                    status = 11;
                }
                else if (eventstatus.toLowerCase() === "DISABLED".toLowerCase()) {
                    status = 12;
                }
                else if (eventstatus.toLowerCase() === "APPEAL REQUESTED".toLowerCase()) {
                    status = 13;
                }

                userService.updateWabaApprovalResponseId(status, result.id, (err, updateWabaApprovalResponseId) => {


                    if (err) {
                        console.log("err1 ---> ", err);
                    } else {
                        console.log("updated template status data", updateWabaApprovalResponseId);
                        res.send({
                            code: 200,
                            status: 'SUCCESS',
                            message: 'Template Generated Successfully',
                            data: result
                        });
                    }
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