const sendService = require('../../services/v1/newsend');
let axios = require('axios');

module.exports = async (req, res) => {
    let mobileno = req.body.mobileno;
    let otp = req.body.otp;

    if (mobileno.length == 0) {
        return res.send({
            code: 100,
            status: 'failed',
            message: 'Mobile number cannot be empty'
        });
    } else if (otp.length == 0) {
        return res.send({
            code: 100,
            status: 'failed',
            message: 'OTP cannot be empty'
        });
    }

    if (mobileno != undefined && mobileno.length > 0 && mobileno.length == 10) {
        let storeDIAVOTPResult = await sendService.checkDIAVOTP(mobileno, otp);
        console.log({ storeDIAVOTPResult });
        if (storeDIAVOTPResult == 0) {
            var data = JSON.stringify({
                "from": "919822028255",
                "to": mobileno,
                "type": "template",
                "message": {
                    "templateid": "96561",
                    "placeholders": []
                }
            });

            var config = {
                method: 'post',
                url: 'https://daivapi.pinnacle.in/v2/wamessage/sendMessage',
                headers: {
                    'apikey': 'a3cae1c2-a54b-11ee-986f-02db41860991',
                    'Content-Type': 'application/json'
                },
                data: data
            };

            let otpverificationfailed = await axios(config);
            if(otpverificationfailed.data.code == 200){
                res.send({
                    code: 100,
                    status: 'failed',
                    message: 'OTP is invalid'
                });
            }else{
                res.send({
                    code: 100,
                    status: 'failed',
                    message: 'Something went wrong(1)'
                });
            }
        } else {
            var data = JSON.stringify({
                "from": "919822028255",
                "to": mobileno,
                "type": "template",
                "message": {
                    "templateid": "96560",
                    "placeholders": []
                }
            });

            var config = {
                method: 'post',
                url: 'https://daivapi.pinnacle.in/v2/wamessage/sendMessage',
                headers: {
                    'apikey': 'a3cae1c2-a54b-11ee-986f-02db41860991',
                    'Content-Type': 'application/json'
                },
                data: data
            };

            let otpverificationsucess = await axios(config);
            if(otpverificationsucess.data.code == 200){
                res.send({
                    code: 200,
                    status: 'success',
                    message: 'OTP verified successfully'
                });
            }else{
                res.send({
                    code: 100,
                    status: 'failed',
                    message: 'Something went wrong(2)'
                });
            }
        }

    } else {
        res.send({
            code: 100,
            status: 'failed',
            message: 'Mobile number is invalid'
        });
    }
};
