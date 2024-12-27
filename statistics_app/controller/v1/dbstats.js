const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const async = require('async');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');

module.exports = async (req, res) => {
    let dbStats;
    try {
        errorLogger.info(req.body);
        const accessToken = req.body.accessToken;
        const waURL = req.body.waurl;
        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        let apikeys = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
        let getusers = function (callback) {
            userService.getUserId(apikeys, (err, result) => {
                if (err) {
                    // console.log(err);
                    return callback(err.message);
                }
                // console.log('user :' + JSON.stringify(result));
                if (result.length > 0) {
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
                let userstatus = result[0].userstatus;
                if (err) {
                    return callback(err.message);
                } else {
                    callback(null, userid, userstatus);
                }
            });
        }

        let getusersetting = function (userid, userstatus, callback) {
            userService.getUserSettings(userid, '', (err, result) => {
                // console.log(result);
                if (err) {
                    return callback(err.message);
                } else {
                    if (result != null && result.length > 0) {
                        let authtoken = result[0].authtoken;
                        let waurl = result[0].waurl;
                        console.log(authtoken, waurl);
                        callback(null, userid, userstatus, authtoken, waurl);
                    }
                    else {
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

        let fetchuserid = function (userid, userstatus, authtoken, waurl, callback) {
            userService.fetchUserId(userid, (err, [result]) => {
                if (err) {
                    return callback(err.message);
                } else {
                    checkuserid = result
                    callback(null, checkuserid, userid, userstatus, authtoken, waurl);
                }
            });
        }

        let getdbstat = (checkuserid, userid, userstatus, authtoken, waurl, callback) => {
            whatsappService.getDbStat(accessToken, waURL, '/v1/stats/db', (err, result) => {
                if (err) {
                    console.log(err);
                    return callback(err.message);
                } else {
                    dbStats = result.stats.db;
                    // console.log(dbStats);
                    //db_contacts
                    let dbcontacts = dbStats.db_contacts.data;
                    let NonWhatsappUserValue = dbcontacts[0].value;
                    let WhatsappUserValue = dbcontacts[1].value;
                    //db_message_receipt
                    let DbMessageReceipt = dbStats.db_message_receipts;
                    let MessageReceiptValue = DbMessageReceipt.data[0].value;
                    //db_messages
                    let DbMessages = JSON.stringify(dbStats.db_messages.data);
                    //db_pending_callbacks
                    let DbPendingCallbacksValue = dbStats.db_pending_callbacks.data[0].value;
                    //db_pending_messages
                    let DbPendingMessagesValue = dbStats.db_pending_messages.data[0].value;
                    if (userstatus != 0) {
                        // console.log('checkuserid: ' + JSON.stringify(checkuserid));
                        if (checkuserid != undefined && parseInt(checkuserid.userid) != undefined && parseInt(checkuserid.userid) == userid) {
                            console.log('updateDBStats');
                            userService.updateDBStats(userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, (err, result) => {
                                if (err) {
                                    return callback(err.message);
                                } else {
                                    callback(null, result);
                                }
                            });
                        } else {
                            userService.insertDBStats(userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, (err, result) => {
                                console.log('insertDBStats');
                                if (err) {
                                    return callback(err.message);
                                } else {
                                    callback(null, result);
                                }
                            });
                        }
                    }
                }
            });
        }
        async.waterfall([getusers, getuserstatus, getusersetting, fetchuserid, getdbstat], function (err, result) {
            console.log('result0' + result);
            if (err) {
                errorLogger.error(err);
                res.status(err.response != undefined && err.response.status != undefined ? err.response.status : 200);
                res.send({
                    code: 200,
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : 'The specified WABA might be offline or out of service',
                    data: []

                });
            } else {
                errorLogger.info(result);
                res.send({
                    code: 200,
                    status: 'success',
                    message: 'Statestics fetched successfully',
                    data: { dbStats }
                });
            }
        });

    } catch (error) {
        errorLogger.error(JSON.stringify(error));
        res.status(500);
        res.send({
            code: 'WA101',
            status: 'FAILED',
            message: error.message != undefined ? error.message : 'Request Failed',
            data: []
        });
    }
}