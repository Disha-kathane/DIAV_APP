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
        (selectwanumberResult,done) => {
            sendService.msgsettingdetails(wanumber,(err,msgsettingdetailsResult) => {
                if (err) {
                    console.log('msgsettingdetails err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('msgsettingdetails result=======================>' + JSON.stringify(msgsettingdetailsResult));
                    done(null, msgsettingdetailsResult);
                }
            })
        }
    ],(err,result) => {
        if(err){
            res.send(err)
        } else {
            res.send(result[0])
        }
    })
}