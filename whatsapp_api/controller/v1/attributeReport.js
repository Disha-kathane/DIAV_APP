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
        let mobileNumber = req.body.mobileNumber; 

        if(flowID && flowID.length > 1){
            if(attributeKey && attributeKey.length > 1 && mobileNumber && mobileNumber.length > 1){
                attributeDetails = await userService.getAttributewithAttrkeyAndMobile(flowID, fromDate, toDate, attributeKey, mobileNumber); 
            }else if(attributeKey && attributeKey.length > 1){
                attributeDetails = await userService.getAttributewithAttrkey(flowID, fromDate, toDate, attributeKey);  
            }else{
                attributeDetails = await userService.getAttributeDetails(flowID, fromDate, toDate); 
            }

            return await attributeDetails.map((item, i)=> {
                return {
                    attributeDetailsId: attributeDetails[i].id,
                    attributeFlowid: attributeDetails[i].flowid,
                    attributeSessionMobile: attributeDetails[i].session_mobile,
                    attributeCurrentMsgId: attributeDetails[i].current_message_id,
                    attributeMessageContent: attributeDetails[i].message_content.toString(),
                    attributeMessageType: attributeDetails[i].message_type,
                    attributeKey: attributeDetails[i].attrkey,
                    attributevalue: attributeDetails[i].attrvalue.toString(),
                    attributeSessionId: attributeDetails[i].session_id,
                    attributeSessionDt: attributeDetails[i].sessiondt,
                    attributeValidator: attributeDetails[i].validator,
                    attributeIsValidator: attributeDetails[i].is_validator,
                    attributeWebhook: attributeDetails[i].webhook,
                    attributeIsWebhook: attributeDetails[i].is_webhook,
                    attributeIsPlaceholder: attributeDetails[i].is_placeholder,
                    attributeMediaType: attributeDetails[i].mediatype,
                    attributeMediaId: attributeDetails[i].mediaid,
                    attributeMediaURL: attributeDetails[i].mediaurl,
                    attributeIsprocessed: attributeDetails[i].isprocessed
                }
            })
        }

       
       
     } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
      // return responseHelper(error);
    }
}