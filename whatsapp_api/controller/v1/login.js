const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
const moment = require("moment");
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }

        if (!req.body.wanumber) {
            return responseHelper(403, 'Wa  Number is required');
        }

        const waNumber = req.body.wanumber;
        const apiKey = req.headers.apikey;
        const { userId, wabaId } = await userService.getUserId(apiKey);
        // User Validation
        if (!userId) {
            return responseHelper(404, 'Correct API Key is required');
        }
        // const { waurl, authtoken, usrnm, usrpass, wanumber } = await userService.getUserSettings(userId); 
        const validateWabaNumber = await userService.checkWabaNumber(userId, waNumber);

        //console.log(validateWabaNumber.length);

        if(!validateWabaNumber.length){
            return responseHelper(404, 'Correct Wa Number is required');  
        }
        const { waurl, authtoken, usrnm, usrpass, wanumber } = await userService.getLoginSettings(waNumber); 

        const { token, expires_after } = await whatsappService.userLogin(waurl, usrnm, usrpass);
            const validExpiresDate = moment(expires_after).format('YYYY-MM-DD HH:mm:ss')
            await userService.updateUserSettings(token, validExpiresDate, waNumber, userId);
            return responseHelper(200,'Token Generated', {
                token: token,
                validity: expires_after
            }
        );
        
     } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
      // return responseHelper(error);
    }
}