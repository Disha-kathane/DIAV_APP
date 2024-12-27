const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {
        const token = req.body.token;
        let waNumber = req.body.waNumber;
        
        const validExpiresDate =  req.body.validExpiresDate;
        const userId = req.body.userId;

        const updateToken = await userService.updateUserSettings(token, validExpiresDate, waNumber, userId);
        console.log("updateToken", JSON.stringify(updateToken));

        if(updateToken.affectedRows != 0){
          return responseHelper(200, 'The Token is updated');
        }else{
          return responseHelper(400, 'The Token is not updated');
        }
       
     } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
      // return responseHelper(error);
    }
}