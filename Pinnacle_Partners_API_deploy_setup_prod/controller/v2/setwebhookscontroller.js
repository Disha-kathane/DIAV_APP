const dbpool = require('../../db/database');
const async = require('async');
const sendService = require('../../services/v1/send');
let axios = require('axios');


module.exports = (req, res) => {

    let wanumber = req.headers.wanumber;
    let apikey = req.headers.apikey;
    let custom_callback = req.body.webhook_url;
    let custom_parameters = req.body.custom_parameters;
    let userid;

    async.waterfall([
        (done) => {
            sendService.selectapikey(apikey, (err, selectapikeyResult) => {
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
            sendService.selectwanumber(wanumber, (err, selectwanumberResult) => {
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
            sendService.fetchuserid(wanumber, apikey, (err, fetchuseridResult) => {
                if (err) {
                    console.log('fetchuserid err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('fetchuserid result=======================>' + JSON.stringify(fetchuseridResult));
                    done(null, fetchuseridResult);
                }
            })
        },
        (fetchuseridResult, done) => {

            userid = fetchuseridResult[0].userid;

            sendService.updatewebhooks(custom_callback, custom_parameters, userid, wanumber, (err, updatewebhooksResult) => {
                console.log(userid);
                console.log(custom_callback);
                if (err) {
                    console.log('updatewebhooks err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('updatewebhooks result=======================>' + JSON.stringify(updatewebhooksResult));
                    done(null, updatewebhooksResult);
                }
            })
        }
    ], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send({
                code: '200',
                status: 'Success',
                message: 'Your webhook has been configured successfully'
            })
        }
    })

}