const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/users');
const responseHelper = require('../../utils/responseHelper');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {

        if(!req.body.wabaNumber){
            return responseHelper(404, 'Correct Waba Number is required'); 
        }

        if(!req.body.url){
            return responseHelper(404, 'Correct URL Link is required'); 
        }

        let wabaNumber = req.body.wabaNumber;
        let url = req.body.url;

        if (/^\+/.test(wabaNumber) == true) {
            wabaNumber = wabaNumber.toString().replace('+', '');
        }

        AppendwabaNumber = '+' + wabaNumber;
        const pinnacleURL = "https://lsq.pinnacle.in/leadsqueared/customurl/"+ wabaNumber;

        if(AppendwabaNumber && url && pinnacleURL){
            const setwebhookAsPinnacleURL = await whatsappService.updateCustomURL(AppendwabaNumber, url, pinnacleURL);
            const result = await userService.updateWebhookURL(pinnacleURL, AppendwabaNumber);
            return({
                setwebhookAsPinnacleURL
            });
      
        }

        const result = await userService.updateWebhookURL(pinnacleURL, AppendwabaNumber);

        //const result = await userService.updateWebhookURL(req.body.url, AppendwabaNumber);


        console.log("This is patch webhook==============>>>>",result);
         
        res.send({
            code: 200,
            status: 'SUCCESS',
            message: 'Data is updated for the record against the given wabanumber',
            data: {}
        });
        
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.messagetype, null, error);
      // return responseHelper(error);
    }
}