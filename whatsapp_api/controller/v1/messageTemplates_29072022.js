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
        //console.log('BODY',req.body);
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
        const apiKey = req.headers.apikey;
        const { userId, wabaId } = await userService.getUserId(apiKey);

        if (!userId) {
            return responseHelper(404, 'Correct API Key is required');
        }
        
       // console.log(req.body.tempid,'LENGTH', req.body.tempid.length);

        if (!(req.body.tempid && req.body.tempid.length)) {
            return responseHelper(404, 'tempid cannot be empty');
        }
        
        const tempIdList = req.body.tempid;

        const AccessToken = await templateService.getSystemAccessToken();
        const access_token = AccessToken[0].value;
        const tempListResponse = await templateService.getTemplateDetails(tempIdList, userId);
        const instanceUrl = config.graphFacebookUrl;
        let body = [];
        let tmpHeader = {};
        let mediaType;
        if (tempListResponse.head_temptype == 0 && tempListResponse.head_text_title != null && tempListResponse.head_text_title !='') { // text
            tmpHeader.type = "HEADER";
            tmpHeader.format = "TEXT";
            tmpHeader.text = tempListResponse.head_text_title;
            if (tempListResponse.placeholder_template_type == 1 || tempListResponse.placeholder_template_type == 2) {
                tmpHeader.example = {
                    "header_text": ['test']
                };
            }
            body.push(tmpHeader);
            //console.log('tmpHeader: ' + JSON.stringify(tmpHeader));
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
                mediaType = 'DOCUMENT'
            } else if (tempListResponse.head_mediatype == '1') {
                mediaType = 'IMAGE'
            } else {
                mediaType = 'VIDEO'
            }

            tmpHeader.type = "HEADER";
            tmpHeader.format = mediaType;
            tmpHeader.example = {
                "header_handle": [uploadResonse.h]
            }
            body.push(tmpHeader);
            //console.log('tmpHeader: ' + JSON.stringify(tmpHeader));
        };

        let tmpBody = {
            "type": "BODY",
            "text": Buffer.from(tempListResponse.body_message, 'utf-8').toString()
        };

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

       //console.log(body);

        if (tempListResponse.button_option != null && tempListResponse.button_option !='') {
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
                            let tmpButtonBody = {
                                "type": "URL",
                                "text": tempListResponse.button_option_string[p].visit_website.web_button_text,
                                "url": tempListResponse.button_option_string[p].visit_website.web_url
                            }

                            if (tempListResponse.placeholder_template_type == 1 || tempListResponse.placeholder_template_type == 4) {
                                tmpButtonBody.example = [];
                                tmpButtonBody.example.push('test');
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
                        }
                        buttonOptionBody.buttons.push(tmpButtonBody);
                    }
                }
                body.push(buttonOptionBody);
            }
        }

        //console.log("body", body);
        const generateTempID = await whatsappService.messageTemplate(tempListResponse.temptitle, tempListResponse.category, tempListResponse.langcode, body, access_token, wabaId);
        await templateService.updateMsgResponseId(tempIdList, generateTempID.id);
        console.log( tempListResponse.temptitle, generateTempID.id );
        return responseHelper(200, 'The Template has been processed');
    } catch (error) {
        console.log(error);
        console.log(error.response.data.error.message);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.response.data.error.message);
    }
}