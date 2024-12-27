const dbpool = require('../../db/database');
const async = require('async');
const sendService = require('../../services/v1/send');
let axios = require('axios');


module.exports = (req, res) => {

    wanumber = req.header.wanumber;

    async.waterfall([
        (done) => {
            sendService.updateapikey(apikey, userid, (err, updateapikeyResult) => {
                if (err) {
                    console.log('updateapikey err================================>' + err);
                    done(err);
                } else {
                    console.log('updateapikey result =====================================>' + JSON.stringify(updateapikeyResult));
                    done(null, updateapikeyResult)
                }
            })
        }
    ], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send(result)
        }
    })
}


