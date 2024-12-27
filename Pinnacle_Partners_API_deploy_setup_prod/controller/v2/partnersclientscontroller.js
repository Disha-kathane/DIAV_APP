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
        (selectwanumberResult,done) => {
            sendService.fetchpartnersclients(wanumber, (err, fetchpartnersclientsResult) => {
                if (err) {
                    console.log('fetchpartnersclients err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('fetchpartnersclients result=======================>' + JSON.stringify(fetchpartnersclientsResult));
                    done(null, fetchpartnersclientsResult);
                }
            })
        }
    ], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send({
                clients:{
                name:result[0].firstname,
                id: result[0].username,
                organisation: result[0].companyname
                },
                contact_info:{
                phone: result[0].mobile,
                email: result[0].email
                },
                contact_user:{
                    phone: result[0].mobile,
                    email: result[0].email,
                    name: result[0].firstname
                },
                created_at: result[0].expirydate,
                created_by: {
                    user_id: result[0].auserid,
                    user_name: result[0].username
                },
                modified_at: result[0].lastupdatetime,
                modified_by: {
                    user_id: result[0].euserid,
                    user_name: result[0].username
                }
            });
            //res.send(result)
        }
    })
}