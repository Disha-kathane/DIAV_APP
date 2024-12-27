const multer = require('fastify-multer');
const fs = require('fs');
const FormData = require('form-data');
const mime = require('mime-types');
const fastJson = require('fast-json-stringify');
const async = require('async');
const sendService = require('../../services/v2/send');
const optinService = require('../../services/v2/optin');
const { errorLogger, infoLogger } = require('../../applogger1');
const botUtils = require('../../utils/bot1');
const validator = require('validator');

//optin api which is used to optin the number
//New Api made in async and await

module.exports = (req, res) => {
    try {
        errorLogger.info(JSON.stringify(req.body));
        let apiKey = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
        let messageObj = req.body;
        let from = (typeof req.body.from != undefined) ? req.body.from + '' : '';
        let to = (typeof req.body.contact != undefined) ? req.body.contact + '' : '';
        let userId;

        from = from.replace(/ /g, '');
        from = from.replace(/\+/g, '');
        to = to.replace(/ /g, '');
        to = to.replace(/\+/g, '');

        const validateApiKey = async () => {
            try {
                let result = await sendService.getApiKey(apiKey);
                if (result.length > 0 && result != null) {
                    if (result[0].userstatus == 1) {
                        if (result[0].account_type == 0) {
                            userId = result[0].userid;
                            return userId;
                        } else if (result[0].account_type == 1) {
                            if (result[0].balance_amt > 0) {
                                userId = result[0].userid;
                                return userId;
                            } else {
                                return res.send({
                                    code: 'WA036',
                                    status: 'FAILED',
                                    message: 'Insufficient Balance',
                                    data: {}
                                });
                            }
                        }
                    } else {
                        return res.send({
                            code: 'WA001',
                            status: 'FAILED',
                            message: 'User is Inactive',
                            data: {}
                        });
                    }

                } else {
                    return res.send({
                        code: 'WA002',
                        status: 'FAILED',
                        message: 'Authentication Failed',
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


        const wabaInfo = async (userid) => {
            try {
                let wabanumber;
                if (typeof from == undefined || validator.isEmpty(from + '') || from == null) {
                    error = true;
                    return res.send({
                        code: 'WA003',
                        status: 'FAILED',
                        message: 'Mobile number(from or to) is required',
                        data: {}
                    });
                }
                if (typeof to == undefined || validator.isEmpty(to + '') || to == null) {
                    error = true;
                    return res.send({
                        code: 'WA003',
                        status: 'FAILED',
                        message: 'Mobile number(from or to) is required',
                        data: {}
                    });
                }
                if (from.length > 0 && to.length) {
                    let tmpWabaNumber = from.replace(/^91/g, '');
                    let arr = [];
                    arr.push(from, to);
                    for (i = 0; i < arr.length; i++) {
                        if (!tmpWabaNumber.startsWith('9') ||
                            !tmpWabaNumber.startsWith('8') ||
                            !tmpWabaNumber.startsWith('7') ||
                            !tmpWabaNumber.startsWith('6')) {
                            wabaCountryCode = botUtils.getCountryCode(arr[i]);
                            wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(arr[i]);
                        }
                        else {
                            if (botUtils.isMobileInternational(arr[i])) {
                                wabaCountryCode = botUtils.getCountryCode(arr[i]);
                                wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(arr[i]);
                            }
                            else {
                                return res.send({
                                    code: 'WA004',
                                    status: 'FAILED',
                                    message: 'Mobile number(from) must contain Country Code',
                                    data: {}
                                });
                            }
                        }
                    }

                }
                let getSpecificWabaInfoResult = await sendService.getSpecificWabaInfo(userid, from);
                if (getSpecificWabaInfoResult.length > 0) {
                    return getSpecificWabaInfoResult;
                }
                else {
                    return res.send({
                        code: 'WA005',
                        status: 'FAILED',
                        message: 'from number is invalid or not found',
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

        const checkOptin = async (wabaInfo) => {
            try {
                let optinResult = await optinService.checkOptinContactStatus_Mod(from, to);
                // console.log("optinResult", optinResult)
                if (optinResult.length > 0) {
                    if (optinResult[0].wastatus != 1) {
                        return res.send({
                            code: 'WA102',
                            status: 'FAILED',
                            message: 'Non WhatsApp Number',
                            data: {}
                        });

                    } else {
                        return res.send({
                            code: "200",
                            message: 'valid',
                            status: 'SUCCESS',
                            data: {}
                        });
                    }

                } else {
                    return wabaInfo;
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

        const doOptin = async (wabaInfo) => {
            const api = '/v1/contacts';
            const objData = {
                "blocking": "wait",
                "contacts": ['+' + to]
            };
            const httpMethod = 1;
            const requestType = 1;
            const contentLength = Buffer.byteLength(JSON.stringify(objData));
            const apiHeaders = [{
                'headerName': 'Authorization',
                'headerVal': 'Bearer ' + wabaInfo[0].authtoken
            }, {
                'headerName': 'content-length',
                'headerVal': contentLength
            }];

            botUtils.callWhatsAppApi(wabaInfo[0].waurl, api, objData, httpMethod, requestType, apiHeaders).then((response) => {
                // console.log('Optin Response====================>' + JSON.stringify(response.contacts[0].status));
                if (typeof response.contacts != undefined) {
                    let status;
                    if (response.contacts[0].status == 'valid') {
                        status = 1;
                    }
                    if (response.contacts[0].status == 'invalid') {
                        status = 2;
                    }

                    optinService.insertOptinContacts_Mod(to, '+' + from, userId, 0, status).then((result) => {
                        console.log(result);
                        if (status != 1) {
                            return res.send({
                                code: 'WA102',
                                status: 'FAILED',
                                message: 'Non WhatsApp Number',
                                data: {}
                            });

                        } else {
                            return res.send({
                                code: "200",
                                message: 'valid',
                                status: 'SUCCESS',
                                data: {}
                            });
                        }
                    }).catch((err) => {
                        return res.send({
                            code: 'WA100',
                            status: 'FAILED',
                            message: 'Something went wrong(1)',
                            data: {}
                        });
                    });
                } else {
                    return res.send({
                        code: 'WA100',
                        status: 'FAILED',
                        message: 'Something went wrong(2)',
                        data: {}
                    });
                }
            }).catch((err) => {
                return res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message,
                    data: {}
                });
            });
        };

        (async () => {
            try {
                const validateApiKeyResult = await validateApiKey();
                const wabaInfoResult = await wabaInfo(validateApiKeyResult);
                const checkOptinResult = await checkOptin(wabaInfoResult);
                const doOptinResult = await doOptin(checkOptinResult);
            } catch (err) {
                return res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message,
                    data: {}
                });
            }
        })();
    }
    catch (error) {
        errorLogger.error(JSON.stringify(error));
        res.send({
            code: 'WA100',
            status: 'FAILED',
            message: error.message != undefined ? error.message : 'Request Failed',
            data: {}
        });
    }
};

