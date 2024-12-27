const whatsappService = require('../../services/v1/whatsapp');
const templateService = require('../../services/v1/template')
const cron = require('node-cron');
const moment = require("moment");

module.exports = cron.schedule('*/5 * * * * *', async () => {
    try {
        const AccessToken = await templateService.getSystemAccessToken();
        const access_token = AccessToken[0].value;
        const watemplateStatus = await templateService.getTemplateTitles();
        if (watemplateStatus && watemplateStatus.length) {
            await Promise.all(watemplateStatus.map(async (item) => {

                const wabaId = await templateService.getWabaId(item.temptitle);
                console.log('wabaID:' + wabaId);
                const templateStatus = await whatsappService.getMsgTemplateStatus(item.temptitle, access_token, wabaId);
                console.log(templateStatus);
                let statusCode;
                if (templateStatus == 'REJECTED') {
                    statusCode = 2;
                } else if (templateStatus == 'APPROVED') {
                    statusCode = 1;
                } else {
                    statusCode = 0;
                }
                const responseStatus = await templateService.updateMsgTemplateStatus(statusCode, item.temptitle);
                return;
            }))
        }
    } catch (error) {
        // console.log(error);
    }
}, {
    scheduled: false
})
