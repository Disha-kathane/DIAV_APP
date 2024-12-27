const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
const moment = require("moment");
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {
        // check for basic auth header
        // if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        //     return res.send( 'Missing Authorization Header' );
        // }
        
       

        // const base64Credentials =  req.headers.authorization.split(' ')[1];
        // const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        // const [username, password] = credentials.split(':');
        // console.log(username,password);

        const userName = req.headers.username;
        const passWord = req.headers.password;
        const userDetails = await userService.getUserIdFromUsernameandPassword(userName,passWord);

        return userDetails;
       
        // const { token, expires_after } = await whatsappService.userLogin(userDetails.waurl, userDetails.username, userDetails.userpass);
        //     const validExpiresDate = moment(expires_after).format('YYYY-MM-DD HH:mm:ss')
        //     await userService.updateUserSettings(token, validExpiresDate, userDetails.wabanumber, userDetails.userid);
        //     return responseHelper(200,'Token Generated', {
        //         token: token,
        //         validity: expires_after
        //     }
        // );


     } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
      // return responseHelper(error);
    }
}