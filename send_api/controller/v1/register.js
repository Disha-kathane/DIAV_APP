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

module.exports = (req, res) => {
    // router.post('/register', signupValidation, (req, res, next) => {
    try {

        let email = req.body.email;
        if (validator.validate(email) == false) {
            return res.send({
                code: "WA001",
                status: "FAILED",
                message: 'Invalid email!',
                data: {}
            })
        }
        userService.fetchUser(email, '', (err, result) => {
            // console.log(result)
            if (result.length) {
                const updatetokgen = new TokenGenerator(256, TokenGenerator.BASE62);
                let updatesystoken = updatetokgen.generate();
                if (!updatesystoken) {
                    return res.send({
                        code: "WA001",
                        status: "SUCCESS",
                        message: 'System token is not generated!',
                        data: {}


                    });
                }
                userService.updateLastLogin(result[0].id, updatesystoken, (err, result) => {
                    if (err) {
                        console.log("Updation of user is failed");
                    }
                    // console.log("result============", result)
                    return res.send({
                        code: "200",
                        status: "SUCCESS",
                        message: "The system token has been updated successfully!",
                        data: {
                            "SystemToken": updatesystoken
                        }
                    });
                }
                );
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
                    userService.insertUser(email, systoken, (err, result) => {
                        if (err) {
                            console.log("Insertion of user is failed");
                        }
                        return res.send({
                            code: "200",
                            status: "SUCCESS",
                            message: "The user has been registered with us!",
                            data: {
                                "SystemToken": systoken
                            }
                        });
                    });
                }

            }
        }

        );
    } catch (error) {
        // res.status(500);
        res.send({
            code: 'WA100',
            status: 'FAILED',
            message: error.message != undefined ? error.message : 'Request Failed',
            data: {}
        });
    }
}