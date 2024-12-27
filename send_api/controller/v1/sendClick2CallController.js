const async = require('async');
let axios = require('axios');
let http = require('http');
let https = require('https');
let httpUrl = require('url');
const sendService = require('../../services/v1/send');

module.exports = async (req, res) => {
    let from = req.body.from;
    let to = req.body.to;
    let apikey = req.body.apikey;
    let body = null;

    async.waterfall([
        (done) => {
            sendService.fetchTemplate(from, (err, result) => {
                body = {
                    "from": from,
                    "to": to,
                    "type": "template",
                    "message": {
                        "templateid": result[0].tempid,
                        "placeholders": []
                    }
                };

                if(result[0].button_option!= '' && result[0].button_option == 1){
                    body.message.buttons= [];               
                }
                else if(result[0].button_option!= '' && result[0].button_option == 0){
                    body.message.buttons= [];
                }
                done(err, result);
            });
        },
        (result, done) => {
            let data = JSON.stringify({ "from": req.body.from, "contact": req.body.to });
            let optinUrl = 'https://localhost:5976/v1/wamessage/optin';
            let config = {
                method: 'post',
                url: optinUrl,
                headers: {
                    'apikey': req.body.apikey,
                    'Content-Type': 'application/json'
                },
                data: data
            };

            let protocol = httpUrl.parse(optinUrl).protocol;
            if (protocol != null && protocol == "https:") {
                config.httpsAgent = new https.Agent({
                    keepAlive: false,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            } else {
                config.httpAgent = new http.Agent({
                    keepAlive: false,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            }

            axios(config)
                .then(function (response) {
                    console.log(JSON.stringify(response.data));
                    done(null, response.data);
                })
                .catch(function (error) {
                    console.log(error);
                    done(error);
                });
        },
        (optinresponse, done) => {
            var data = JSON.stringify(body);
            let messageUrl = 'https://localhost:5976/v1/wamessage/send';
            let config = {
                method: 'post',
                url: messageUrl,
                headers: {
                    'apikey': req.body.apikey,
                    'Content-Type': 'application/json'
                },
                data: data
            };

            let protocol = httpUrl.parse(messageUrl).protocol;
            if (protocol != null && protocol == "https:") {
                config.httpsAgent = new https.Agent({
                    keepAlive: false,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            } else {
                config.httpAgent = new http.Agent({
                    keepAlive: false,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            }

            axios(config)
                .then(function (response) {
                    console.log(JSON.stringify(response.data));
                    done(null, response.data);
                })
                .catch(function (error) {
                    console.log(error);
                    done(error);
                });
        }
    ], (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
}