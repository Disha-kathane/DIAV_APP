const async = require('async');
const { errorLogger, infoLogger } = require('../../applogger');
const botUtils = require('../../utils/bot');
const cron = require('node-cron');
const sendService = require('../../services/v1/send');
const CRON_VAL = '*/1 * * * *';
// const CRON_VAL = '*/10 * * * * *';
let isrunning = true;
const semaphore = require('semaphore');
const sem = semaphore(1);

module.exports = cron.schedule(CRON_VAL, async function () {
    try {
        if (isrunning) {
            isrunning = false;

            let fetchMessages = (cb) => {
                sendService.getUndeletedProcessedMessages((err, result) => {
                    if (err) {
                        // console.log('getUndeletedProcessedMessages err====================>' + JSON.stringify(err));
                        return cb({
                            code: 'WA001', status: 'SUCCESS', message: 'No Records Found'
                        });
                    } else {
                        // console.log('getUndeletedProcessedMessages result====================>' + JSON.stringify(result));
                        if (result.length > 0) {
                            cb(null, result);
                        }
                        else {
                            return cb({
                                code: 'WA002', status: 'SUCCESS', message: 'No Records Found'
                            });
                        }
                    }
                });
            };

            let processMessage = (msgResult, cb) => {
                for (let index = 0; index < msgResult.length; index++) {
                    let bodyContent = null;

                    let objMsg = {};
                    let direction = 1;
                    let wabaCountryCode;
                    let wabaCountryCodeNumeric;

                    async.waterfall([
                        function (done) {
                            sendService.checkIfPresentInSentMaster(msgResult[index].mobileno, msgResult[index].campaignid, (err, isPresentResult) => {
                                if (err) {
                                    // console.log('checkIfPresentInSentMaster err========>' + result[0].c);
                                }
                                else {
                                    console.log('checkIfPresentInSentMaster result========>' + JSON.stringify(isPresentResult));
                                    if (isPresentResult[0].c > 0) {
                                        sendService.deleteMessageFromRequestMaster_Mod(msgResult[index].id, (err, result) => {
                                            if (err) {
                                                console.log('deleteMessageFromRequestMaster_Mod err========>' + JSON.stringify(err));
                                            }
                                            else {
                                                console.log('deleteMessageFromRequestMaster_Mod result========>' + JSON.stringify(result));
                                            }
                                            done(err, result);
                                        });
                                    }
                                    else {
                                        // sendService.updateUnprocessedMessages(msgResult[index].mobileno, msgResult[index].campaignid, msgResult[index].appid, (err, result) => {
                                        //     if (err) {
                                        //         console.log('updateUnprocessedMessages err========>' + JSON.stringify(err));
                                        //     }
                                        //     else {
                                        //         console.log('updateUnprocessedMessages result========>' + JSON.stringify(result));
                                        //     }
                                        //     done(err, result);
                                        // });

                                        sendService.updateUnprocessedMessages_Mod(msgResult[index].id, (err, result) => {
                                            if (err) {
                                                // console.log('updateUnprocessedMessages err========>' + JSON.stringify(err));
                                            }
                                            else {
                                                // console.log('updateUnprocessedMessages result========>' + JSON.stringify(result));
                                            }
                                            done(err, result);
                                        });
                                    }
                                }
                            });
                        }
                    ], function (err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Record shifted to sent master(2)');
                        }
                    });

                    if (index == (msgResult.length - 1)) {
                        console.log(index, " = ", msgResult.length - 1);

                        cb(null, {
                            code: 200,
                            status: 'SUCCESS',
                            message: 'Messages Shifted Successfully'
                        });
                    }
                }
            };

            async.waterfall([
                fetchMessages,
                processMessage
            ], function (err, result) {
                if (err) {
                    // console.log(err);
                    if (err.code == 'WA001' || err.code == 'WA002') {
                        let waitingTime = 5000;
                        console.log('Waiting for ' + waitingTime + 'ms');
                        setTimeout(() => {
                            isrunning = true;
                        }, waitingTime);
                    }
                } else {
                    //console.log(result);
                    isrunning = true;
                }
            });
        }
    }
    catch (error) {
        //console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
});