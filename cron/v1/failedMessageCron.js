const async = require('async');
const { errorLogger, infoLogger } = require('../../applogger');
const botUtils = require('../../utils/bot');
const cron = require('node-cron');
const sendService = require('../../services/v1/send');
// const CRON_VAL = '*/1 * * * *';
const CRON_VAL = '*/10 * * * * *';
let isrunning = true;
const IS_OPTIN = 2;
const semaphore = require('semaphore');
const sem = semaphore(1);

module.exports = cron.schedule(CRON_VAL, async function () {
    try {
        if (isrunning) {
            isrunning = false;

            let msg_retry_count = null;

            let fetchMessageConfig = (done) => {
                sendService.fetchMessageConfig((err, result) => {
                    msg_retry_count = parseInt(result[0].retry_count);
                    done(err, parseInt(result[0].retry_count));
                });
            };

            let fetchMessages = (retry_count, done) => {
                sendService.fetchFailedMessages(retry_count, (err, result) => {
                    if (err) {
                        //console.log(err);
                        return done({
                            code: 'WA001', status: 'SUCCESS', message: 'No Records Found'
                        });
                    } else {
                        if (result.length > 0) {
                            done(null, result);
                        }
                        else {
                            return done({
                                code: 'WA002', status: 'SUCCESS', message: 'No Records Found'
                            });
                        }
                    }
                });
            };

            let processMessage = (msgResult, done) => {
                for (let index = 0; index < msgResult.length; index++) {
                    let bodyContent = null;

                    let objMsg = {};
                    let direction = 1;
                    let wabaCountryCode;
                    let wabaCountryCodeNumeric;

                    async.waterfall([
                        function (cb) {
                            if (botUtils.isMobileInternational(msgResult[index].mobileno)) {
                                wabaCountryCode = botUtils.getCountryCode(msgResult[index].mobileno);
                                wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(msgResult[index].mobileno);
                            }

                            // sendService.getNotificationRate(wabaCountryCodeNumeric, msgResult[index].userid, function (err, result) {
                            //     cb(err, result, wabaCountryCodeNumeric);
                            // });
                            let failed_rate = 0;
                            cb(null, failed_rate, wabaCountryCodeNumeric);
                        },
                        function (rate, countrycode, cb) {
                            sendService.checkIfPresentInSentMaster(msgResult[index].mobileno, msgResult[index].campaignid, (err, result) => {
                                console.log('checkIfPresentInSentMaster========>' + result[0].c);
                                if (result[0].c > 0) {
                                    cb(null, rate, countrycode, result[0].c);
                                }
                                else {
                                    cb(null, rate, countrycode, 0);
                                }
                            });
                        },
                        function (rate, countrycode, count, cb) {
                            if (count == 0) {
                                let errorCode = null;
                                let errorDesc = null;
                                let waMessageId = null;
                                if (msgResult[index].isoptin == IS_OPTIN) {
                                    errorCode = 101;
                                    errorDesc = 'Message Failed due to Non-Whatsapp Mobile Number';
                                }
                                else if (msgResult[index].retrycount == msg_retry_count && msgResult[index].senderrorcode == 0) {
                                    errorCode = 102;
                                    errorDesc = 'Message Failed due to Maximum Retry Attempted';
                                }
                                else if (msgResult[index].retrycount == msg_retry_count && msgResult[index].senderrorcode == 400) {
                                    errorCode = 102;
                                    errorDesc = msgResult[index].error;
                                } else {
                                    errorCode = msgResult[index].senderrorcode;
                                    errorDesc = msgResult[index].error;
                                }

                                let readstatus = 3;

                                sendService.insertFailedMessageInSentMaster(msgResult[index].id, msgResult[index].botid, msgResult[index].userid, msgResult[index].mobileno, JSON.stringify(objMsg), waMessageId, msgResult[index].messagetype, msgResult[index].campaignid, msgResult[index].contactno, msgResult[index].msg_setting_id, direction, errorCode, errorDesc, bodyContent, msgResult[index].appid, rate, countrycode, readstatus, msgResult[index].fbtrace_id, msgResult[index].retrycount, function (err, result) {
                                    if (err) {
                                        if (msgResult[index].mobileno.length > 12) {
                                            sendService.insertInvalidContact(msgResult[index].mobileno, msgResult[index].campaignid, msgResult[index].userid, (err, result) => {
                                                cb(err, result);
                                            });
                                        }
                                        console.log('insertFailedMessageInSentMaster err====================>' + err);
                                    }
                                    else {
                                        let insertdata = {
                                            'inserting failed ': {
                                                id: msgResult[index].id,
                                                botid: msgResult[index].botid,
                                                userid: msgResult[index].userid,
                                                mobileno: msgResult[index].mobileno,
                                                objmsg: JSON.stringify(objMsg),
                                                messageid: waMessageId,
                                                messagetype: msgResult[index].messagetype,
                                                campaignid: msgResult[index].campaignid,
                                                contactno: msgResult[index].contactno,
                                                msg_setting_id: msgResult[index].msg_setting_id,
                                                direction: direction,
                                                errcode: errorCode,
                                                errordesc: errorDesc,
                                                bodyContent: bodyContent,
                                                appid: msgResult[index].appid,
                                                rate: rate,
                                                countrycode: countrycode,
                                                readstatus: readstatus,
                                                retrycount: msgResult[index].retrycount
                                            }
                                        };
                                        errorLogger.info(insertdata);
                                        errorLogger.info('insertFailedMessageInSentMaster result====================>' + JSON.stringify(result));
                                        console.log('insertFailedMessageInSentMaster result====================>' + JSON.stringify(result));
                                        cb(null, result);
                                    }
                                });
                            }
                            else {
                                cb(null, count);
                            }
                        },
                        function (result, cb) {
                            sendService.deleteMessageFromRequestMaster(0, msgResult[index].id, function (err, result) {
                                if (err) {
                                    console.log('deleteMessageFromRequestMaster err====================>' + err);
                                }
                                else {
                                    console.log('deleteMessageFromRequestMaster result====================>' + JSON.stringify(result));
                                }
                                cb(err, result);
                            });
                        }
                    ], function (err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Record shifted to sent master(1)');
                        }
                    });

                    if (index == (msgResult.length - 1)) {
                        console.log(index, " = ", msgResult.length - 1);

                        done(null, {
                            code: 200,
                            status: 'SUCCESS',
                            message: 'Messages Shifted Successfully'
                        });
                    }
                }
            };

            async.waterfall([
                fetchMessageConfig,
                fetchMessages,
                processMessage
            ], function (err, result) {
                if (err) {
                    //console.log(err);
                    if (err.code == 'WA001' || err.code == 'WA002') {
                        let waitingTime = 5000;
                        console.log('Waiting for ' + waitingTime + 'ms');
                        setTimeout(() => {
                            isrunning = true;
                        }, waitingTime);
                    }
                } else {
                    // console.log(result);
                    console.log('index =============================================================' + isrunning);
                    isrunning = true;
                }
            });
        }
    }
    catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
});