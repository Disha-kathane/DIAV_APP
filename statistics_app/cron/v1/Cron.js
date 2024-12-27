const cron = require('node-cron');
const userService = require('../../services/v1/userStat');
const whatsappService = require('../../services/v1/whatsapp');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');
const async = require('async');

module.exports = cron.schedule('*/30 * * * * *', function () {
    try {
        //console.log("mycampaigncron");

        let getcampaignstatus = (callback) => {
            userService.getCampaignStatus((err, result) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        }

        let campaignstatus = (resultArr, callback) => {
            if (resultArr != null && resultArr.length > 0) {
                resultArr.forEach((entry, index) => {
                    const campaign_status = entry.campaign_status;
                    const campaign_id = entry.campaignid;
                    const is_schedule = entry.is_schedule;
                    console.log(is_schedule, campaign_id)
                    console.log(campaign_id, campaign_status, campaign_status);

                    let updateCampaignStatus = (callback1) => {
                        if (campaign_status == 0 && is_schedule == 0) {

                            userService.checkINReqMaster(campaign_id, (err, result) => {
                                if (err) {
                                    callback1(err);
                                }
                                if (result[0].c > 0) {
                                    console.log("upadated status of campaignid whose data is in request master");
                                    userService.updateCampaignStatus(campaign_id, (err, result) => {
                                        if (err) {
                                            callback1(err);
                                        } else {
                                            callback1(null, result);
                                        }

                                    });
                                } else if (result[0].c == 0) {
                                    console.log("upadated status of campaignid whose data is in not request master");
                                    userService.updateCampaignStatus(campaign_id, (err, result) => {
                                        if (err) {
                                            callback1(err);
                                        } else {
                                            callback1(null, result);
                                        }
                                    })
                                }
                            })
                        }
                        else if (campaign_status == 1) {
                            console.log("upadated to 6");
                            userService.checkINReqMaster(campaign_id, (err, result) => {
                                if (err) {
                                    callback1(err);
                                }
                                if (result[0].c == 0) {
                                    userService.updateStatuscompleted(campaign_id, (err, result) => {
                                        if (err) {
                                            callback1(err);
                                        } else {
                                            callback1(null, result);
                                        }
                                    })
                                }
                            })
                        }
                    }

                    async.waterfall([updateCampaignStatus], function (err, result) {
                        if (index == resultArr.length - 1) {
                            if (err) {
                                //console.log(err);
                                callback(err);
                            } else {
                                callback(null, 'Status updated successfully');
                            }
                        }
                    });
                });
            }
        }

        async.waterfall([getcampaignstatus, campaignstatus], function (err, result) {
            if (err) {
                errorLogger.error(err);
                console.log({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message
                });
            } else {
                errorLogger.info(result);
                console.log({
                    code: 200,
                    status: 'SUCCESS',
                    message: result
                });
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