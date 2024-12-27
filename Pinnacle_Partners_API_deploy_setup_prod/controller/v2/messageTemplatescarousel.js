const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const fs = require('fs');
const async = require('async');

var appLoggers = require('../../applogger.js');
var mime = require('mime-types');
const {
    Console
} = require('console');
const AWS = require('aws-sdk');
const path = require('path');
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
module.exports = (req, res) => {
    try {
        let bodyplaceholdersS1;
        let objData = null;
        let components = [];
        let carousel_payload = [];
        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let name = req.body.name;
        let language = req.body.language;
        let category = req.body.category;
        let ComponentsData = req.body.components != undefined ? JSON.parse(req.body.components) : null;
        let filepath = req.files.media != undefined ? req.files.media[0].path : null;
        let head_temptype = null;
        let tempid;
        let botid;
        let head_text_title = null;
        let head_mediatype = null;
        let head_media_url = null;
        let head_media_filename = null;
        let body_message;
        let body_messageM;
        let bodyplaceholdersM = null;
        let body_message1;
        let bodyplaceholdersS;
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
        let marketing_opt_out = 0;
        let marketing_consent = 0;
        let quick_reply = carousel_payload.button;
        let visit_website = carousel_payload.button;

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
        let getusers = function (callback) {
            userService.getUserId(apikeys, wanumber, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    userid = result[0].userid;
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
                if (ComponentsData.findIndex(x => x.type === "BODY") > -1) {
                    let bodyindex = ComponentsData.findIndex(x => x.type === "BODY");
                    body_message = ComponentsData[bodyindex].text;
                    body_messageM = ComponentsData[bodyindex].text;
                    bodyplaceholders = ComponentsData[bodyindex].example != undefined ? ComponentsData[bodyindex].example.body_text[0] : null;
                    sample_content.body_content = bodyplaceholders;
                    if (body_message.match(/\{\w+\}/g) != null) {
                        bodyplaceholders = body_messageM.match(/\{\w+\}/g).map(s => s.slice(1, -1));
                        bodyplaceholders = bodyplaceholders.map(Number).filter((value, index, self) => self.indexOf(value) === index).toString();
                    }

                    components.push({
                        type: 'BODY',
                        text: ComponentsData[bodyindex].text,
                        example: ComponentsData[bodyindex].example
                    });
                }
                if (ComponentsData[1].type == "CAROUSEL") {
                    components.push({
                        "type": "CAROUSEL",
                        "cards": []
                    });
                    uploadTemplateMedia(filepath, access_token, (err, fileHandleResult) => {
                        if (err) {
                            console.log(err);
                            callback(err);
                        }
                        else {
                            head_media_url = fileHandleResult.head_media_url;
                            head_media_filename = head_media_url.substring(head_media_url.lastIndexOf('/') + 1);
                            let temp_h = fileHandleResult.h;
                            for (let i = 0; i < ComponentsData[1].cards.length; i++) {
                                if (ComponentsData[1].cards[i].components[1].type == "BODY") {
                                    body_message = ComponentsData[1].cards[i].components[1].text;
                                    body_message1 = ComponentsData[1].cards[i].components[1].example;
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
                                if (ComponentsData[1].cards[i].components[2].type == 'BUTTONS') {
                                    let ComponentsData1 = ComponentsData[1].cards[i].components[2];
                                    let urldata = ComponentsData1.buttons;
                                    components[1].cards[i].components.push({
                                        type: 'BUTTONS',
                                        buttons: urldata
                                    });
                                    if (urldata.findIndex(x => x.type === "QUICK_REPLY") > -1) {
                                        quick_reply = {
                                            "button_text": urldata[0].text
                                        };
                                    }
                                    if (urldata.findIndex(x => x.type === "URL") > -1) {
                                        urlindex = urldata.findIndex(x => x.type === "URL");
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

                                }

                                if (ComponentsData[1].cards[i].components[0].type == 'HEADER') {
                                    let ComponentsData1 = ComponentsData[1].cards[i].components[0];
                                    let headerindex = (ComponentsData1.type === "HEADER");
                                    let hasHeader = (ComponentsData1.format === "HEADER");
                                    let hasImage = (ComponentsData1.format === "IMAGE");
                                    let hasVideo = (ComponentsData1.format === "VIDEO");

                                    if (hasImage) {
                                        sample_content.header_content = null;
                                        head_temptype = 1;
                                        head_mediatype = "1";
                                        if (err) {
                                            console.log(err);
                                            callback(err);
                                        }
                                        else {
                                            components[1].cards[i].components.push({
                                                type: ComponentsData1.type,
                                                format: ComponentsData1.format,
                                                example: {
                                                    header_handle: [temp_h]
                                                }
                                            });

                                            carousel_payload.push({
                                                "media_type": head_mediatype,
                                                "media_url": head_media_url,
                                                "body": body_message,
                                                "body_sample_content": bodyplaceholdersS1,
                                                "buttons": { visit_website, quick_reply }


                                            });
                                            objData = {
                                                access_token,
                                                name,
                                                language,
                                                category,
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
                                            if (i == ComponentsData[1].cards.length - 1) {
                                                callback(null, objData, imagedata, carousel_payload);
                                            }
                                        }
                                    }
                                    else if (hasVideo) {
                                        sample_content.header_content = null;
                                        head_temptype = 1;
                                        head_mediatype = "2";
                                        if (err) {
                                            console.log(err);
                                            callback(err);
                                        }
                                        else {
                                            components[1].cards[i].components.push({
                                                type: ComponentsData1.type,
                                                format: ComponentsData1.format,
                                                example: {
                                                    header_handle: [temp_h]
                                                }
                                            });

                                            carousel_payload.push({
                                                "media_type": head_mediatype,
                                                "media_url": head_media_url,
                                                "body": body_message,
                                                "body_sample_content": bodyplaceholdersS1,
                                                "buttons": { visit_website, quick_reply }


                                            });
                                            objData = {
                                                access_token,
                                                name,
                                                language,
                                                category,
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
                                            if (i == ComponentsData[1].cards.length - 1) {
                                                callback(null, objData, videodata, carousel_payload);
                                            }
                                        }
                                    }
                                    else {
                                        head_temptype = "0";
                                        headerplaceholder = ComponentsData[headerindex].example != undefined ? ComponentsData[headerindex].example.header_text : null;
                                        sample_content.header_content = ComponentsData[headerindex].example != null ? ComponentsData[headerindex].example.header_text : null;
                                        components.push({
                                            type: 'HEADER',
                                            format: ComponentsData[headerindex].format,
                                            text: ComponentsData[headerindex].text,
                                            example: ComponentsData[headerindex].example
                                        });
                                        carousel_payload.push({
                                            "media_type": head_mediatype,
                                            "media_url": head_media_url,
                                            "body": body_message,
                                            "body_sample_content": bodyplaceholdersS,
                                            "buttons": { visit_website, quick_reply }
                                        });

                                        objData = {
                                            access_token,
                                            name,
                                            language,
                                            category,
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
                                            body_message1,
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
                                            bodyplaceholder,
                                            urlplaceholder,
                                            headerplaceholder,
                                            is_email_sent,
                                            marketing_opt_out,
                                            marketing_consent
                                        };

                                        if (i == ComponentsData[1].cards.length - 1) {
                                            callback(null, objData, textdata, carousel_payload);
                                        }
                                    }
                                }
                                else {
                                    objData = {
                                        access_token,
                                        name,
                                        language,
                                        category,
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
                                    if (i == ComponentsData[1].cards.length - 1) {
                                        callback(null, objData, textdata, carousel_payload);
                                    }
                                }
                            }
                        }
                    });
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
        let createtemplate = function (objData, data, carousel_payload, callback) {
            wabaid = data.wabaid;
            whatsappService.messageCarouselTemplate(objData, wabaid, (err, result) => {
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
                    if (data.sample_content.dynamic_url != undefined) {
                        data.sample_content.dynamic_url = null;
                    }
                    for (obj in data) {
                        if (data[obj] == undefined) {
                            data[obj] = null;
                        }
                    };



                    userService.insertTemplateDetailscarousel1(result, data, carousel_payload, body_messageM, bodyplaceholders, (err, insertTemplateresult) => {
                        if (err) {
                            console.log(err);
                            callback(err);
                        } else {
                            console.log("inserted data", insertTemplateresult);
                            callback(null, result);
                        }
                    });
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
                console.log(eventstatus);
                if (eventstatus.toLowerCase() === "REJECTED".toLowerCase()) {
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
let uploadTemplateMedia = (filepath, access_token, next) => {
    if (filepath != null) {
        async.waterfall([
            (done) => {
                let stats = fs.statSync(filepath);
                let FileLength = stats.size;
                let FileType = (mime.lookup(filepath));
                whatsappService.uploadMedia(FileLength, FileType, access_token, (err, result) => {
                    if (err) {
                        done(err);
                    } else {
                        done(null, result.id, FileType, filepath);
                    }
                });
            },
            (id, FileType, filepath, done) => {
                fs.readFile(filepath, function (err, data) {
                    if (err) {
                        throw err;
                    }
                    done(null, id, FileType, data);
                });
            },
            (id, FileType, filedata, done) => {
                whatsappService.uploads(id, access_token, filedata, FileType, (err, result) => {
                    if (err) {
                        // console.log(err);
                        done(err);
                    } else {
                        done(null, result.h, filepath);
                    }
                });
            },
            (h, filepath, done) => {

                const fileContent = fs.readFileSync(filepath);
                const params = {
                    Bucket: BUCKET_NAME,
                    Key: path.basename(filepath),
                    Body: fileContent
                };

                // Uploading files to the bucket
                s3.upload(params, function (err, data) {
                    if (err) {
                        return done(error);
                    } else {
                        fs.unlink(filepath, function (err) {
                            if (err) {
                                console.error(err);
                            }
                            let temp = {
                                h: h,
                                head_media_url: data.Location
                            };
                            done(null, temp);
                        });
                    }
                });


            }

        ], (err, result) => {
            if (err) {
                console.log(err);
                next(err);
            } else {
                next(null, result);
            }
        });
    } else {
        next('Please upload valid media file');
    }
};