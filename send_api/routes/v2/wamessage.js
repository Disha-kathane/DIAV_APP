
const sendMessageController = require('../../controller/v2/send');
const sendMessageApiController = require('../../controller/v2/sendMessage');
const uploadMediaController = require('../../controller/v2/uploadMedia');
const downloadMediaController = require('../../controller/v2/downloadMedia');
const optinController = require('../../controller/v2/optin');
const optoutController = require('../../controller/v2/optout');
const bulkmesssageController = require('../../controller/v2/bulkmessage');
const loginController = require('../../controller/v2/login');
const registerController = require('../../controller/v2/register');
const sendDecryptController = require('../../controller/v2/sendDecrypt');
const encryptionController = require('../../controller/v2/encryption');
const postcalltoactioncontroller = require('../../controller/v2/postcalltoactioncontroller');


module.exports = (upload) => {
    const uploadMediaOpts = {
        preHandler: [
            upload.fields([{
                name: 'sheet',
                maxCount: 1
            }])
        ],
        handler: uploadMediaController
    };

    const sendMessageOpts = {
        handler: sendMessageController
    };

    const sendMessageApiOpts = {
        handler: sendMessageApiController
    };


    const downloadMediaOpts = {
        handler: downloadMediaController
    };

    const optinOpts = {
        handler: optinController
    };

    const optoutOpts = {
        handler: optoutController
    };

    const bulkmessageOpts = {
        handler: bulkmesssageController
    };

    const loginOpts = {
        handler: loginController
    };

    const registerOpts = {
        handler: registerController
    };

    const sendDecryptOpts = {
        handler: sendDecryptController
    };

    const encryptionOpts = {
        handler: encryptionController
    };

    const postcalltoactionOpts = {
        handler: postcalltoactioncontroller
    }

    return (fastify, opts, done) => {
        fastify.post('/send', sendMessageOpts);
        fastify.post('/sendMessage', sendMessageApiOpts);
        fastify.post('/media', uploadMediaOpts);
        fastify.post('/media/:mediaid', downloadMediaOpts);
        fastify.post('/optin', optinOpts);
        fastify.post('/optout', optoutOpts);
        fastify.post('/bulksendMsg', bulkmessageOpts);
        fastify.post('/login', loginOpts);
        fastify.post('/register', registerOpts);
        fastify.post('/sendRequest', sendDecryptOpts);
        fastify.post('/encryption', encryptionOpts);
        fastify.get('/cta/:mobileno/:campaignid/:placeholder/*', postcalltoactionOpts);
        done();
    };
};