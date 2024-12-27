const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const async = require('async');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
const fs = require('fs');
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

module.exports = (req, res) => {
    try {
        console.log(JSON.stringify(req.files));
        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        if (req.files == undefined) {
            return {
                code: 'WA100',
                status: 'FAILED',
                message: 'Please select media',
                data: {}
            };
        }

        if (Object.keys(req.files).length == 0) {
            res.send({
                code: 'WA100',
                status: 'FAILED',
                message: 'Request you to upload file'
            })
        } else {

            if (req.files.media.length > 1) {
                return {
                    code: 'WA100',
                    status: 'FAILED',
                    message: 'Multiple media upload not supported',
                    data: {}
                };
            }
            let filepath = req.files.media != undefined ? req.files.media[0].path : null;
            // let temp_h = null;

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
            if (!req.files.media) {
                return {
                    code: 'WA002',
                    status: 'FAILED',
                    message: 'media is required',
                    data: {}
                };
            }

            let getusers = function (callback) {
                userService.getUserId(apikeys, wanumber, (err, result) => {
                    if (err) {
                        console.log('getUserId error==============>' + err);
                        return callback(err);
                    }
                    if (result != null && result.length > 0) {
                        userid = result[0].userid;
                        // console.log({userid},{wanumber})
                        callback(null, userid, wanumber);

                    } else {
                        res.send({
                            code: 'WA006',
                            status: 'FAILED',
                            message: 'Correct API Key is required',
                            data: {}
                        });
                    }
                });
            }

            let getwabaid = function (userid, wanumber, callback) {
                userService.getWabaId(userid, wanumber, (err, result) => {
                    if (err) {
                        console.log('getWabaId error==============>' + err);
                        return callback(err)
                    }
                    if (result != null && result.length > 0) {
                        wabaid = result[0].whatsapp_business_account_id;
                        callback(null, wabaid)
                    }
                })
            }

            let getusersetting = function (wabaid, callback) {
                userService.getAccessToken((err, result) => {
                    if (err) {
                        console.log('getAccessToken error==============>' + err);
                        return callback(err);
                    }
                    if (result != null && result.length > 0) {
                        SystemAccessToken = result[0].value;
                        callback(null, SystemAccessToken, wabaid)
                    }

                })
            }

            let retrivetemplate = function (SystemAccessToken, callback) {
                // console.log({limit})
                uploadTemplateMedia(filepath, SystemAccessToken, (err, fileHandleResult) => {
                    if (err) {
                        callback(err);
                    } else {
                        head_media_url = fileHandleResult.head_media_url;
                        FileType = fileHandleResult.FileType;
                        console.log("AWS_S3_url------------------", head_media_url);
                        head_media_filename = head_media_url.substring(head_media_url.lastIndexOf('/') + 1);
                        let temp_h = fileHandleResult.h;

                        userService.insertheaderdata(wanumber, head_media_url, temp_h, FileType, (err, insertheaderdataresult) => {
                            if (err) {
                                console.log(err);
                            } else {
                                // console.log(result);
                                console.log("header handler data", insertheaderdataresult);

                            }
                        });

                        console.log(" header_handle ----------------------" + temp_h);
                        res.send({
                            code: 200,
                            status: 'SUCCESS',
                            message: 'Header Handle Generated Successfully',
                            data: {
                                header_handle: [temp_h]
                            }
                        });
                    }
                });
            }

            async.waterfall([getusers, getwabaid, getusersetting, retrivetemplate], function (err, fileHandleResult) {
                if (err) {
                    res.send({
                        code: 'WA100',
                        status: 'FAILED',
                        message: err.message != undefined ? err.message : 'Request Failed'
                    })
                }
            });

        }


    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));

    }
}


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
                        done(null, result.h, filepath, FileType);
                    }
                });
            },
            (h, filepath, FileType, done) => {
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
                                head_media_url: data.Location,
                                FileType: FileType
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