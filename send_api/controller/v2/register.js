const validator = require("email-validator");
const TokenGenerator = require('uuid-token-generator');
const {
    validationResult
} = require('express-validator');
const jwt = require('jsonwebtoken');
const util = require('util');
const {
    json
} = require('body-parser');

const { errorLogger, infoLogger } = require('../../applogger1');
const dbpool = require('../../db/wabot');
const idfcService = require('../../services/v2/idfc');

module.exports = (req, res) => {
    try {
        errorLogger.info(JSON.stringify(req.body));
        let email = req.body.email;
        const register = async () => {
            try {
                if (validator.validate(email) == false) {
                    return res.send({
                        code: "WA001",
                        status: "FAILED",
                        message: 'Invalid email!',
                        data: {}
                    })
                }
                let fetchUserResult = await idfcService.fetchUser(email, '')
                if (fetchUserResult.length) {
                    const updatetokgen = new TokenGenerator(256, TokenGenerator.BASE62);
                    let updatesystoken = updatetokgen.generate();
                    if (!updatesystoken) {
                        return res.send({
                            code: "WA001",
                            status: "SUCCESS",
                            message: 'System token is not generated!',
                            data: {}
                        });
                    } else {
                        let updateLastLoginResult = await idfcService.updateLastLogin(fetchUserResult[0].id, updatesystoken)
                        return res.send({
                            code: "200",
                            status: "SUCCESS",
                            message: "The system token has been updated successfully!",
                            data: {
                                "SystemToken": updatesystoken
                            }
                        });
                    }
                } else {
                    const tokgen2 = new TokenGenerator(256, TokenGenerator.BASE62);
                    let systoken = tokgen2.generate();
                    if (!systoken) {
                        return res.send({
                            code: "WA002",
                            status: "SUCCESS",
                            message: 'System token is not generated!',
                            data: {}
                        });
                    } else {
                        // has hashed pw => add to database
                        let insertUserResult = await idfcService.insertUser(email, systoken)
                        return res.send({
                            code: "200",
                            status: "SUCCESS",
                            message: "The user has been registered with us!",
                            data: {
                                "SystemToken": systoken
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

        }

        (async () => {
            try {
                const registerResult = await register();
            } catch (err) {
                errorLogger.error(JSON.stringify(err));
                return res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message,
                    data: {}
                });
            }
        })();
    } catch (error) {
        res.send({
            code: 'WA100',
            status: 'FAILED',
            message: error.message != undefined ? error.message : 'Request Failed',
            data: {}
        });
    }
}