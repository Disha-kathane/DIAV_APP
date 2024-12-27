const whatsappService = require('../../services/v1/whatsapp');
const templateService = require('../../services/v1/template')
const cron = require('node-cron');
const moment = require("moment");
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = cron.schedule(' */10 * * * *', async () => {
    try {

        axios.get('https://whatsapp-api.leadsquaredapps.com/WhatsAppClientNotificationsWebhook?id=f24a7c23598f1e87a45c80b22294f201&businessNumber=919922440508')
        .then(function (response) {
            // handle success
            console.log(response);
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .then(function () {
            // always executed
        });

    } catch (error) {
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
    }
}, {
    scheduled: false
})