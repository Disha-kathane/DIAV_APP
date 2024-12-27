const validator = require("email-validator");
const TokenGenerator = require('uuid-token-generator');
const {
    signupValidation,
    loginValidation
} = require('../../services/v1/validation');
const {
    validationResult
} = require('express-validator');
const jwt = require('jsonwebtoken');
const util = require('util');
const {
    json
} = require('body-parser');
// const jwtVerifyAsync = util.promisify(jwt.verify);
const dbpool = require('../../db/wabot');
const userService = require('../../services/v1/users');
const { Console } = require("console");

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
        if (sysToken) {
            userService.fetchUser('', sysToken,
                (err, result) => {
                    if (err) {
                        // console.log("user not exist");
                        // throw err;
                        return res.send({
                            code: "WA100",
                            status: "FAILED",
                            msg: err,
                            data: {}
                        });
                    }
                    if (result) {
                        if (!result.length) {
                            return res.send({
                                code: "WA002",
                                status: "FAILED",
                                message: "User does not exist",
                                data: {}
                            });
                        }
                        const token = jwt.sign({
                            id: result[0].id
                        }, 'the-super-strong-secrect', {
                            expiresIn: expire
                        });
                        userService.updateLastLogin(result[0].id, '', (err, updatelastlogin) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("updateLastLogin", updatelastlogin);
                            }
                        });
                        if (token) {
                            userService.fetchAccessToken(result[0].id, '', (errtoken, resulttoken) => {
                                if (errtoken) {
                                    // throw errtoken;
                                    return res.send({
                                        code: "WA100",
                                        status: "FAILED",
                                        msg: err,
                                        data: {}
                                    });
                                }
                                if (!resulttoken.length) {
                                    userService.insertAccessToken(token, result[0].id, (errit) => {
                                        console.log("insertAccessToken", errit)
                                        if (errit) {
                                            console.log("error in insert access_token");
                                        }
                                    });
                                    return;
                                }
                                userService.updateAccessToken(token, result[0].id, (updatetokenerr, updatetokenres) => {
                                    console.log("updateAccessToken", updatetokenres);
                                    if (updatetokenerr) {
                                        console.log("error occured during update access token");
                                    }
                                })
                            })

                        }
                        return res.status(200).send({
                            code: "200",
                            status: "SUCCESS",
                            message: 'Logged in!',
                            data: {
                                "token": token,
                                "id": result[0].id,
                                "email": result[0].email

                            }

                        });
                    }
                }
            );
        }

    } catch (error) {
        // console.log(error);
        res.status(500);
        res.send({
            code: 'WA100',
            status: 'FAILED',
            message: error.message != undefined ? error.message : 'Request Failed',
            data: {}
        });
    }
}