const whatsappService = require('../../services/v1/whatsapp');
const templateService = require('../../services/v1/template');
const cron = require('node-cron');
const moment = require("moment");
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = cron.schedule(' */1 * * * *', async () => {
    try {
        const AccessToken = await templateService.getSystemAccessToken();
        const access_token = AccessToken[0].value;
        const watemplateStatus = await templateService.getTemplateCategoryUserid();
        console.log({ watemplateStatus });
        if (watemplateStatus && watemplateStatus.length) {
            await Promise.all(watemplateStatus.map(async (item) => {
                const wabaId = await templateService.getWabaUserId_1(item.temptitle, item.userid, item.tempid);
                console.log({ wabaId });
                if (wabaId == 0) {
                    const responseStatus = await templateService.updateMsgTemplateStatus(-1, item.temptitle, item.userid, item.tempid);
                    return;
                } else {
                    const templateCategory = await whatsappService.getMsgTemplateCategory(item.temptitle, access_token, wabaId);
                    console.log({ templateCategory });
                    console.log("templateCategory", item.temptitle, templateCategory);
                    if (templateCategory.length > 0) {
                        let currentCategory = templateCategory[0].category;
                        let previousCategory = templateCategory[0].previous_category != undefined ? templateCategory[0].previous_category : null;
                        let id = templateCategory[0].id;
                        console.log({ currentCategory });
                        console.log({ previousCategory });
                        // let statusCode;
                        // if (templateStatus == 'REJECTED') {
                        //     statusCode = 2;
                        // } else if (templateStatus == 'APPROVED') {
                        //     statusCode = 1;
                        // } else {
                        //     statusCode = 0;
                        // }
                        const responseStatus = await templateService.updateMsgTemplateCategory(currentCategory, previousCategory, item.temptitle, item.userid, item.tempid, id);
                        console.log({ responseStatus });
                        return;
                    } else {
                        const responseStatus = await templateService.updateMsgTemplateStatus(-1, item.temptitle, item.userid, item.tempid);
                        return;
                    }
                }
            }));
        }
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
    }
}, {
    scheduled: false
});
