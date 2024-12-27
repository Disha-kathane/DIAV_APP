const dbpool = require('../../db/database');
const async = require('async');
const sendService = require('../../services/v1/send');
let axios = require('axios');

module.exports = (req, res) => {

    let wanumber = req.headers.wanumber;
    let accesstoken = req.headers.accesstoken;
    let expiresin;

    async.waterfall([
        (done) => {
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
            sendService.getapikeybywanumber(wanumber, accesstoken, (err, getapikeybywanumberResult) => {
                if (err) {
                    console.log('getapikeybywanumber err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('getapikeybywanumber result=======================>' + JSON.stringify(getapikeybywanumberResult));
                    if (getapikeybywanumberResult.length > 0) {
                        done(null, getapikeybywanumberResult);
                    } else {
                        done('Invalid Accesstoken')
                    }
                    // done(null, getapikeybywanumberResult);
                }
            })
        }
    ], (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.send({
                apikey: result[0].apikey
            })
        }
    })
}

