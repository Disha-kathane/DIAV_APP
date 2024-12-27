const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const appLoggers = require('../../applogger.js');
const async = require('async');
const errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    let dbStats;
    try {

        if (!req.headers.apikey) {
            return {
                code: 403,
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        const headers = req.headers;
        const apikeys = (typeof headers.apikey != 'undefined') ? headers.apikey + '' : '';
        let getusers = function (callback) {
            userService.getUserId(apikeys, (err, result) => {
                if (err) {
                    callback(err);
                }
                console.log('user :'+JSON.stringify(result));
                if (result.length > 0) {
                    userid = result[0].userid;
                    callback(null, userid);

                } else {
                    res.send({
                        code: 400,
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: {}
                    });
                }
            });
        }

        let getuserstatus = function (userid, callback) {
            userService.getUserStatus(userid, (err, result) => {
                const userstatus = result[0].userstatus;
                if (err) {
                    callback(err);
                } else {
                    callback(null, userid, userstatus);
                }

            });

        }

        let getusersetting = function (userid, userstatus, callback) {
            userService.getUserSettings(userid,'', (err, result) => {
                if (err) {
                    callback(err);
                } else {
                    if (result != null && result.length > 0) {
                        const authtoken = result[0].authtoken;
                        const waurl = result[0].waurl;
                        callback(null, userid, userstatus, authtoken, waurl);
                    }
                }

            });
        }

        let fetchuserid = function (userid, userstatus, authtoken, waurl, callback) {
            userService.fetchUserId(userid, (err, [result]) => {
                if (err) {
                    callback(err);
                } else {
                    checkuserid = result
                    callback(null, checkuserid, userid, userstatus, authtoken, waurl);
                }
            });
        }

        let getdbstat = (checkuserid, userid, userstatus, authtoken, waurl, callback) => {
            whatsappService.getDbStat(authtoken, waurl, '/v1/stats/db', (err, result) => {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    dbStats = result.stats.db;
                    //db_contacts
                    const dbcontacts = dbStats.db_contacts.data;
                    const NonWhatsappUserValue = dbcontacts[0].value;
                    const WhatsappUserValue = dbcontacts[1].value;
                    //db_message_receipt
                    const DbMessageReceipt = dbStats.db_message_receipts;
                    const MessageReceiptValue = DbMessageReceipt.data[0].value;
                    //db_messages
                    const DbMessages = JSON.stringify(dbStats.db_messages.data);
                    //db_pending_callbacks
                    const DbPendingCallbacksValue = dbStats.db_pending_callbacks.data[0].value;
                    //db_pending_messages
                    const DbPendingMessagesValue = dbStats.db_pending_messages.data[0].value;
                    if (userstatus != 0) {
                        console.log('checkuserid: ' + JSON.stringify(checkuserid));
                        if (checkuserid != undefined && parseInt(checkuserid.userid) != undefined && parseInt(checkuserid.userid) == userid) {
                            console.log('updateDBStats');
                            userService.updateDBStats(userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, (err, result) => {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, result);
                                }
                            });
                        } else {
                            userService.insertDBStats(userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, (err, result) => {
                                console.log('insertDBStats');
                                if (err) {
                                    callback(err);
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
            console.log('result0'+result);
            if (err) {
                res.send({
                    code: '100',
                    status: 'FAILED',
                    message: err

                });
            } else {
                res.send({
                    code: 200,
                    status: 'success',
                    message: 'Statestics fetched successfully',
                    data: []
                });
            }
        });

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}