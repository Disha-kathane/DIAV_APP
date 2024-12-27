const dbpool = require('../../db/database');
const async = require('async');
const sendService = require('../../services/v1/send');
let axios = require('axios');

module.exports = (req, res) => {

    let wanumber = req.headers.wanumber;
    let apikey = req.headers.apikey;
    let firstname = req.body.firstname;
    let mobile = req.body.mobile;
    let email = req.body.email;
    let companyname = req.body.companyname;

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
            sendService.updateclient(firstname, mobile, email, companyname, wanumber, apikey, (err, updateclientResult) => {
                console.log(wanumber);
                console.log(apikey);
                console.log(firstname);
                if (err) {
                    console.log('updateclient err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('updateclient result=======================>' + JSON.stringify(updateclientResult));
                    done(null, updateclientResult);
                }
            })
        }
    ], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send({
                clients: {
                    name: firstname,
                    organisation: companyname
                },
                contact_info: {
                    phone: mobile,
                    email: email
                },
                contact_user: {
                    phone: mobile,
                    email: email,
                    name: firstname
                }
            });
        }
    })
}