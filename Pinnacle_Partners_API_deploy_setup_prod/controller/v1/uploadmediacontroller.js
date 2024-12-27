const dbpool = require('../../db/database');
const async = require('async');
const userService = require('../../services/v1/user');
let axios = require('axios');
var fs = require('fs');
var FormData = require('form-data');
var mime = require('mime-types');
const utils = require('../../utils/bot');

module.exports = (req, res) => {

    try {
        let apikey = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let FilePath = req.files.sheet[0].path;

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
                console.log('fetchmediausersdetailsResult==================>' + JSON.stringify(fetchmediausersdetailsResult));
                let data = new FormData();
                let phone_number_id = fetchmediausersdetailsResult.phone_number_id;
                let userid = fetchmediausersdetailsResult.userid
                if (phone_number_id != null && phone_number_id != undefined) {
                    console.log(phone_number_id);
                    userService.getSystemAccessToken((err, result) => {
                        console.log('result 1==================>' + JSON.stringify(result));
                        let SystemAccessToken = result[0].VALUE;
                        userService.getusersdetails(userid, wanumber, (err, result) => {
                            console.log(userid);
                            console.log(wanumber);

                            if (err) {
                                console.log('err 2==================>' + JSON.stringify(err));
                                return done(err.message);
                            }
                            if (result != undefined && result != null && result.length > 0) {

                                console.log('result 2==================>' + JSON.stringify(result));
                                result.authtoken = SystemAccessToken;
                                data.append('file', fs.createReadStream(FilePath));
                                data.append('messaging_product', 'whatsapp');
                                done(null, result, data, userid);
                            }
                        })
                    })
                } else {
                    userService.getusersdetails(userid, wanumber, (err, result) => {
                        if (err) {
                            console.log(err);
                            return done(err.message);
                        }
                        if (result != undefined && result != null && result.length > 0) {
                            let data = fs.createReadStream(FilePath);
                            done(null, result, data, userid);
                        }
                    });
                }
            },
            (result, data, userid, done) => {
                let FileType = (mime.lookup(FilePath));
                console.log("FileType=========================================>" + FileType)
                let filename = FilePath.split('/');
                let tmpFileName = filename[filename.length - 1] != undefined ? filename[filename.length - 1] : null;
                console.log("FilePath=========================================>" + tmpFileName)
                let mediatype = 0;
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
                        console.log(insertMediaResult);
                        console.log("data inserted for cloud")
                        // callback(err, result);
                    });

                    done(null, result);
                }).catch((error) => {
                    if (error) {
                        console.log(error);
                        callback(error.message);
                    }
                });
            }
        ], (err, result) => {
            if (err) {
                res.send(err);
            } else {
                res.send({
                    code: 200,
                    status: 'success',
                    message: 'Media fetched Successfully',
                    data: [{
                        MediaId: result
                    }]
                });
            }
        })
    } catch (err){
        // res.status(500);
        res.send({
            code: '100',
            status: 'FAILED',
            message: 'Please select file to be uploaded',
            // data: []
        });
    }
}
