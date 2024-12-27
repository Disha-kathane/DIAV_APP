const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
const moment = require("moment");

module.exports = async (req, res) => {
    try {
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
        const apiKey = req.headers.apikey;
        const { userId, wabaId } = await userService.getUserId(apiKey);
        // User Validation
        if (!userId) {
            return responseHelper(404, 'Correct API Key is required');
        }
        const { waurl, authtoken, usrnm, usrpass, wanumber } = await userService.getUserSettings(userId);
        const { token, expires_after } = await whatsappService.userLogin(waurl, usrnm, usrpass);
        const validExpiresDate = moment(expires_after).format('YYYY-MM-DD HH:mm:ss')
        await userService.updateUserSettings(token, validExpiresDate, userId)
        return ({
            code: 200,
            status: 'SUCCESS',
            message: 'Token Generated',
            data: {
                token: token,
                validity: expires_after
            }
        });
    } catch (error) {
        console.log(error);
        return error;
    }
}