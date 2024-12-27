// const waCallbackController = require('../../controller/v1/wacallback');
// const waCallbackController = require('../../controller/v1/wacallback_prod_11022022');
// const waCallbackController = require('../../controller/v1/wacallback_ready_15022022');
const waCallbackController = require('../../controller/v1/wacallback');
const indexController = require('../../controller/v1/indexController');
const pushWebhookController = require('../../controller/v1/pushWebhookController');
const lupinWebhookController = require('../../controller/v1/lupinWebhookController');
const sendOtpController = require('../../controller/v1/sendOtpController');
const endLiveChatController = require('../../controller/v1/endLiveChatController');
const getNewCallbackController = require('../../controller/v1/getNewCallbackController');
const postNewCallbackController = require('../../controller/v1/postNewCallbackController');
const getpaymentDetailsPayU = require('../../controller/v1/getpaymentDetailsPayU');
const diavGenerateOTP = require('../../controller/v1/diavGenerateOTPController');
const diavVerifyOTP = require('../../controller/v1/diavVerifyOTPController');
const diavCheckMobile = require('../../controller/v1/diavCheckMobileController');
const diavCountryCode = require('../../controller/v1/diavCountryCodeController');

module.exports = (upload) => {

    const waCallbackOpts = {
        handler: waCallbackController
    };

    const indexOpts = {
        handler: indexController
    };

    const pushWebhookOpts = {
        handler: pushWebhookController
    };

    const lupinWebhookOpts = {
        handler: lupinWebhookController
    };

    const sendOtpOpts = {
        handler: sendOtpController
    };

    const endLivechat = {
        handler: endLiveChatController
    };

    const getNewCallbackOpts = {
        handler: getNewCallbackController
    };

    const postNewCallbackOpts = {
        handler: postNewCallbackController
    };

    const getpaymentDetails = {
        handler: getpaymentDetailsPayU
    };
    const diavGenerateOTPOpts = {
        handler: diavGenerateOTP
    };
    const diavVerifyOTPOpts = {
        handler: diavVerifyOTP
    };
    const diavCheckMobileOpts={
        handler: diavCheckMobile
    }
    const diavCountryCodeOpts={
        handler: diavCountryCode
    }

    return (fastify, opts, done) => {
        // fastify.get('/index', indexOpts);
        fastify.post('/callback/:apikey/:wanumber', waCallbackOpts);
        fastify.post('/messageWebhook/:pincode', indexOpts);
        fastify.post('/pushWebhook', pushWebhookOpts);
        fastify.post('/lupinWebhook', lupinWebhookOpts);
        fastify.post('/sendOtp/:mobileno/:wanumber', sendOtpOpts);
        fastify.post('/endLiveChat', endLivechat);
        fastify.post('/newCallback', postNewCallbackOpts);
        fastify.get('/newCallback', getNewCallbackOpts);
        fastify.get('/', pushWebhookOpts);
        fastify.post('/getpaymentdetails/payU', getpaymentDetails);
        fastify.post('/diavGenerateOTP',diavGenerateOTPOpts);
        fastify.post('/diavVerifyOTP',diavVerifyOTPOpts);
        fastify.post('/checkmobileno/:wanumber',diavCheckMobileOpts);
        fastify.post('/checkcountrycode/:wanumber',diavCountryCodeOpts);
        done();
    };
};
