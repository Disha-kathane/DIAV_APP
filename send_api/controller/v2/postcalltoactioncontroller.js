let async = require('async');
let axios = require('axios');
const dbpool = require('../../db/wabot');
const sendService = require('../../services/v2/send');
let moment = require('moment');
var parser = require('ua-parser-js');


module.exports = (req, res) => {
    console.log(req.url);
    console.log(req.params['*']);
    let currentdatetime = moment().format("YYYY-MM-DD HH:mm:ss");
    let mobileno = req.params.mobileno;
    let campaignid = req.params.campaignid;
    let placeholder = req.params.placeholder;
    let ua = parser(req.headers['user-agent']);
    let browser = ua.browser.name;
    let os = ua.os.name;
    let _api = req.params['*'] != undefined && req.params['*'] != null ? '/' + req.params['*'] : '';
    _api = _api.replace(/\/$/, '');
    placeholder = placeholder + _api;
    console.log({ browser });
    console.log({ os });
    console.log({ placeholder });
    console.log({ mobileno });
    if (placeholder.startsWith("http://")) {
        placeholder = placeholder.replace('http://', '');
    } else if (placeholder.startsWith("http:/")) {
        placeholder = placeholder.replace('http:/', '');
    }
    else if (placeholder.startsWith("https://")) {
        placeholder = placeholder.replace('https://', '');
    } else if (placeholder.startsWith("https:/")) {
        placeholder = placeholder.replace('https:/', '');
    }
    console.log('placeholder======>' + placeholder);

    async.waterfall([
        function (done) {
            mobileno = mobileno.replace(/^{{1/g, '');
            mobileno = mobileno.replace(/}}/g, '');
            mobileno = mobileno.replace(/%7B%7B1%7D%7D/g, '');
            if (!mobileno.startsWith("http") || !mobileno.startsWith("https"))  {
                sendService.insertcurrentdatetime(currentdatetime, mobileno, browser, os, campaignid, (err, insertcurrentdatetimeResult) => {
                    if (err) {
                        console.log('insertcurrentdatetime err=======================>' + JSON.stringify(err));
                        done(err);
                    } else {
                        console.log('insertcurrentdatetime result=======================>' + JSON.stringify(insertcurrentdatetimeResult));
                        done(null, insertcurrentdatetimeResult);
                    }
                });
            } else {
                done('Something went wrong');
            }
        },

    ], (err, result) => {
        if (err) {
            res.send({
                code: 100,
                status: 'Failed'
            });
        } else {
            if (placeholder.startsWith("http") || placeholder.startsWith("https")) {
                res.redirect(placeholder);
            }
            else {
                res.redirect('https://' + placeholder);
            }
        }
    });
};
