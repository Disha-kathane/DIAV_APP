const async = require('async');
let axios = require('axios');
let http = require('http');
let https = require('https');
let httpUrl = require('url');
const sendService = require('../../services/v1/send');

module.exports = async (req, res) => {
    async.waterfall([
        (done) => {
            sendService.checkWanumber(req.body.from, (err, checkWanumberResult) => {
                if (err) {
                    done(err);
                } else {
                    console.log({ checkWanumberResult });
                    if (checkWanumberResult[0].phone_number_id != '' &&
                        (checkWanumberResult[0].phone_number_id != null &&
                            checkWanumberResult[0].phone_number_id != undefined)) {
                        done(null, 1);
                    } else {
                        done(null, 0);
                    }
                }
            });
        },
        (iscloud, done) => {
            if (iscloud == 0) {
                let data = JSON.stringify({ "from": req.body.from, "contact": req.body.to });
                let optinUrl = 'https://localhost:5976/v1/wamessage/optin';
                let config = {
                    method: 'post',
                    url: optinUrl,
                    headers: {
                        'apikey': req.headers.apikey,
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
            } else {
                done(null, iscloud);
            }
        },
        (optinresponse, done) => {
            var data = JSON.stringify(req.body);
            let messageUrl = 'https://localhost:5976/v1/wamessage/send';
            let config = {
                method: 'post',
                url: messageUrl,
                headers: {
                    'apikey': req.headers.apikey,
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