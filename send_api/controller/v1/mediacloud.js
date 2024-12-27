const userService = require('../../services/v1/users');
const sendService = require('../../services/v1/send');
const utils = require('../../utils/bot');
const async = require('async');
var fs = require('fs');
var axios = require('axios');
var FormData = require('form-data');
var mime = require('mime-types');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');


module.exports = async (req, res) => {
    try {
        errorLogger.info(req.body);
        let apikeys = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
        let wanumber = (typeof req.headers.wanumber != undefined) ? req.headers.wanumber + '' : '';
        let FilePath = req.files.sheet[0].path;
        let setflag = 0;

        //console.log(data);
        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: []
            };
        }

        if (FilePath.length < 0) {
            return {
                code: 'WA002',
                status: 'FAILED',
                message: 'File is required',
                data: []
            }
        }
        if (!req.headers.wanumber) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'Whatsapp Number is required',
                data: []
            };
        }

        let getusers = function (callback) {
            userService.getOptoutUserId(apikeys, (err, result) => {
                if (err) {
                    callback(err);
                }
                // console.log(result)
                if (result != null && result.length > 0) {
                    userid = result[0].userid;
                    callback(null, userid);

                } else {
                    res.send({
                        code: 'WA004',
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: []
                    });
                }
            });
        }


        let getusersetting = function (userid, callback) {
            userService.checkWanumber(wanumber, (err, result) => {
                let data = new FormData();
                if (result.length > 0) {
                    let phone_number_id = result[0].phone_number_id;
                    if (phone_number_id != null && phone_number_id != undefined) {
                        setflag = 1;
                        userService.getSystemAccessToken((err, result) => {
                            let SystemAccessToken = result[0].VALUE;
                            userService.getMediaUserSettings(userid, wanumber, (err, result) => {
                                if (err) {
                                    return callback(err.message);
                                }

                                if (result != undefined && result != null && result.length > 0) {
                                    result.authtoken = SystemAccessToken;
                                    data.append('file', fs.createReadStream(FilePath));
                                    data.append('messaging_product', 'whatsapp');
                                    callback(null, result, data, userid);

                                }

                            });
                        })


                    } else {
                        userService.getMediaUserSettings(userid, wanumber, (err, result) => {
                            if (err) {
                                return callback(err.message);
                            }
                            //  console.log("result", result)
                            if (result != undefined && result != null && result.length > 0) {
                                let data = fs.createReadStream(FilePath);
                                callback(null, result, data, userid);
                            }

                        });
                    }
                } else {
                    return done({
                        code: 'WA100',
                        status: 'FAILED',
                        message: 'Wabanumber Not Found',
                        data: {}
                    });
                }
            })
        }

        let getmedia = function (result, data, userid, callback) {
            let FileType = (mime.lookup(FilePath));
            console.log("FileType=========================================>" + FileType)
            let filename = FilePath.split('/');
            let tmpFileName = filename[filename.length - 1] != undefined ? filename[filename.length - 1] : null;
            console.log("FilePath=========================================>" + tmpFileName)
            let mediatype = 0;
            if (setflag == 0) {
                let authtoken = result[0].authtoken;
                let waurl = result[0].waurl;
                const apiHeaders = [{
                    'headerName': 'Authorization',
                    'headerVal': 'Bearer ' + authtoken
                },
                {
                    'headerName': 'Content-Type',
                    'headerVal': FileType,

                }
                ];

                if (FileType.includes('application')) {
                    mediatype = 0;
                }
                else if (FileType.includes('image')) {
                    mediatype = 1;
                }
                else if (FileType.includes('video')) {
                    mediatype = 2;
                }
                else if (FileType.includes('audio')) {
                    mediatype = 3;
                }

                utils.uploadWhatsappMedia(waurl, data, apiHeaders).then((response) => {
                    let result = response.media[0].id;
                    userService.insertMedia(result, mediatype, FilePath, tmpFileName, userid, (err, insertMediaResult) => {
                        console.log("data inserted for premises")
                        // callback(err, result);
                    });
                    callback(null, result);
                }).catch((error) => {
                    if (error) {
                        console.log(error);
                        callback(error.message);
                    }
                });
            } else {

                let waurl = result[0].waurl;
                waurl = waurl.substring(0, waurl.lastIndexOf("/"));
                let systemauthtoken = result.authtoken;
                const apiHeaders = [{
                    'headerName': 'Authorization',
                    'headerVal': 'Bearer ' + systemauthtoken
                },
                {
                    'headerName': 'Content-Type',
                    'headerVal': FileType,
                }
                ];

                if (FileType.includes('application')) {
                    mediatype = 0;
                }
                else if (FileType.includes('image')) {
                    mediatype = 1;
                }
                else if (FileType.includes('video')) {
                    mediatype = 2;
                }
                else if (FileType.includes('audio')) {
                    mediatype = 3;
                }

                utils.uploadWhatsappMediaCloud(waurl, data, apiHeaders).then((response) => {
                    let result = response.id;
                    userService.insertMedia(result, mediatype, FilePath, tmpFileName, userid, (err, insertMediaResult) => {
                        console.log("data inserted for cloud")
                        // callback(err, result);
                    });

                    callback(null, result);
                }).catch((error) => {
                    if (error) {
                        console.log(error);
                        callback(error.message);
                    }
                });

            }
        }


        async.waterfall([getusers, getusersetting, getmedia], function (err, result) {
            console.log("data", result);
            if (err) {
                errorLogger.error(err);
                console.log(err);
                res.status(err.response != undefined && err.response.status != undefined ? err.response.status : 200);
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : 'The specified WABA might be offline or out of service',
                    data: []
                });
                return;
            } else {
                errorLogger.info(result);
                res.send({
                    code: 200,
                    status: 'success',
                    message: 'Media fetched Successfully',
                    data: [{
                        MediaId: result
                    }]
                });
            }
        });

    } catch (error) {
        console.log(error)
        errorLogger.error(JSON.stringify(error));
        res.status(500);
        res.send({
            code: 'WA101',
            status: 'FAILED',
            message: error.message != undefined ? error.message : 'Request Failed',
            data: []
        });
    }
}