const async = require('async');
const optoutService = require('../../services/v2/optout');
const { errorLogger, infoLogger } = require('../../applogger1');


//optout api to delete the contact 
//New code made in async await 

module.exports = (req, res) => {
    try {
        errorLogger.info(JSON.stringify(req.body));
        let apikeys = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
        let contactno = (typeof req.body.from != undefined) ? req.body.from + '' : '';
        let wanumber = (typeof req.body.contact != undefined) ? req.body.contact + '' : '';
        let appendcontactno = '+' + contactno;
        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        if (!req.body.from) {
            return {
                code: 'WA002',
                status: 'FAILED',
                message: 'From number is required',
                data: {}
            };
        }
        if (!req.body.contact) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'To number is required',
                data: {}
            };
        }

        let getusers = async () => {
            try {
                let result = await optoutService.getOptoutUserId(apikeys);
                if (result != null && result.length > 0) {
                    userid = result[0].userid;
                    return userid;
                } else {
                    res.send({
                        code: 'WA004',
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: {}
                    });
                }
            } catch (err) {
                return res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message,
                    data: {}
                });

            }

        };

        let deletecontact = async (userid) => {
            try {
                let result = await optoutService.deleteContact(userid, appendcontactno, wanumber);
                let rows = result.affectedRows;
                if (rows == 0) {
                    return res.send({
                        code: 'WA005',
                        status: 'FAILED',
                        message: 'No Record Found',
                        data: {}
                    });
                } else {
                    return res.send({
                        code: "200",
                        status: 'SUCCESS',
                        message: 'Whatsapp Number Opted Out Successfully',
                        data: {}
                    });
                }

            } catch (err) {
                return res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message,
                    data: {}
                });

            }

        };




        (async () => {
            try {
                const getusersResult = await getusers();
                const deletecontactResult = await deletecontact(getusersResult);
            } catch (err) {
                return res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message,
                    data: {}
                });
            }
        })();
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

