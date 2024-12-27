const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {
        const responceID = req.body.wabaApprovalResponsedId;
        if(!responceID){
            return responseHelper(400,' Waba Approval Responsed Id is required');
        }

        let checkTempId = await userService.getTempIdFromResponceId(responceID);
        if(checkTempId > 0){ 
            return responseHelper(200,'Valid Responsed Id', checkTempId);
        }else{
            return responseHelper(400,'InValid Responsed Id');
        }

    } catch (error) { 
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
     
    }
}