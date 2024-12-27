const validator = require("email-validator");
const TokenGenerator = require('uuid-token-generator');
const {
    validationResult
} = require('express-validator');
const { errorLogger, infoLogger } = require('../../applogger1');
const jwt = require('jsonwebtoken');
const util = require('util');
const {
    json
} = require('body-parser');
const dbpool = require('../../db/wabot');
const idfcService = require('../../services/v2/idfc');


module.exports = async (req, res) => {
    try {
        let expire = "24h";
        if (!req.headers.systemtoken) {
            return res.send({
                code: "WA001",
                status: "FAILED",
                message: "System token is required",
                data: {}
            });
        }
        let sysToken = req.headers.systemtoken;
        const login = async () => {
            try {
                if (sysToken) {
                    let fetchuserResult = await idfcService.fetchUser('', sysToken);
                    if (fetchuserResult) {
                        if (!fetchuserResult.length) {
                            return res.send({
                                code: "WA002",
                                status: "FAILED",
                                message: "User does not exist",
                                data: {}
                            });
                        }
                        const token = jwt.sign({
                            id: fetchuserResult[0].id
                        }, 'the-super-strong-secrect', {
                            expiresIn: expire
                        });
                        let updatelastloginResult = await idfcService.updateLastLogin(fetchuserResult[0].id, '');
                        if (updatelastloginResult.length > 0) {
                            console.log("updateLastLogin", updatelastlogin);
                        }
                        if (token) {
                            let resulttoken = await idfcService.fetchAccessToken(fetchuserResult[0].id, '');
                            if (!resulttoken.length) {
                                let insertResult = idfcService.insertAccessToken(token, fetchuserResult[0].id);
                                if (insertResult.length > 0) {
                                    console.log("error in insert access_token", insertResult);
                                }
                            }
                        }
                        let updatetokenres = await idfcService.updateAccessToken(token, fetchuserResult[0].id);
                        // console.log("updateAccessToken", updatetokenres);
                        return res.status(200).send({
                            code: "200",
                            status: "SUCCESS",
                            message: 'Logged in!',
                            data: {
                                "token": token,
                                "id": fetchuserResult[0].id,
                                "email": fetchuserResult[0].email
                            }

                        });
                    }

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

        await (async () => {
            try {
                const loginResult = await login();
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
};