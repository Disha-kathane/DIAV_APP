
const dbpool = require('../../db/database');
const async = require('async');
const sendService = require('../../services/v1/send');
let axios = require('axios');

module.exports = (req, res) => {

    let wanumber = req.headers.wanumber;
    let apikey = req.headers.apikey;

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
                    } else if (apikey != selectapikeyResult) {
                        done('API does not belongs to the user')
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
            sendService.fetchwebhookurl(wanumber, apikey, (err, fetchwebhookurlResult) => {
                if (err) {
                    console.log('fetchwebhookurl err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('fetchwebhookurl result=======================>' + JSON.stringify(fetchwebhookurlResult));
                    done(null, fetchwebhookurlResult[0]);
                }
            })
        }
    ], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            // res.send(result.custom_parameters)
            res.send({
                webhook_url: result.custom_callback,
                headers: JSON.parse(result.custom_parameters),
            });
            // res.send(JSON.parse(result.custom_parameters))
            // res.send({
            //     webhook_url: result[0].custom_callback,
            //     headers: {
            //         header_1: result[0].phone
            //     }
            // res.send({
            //     webhook_url: 
            // });
        }
    })
} 
