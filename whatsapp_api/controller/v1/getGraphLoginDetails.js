const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {
        let userName = req.body.username;
        let passWord = req.body.password;

        console.log(req.body);

        if (!userName) {
            return responseHelper(400, 'UserName is required');
        }

        if (!passWord) {
            return responseHelper(400, 'Password is required');
        }

        const loginDetails = await userService.getLoginDetails(userName, passWord);
        //console.log("loginDetails", loginDetails);
        //return responseHelper(200,'LSQ LoginDetails', loginDetails);
        if (loginDetails.length) {
            return responseHelper(200, 'LSQ LoginDetails', loginDetails);
        } else {
            return responseHelper(400, 'Invalid LoginDetails');
        }

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
    }
}