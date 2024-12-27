const cron = require('node-cron');
const userService = require('../../services/v1/userStat');
const whatsappService = require('../../services/v1/whatsapp');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');
const async = require('async');

module.exports = cron.schedule('*/5 * * * *', function () {
    try {
        //console.log("mycampaigncron");
        let getcampaignstatus = (callback) => {
            userService.getCampaignStatus((err, result) => {
                if (err) {
                    return callback(err.message);
                } else {

                    return callback(null, result);
                }
            });
        }

        async.waterfall([getcampaignstatus], function (err, result) {
            if (err) {
                errorLogger.error(err);
                console.log({ code: 'WA100', status: 'FAILED', message: err.message });
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