const sendService = require('../../services/v1/newsend');
let axios = require('axios');

module.exports = async (req, res) => {
    let mobileno = req.body.mobileno;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,PATCH,OPTIONS'
    };

    let response = null;

    if (mobileno != undefined && mobileno.length > 0 && mobileno.length == 10) {
        let otp = Math.floor(100000 + Math.random() * 900000);

        console.log({ otp });

        let otpdata = JSON.stringify({
            "from": "919822028255",
            "to": mobileno,
            "type": "template",
            "message": {
                "templateid": "96559",
                "placeholders": [
                    otp
                ]
            }
        });

        let config = {
            method: 'post',
            url: 'https://daivapi.pinnacle.in/v2/wamessage/sendMessage',
            headers: {
                'apikey': 'a3cae1c2-a54b-11ee-986f-02db41860991',
                'Content-Type': 'application/json'
            },
            data: otpdata
        };

        let otpresult = await axios(config);
        console.log(otpresult.data);
        if (otpresult.data.code == 200) {
            let storeDIAVOTPResult = await sendService.storeDIAVOTP(mobileno, otp);
            console.log({ storeDIAVOTPResult });

            if (storeDIAVOTPResult.affectedRows > 0) {
                res.send({
                    code: 200,
                    status: 'success',
                    message: 'OTP sent successfully'
                });                
            } else {
                res.send({
                    code: 100,
                    status: 'failed',
                    message: 'Something went wrong(1)'
                });
            }
        } else {
            res.send({
                code: 100,
                status: 'failed',
                message: 'Something went wrong(2)'
            });
        }

    } else {
        res.send({
            code: 100,
            status: 'failed',
            message: 'Mobile number is invalid'
        });
    }
};
