let axios = require('axios');
let async = require('async');
const sendService = require('../../services/v1/send');
let http = require('http');
let https = require('https');
let httpUrl = require('url');

function generateOtp(min, max) {
    return Math.floor(
        Math.random() * (max - min) + min
    )
}

module.exports = (req, res) => {
    let mobileno = req.params.mobileno;
    let wanumber = req.params.wanumber;

    let response = null;

    async.waterfall([
        (done) => {
            let otp = generateOtp(1000, 9999);
            let username = 'pinbot';
            let password = '4_ayRW-6';
            let senderid = 'PINBOT';
            let message = 'Your conversation OTP is ' + otp + '. Thanks for your enquiry. Regards, PinnacleTeleservices';
            let templateid = '1507161192368453348';
            let messageurl = 'http://smsjust.com/sms/user/urlsms.php?username=' + username +
                '&pass=' + password +
                '&senderid=' + senderid +
                '&message=' + message +
                '&dest_mobileno=' + mobileno +
                '&msgtype=TXT&dlttempid=' + templateid + '&response=Y';

            let config = {
                method: 'GET',
                url: messageurl,
                headers: {}
            };

            let protocol = httpUrl.parse(messageurl).protocol;
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
                    if (response.status == 200 && response.data.includes('-') && response.data.includes('_')) {
                        console.log(JSON.stringify(response.data));
                        console.log(response.status);
                        done(null, otp, wanumber);
                    } else {
                        return done(response.data);
                    }

                })
                .catch(function (error) {
                    console.log(error);
                    return done(error);
                });
        },
        (otp, wanumber, done) => {
            sendService.fetchFlowSessionId(wanumber, (err, result) => {
                console.log(JSON.stringify(result))
                done(err, otp, wanumber, result[0].id);
            });
        },
        (otp, wanumber, id, done) => {
            sendService.updateOtp(otp, wanumber, id, (err, result) => {
                done(err, result);
            });
        }
    ], (err, result) => {
        if (err) {
            response = {
                code: 100,
                status: "failed",
                data: err
            };

            res.send(response);
        } else {
            response = {
                code: 200,
                status: "success",
                type: "text",
                data: "We have sent you an sms with the one time password on your mobile number.\n\nPlease check your message box and validate"
            };

            res.send(response);
        }
    });
}