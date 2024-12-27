const async = require('async');
const axios = require('axios');
const http = require('http');
const https = require('https');
const httpUrl = require('url');
const { errorLogger, infoLogger } = require('../../applogger1');

//Sending bulk messaage using send api 
//Made in async await

module.exports = (req, res) => {
    try {
        const SendBulkMsg = async (callback) => {
            errorLogger.info(JSON.stringify(req.body));
            let data = req.body;
            ToNumber = req.body.to;
            arrres = Array.isArray(ToNumber);
            if (arrres == false) {
                res.send({
                    code: 'WA101',
                    status: 'FAILED',
                    message: "To number should be in array",
                    data: {}
                });

            } else {
                let responsedata = [];
                let j = 0;
                if (ToNumber.length <= 50) {
                    for (i = 0; i < ToNumber.length; i++) {
                        let Number = ToNumber[i];
                        req.body.to = Number;

                        let messageUrl = 'http://localhost:5976/v2/wamessage/send';
                        var config = {
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

                        await axios(config)
                            .then(function (response) {
                                // console.log(response)
                                response.data.data.wanumber = Number;
                                responsedata.push(response.data);

                            })
                            .catch(function (error) {
                                callback(error);
                            });
                    }

                    return responsedata;
                } else {
                    res.send({
                        code: 'WA102',
                        status: 'FAILED',
                        message: "Number Length should be less than or equal to 50",
                        data: {}
                    });
                }

            }

        };

        async.waterfall([SendBulkMsg], (error, result) => {
            if (error) {
                errorLogger.error(JSON.stringify(error));
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: error.message,
                    data: {}
                });
            } else {
                let response = {
                    code: "200",
                    status: "SUCCESS",
                    message: "Data fetched Successfully",
                    data: result
                };
                res.send(response);
            }

        });
    } catch (error) {
        errorLogger.error(JSON.stringify(error));
        res.send({
            code: 'WA100',
            status: 'FAILED',
            message: error.message != undefined ? error.message : 'Request Failed',
            data: {}
        });

    }

}

