const cron = require('node-cron');
const userService = require('../../services/v1/userStat');
const whatsappService = require('../../services/v1/whatsapp');
const async = require('async');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');

module.exports = cron.schedule('*/5 * * * * *', function () {
    try {
        //console.log("DBStats Scheduler");
        let getapikeys = (callback) => {
            userService.getApiKey((err, result) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        }
        let getusers = (resultArr, callback) => {
            if (resultArr != null && resultArr.length > 0) {
                resultArr.forEach((entry, index) => {
                    const apikeys = entry.apikey;
                    let getuserids = (callback1) => {
                        userService.getUserId(apikeys, (err, result) => {
                            if (err) {
                                callback1(err);
                            } else {
                                callback1(null, result);
                            }
                        });
                    }
                    let getuserstatus = (result, callback1) => {
                        const userid = result[0].userid;
                        userService.getUserStatus(userid, (err, [result]) => {
                            if (err) {
                                callback1(err);
                            } else {
                                const userstatus = result.userstatus;
                                callback1(null, userid, userstatus);
                            }
                        });
                    }
                    let getusersetting = (userid, userstatus, callback1) => {
                        userService.getUserSettings(userid, '', (err, result) => {
                            if (err) {
                                callback1(err);
                            } else {
                                if (result != null && result.length > 0) {
                                    const authtoken = result[0].authtoken;
                                    const waurl = result[0].waurl;
                                    callback1(null, userid, userstatus, authtoken, waurl);
                                }
                            }
                        });
                    }
                    let fetchuserid = (userid, userstatus, authtoken, waurl, callback1) => {
                        userService.fetchUserId(userid, (err, [result]) => {
                            if (err) {
                                callback1(err);
                            } else {
                                checkuserid = result;
                                callback1(null, checkuserid, userid, userstatus, authtoken, waurl);
                            }
                        });
                    }
                    let getdbstat = (checkuserid, userid, userstatus, authtoken, waurl, callback1) => {
                        whatsappService.getDbStat(authtoken, waurl, '/v1/stats/db', (err, result) => {
                            if (err) {
                                callback1(err);
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
                                    //console.log('checkuserid: '+JSON.stringify(checkuserid));
                                    if (checkuserid != undefined && parseInt(checkuserid.userid) != undefined && parseInt(checkuserid.userid) == userid) {
                                        console.log('updateDBStats');
                                        userService.updateDBStats(userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, (err, result) => {
                                            if (err) {
                                                callback1(err);
                                            } else {
                                                callback1(null, result);
                                            }
                                        });
                                    } else {
                                        userService.insertDBStats(userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, (err, result) => {
                                            console.log('insertDBStats');
                                            if (err) {
                                                callback1(err);
                                            } else {
                                                callback1(null, result);
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                    async.waterfall([getuserids, getuserstatus, getusersetting, fetchuserid, getdbstat], function (err, result) {
                        if (index == resultArr.length - 1) {
                            if (err) {
                                //console.log(err);
                                callback(err);
                            } else {
                                callback(null, 'Statestics fetched successfully');
                            }
                        }
                    });
                });
            }
        }
        async.waterfall([getapikeys, getusers], function (err, result) {
            if (err) {
                errorLogger.error(err);
                console.log(err.response.status);
                console.log({ code: 100, status: 'FAILED', message: err });
            } else {
                errorLogger.info(result);
                console.log({ code: 200, status: 'SUCCESS', message: result });
            }
        });
    } catch (error) {
        errorLogger.error(JSON.stringify(error));
        //res.status(500);
        console.log({
            code: 'WA101',
            status: 'FAILED',
            message: error.message,
            data: []
        });
    }
});