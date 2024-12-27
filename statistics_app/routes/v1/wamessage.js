const otpInController = require('../../controller/v1/optIn');
const otpOutController = require('../../controller/v1/optOut');
const healthController = require('../../controller/v1/health')
const messageTemplateController = require('../../controller/v1/messageTemplates')
const DBStatsController = require('../../controller/v1/dbstats')
const deleteMsgTempController = require('../../controller/v1/deleteTemplates')
const broadCastController = require('../../controller/v1/broadCast')
const responseHelper = require('../../utils/responseHelper')
const qualitySignalsController = require('../../controller/v1/qualitySignals')
const sendController = require('../../controller/v1/send');
const waCallbackController = require('../../controller/v1/wacallback');
const metricController = require('../../controller/v1/metric');
const loginController = require('../../controller/v1/login.js');
const webhookController = require('../../controller/v1/getWebhook');
const setWebhookController = require('../../controller/v1/setWebhook');
const webhookSetting = require('../../controller/v1/webhookSetting');
const diamentionMetricsController = require('../../controller/v1/diamentionMetrics');
const endLiveChatController = require('../../controller/v1/endLiveChatController');



module.exports = (upload) => {
    const optInOpts = {
        // preHandler: [
        //     async (req, response, next) => {
        //         if (!req.headers.apikey) {
        //             return responseHelper(403, 'API Key is required');
        //         }
        //         const apiKey = req.headers.apikey;
        //         const userId = await userService.getUserId(apiKey);
        //         req.userId = userId;
        //         if (!userId) {
        //             return responseHelper(404, 'FAILED', 'Correct API Key is required');
        //         }
        //     },
        //     upload.fields([{
        //         name: 'sheet',
        //         maxCount: 1
        //     }])
        // ],
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
    const webhookOpts = {
        handler: webhookController
    };

    const setwebhookOpts = {
        handler: setWebhookController
    };

    const webhookSettingOpts = {
        handler: webhookSetting
    }

    const diamentionMetricsOpts = {
        handler: diamentionMetricsController
    }

    const endLivechat = {
        handler: endLiveChatController
    };

    return (fastify, opts, done) => {
        fastify.post('/health', healthOpts);
        fastify.post('/dbstats', DBStatsOpts);
        fastify.post('/qualitySignals', qualitySignalsOpts);
        fastify.post('/metric', metricOpts);
        fastify.post('/getWebhook', webhookOpts);
        fastify.post('/setWebhook', setwebhookOpts);
        fastify.post('/webhookSetting', webhookSettingOpts);
        fastify.post('/diamentionMetrics', diamentionMetricsOpts);
        fastify.post('/endLiveChat', endLivechat);


        // fastify.post('/optin', optInOpts);
        // fastify.post('/optout', optOutOpts);
        // fastify.post('/messageTemplate', messageTemplateOpts);
        // fastify.post('/deleteMessageTemplate', deleteMsgTempOpts);
        // fastify.post('/broadCast', broadCastOpts);
        // fastify.post('/send', sendOpts);
        // fastify.post('/wacallback/:apikey', waCallbackOpts);
        // fastify.post('/login', loginOpts);
        done();
    }
}