const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {

        if(!req.body.wabaNumber){
            return responseHelper(404, 'Correct Waba Number is required'); 
        }

        if(!req.body.url){
            return responseHelper(404, 'Correct URL Link is required'); 
        }

        let result = req.body.wabaNumber;
        let url = req.body.url;

        if (/^\+/.test(result) == true) {
            result = result.toString().replace('+', '');
        }

        const newURL = url.concat(result);
        const addNewURL = await userService.update(token, validExpiresDate, waNumber, userId);
        return newURL;     
       
     } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
      // return responseHelper(error);
    }
}