const whatsappService = require('../../services/v1/whatsapp');
const templateService = require('../../services/v1/template')
const userService = require('../../services/v1/users');

module.exports = async(req, res) => {
    try {
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
        const apiKey = req.headers.apikey;
        const { userId, wabaId } = await userService.getUserId(apiKey);

        if (!userId) {
            return responseHelper(404, 'Correct API Key is required');
        }

        if (!(req.body.tempid && req.body.tempid.length)) {
            return responseHelper(404, 'tempid cannot be empty');          
        }

        const tempIdList = req.body.tempid;
        const AccessToken = await templateService.getSystemAccessToken();
        const access_token = AccessToken[0].value;
        const tempListResponse = await templateService.getTemplateDetails(tempIdList);
        const deleteResult = await Promise.all(tempListResponse.map(async (item, index) => {
            try {
                const result = await whatsappService.deleteMsgTemplate(access_token, 'sample_template_1943_1313131312', wabaId);
                return {
                    result,
                    isError: false
                };
            } catch (error) {
                return {
                    result: error,
                    isError: true
                }
            }
        }));

        const failedDeleteOperations = deleteResult.filter(item => item.isError);
        if (failedDeleteOperations && failedDeleteOperations.length) {
            // create and call the service here to save response in db
        }

        return {
            code: 200,
            status: 'SUCCESS',
            message: 'Templates Deleted',
            deleteResult
        };

} catch (error) {
    console.log(error);
    //errorLogger.error(JSON.stringify(error));
    return error;
}
}
