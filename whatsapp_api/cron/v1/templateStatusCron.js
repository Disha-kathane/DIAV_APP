const whatsappService = require('../../services/v1/whatsapp');
const templateService = require('../../services/v1/template')
const cron = require('node-cron');
const moment = require("moment");
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
let CRON_PERIOD = '*/10 * * * *';

module.exports = cron.schedule(CRON_PERIOD, async () => {
    try {
        const AccessToken = await templateService.getSystemAccessToken();
        const access_token = AccessToken[0].value;
        const watemplateStatus = await templateService.getTemplateTitlesUserid();
        console.log({watemplateStatus},watemplateStatus.length);

        if (watemplateStatus && watemplateStatus.length) {
            await Promise.all(watemplateStatus.map(async (item) => {
                const wabaTempTitle = await templateService.getWabaUserId(item.temptitle, item.userid, item.tempid);
                console.log({wabaTempTitle});
                const templateStatus = await whatsappService.getMsgTemplateStatus(item.temptitle, access_token, wabaTempTitle);
                console.log({templateStatus});
                console.log("templateStatus", item.temptitle, templateStatus);
                let statusCode;
                if (templateStatus.toLowerCase() == 'REJECTED'.toLowerCase()) {
                    statusCode = 2;
                } else if (templateStatus.toLowerCase() == 'APPROVED'.toLowerCase()) {
                    statusCode = 1;
                } else if (templateStatus.toLowerCase() == 'DISABLED'.toLowerCase()) {
                    statusCode = 12;
                } else if (templateStatus.toLowerCase() == 'PAUSED'.toLowerCase()) {
                    statusCode = 11;
                } else if (templateStatus.toLowerCase() == 'FLAGGED'.toLowerCase()) {
                    statusCode = 5;
                } else if (templateStatus.toLowerCase() == 'BAD REQUEST'.toLowerCase()) {
                    statusCode = 3;
                } else if (templateStatus.toLowerCase() == 'INVALID REQUEST'.toLowerCase()) {
                    statusCode = 4;
                } else if (templateStatus.toLowerCase() == 'IN REVIEW'.toLowerCase()) {
                    statusCode = 6;
                } else if (templateStatus.toLowerCase() == 'ACTIVE - QUALITY PENDING'.toLowerCase()) {
                    statusCode = 7;
                } else if (templateStatus.toLowerCase() == 'ACTIVE - HIGH QUALITY'.toLowerCase()) {
                    statusCode = 8;
                } else if (templateStatus.toLowerCase() == 'ACTIVE - MEDIUM QUALITY'.toLowerCase()) {
                    statusCode = 9;
                } else if (templateStatus.toLowerCase() == 'ACTIVE - LOW QUALITY'.toLowerCase()) {
                    statusCode = 10;
                } else if (templateStatus.toLowerCase() == 'APPEAL REQUESTED'.toLowerCase()) {
                    statusCode = 13;
                } else {
                    statusCode = 0;
                }
                const responseStatus = await templateService.updateMsgTemplateStatus(statusCode, item.temptitle, item.userid, item.tempid);

                await sleep(30000);

                return;
            }))
        }
    } catch (error) {
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
    }
}, {
    scheduled: false
});


async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}
