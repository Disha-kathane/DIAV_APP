const userService = require('../../services/v1/users');
const whatsappService = require('../../services/v1/whatsapp');
const cron = require('node-cron');
const moment = require("moment");

module.exports = cron.schedule('*/30 * * * * *', async () => {
    try {
        const expiredUsers = await userService.getExpiredUsers();
        if (expiredUsers && expiredUsers.length) {
            await Promise.all(expiredUsers.map(async (item) => {
                const { waurl, authtoken, usrnm, usrpass, wanumber } = await userService.getUserSettings(item.userid);
                const { token, expires_after }  = await whatsappService.userLogin(waurl, usrnm, usrpass);
                const validExpiresDate = moment(expires_after).format('YYYY-MM-DD HH:mm:ss')
                return userService.updateUserSettings(token, validExpiresDate, item.userid);
            }))
        }
        return;
    } catch (error) {
        console.log(error);
    }
}, {
    scheduled: false
})