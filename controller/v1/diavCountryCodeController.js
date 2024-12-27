const botUtils = require('../../utils/bot');

function isInArray(value, array) {
    return array.indexOf(value) > -1;
}

module.exports = async (req, res) => {
    let mobileno = req.params.wanumber;

    let wabaCountryCodeNumeric = null;

    let countryCode = [1, 44, 353, 61, 49, 33, 34, 39, 46, 47, 358, 975, 977, 64, 91];

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,PATCH,OPTIONS'
    };

    if (mobileno != undefined && mobileno.length > 0) {
        wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(mobileno);
        console.log({ wabaCountryCodeNumeric });

        if (isInArray(wabaCountryCodeNumeric, countryCode) == true) {
            res.send({
                "code": 200,
                "status": "success",
                "type": "text",
                "data": "Mobile number is allowed to chat with us.\n\nRegards,\n\nDIAV"
            });
        } else {
            res.send({
                "code": 100,
                "status": "failed",
                "data": "Mobile number is not allowed to chat with us.\n\nRegards,\n\nDIAV"
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
