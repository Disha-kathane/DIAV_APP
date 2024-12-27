const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;


module.exports = async (req, res) => {
    try {

        if (!req.body.wanumber) {
            return responseHelper(403, 'Wa  Number is required');
        }

        let waNumberID = req.body.wanumber;
        const { userId, wabaId } = await userService.getUserIdFromWaNumber(waNumberID);
        console.log({userId});
        const { waurl, authtoken, usrnm, usrpass, wanumber } = await userService.getUserSettingsFromUserId(userId);   
        
        const access_token = await userService.fetchAccessToken();
        console.log("access_toeken ================>", access_token);
    
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
        const wabaNumber = await userService.getWabanumber(userId);
        let PhoneResult = await whatsappService.getPhoneNumberId(wabaNumber, access_token);
        var Id =[];
  
        for(let i = 0 ;i < PhoneResult.data.length; i++ ){
            console.log('waNumberID: '+waNumberID);
            console.log('JSON.stringify(PhoneResult.data[i].display_phone_number).toString().replace(/[^0-9]/g, ""): '+JSON.stringify(PhoneResult.data[i].display_phone_number).toString().replace(/[^0-9]/g, ""));
            if(JSON.stringify(PhoneResult.data[i].display_phone_number).toString().replace(/[^0-9]/g, "") == waNumberID ){
                Id = PhoneResult.data[i].id;
            }
        }

        return({
            code: 200,
            status: 'SUCCESS',
            message: 'Waba Phone Id',
            Id,
        });

    } catch (error) { 
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
     
    }
}