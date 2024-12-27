const dbpool = require('../../db/database');
const async = require('async');
const sendService = require('../../services/v1/send');
let axios = require('axios');
const fastify = require('fastify')({
    logger: false
});

let jwt = require('jsonwebtoken');


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
            let token = jwt.sign({ foo: 'bar' }, 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9');
            done(null, token)
        },
        (token, done) => {
            sendService.insertinwaaccesstoken(wanumber, token, (err, insertinwaaccesstokenResult) => {
                if (err) {
                    console.log('insertinwaaccesstoken err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('insertinwaaccesstoken result=======================>' + JSON.stringify(insertinwaaccesstokenResult));
                    done(null, insertinwaaccesstokenResult);
                }
            })
        },
        (insertinwaaccesstokenResult,done) => {
            sendService.selectaccesstoken(wanumber, (err, selectaccesstokenResult) => {
                if (err) {
                    console.log('selectaccesstoken err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('selectaccesstoken result=======================>' + JSON.stringify(selectaccesstokenResult));
                    done(null, selectaccesstokenResult);
                }
            })
        }
    ], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send({
                accesstoken: result[0].accesstoken
            })
        }
    })
}
