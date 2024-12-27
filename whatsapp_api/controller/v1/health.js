const userService = require('../../services/v1/userStat');
const async = require('async');
let appLoggers = require('../../applogger.js');
const {
    callWebhook
} = require('../../utils/bot');
let errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    let updatewaGetHealthStatus;
    let wastatus;
    try {
        console.log(req.body);
        let apikeys = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
        let wanumber = (typeof req.body.wanumber != undefined) ? req.body.wanumber + '' : '';
        wanumber = wanumber.replace("+","");
        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }

        let getusers = function (callback) {
            userService.getUserId(apikeys, (err, result) => {
                if (err) {
                    callback(err);
                }

                if (result != null && result.length > 0) {
                    userid = result[0].userid;
                    callback(null, userid);

                } else {
                    res.send({
                        code: 'WA002',
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: {}
                    });
                }
            });
        }

        let getuserstatus = function (userid, callback) {
            userService.getUserStatus(userid, (err, result) => {
                console.log("In get userstatus");
                if (err) {
                    callback(err);
                } else {
                    const userstatus = result[0].userstatus;
                    callback(null, userstatus, userid);

                }
            });
        }

        let getusersetting = function (userstatus, userid, callback) {
            if (userstatus != 0) {
                userService.getUserSettings(userid, wanumber, (err, result) => {
                    console.log("In get settings")
                    if (err) {
                        callback(err);
                    } else {
                        if (result != undefined && result != null && result.length > 0) {
                            const authtoken = result[0].authtoken;
                            const waurl = result[0].waurl;
                            callback(null, authtoken, waurl);
                        } else {
                            res.send({
                                code: 'WA003',
                                status: 'FAILED',
                                message: 'No User Found',
                                data: {}
                            });
                        }
                    }
                });
            }
        }

        let gethealth = function (authtoken, waurl, callback) {
            whatsappService.getHealth(authtoken, waurl, '/v1/health', (err, result) => {
                console.log("In get health")
                if (err) {
                    callback(err);
                } else {
                    wastatus = result.health.gateway_status
                    if (wastatus == 'connected') {
                        updatewaGetHealthStatus = '1';
                    } else if (wastatus == 'connecting') {
                        updatewaGetHealthStatus = '2';
                    } else if (wastatus == 'disconnected') {
                        updatewaGetHealthStatus = '3';
                    } else if (wastatus == 'uninitialized') {
                        updatewaGetHealthStatus = '4';
                    } else {
                        updatewaGetHealthStatus = '5';
                    }
                    callback(null, updatewaGetHealthStatus);
                }
            });
        }

        async.waterfall([getusers, getuserstatus, getusersetting, gethealth], function (err, result) {
            if (err) {
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err

                });
            } else {
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'Health fetched Successfully',
                    data: [{
                        health: wastatus
                    }]
                });
            }
        });
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}