const botUtils = require('../../utils/bot');
const whatsappService = require('../../services/v1/whatsapp');
const responseHelper = require('../../utils/responseHelper');
const contactService = require('../../services/v1/contacts');
const userService = require('../../services/v1/users');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {   
    try {
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
        const apiKey = req.headers.apikey;
        const { userId, wabaId } = await userService.getUserId(apiKey);

        // User Validation
        if (!userId) {
            return responseHelper(404, 'Correct API Key is required');
        }
        const { waurl, authtoken, usrnm, usrpass, wanumber } = await userService.getUserSettings(userId);         
        let  result, fileColumnKey;
        const wabaNumber = req.body.wabanumber;
        result = req.body.contacts;
        result = result.toString().replace(/[^0-9]/g, "");
        const validWabaNumber = await userService.checkWabaNumber(userId, wabaNumber)
        
        if (!(validWabaNumber && validWabaNumber.length)) {
            return responseHelper(404, 'WabaNumber is missing.'); 
        } 

        const invalidContacts = [];
        if (!(result.length >= 10)) {
            return responseHelper(404, 'Invalid Number'); 
        }

        let contacts = await contactService.checkgetOneContact( userId, result, wabaNumber);
        if (contacts && contacts.length) {
            return responseHelper(200, 'already optin number'); 
        }else{
            await contactService.insertoptinContacts(result, userId, 0, wabaNumber);
            const countryCode = botUtils.getCountryCode(result);
            if (/^\+/.test(result) == true) {
                result = result.toString().replace('+', '');
            }

            AppendResult = '+' + result;

            try {
                errorLogger.info(waurl);
                let optinResult= await whatsappService.getContactList(authtoken, waurl, [AppendResult]);
                errorLogger.info(optinResult);
                let status = optinResult[0].status;
                console.log(status);
                if(status == 'valid'){
                    statusCode = 1;
                }

                if(status == 'invalid'){
                    statusCode = 2; 
                }

                let waid = optinResult[0].wa_id || null;
                                    
                await contactService.updateContactListopin(result, userId, statusCode, waid, wabaNumber);
                return({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'Contacts Inserted',
                    data: optinResult[0],
                });
            } catch (error) {
                console.log( waurl, [ AppendResult ], wabaNumber);
                errorLogger.error(JSON.stringify(error.toString()));
                return({
                    code: 400,
                    status: 'FAILED',
                });
            }
        }  
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}