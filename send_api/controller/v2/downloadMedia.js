const utils = require('../../utils/bot1');
const mediaService = require('../../services/v2/media');
const whatsappService = require('../../services/v2/whatsapp');
const async = require('async');
const axios = require('axios');
const bufferImage = require("buffer-image");
const {
    errorLogger,
    infoLogger
} = require('../../applogger1');

//old code using waterfall


module.exports = async (req, res) => {
    try {
        let apikeys = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
        let wanumber = (typeof req.headers.wanumber != undefined) ? req.headers.wanumber + '' : '';
        let MediaId = (typeof req.params.mediaid != undefined) ? req.params.mediaid + '' : '';
        let setflag = 0;
        // console.log(MediaId);
        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: []
            };
        }

        if (!req.params.mediaid) {
            return {
                code: 'WA002',
                status: 'FAILED',
                message: 'MediaId is required',
                data: []
            };
        }

        if (!req.headers.wanumber) {
            return {
                code: 'WA004',
                status: 'FAILED',
                message: 'Wanumber is required',
                data: []
            };
        }

        let getusers = function (callback) {
            mediaService.getOptoutUserId(apikeys, (err, result) => {
                // console.log(JSON.stringify(result));
                if (err) {
                    return callback(err.message);
                }
                if (result != null && result.length > 0) {
                    userid = result[0].userid;
                    callback(null, userid);

                } else {
                    res.send({
                        code: 'WA003',
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: []
                    });
                }
            });
        };


        let getusersetting = function (userid, callback) {
            mediaService.checkWanumber(wanumber, (err, result) => {
                if (result.length > 0) {
                    let phone_number_id = result[0].phone_number_id;
                    if (phone_number_id != null && phone_number_id != undefined) {
                        setflag = 1;
                        mediaService.getSystemAccessToken((err, result) => {
                            if (err) {
                                return callback(err.message);
                            }
                            if (result.length > 0) {
                                let SystemAccessToken = result[0].VALUE;
                                mediaService.getMediaUserSettings(userid, wanumber, (err, result) => {
                                    if (err) {
                                        return callback(err.message);
                                    }
                                    if (result != undefined && result != null && result.length > 0) {
                                        result.authtoken = SystemAccessToken;
                                        whatsappService.getMediaUrl(MediaId, SystemAccessToken, (err, result) => {
                                            if (err) {
                                                return callback(err.message);
                                            }
                                            const buf = Buffer.from(result.data);
                                            let data = JSON.parse(buf);
                                            let url = data.url;

                                            whatsappService.downloadCloudMedia(url, SystemAccessToken, (err, result) => {
                                                if (err) {
                                                    return callback(err.message);
                                                }

                                                res.header('Content-Type', result.headers['content-type']);
                                                res.send(Buffer.from(result.data));

                                            });

                                        });

                                    }

                                });
                            }

                        });
                    } else {
                        mediaService.getMediaUserSettings(userid, wanumber, (err, result) => {
                            // console.log(JSON.stringify(result));
                            if (err) {
                                return callback(err.message);
                            }
                            if (result != undefined && result != null && result.length > 0) {
                                callback(null, result, MediaId);
                            }
                        });
                    }


                } else {
                    return done({
                        code: 'WA100',
                        status: 'FAILED',
                        message: 'Wanumber Not Found',
                        data: {}
                    });
                }
            });
        };


        let downloadmedia = function (result, MediaId, callback) {
            let authtoken = result[0].authtoken;
            let waurl = result[0].waurl;
            const apiHeaders = [{
                'headerName': 'Authorization',
                'headerVal': 'Bearer ' + authtoken
            },
            {
                'headerName': 'Content-Type',
                'headerVal': 'application/json'
            }
            ];

            utils.downloadWhatsappMedia(waurl, MediaId, apiHeaders).then((response) => {
                // console.log('downloadWhatsappMedia==================>' + JSON.stringify(response));
                callback(null, response);
            }).catch((error) => {
                if (error) {
                    // console.log(error);
                    return callback(error.message);
                }
            });
        };

        async.waterfall([getusers, getusersetting, downloadmedia], function (err, result) {
            // console.log("data", result);
            if (err) {
                errorLogger.error(err);
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
                res.header('Content-Type', result.headers['content-type']);
                // res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.send(Buffer.from(result.data));

            }
        });

    } catch (error) {
        errorLogger.error(JSON.stringify(error));
        res.send({
            code: 'WA100',
            status: 'FAILED',
            message: 'Request Failed',
            data: []
        });
    }

};