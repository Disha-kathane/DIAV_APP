const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {

        let waNumberID = req.body.wanumber;
        const apiKeyID = req.body.apikey;

        if(!waNumberID){
            return responseHelper(400,'waNumber is required');
        }

        if(!apiKeyID){
            return responseHelper(400,'apiKey is required');
        }

        waNumberID = waNumberID.toString().replace(/[^0-9]/g, "");
        if (!(waNumberID.length >= 10)) {
            return responseHelper(404, 'Invalid Number'); 
        }

        if (/^\+/.test(waNumberID) == true) {
            waNumberID = waNumberID.toString().replace('+', '');
        }

        AppendResult = '+' + waNumberID;
        
        const checkAPIKey = await userService.getAPIKeyForLeadSqared(AppendResult, apiKeyID);
        if(parseInt(checkAPIKey) == 1){
            return responseHelper(200,'Valid ApI');
        }else{
            return responseHelper(400,'InValid ApI');
        }

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
     
    }
}