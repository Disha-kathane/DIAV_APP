const userService = require('../../services/v1/users');
const whatsappService = require('../../services/v1/whatsapp');
const cron = require('node-cron');
const moment = require("moment");

var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
var infoLogger = appLoggers.infoLogger;

const CRON_VAL = '0 1 * * *';

// const CRON_VAL = '*/30 * * * * *';

module.exports = cron.schedule(CRON_VAL, async () => {
    try {
        // const expiredUsers = await userService.getExpiredUsers();
        const expiredUsers = await userService.getLoginExpiredUsers();
        if (expiredUsers && expiredUsers.length) {
            await Promise.all(expiredUsers.map(async (item) => {
                // const { waurl, authtoken, usrnm, usrpass, wanumber } = await userService.getUserSettings(item.userid);
                const { waurl, authtoken, usrnm, usrpass, wanumber } = await userService.getLoginSettings(item.wanumber); 
                const { token, expires_after }  = await whatsappService.userLogin(waurl, usrnm, usrpass);
                const validExpiresDate = moment(expires_after).format('YYYY-MM-DD HH:mm:ss')
                errorLogger.info(token, validExpiresDate, wanumber, item.userid);
                return userService.updateUserSettings(token, validExpiresDate, wanumber, item.userid);
                console.log("Done");
                
            }))
        }
        return;
    } catch (error) {
        console.log(error);
    }
}, {
    scheduled: false
})