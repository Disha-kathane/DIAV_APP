const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {

        if (!req.body.flowId) {
            return responseHelper(403, 'Wa  Number is required');
        }

        let flowID = req.body.flowId;
        let toDate = req.body.toDate;
        let fromDate = req.body.fromDate;
        let attributeDetails;
        let attributeList;
        let attributeKey = req.body.attributeKey;
        
        if(flowID && flowID.length > 1){
            return await userService.getAttributeAttrkey(flowID, fromDate, toDate, attributeKey); 
        }

      

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
      // return responseHelper(error);
    }
}