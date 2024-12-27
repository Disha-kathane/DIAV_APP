const dbpool = require('../../db/database');
const async = require('async');
const sendService = require('../../services/v1/send');
let axios = require('axios');

module.exports = (req, res) => {
     
    async.waterfall([
        (done) => {
            sendService.fetchaccesstoken((err,fetchaccesstokenResult) => {
                if (err) {
                    console.log('fetchaccesstoken err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('fetchaccesstoken result=======================>' + JSON.stringify(fetchaccesstokenResult));
                    done(null, fetchaccesstokenResult[0]);
                }
            })
        }
    ], (err,result) => {
        if(err){
            res.send(err)
        } else {
            res.send(result)
        }
    })
}