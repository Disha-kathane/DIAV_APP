const dbpool = require('../../db/database');
const async = require('async');
const sendService = require('../../services/v1/send');
let axios = require('axios');


module.exports = (req, res) => {

    let wanumber = req.headers.wanumber;
    let apikey = req.headers.apikey;
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
            sendService.fetchusernameuseridcustomcallback(wanumber, apikey, (err, fetchusernameuseridcustomcallbackResult) => {
                if (err) {
                    console.log('fetchusernameuseridcustomcallback err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('fetchusernameuseridcustomcallback result=======================>' + JSON.stringify(fetchusernameuseridcustomcallbackResult));
                    done(null, fetchusernameuseridcustomcallbackResult);
                }
            })
        }
    ], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send({
                webhook_url: result[0].custom_callback,
                brand_name: result[0].companyname,
                id: result[0].username
            });
        }
    })
}