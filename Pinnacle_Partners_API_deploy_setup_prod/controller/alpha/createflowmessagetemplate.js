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


//Create template api on whatsapp bussiness account
module.exports = (req, res) => {
    try {
        let objData = null;
        let components = [];
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
        let flowid1 = null;

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
            // console.log({getusers})
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
            // console.log({getusersetting})
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
                    bodyplaceholders = ComponentsData[bodyindex].example != undefined ? ComponentsData[bodyindex].example.body_text[0] : null;
                    sample_content.body_content = bodyplaceholders;
                    if (body_message.match(/\{\w+\}/g) != null) {
                        bodyplaceholders = body_message.match(/\{\w+\}/g).map(s => s.slice(1, -1));
                        bodyplaceholders = bodyplaceholders.map(Number).filter((value, index, self) => self.indexOf(value) === index).toString();
                    }

                    components.push({
                        type: 'BODY',
                        text: ComponentsData[bodyindex].text,
                        example: ComponentsData[bodyindex].example
                    });
                }

                if (ComponentsData.findIndex(x => x.type === "FOOTER") > -1) {
                    let footerindex = ComponentsData.findIndex(x => x.type === "FOOTER");
                    footer_text = ComponentsData[footerindex].text;
                    if (footer_text == 'Not interested? Tap Stop promotions') {
                        marketing_opt_out = 1;
                        marketing_consent = 1;
                    }
                    components.push({
                        type: 'FOOTER',
                        text: ComponentsData[footerindex].text
                    });

                }
                if (ComponentsData.findIndex(x => x.type === "BUTTONS") > -1) {
                    // button_option = 0;
                    let buttonindex = ComponentsData.findIndex(x => x.type === "BUTTONS");
                    let urldata = ComponentsData[buttonindex].buttons;
                    insideurlindex = urldata.findIndex(x => x.type === "FLOW");
                    flowid1 = urldata[insideurlindex].flow_id;
                    components.push({
                        type: 'BUTTONS',
                        buttons: urldata
                    });
                    let tmpButtonBody = {
                        type: 'BUTTONS',
                        buttons: urldata
                    };
                    button_option_string.push(tmpButtonBody);

                    if (urldata.findIndex(x => x.type === "QUICK_REPLY") > -1) {
                        button_option = 1;
                        for (let k = 0; k < urldata.length; ++k) {
                            let tmpButtonBody = {
                                "quick_reply": urldata[k].text
                            };
                            button_option_string.push(tmpButtonBody);
                        }
                    }


                    if (urldata.findIndex(x => x.type === "PHONE_NUMBER") > -1) {
                        button_option = 0;
                        insideurlindex = urldata.findIndex(x => x.type === "PHONE_NUMBER");
                        button_option_string.push({
                            "call_phone": {
                                "phone_button_text": urldata[insideurlindex].text,
                                "phone_number": urldata[insideurlindex].phone_number
                            }
                        });
                    }
                    if (urldata.findIndex(x => x.type === "copy_code") > -1) {
                        button_option = 0;
                        insideurlindex1 = urldata.findIndex(x => x.type === "copy_code");
                        button_option_string.push({
                            "type": urldata[insideurlindex1].type,
                            "example": urldata[insideurlindex1].example,
                        });
                    }
                    if (urldata.findIndex(x => x.type === "MPM") > -1) {
                        button_option = 0;
                        insideurlindex2 = urldata.findIndex(x => x.type === "MPM");
                        button_option_string.push({
                            "type": urldata[insideurlindex2].type,
                            "text": urldata[insideurlindex2].text,
                        });
                    }
                    if (urldata.findIndex(x => x.type === "URL") > -1) {
                        button_option = 0;
                        urlindex = urldata.findIndex(x => x.type === "URL");
                        urlplaceholder = urldata[urlindex].example != undefined ? urldata[urlindex].example[0] : null;
                        sample_content.dynamic_url = urldata[urlindex].example != null ? urldata[urlindex].example : null;
                        // urlplaceholder = urlplaceholder.match(/\{\w+\}/g).map(s => s.slice(1, -1))
                        //   components.buttons.push({
                        //     type: 'URL',
                        //     text: urldata[urlindex].text,
                        //     url: urldata[urlindex].url,
                        //     example: [urldata[urlindex].example]
                        // })
                        if (urlplaceholder != null && urlplaceholder.length > 0) {
                            button_option_string.push({
                                "visit_website": {
                                    "web_button_text": urldata[urlindex].text,
                                    "web_url_option": "1",
                                    "web_url": urldata[urlindex].url
                                }
                            });
                        } else {
                            button_option_string.push({
                                "visit_website": {
                                    "web_button_text": urldata[urlindex].text,
                                    "web_url_option": "0",
                                    "web_url": urldata[urlindex].url
                                }
                            });
                        }

                    }
                }


                if (ComponentsData.findIndex(x => x.type === "HEADER") > -1) {
                    let headerindex = ComponentsData.findIndex(x => x.type === "HEADER");
                    let hasHeader = ComponentsData.some(obj => obj.format === "HEADER");
                    let hasImage = ComponentsData.some(obj => obj.format === "IMAGE");
                    let hasVideo = ComponentsData.some(obj => obj.format === "VIDEO");
                    let hasDocument = ComponentsData.some(obj => obj.format === "DOCUMENT");
                    let hasLocation = ComponentsData.some(obj => obj.format === "LOCATION");

                    if (hasImage) {
                        sample_content.header_content = null;

                        head_temptype = 1;
                        head_mediatype = 1;
                        uploadTemplateMedia(filepath, access_token, (err, fileHandleResult) => {
                            if (err) {
                                callback(err);
                            } else {
                                head_media_url = fileHandleResult.head_media_url;
                                head_media_filename = head_media_url.substring(head_media_url.lastIndexOf('/') + 1);
                                let temp_h = fileHandleResult.h;
                                sample_content.header_content = ComponentsData[headerindex].example;
                                components.push({
                                    type: ComponentsData[headerindex].type,
                                    format: ComponentsData[headerindex].format,
                                    example: {
                                        header_handle: [temp_h]
                                    }
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
                        });

                    } else if (hasVideo) {
                        sample_content.header_content = null;
                        head_temptype = 1;
                        head_mediatype = 2;
                        uploadTemplateMedia(filepath, access_token, (err, fileHandleResult) => {
                            if (err) {
                                callback(err);
                            } else {
                                head_media_url = fileHandleResult.head_media_url;
                                head_media_filename = head_media_url.substring(head_media_url.lastIndexOf('/') + 1);
                                temp_h = fileHandleResult.h;
                                components.push({
                                    type: ComponentsData[headerindex].type,
                                    format: ComponentsData[headerindex].format,
                                    example: {
                                        header_handle: [temp_h]
                                    }
                                });

                                objData = {
                                    access_token,
                                    name,
                                    language,
                                    category,
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
                        });

                    } else if (hasDocument) {
                        sample_content.header_content = null;
                        head_temptype = 1;
                        head_mediatype = 0;
                        uploadTemplateMedia(filepath, access_token, (err, fileHandleResult) => {
                            if (err) {
                                callback(err);
                            } else {
                                head_media_url = fileHandleResult.head_media_url;
                                head_media_filename = head_media_url.substring(head_media_url.lastIndexOf('/') + 1);
                                temp_h = fileHandleResult.h;
                                components.push({
                                    type: ComponentsData[headerindex].type,
                                    format: ComponentsData[headerindex].format,
                                    example: {
                                        header_handle: [temp_h]
                                    }
                                });

                                objData = {
                                    access_token,
                                    name,
                                    language,
                                    category,
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
                            }
                        });
                    } else if (hasLocation) {

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

                    } else {
                        head_temptype = 0;
                        headerplaceholder = ComponentsData[headerindex].example != undefined ? ComponentsData[headerindex].example.header_text : null;
                        sample_content.header_content = ComponentsData[headerindex].example != null ? ComponentsData[headerindex].example.header_text : null;
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
            whatsappService.messageTemplate(objData, wabaid, (err, result) => {
                if (err) {
                    console.log(err);
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

                    // write that for loop here
                    for (obj in data) {
                        if (data[obj] == undefined) {
                            data[obj] = null;
                        }
                    };

                    userService.insertFlowsTemplateDetails(result, data, flowid1, (err, insertTemplateresult) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("inserted data", insertTemplateresult);
                        }
                    });
                    callback(null, result);
                }

            });
        };

        async.waterfall([getusers, getwabaid, getusersetting, createpayload, createtemplate], function (err, result) {

            if (err) {
                // console.log(JSON.stringify(err));
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : err,

                },
                );
            } else {
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'Template Generated Successfully',
                    data: result
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
