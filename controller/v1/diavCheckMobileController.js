const sendService = require('../../services/v1/newsend');
let axios = require('axios');

module.exports = async (req, res) => {
    let mobileno = req.params.wanumber;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,PATCH,OPTIONS'
    };

    let response = null;

    if (mobileno != undefined && mobileno.length > 0) {
        let checkMobileNumberResult = await sendService.checkMobileNumber(mobileno);
        console.log({ checkMobileNumberResult });

        if (checkMobileNumberResult > 0) {
            res.send({
                "code": 200,
                "status": "success",
                "type": "text",
                "data": "Mobile number is registered with us.\n\nRegards,\n\nDIAV"
            });
        } else {
            res.send({
                "code": 100,
                "status": "failed",
                "data": "Mobile number is not registered with us.\n\nRegards,\n\nDIAV"
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
