const async = require('async');
let axios = require('axios');
let http = require('http');
let https = require('https');
let httpUrl = require('url');


module.exports = (req, res) => {
    let SendBulkMsg = async (callback) => {
        let data = req.body;
        let ToNumber = req.body.to;
        arrres = Array.isArray(ToNumber);
        // console.log(arrres)
        if (arrres == false) {
            res.send({
                code: 'WA037',
                status: 'FAILED',
                data: "To number should be in array"
            });

        } else {
            let responsedata = [];
            let j = 0;
            if (ToNumber.length <= 50) {
                for (i = 0; i < ToNumber.length; i++) {
                    let Number = ToNumber[i];
                    req.body.to = Number;

                    let messageUrl = 'https://localhost:5976/v1/wamessage/send';
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
                            // j++;
                            response.data.data.wanumber = Number
                            responsedata.push(response.data);

                            // console.log(i + '==' + j);
                            // if (i == j) {
                            //     callback(null, responsedata);
                            // }

                        })
                        .catch(function (error) {
                            callback(error);
                        });
                }

                return responsedata
            } else {
                res.send({
                    code: 'WA038',
                    status: 'FAILED',
                    data: "Number Length should be less than or equal to 50"
                });
            }

        }

    }



    async.waterfall([SendBulkMsg], (error, result) => {
        // console.log("result========", result)
        if (error) {
            res.send({
                code: 'WA100',
                status: 'FAILED',
                data: "Something went wrong"
            });
        } else {
            let response = {
                code: 200,
                status: "success",
                data: result
            };
            res.send(response);
        }

    })
}
