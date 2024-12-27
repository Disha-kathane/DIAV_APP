const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {

         //API Validation
        if (!req.headers.apikey) {
         return responseHelper(403, 'API Key is required');
        }

        const apiKey = req.headers.apikey;
        const waNumberID = req.body.wabaNumber;
        const tempID = req.body.tempId;
        
        const { userId, wabaId } = await userService.getUserId(apiKey);
        let tempId = await userService.checkTempId(userId, tempID);
        console.log(tempId);

        if(tempId >= 1){
            return responseHelper(200, 'Valid Temp Id');
        }else{
            return responseHelper(400, 'InValid Temp Id');
        }

       
     } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
      // return responseHelper(error);
    }
}