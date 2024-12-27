const botUtils = require('../../utils/bot');
const whatsappService = require('../../services/v1/whatsapp');
const responseHelper = require('../../utils/responseHelper');
const contactService = require('../../services/v1/contacts');
const userService = require('../../services/v1/users');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {   
    try {
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
        const apiKey = req.headers.apikey;
        const { userId, wabaId } = await userService.getUserId(apiKey);

        if (!userId) {
            return responseHelper(404, 'Correct API Key is required');
        }
        if( userId != 751){
           return responseHelper(403, 'Correct User API Key is required'); 
        }
        // User Validation
        
        if (!req.body.wanumber) {
            return responseHelper(403, 'Wa  Number is required');
        }

        let wabaNumber = req.body.wanumber;
        wabaNumber = wabaNumber.toString().replace(/[^0-9]/g, "");
        wabaNumber = '+' + wabaNumber;
        const userIdFromWabaNumber = await userService.getUserIdWithWabaNumber(wabaNumber);
        const apiKeyFromUserId = await userService.getApiKeyfromWabaNumber(userIdFromWabaNumber);
        return({
            code: 200,
            status: 'SUCCESS',
            message: 'API Key for',
            wabaNumber,
            data: apiKeyFromUserId,
        });
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}