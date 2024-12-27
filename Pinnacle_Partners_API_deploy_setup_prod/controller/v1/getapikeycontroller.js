const dbpool = require('../../db/database');
const async = require('async');
const sendService = require('../../services/v1/send');
let axios = require('axios');

module.exports = (req, res) => {

    let wanumber = req.headers.wanumber;

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
            sendService.fetchapikeyappid(wanumber, (err, fetchapikeyappidResult) => {
                if (err) {
                    console.log('fetchapikeyappid err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('fetchapikeyappid result=======================>' + JSON.stringify(fetchapikeyappidResult));
                    done(null, fetchapikeyappidResult);
                }
            })
        }
    ], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send({
                api_keys: [
                    {
                        id: result[0].username,
                        api_key: result[0].apikey,
                        app_id: result[0].apikey_id
                    }
                ]
            })
        }
    })
}


