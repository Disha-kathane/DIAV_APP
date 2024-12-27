const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {

        if (!req.body.waNumber) {
            return responseHelper(403, 'Correct waNumber is required');
        }

        var waNumberID = req.body.waNumber;
        if(!waNumberID){
            return responseHelper(400,'waNumber is required');
        }

        waNumberID = waNumberID.toString().replace(/[^0-9]/g, "");
        
        if (!(waNumberID.length >= 10)) {
            return responseHelper(404, 'Invalid Number'); 
        }

        if (/^\+/.test(waNumberID) == true) {
            waNumberID = waNumberID.toString().replace('+', '');
        }

        AppendResult = '+' + waNumberID;
        const userid = await userService.getUserIdFromWanumber(AppendResult);
        const flowTitle = await userService.getFlowTitles(userid);

        return ({
            flowDetails: flowTitle
        });
       
    } catch (error) {
       console.log(error);
       errorLogger.error(JSON.stringify(error));
       return responseHelper(500, error.messagetype, null, error);
     // return responseHelper(error);
   }
}