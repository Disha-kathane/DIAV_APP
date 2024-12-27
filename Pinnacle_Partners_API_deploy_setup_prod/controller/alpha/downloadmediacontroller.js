const dbpool = require('../../db/database');
const async = require('async');
const userService = require('../../services/v1/user');
const whatsappService = require('../../services/v1/whatsapp');
let axios = require('axios');
var fs = require('fs');
var FormData = require('form-data');
var mime = require('mime-types');
const utils = require('../../utils/bot');
const bufferImage = require("buffer-image");

module.exports = (req, res) => {

    let apikey = req.headers.apikey;
    let wanumber = req.headers.wanumber;
    let mediaid = req.params.mediaid;

    if (!req.params.mediaid) {
        return {
            code: '100',
            status: 'FAILED',
            message: 'MediaId is required as parameter in URL',
           // data: []
        }
    }

    async.waterfall([
        (done) => {
            userService.selectapikey(apikey, (err, selectapikeyResult) => {
                if (err) {
                    console.log('selectapikey err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('selectapikey result=======================>' + JSON.stringify(selectapikeyResult));
                    if (selectapikeyResult[0].c > 0) {
                        done(null, selectapikeyResult);
                    } else {
                        done('Authentication failed')
                    }
                }
            })
        },
        (selectapikeyResult, done) => {
            userService.selectwanumber(wanumber, (err, selectwanumberResult) => {
                if (err) {
                    console.log('selectwanumber err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('selectwanumber result=======================>' + JSON.stringify(selectwanumberResult));
                    if (selectwanumberResult[0].c > 0) {
                        done(null, selectwanumberResult);
                    } else {
                        done('Invalid Wanumber')
                    }
                }
            })
        },
        (selectwanumberResult, done) => {
            userService.fetchmediausersdetails(apikey, wanumber, (err, fetchmediausersdetailsResult) => {
                if (err) {
                    console.log('fetchmediausersdetails err================================>' + err);
                    done(err);
                } else {
                    console.log('fetchmediausersdetails result =====================================>' + JSON.stringify(fetchmediausersdetailsResult));
                    done(null, fetchmediausersdetailsResult[0])
                }
            })
        },
        (fetchmediausersdetailsResult, done) => {
            console.log('fetchmediausersdetailsResult download==================>' + JSON.stringify(fetchmediausersdetailsResult));
            let phone_number_id = fetchmediausersdetailsResult.phone_number_id;
            let userid = fetchmediausersdetailsResult.userid;
            if (phone_number_id != null && phone_number_id != undefined) {
                userService.getSystemAccessToken((err, result) => {
                    if (err){
                        return done(err.message);
                    }
                    if (result.length > 0) {
                        let SystemAccessToken = result[0].VALUE;
                        userService.getusersdetails(userid, wanumber, (err, result) => {
                            if (err) {
                                return done(err.message);
                            }
                            if (result != undefined && result != null && result.length > 0) {
                                result.authtoken = SystemAccessToken;
                                whatsappService.getMediaUrl(mediaid, SystemAccessToken, (err, result) => {
                                    if (err) {
                                        return done(err.message);
                                    }
                                    const buf = Buffer.from(result.data);
                                    let data = JSON.parse(buf);
                                    let url = data.url;

                                    whatsappService.downloadCloudMedia(url, SystemAccessToken, (err, result) => {
                                        if (err) {
                                            return done(err.message);
                                        }

                                        res.header('Content-Type', result.headers['content-type']);
                                        res.send(Buffer.from(result.data));

                                    })

                                })

                            }

                        });
                    }
                })
            } else {
                userService.getusersdetails(userid, wanumber, (err, result) => {
                    console.log(JSON.stringify(result));
                    if (err) {
                        return done(err.message);
                    }
                    if (result != undefined && result != null && result.length > 0) {
                        done(null, result, mediaid);
                    }
                });
            }
        },
        (result, mediaid,done) => {
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

            utils.downloadWhatsappMedia(waurl, mediaid, apiHeaders).then((response) => {
                // console.log('downloadWhatsappMedia==================>' + JSON.stringify(response));
                callback(null, response);
            }).catch((error) => {
                if (error) {
                    // console.log(error);
                    return callback(error.message);
                }
            });
        }
    ], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.header('Content-Type', result.headers['content-type']);
            // res.writeHead(200, { 'Content-Type': 'image/jpeg' });

            res.send(Buffer.from(result.data));
        }
    })
}