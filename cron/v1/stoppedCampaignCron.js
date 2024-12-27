const async = require('async');
const { errorLogger, infoLogger } = require('../../applogger');
const botUtils = require('../../utils/bot');
const cron = require('node-cron');
const sendService = require('../../services/v1/send');
const CRON_VAL = '*/1 * * * *';
// const CRON_VAL = '*/1 * * * * *';
let isrunning = true;
const IS_OPTIN = 2;
const semaphore = require('semaphore');
const sem = semaphore(1);

module.exports = cron.schedule(CRON_VAL, async function () {
    try {
        if (isrunning) {
            isrunning = false;

            let fetchStoppedCampaignMessages = (done) => {
                sendService.fetchStoppedCampaignMessages((err, result) => {
                    if (err) {
                        //console.log(err);
                        return done({
                            code: 'WA001', status: 'SUCCESS', message: 'No Records Found'
                        });
                    } else {
                        if (result.length > 0) {
                            // console.log('STOPPED_CAMPAIGN_MASTER==================>'+JSON.stringify(result));
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
                    console.log('StoppedCampaignMessages==================>' + JSON.stringify(msgResult[index]));
                    async.waterfall([
                        (cb) => {
                            sendService.insertStoppedMessagesInStoppedRequestMaster(msgResult[index].id, (err, result) => {
                                if (err) {
                                    console.log('insertStoppedMessagesInStoppedRequestMaster err====================>' + err);
                                }
                                else {
                                    console.log('insertStoppedMessagesInStoppedRequestMaster result====================>' + JSON.stringify(result));
                                    cb(null, result);
                                }
                            });
                        },
                        (result, cb) => {
                            sendService.deleteMessageFromRequestMaster(0, msgResult[index].id, (err, result) => {
                                if (err) {
                                    console.log('deleteStoppedMessageFromRequestMaster err====================>' + err);
                                }
                                else {
                                    console.log('deleteStoppedMessageFromRequestMaster result====================>' + JSON.stringify(result));
                                }
                                cb(err, result);
                            });
                        }
                    ], (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Record shifted to stopped request master(3)');
                        }
                    });

                    if (index == (msgResult.length - 1)) {
                        console.log(index, " = ", msgResult.length - 1);

                        done(null, {
                            code: 200,
                            status: 'SUCCESS',
                            message: 'Stopped Messages Shifted Successfully'
                        });
                    }
                }
            };

            async.waterfall([
                fetchStoppedCampaignMessages,
                processMessage
            ], (err, result) => {
                if (err) {
                    //console.log(err);
                    if (err.code == 'WA001' || err.code == 'WA002') {
                        let waitingTime = 5000 * 2;
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