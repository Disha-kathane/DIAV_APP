const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {

        if(!req.body.tokenNumber){
            return responseHelper(404, 'Correct Token Number is required'); 
        }

        const tokenNumber = req.body.tokenNumber;
        const tempName  =  req.body.tempName;
        let userDetails;

        if(tokenNumber && tokenNumber.length > 1 && tempName && tempName.length > 1){
            userDetails = await userService.getDetailFromTokenNumberTempName(tokenNumber, tempName);
           // console.log("With Template", userDetails);
        }else{
            userDetails = await userService.getDetailFromTokenNumber(tokenNumber);
          //console.log("Without Template", userDetails);
        }

        return userDetails;
       
     } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
      // return responseHelper(error);
    }
}