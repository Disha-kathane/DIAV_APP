const whatsappService = require('../../services/v1/whatsapp');
const templateService = require('../../services/v1/template');
const userService = require('../../services/v1/users');
const config = require('../../config');
var appLoggers = require('../../applogger.js');
const axios = require('axios');
const fs = require('fs/promises');
const mimeTypes = require('mime-types');
const responseHelper = require('../../utils/responseHelper');
const { exit } = require('process');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {
        let data = [];

        //console.log('BODY================================>', JSON.stringify(req.body));
        //console.log("--------------------------------");

        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
        const apiKey = req.headers.apikey;
        const { userId, wabaId } = await userService.getUserId(apiKey);

        if (!userId) {
            return responseHelper(404, 'Correct API Key is required');
        }

        if (!(req.body.tempid && req.body.tempid.length)) {
            return responseHelper(404, 'tempid cannot be empty');
        }

        let dynamicURL;
        let headerValue;
        let body = [];
        let tmpHeader = {};
        let mediaType;
        let headerText;
        let dynamiChangedcURL;
        const tempIdList = req.body.tempid;
        const AccessToken = await templateService.getSystemAccessToken();
        const access_token = AccessToken[0].value;

        let tempListResponse = await templateService.getTemplateDetails(tempIdList, userId);
        const instanceUrl = config.graphFacebookUrl;

        //console.log("\n tempListResponse == " + JSON.stringify(tempListResponse));

        if (tempListResponse == undefined || tempListResponse == null) {
            return responseHelper(404, 'Tempid not found');
        }

        if (tempListResponse.sample_content != undefined || tempListResponse.sample_content != null) {
            let actulValue = tempListResponse.sample_content;
            var actulValueOBJ = JSON.parse(actulValue);


            if (actulValueOBJ != undefined || actulValueOBJ != null) {
                if (actulValueOBJ.header_content != undefined || actulValueOBJ.header_content != null) {
                    [headerValue] = actulValueOBJ.header_content;
                }

                if (actulValueOBJ.dynamic_url != undefined || actulValueOBJ.dynamic_url != null) {
                    [dynamicURL] = actulValueOBJ.dynamic_url;
                }
            }
        }


        if (tempListResponse.head_temptype == 0 && tempListResponse.head_text_title != null && tempListResponse.head_text_title != '') { // text
            tmpHeader.type = "HEADER";
            tmpHeader.format = "TEXT";
            tmpHeader.text = tempListResponse.head_text_title;

            if (tempListResponse.headerValue != undefined || tempListResponse.headerValue != "") {
                headerText = headerValue;
            } else {
                headerText = 'test';
            }

            if (tempListResponse.placeholder_template_type == 1 || tempListResponse.placeholder_template_type == 2) {
                tmpHeader.example = {
                    "header_text": [headerText]
                };
            }
            body.push(tmpHeader);

        }

        if (tempListResponse.head_temptype == 1) { // media
            let wafile, fileType, fileLength, fileBuffer;
            if (tempListResponse.head_media_filename != null && tempListResponse.head_media_filename.length > 0 && tempListResponse.head_media_filename != '') {
                wafile = await axios.get(`http://68.183.90.255/assets/watemplates/${userId}/${tempListResponse.head_media_filename}`, {
                    responseType: 'arraybuffer'
                });
                fileType = mimeTypes.lookup(`http://68.183.90.255/assets/watemplates/${userId}/${tempListResponse.head_media_filename}`);
                fileBuffer = wafile.data;
                fileLength = wafile.headers['content-length'];
                fileType = wafile.headers['content-type'];
            }


            if (tempListResponse.head_media_url != null && tempListResponse.head_media_url.length > 0 && tempListResponse.head_media_url != '') {
                wafile = await axios.get(tempListResponse.head_media_url, {
                    responseType: 'arraybuffer'
                });
                fileType = wafile.headers['content-type'];
                fileLength = wafile.headers['content-length'];
                fileBuffer = wafile.data;
            }

            const mediaToken = await whatsappService.getUploadTokenAndSignature(instanceUrl, access_token, fileLength, fileType);
            const uploadResonse = await whatsappService.whatsappMediaUpload(instanceUrl, access_token, mediaToken.id, fileBuffer);

            if (tempListResponse.head_mediatype == 0) {
                mediaType = 'DOCUMENT';
            } else if (tempListResponse.head_mediatype == '1') {
                mediaType = 'IMAGE';
            } else {
                mediaType = 'VIDEO';
            }

            tmpHeader.type = "HEADER";
            tmpHeader.format = mediaType;
            tmpHeader.example = {
                "header_handle": [uploadResonse.h]
            };
            body.push(tmpHeader);

        };

        var body_message = tempListResponse.body_message;

        let tmpBody = {
            "type": "BODY",
            "text": Buffer.from(body_message, 'utf-8').toString()
        };

        // if (tempListResponse.placeholders != null && tempListResponse.placeholders != '') {
        //     tmpBody.example = {
        //         "body_text": []
        //     };
        //     let placeholderArr = tempListResponse.placeholders.split(",");

        //     if (placeholderArr.length > 0) {
        //         let tmpBodyExample = [];


        //         for (let arr = 0; arr < placeholderArr.length; ++arr) {
        //             tmpBodyExample.push('test' + arr);
        //         }

        //         dynamiChangedcURL = tmpBodyExample;

        //         if (tempListResponse.body_message != undefined || tempListResponse.body_message != "") {

        //             dynamiChangedcURL = actulValueOBJ.body_content.toString();

        //         }

        //         tmpBody.example.body_text.push(dynamiChangedcURL);
        //     }
        // }

        if (tempListResponse.placeholders != null && tempListResponse.placeholders != '') {
            tmpBody.example = {
                "body_text": []
            };
            let placeholderArr = tempListResponse.placeholders.split(",");
            if (placeholderArr.length > 0) {
                let tmpBodyExample = [];
                for (let arr = 0; arr < placeholderArr.length; ++arr) {
                    tmpBodyExample.push('test' + arr);
                }
                tmpBody.example.body_text.push(tmpBodyExample);
            }
        }

        if (tempListResponse.footer_text != null && tempListResponse.footer_text.length > 0 && tempListResponse.footer_text != '') {
            let tmpFooter = {
                "type": "FOOTER",
                "text": tempListResponse.footer_text
            };
            body.push(tmpFooter);
        }

        body.push(tmpBody);
        //console.log("i m here");

        let FUrl;

        if (tempListResponse.button_option != null && tempListResponse.button_option != '') {
            let buttonOptionBody = {};
            if (tempListResponse.button_option_string.length > 0) {
                tempListResponse.button_option_string = JSON.parse(tempListResponse.button_option_string);

                if (tempListResponse.button_option == 0) {
                    buttonOptionBody.type = "BUTTONS";
                    buttonOptionBody.buttons = [];
                    for (let p = 0; p < tempListResponse.button_option_string.length; ++p) {
                        if (tempListResponse.button_option_string[p].call_phone != null &&
                            tempListResponse.button_option_string[p].call_phone != undefined) {
                            let tmpButtonBody = {
                                "type": "PHONE_NUMBER",
                                "text": tempListResponse.button_option_string[p].call_phone.phone_button_text,
                                "phone_number": tempListResponse.button_option_string[p].call_phone.phone_number
                            };
                            buttonOptionBody.buttons.push(tmpButtonBody);
                        }

                        if (tempListResponse.button_option_string[p].visit_website != null &&
                            tempListResponse.button_option_string[p].visit_website != undefined) {
                            if (tempListResponse.sample_content.dynamicURL != undefined || tempListResponse.sample_content.dynamicURL != "") {
                                FUrl = dynamicURL;
                            } else {
                                FUrl = 'test';
                            }

                            let tmpButtonBody = {
                                "type": "URL",
                                "text": tempListResponse.button_option_string[p].visit_website.web_button_text,
                                "url": tempListResponse.button_option_string[p].visit_website.web_url
                            };

                            if (tempListResponse.placeholder_template_type == 1 || tempListResponse.placeholder_template_type == 4) {
                                tmpButtonBody.example = [];
                                tmpButtonBody.example.push(FUrl);
                            }
                            buttonOptionBody.buttons.push(tmpButtonBody);
                        }
                    }
                }
                if (tempListResponse.button_option == 1) {
                    buttonOptionBody.type = "BUTTONS";
                    buttonOptionBody.buttons = [];
                    for (let k = 0; k < tempListResponse.button_option_string.length; ++k) {
                        let tmpButtonBody = {
                            "type": "QUICK_REPLY",
                            "text": tempListResponse.button_option_string[k].quick_reply
                        };
                        buttonOptionBody.buttons.push(tmpButtonBody);
                    }
                }

                body.push(buttonOptionBody);
            }
        }

        // console.log(JSON.stringify(body));
        // console.log(tempListResponse.temptitle, tempListResponse.category, tempListResponse.langcode, body, access_token, wabaId)
        const generateTempID = await whatsappService.messageTemplate(tempListResponse.temptitle, tempListResponse.category, tempListResponse.langcode, body, access_token, wabaId);
        await templateService.updateMsgResponseId(tempIdList, generateTempID.id);
        console.log(tempListResponse.temptitle, generateTempID.id);
        return responseHelper(200, 'The Template has been processed');
    } catch (error) {
        console.log('IN CATCH MessageTemplate=============>' + error);
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        let tempError = null;
        if (error != undefined && error.code != undefined && error.code == 'ECONNRESET') {
            tempError = '' + error;
            console.log('IN ECONNRESET : '+error.code);
        }
        else if (error.response.data.error.error_user_msg != undefined) {
            tempError = error.response.data.error.error_user_msg;
        }
        else if (error.response.data.error.message != undefined) {
            tempError = error.response.data.error.message;
        } else {
            tempError = error;
        }
        console.log(tempError);
        // return responseHelper(500, error.message.concat('. ', error.response.data.error.error_user_msg));
        return responseHelper(500, '' + tempError);
    }
};