const whatsappService = require('../../services/v1/whatsapp');
const templateService = require('../../services/v1/template')
const userService = require('../../services/v1/users');
const config = require('../../config');
var appLoggers = require('../../applogger.js');
const axios = require('axios');
// const fs = require('fs/promises');
const fs = require("fs").promises;
const mimeTypes = require('mime-types');
const responseHelper = require('../../utils/responseHelper');
var errorLogger = appLoggers.errorLogger;
module.exports = async (req, res) => {

    try {
        let data = [];
        console.log(req.body);
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

        const tempIdList = req.body.tempid;
        const AccessToken = await templateService.getSystemAccessToken();
        const access_token = AccessToken[0].value;
        const tempListResponse = await templateService.getTemplateDetails(tempIdList, userId);
        const instanceUrl = config.graphFacebookUrl;

        await Promise.all(tempListResponse.map(async (item, index) => {
            let body = [];
            let tmpHeader = {};
            let mediaType;

            try {
                if (item.head_temptype == 0 && item.head_text_title != null) { // text
                    tmpHeader.type = "HEADER";
                    tmpHeader.format = "TEXT";
                    tmpHeader.text = item.head_text_title;
                    if (item.placeholder_template_type == 1 || item.placeholder_template_type == 2) {
                        tmpHeader.example = {
                            "header_text": ['test']
                        };
                    }
                    body.push(tmpHeader);
                    console.log('tmpHeader: ' + JSON.stringify(tmpHeader));
                }
                if (item.head_temptype == 1) { // media
                    let wafile, fileType, fileLength, fileBuffer;
                    if (item.head_media_filename != null && item.head_media_filename.length > 0) {
                        wafile = await axios.get(`http://68.183.90.255/assets/watemplates/${userId}/${item.head_media_filename}`, {
                            responseType: 'arraybuffer'
                        });
                        fileType = mimeTypes.lookup(`http://68.183.90.255/assets/watemplates/${userId}/${item.head_media_filename}`);
                        fileBuffer = wafile.data;
                        fileLength = wafile.headers['content-length'];
                    }
                    if (item.head_media_url != null && item.head_media_url.length > 0) {
                        wafile = await axios.get(item.head_media_url, {
                            responseType: 'arraybuffer'
                        });
                        fileType = wafile.headers['content-type'];
                        fileLength = wafile.headers['content-length'];
                        fileBuffer = wafile.data;
                    }

                    const mediaToken = await whatsappService.getUploadTokenAndSignature(instanceUrl, access_token, fileLength, fileType);
                    const uploadResonse = await whatsappService.whatsappMediaUpload(instanceUrl, access_token, mediaToken.id, fileBuffer);
                    if (item.head_mediatype == 0) {
                        mediaType = 'DOCUMENT'
                    } else if (item.head_mediatype == '1') {
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
                    console.log('tmpHeader: ' + JSON.stringify(tmpHeader));
                };

                let tmpBody = {
                    "type": "BODY",
                    "text": Buffer.from(item.body_message, 'utf-8').toString()
                };

                if (item.placeholders != null) {
                    tmpBody.example = {
                        "body_text": []
                    };
                    let placeholderArr = item.placeholders.split(",");
                    if (placeholderArr.length > 0) {
                        let tmpBodyExample = [];
                        for (let arr = 0; arr < placeholderArr.length; ++arr) {
                            tmpBodyExample.push('test' + arr);
                        }
                        tmpBody.example.body_text.push(tmpBodyExample);
                    }
                }

                if (item.footer_text != null && item.footer_text.length > 0) {
                    let tmpFooter = {
                        "type": "FOOTER",
                        "text": item.footer_text
                    };
                    body.push(tmpFooter);
                }

                body.push(tmpBody);

                if (item.button_option != null) {
                    let buttonOptionBody = {};
                    if (item.button_option_string.length > 0) {
                        item.button_option_string = JSON.parse(item.button_option_string);

                        if (item.button_option == 0) {
                            buttonOptionBody.type = "BUTTONS";
                            buttonOptionBody.buttons = [];
                            for (let p = 0; p < item.button_option_string.length; ++p) {
                                if (item.button_option_string[p].call_phone != null &&
                                    item.button_option_string[p].call_phone != undefined) {
                                    let tmpButtonBody = {
                                        "type": "PHONE_NUMBER",
                                        "text": item.button_option_string[p].call_phone.phone_button_text,
                                        "phone_number": item.button_option_string[p].call_phone.phone_number
                                    };
                                    buttonOptionBody.buttons.push(tmpButtonBody);
                                }
                                if (item.button_option_string[p].visit_website != null &&
                                    item.button_option_string[p].visit_website != undefined) {
                                    let tmpButtonBody = {
                                        "type": "URL",
                                        "text": item.button_option_string[p].visit_website.web_button_text,
                                        "url": item.button_option_string[p].visit_website.web_url
                                    }

                                    if (item.placeholder_template_type == 1 || item.placeholder_template_type == 4) {
                                        tmpButtonBody.example = [];
                                        tmpButtonBody.example.push('test');
                                    }
                                    buttonOptionBody.buttons.push(tmpButtonBody);
                                }
                            }
                        }
                        if (item.button_option == 1) {
                            buttonOptionBody.type = "BUTTONS";
                            buttonOptionBody.buttons = [];
                            for (let k = 0; k < item.button_option_string.length; ++k) {
                                let tmpButtonBody = {
                                    "type": "QUICK_REPLY",
                                    "text": item.button_option_string[k].quick_reply
                                }
                                buttonOptionBody.buttons.push(tmpButtonBody);
                            }
                        }
                        body.push(buttonOptionBody);
                    }
                }

                let templateObj = {};
                const generateTempID = await whatsappService.messageTemplate(item.temptitle, item.category, item.langcode, body, access_token, wabaId);

                templateObj.templateid = item.tempid;
                templateObj.messageid = generateTempID.id;
                templateObj.temptitle = item.temptitle;

                await templateService.updateMsgResponseId(tempIdList[index], generateTempID.id);

                return;
            } catch (error) {
                console.log(error);
                // console.log(error.response.data.error.error_user_title);
                let templateObj = {};
                templateObj.templateid = item.tempid;
                templateObj.messageid = '';
                templateObj.temptitle = item.temptitle;
                // templateObj.status = error.response.data.error.error_user_title;
                templateObj.status = error.response;
                data.push(templateObj);
                setImmediate(async () => {
                    await templateService.updateMsgTemplateStatus(4, item.temptitle);
                })
                errorLogger.error(JSON.stringify(error));
                return;
            }
        }));
        return responseHelper(200, 'SUCCESS', 'All the Templates are processed', 'data');
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}