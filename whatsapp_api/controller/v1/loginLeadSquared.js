const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {
        const loginDetails = req.body;
        if (loginDetails.authenticate == 1){
            const checkUser = await userService.validUserNameandPassword(loginDetails.username, loginDetails.password, loginDetails.whatsappNumber );
            if(checkUser > 0){
                const getapiKey = await userService.getApiKeyfromWabaNumber(checkUser);
                return responseHelper(200,'Valid User',getapiKey);
            }else{
                return responseHelper(400,'InValid User');
            }
        }

        if (loginDetails.authenticate == 0){
            const checkUserAPIKey = await userService.getUserAPIKey(loginDetails.apikey, loginDetails.whatsappNumber );
            if(checkUserAPIKey > 0){
                const UserNameandPassword = await userService.getUserNameandPassword(checkUserAPIKey);
                return responseHelper(200,'Valid User',UserNameandPassword);
            }else{
                return responseHelper(400,'InValid User');
            }
        }

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
     
    }
}