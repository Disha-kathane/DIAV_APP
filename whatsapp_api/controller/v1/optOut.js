const contactService = require('../../services/v1/contacts');
const userService = require('../../services/v1/users');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {
        if (!req.headers.apikey) {
            return {
                code: 403,
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        const apiKey = req.headers.apikey;
        const userId = await userService.getUserId(apiKey);

        if (!userId) {
            return {
                code: 400,
                status: 'FAILED',
                message: 'Correct API Key is required',
                data: {}
            };
        }

       if (req.body.contact && req.body.contact.length) {
            const contactsToDelete = await contactService.deleteContacts(req.body.contact, userId)
            return{
                code: 200,
                status: 'SUCCESS',
                message: 'Contscts Deleted'            
            }
        }else{({
            code: 400,
            status: 'FAILED',
            message: 'Invalid List',
        })};
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(err));
        return error;
    }
}