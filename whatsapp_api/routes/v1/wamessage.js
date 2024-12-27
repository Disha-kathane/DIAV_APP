const otpInController = require('../../controller/v1/optIn');
const otpOutController = require('../../controller/v1/optOut');
const healthController = require('../../controller/v1/health')
const messageTemplateController = require('../../controller/v1/messageTemplates')
const editMessageTemplateController = require('../../controller/v1/editMessageTemplates');
const DBStatsController = require('../../controller/v1/dbstats')
const deleteMsgTempController = require('../../controller/v1/deleteTemplates')
const broadCastController = require('../../controller/v1/broadCast')
const broadCastUrlController = require('../../controller/v1/broadCastUrl')
const responseHelper = require('../../utils/responseHelper')
const qualitySignalsController = require('../../controller/v1/qualitySignals')
const sendController = require('../../controller/v1/send');
const waCallbackController = require('../../controller/v1/wacallback');
const metricController = require('../../controller/v1/metric');
const loginController = require('../../controller/v1/login');
const mediaTokenController = require('../../controller/v1/mediaToken');
const cloudMediaTokenController = require('../../controller/v1/cloudMediaToken');
const broadCastAPIController = require('../../controller/v1/broadCastAPI');
const userService = require('../../services/v1/users');
const apiKeyTokenController = require('../../controller/v1/apiKeyToken');
const leadSquaredLoginValidationController = require('../../controller/v1/loginLeadSquared');
const apiKeyValidatorController = require('../../controller/v1/apiKeyValidator');
const getApiKeyController = require('../../controller/v1/getAPIKey');
const getTempIDController = require('../../controller/v1/getTempID');
const getPhoneNumberIdController = require('../../controller/v1/getPhoneNumberId');
const getSinglePayloadController = require('../../controller/v1/getSinglePayload');
const getPlaceholderController = require('../../controller/v1/getPlaceholder');
const getPlaceholderFromAppIdController = require('../../controller/v1/getPlaceholderFromAppId');
const getUserTokenFromWanumberController = require('../../controller/v1/loginLSURL');
const getDetailsFromWabaController = require('../../controller/v1/detailsFromWaba');
const updateTokenController = require('../../controller/v1/updateToken');
const getUserDetailsFromTokenController = require('../../controller/v1/getUserDetailsFromToken');
const getWabaAgainstTempIdController = require('../../controller/v1/getWabaAgainstTempId');
const getPlaceHolderFromTempIdController = require('../../controller/v1/getPlaceHolderFromTempId');
const patchWebhookController = require('../../controller/v1/patchWebhook');
const getUserNameController = require('../../controller/v1/getUserName');
const getFlowTitleController = require('../../controller/v1/getFlowTitle');
const getAttributeReportsController = require('../../controller/v1/attributeReport');
const getAttributeValuesController = require('../../controller/v1/attributeValues');
const addWebhookController = require('../../controller/v1/addWebhook');
const patchLeadSquaredWebhookController = require('../../controller/v1/patchLSQWebhook');
const imagePathController = require('../../controller/v1/imagePath');
const getLSQloginController = require('../../controller/v1/getGraphLoginDetails');
const whatsappApi = require('../../controller/v1/whatsappApi.js');


module.exports = (upload) => {
    const optInOpts = {
        preHandler: [
            async (req, response, next) => {
                if (!req.headers.apikey) {
                    return responseHelper(403, 'API Key is required');
                }
                const apiKey = req.headers.apikey;
                const userId = await userService.getUserId(apiKey);
                req.userId = userId;
                if (!userId) {
                    return responseHelper(404, 'FAILED', 'Correct API Key is required');
                }
            },
            upload.fields([{
                name: 'sheet',
                maxCount: 1
            }])
        ],
        handler: otpInController
    }

    const optOutOpts = {
        handler: otpOutController
    }

    const healthOpts = {
        handler: healthController
    }

    const messageTemplateOpts = {
        handler: messageTemplateController
    }

    const DBStatsOpts = {
        handler: DBStatsController
    }

    const deleteMsgTempOpts = {
        handler: deleteMsgTempController
    }

    const broadCastOpts = {
        handler: broadCastController
    }

    const broadCastUrlOpts = {
        handler: broadCastUrlController
    }

    const qualitySignalsOpts = {
        handler: qualitySignalsController
    };

    const sendOpts = {
        handler: sendController
    }

    const waCallbackOpts = {
        handler: waCallbackController
    };

    const metricOpts = {
        handler: metricController
    };

    const loginOpts = {
        handler: loginController
    };

    const mediaTokenOpts = {
        handler: mediaTokenController
    }

    const cloudMediaTokenOpts = {
        handler: cloudMediaTokenController
    }

    const broadCastAPIOpts = {
        handler: broadCastAPIController
    };

    const apiKeyTokenOpt = {
        handler: apiKeyTokenController
    };

    const leadSquaredLoginOpt = {
        handler: leadSquaredLoginValidationController
    };

    const apiKeyValidatorOpt = {
        handler: apiKeyValidatorController
    };

    const getApiKeyOpt = {
        handler: getApiKeyController
    };

    const getTempIDOpt = {
        handler: getTempIDController
    };

    const getPhoneNumberIdOpt = {
        handler: getPhoneNumberIdController
    };

    const getSinglePayloadOpt = {
        handler: getSinglePayloadController
    };

    const getPlaceholderOpt = {
        handler: getPlaceholderController
    };

    const getPlaceholderFromAppIdOpt = {
        handler: getPlaceholderFromAppIdController
    };

    const getUserTokenFromWanumberOpt = {
        handler: getUserTokenFromWanumberController
    };

    const updateTokenOpt = {
        handler: updateTokenController
    };

    const getUserDetailsFromTokenOpt = {
        handler: getUserDetailsFromTokenController
    };

    const getWabaAgainstTempIdOpt = {
        handler: getWabaAgainstTempIdController
    };

    const getPlaceHolderFromTempIdOpt = {
        handler: getPlaceHolderFromTempIdController
    };

    const patchWebhookOpt = {
        handler: patchWebhookController
    };

    const getUserNameOpt = {
        handler: getUserNameController
    };

    const getFlowTitleOpt = {
        handler: getFlowTitleController
    };

    const getAttributeReportsOpts = {
        handler: getAttributeReportsController
    };

    const getAttributeValuesOpts = {
        handler: getAttributeValuesController
    };

    const addWebhookOpts = {
        handler: addWebhookController
    };

    const patchLeadSquaredWebhookOpts = {
        handler: patchLeadSquaredWebhookController
    };

    const imagePathOpts = {
        handler: imagePathController
    };

    const editMessageTemplateOpts = {
        handler: editMessageTemplateController
    };

    const getLSQloginOpts = {
        handler: getLSQloginController
    };
    const postWhatsappApi = {
        handler: whatsappApi
    };
    return (fastify, opts, done) => {
        fastify.post('/optin', optInOpts);
        fastify.post('/optout', optOutOpts);
        fastify.post('/health', healthOpts);
        fastify.post('/messageTemplate', messageTemplateOpts);
        fastify.post('/dbstats', DBStatsOpts);
        fastify.post('/deleteTemplates', deleteMsgTempOpts);
        fastify.post('/broadCast', broadCastOpts);
        fastify.post('/broadCastUrl', broadCastUrlOpts);
        fastify.post('/qualitySignals', qualitySignalsOpts);
        fastify.post('/send', sendOpts);
        fastify.post('/wacallback/:apikey', waCallbackOpts);
        fastify.post('/metric', metricOpts);
        fastify.post('/login', loginOpts);
        fastify.post('/mediaToken', mediaTokenOpts);
        fastify.post('/cloudMediaToken', cloudMediaTokenOpts);
        fastify.post('/broadCastAPI', broadCastAPIOpts);
        fastify.post('/apiKeyToken', apiKeyTokenOpt);
        fastify.post('/leadSquaredLogin', leadSquaredLoginOpt);
        fastify.post('/apiKeyValidator', apiKeyValidatorOpt);
        fastify.post('/getApiKey', getApiKeyOpt);
        fastify.post('/getTempID', getTempIDOpt);
        fastify.post('/getPhoneNumberId', getPhoneNumberIdOpt);
        fastify.post('/getSinglePayload', getSinglePayloadOpt);
        fastify.post('/getPlaceholder', getPlaceholderOpt);
        fastify.post('/getPlaceholderFromAppId', getPlaceholderFromAppIdOpt);
        fastify.post('/generateWabaDetails', getUserTokenFromWanumberOpt);
        fastify.post('/updateToken', updateTokenOpt);
        fastify.post('/getUserDetailsFromToken', getUserDetailsFromTokenOpt);
        fastify.post('/getWabaAgainstTempId', getWabaAgainstTempIdOpt);
        fastify.post('/getPlaceHolderFromTempId', getPlaceHolderFromTempIdOpt);
        fastify.post('/patchWebhook', patchWebhookOpt);
        fastify.post('/getUserName', getUserNameOpt);
        fastify.post('/getFlowTitle', getFlowTitleOpt);
        fastify.post('/getAttributeReports', getAttributeReportsOpts);
        fastify.post('/getAttributeValues', getAttributeValuesOpts);
        fastify.post('/addWebhookDetails', addWebhookOpts);
        fastify.post('/patchLSQWebhook', patchLeadSquaredWebhookOpts);
        fastify.post('/getImagePath', imagePathOpts);
        fastify.post('/editMessageTemplate', editMessageTemplateOpts);
        fastify.post('/userDetailsLSQ', getLSQloginOpts);
        fastify.post('/getMediaIdFromMediaUrl', postWhatsappApi);

        done();
    }
}