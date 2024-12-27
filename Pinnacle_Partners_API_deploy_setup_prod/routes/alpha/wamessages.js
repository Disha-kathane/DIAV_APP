
const whatsappflows = require("../../controller/alpha/whatsappflows");
const messageTemplateFlowsController = require('../../controller/alpha/messageCreateFlow.js');
const messageTemplateFlowsPublishController = require('../../controller/alpha/messagePublishFlows.js');
const messageTemplateFlowsJSONuploadController = require('../../controller/alpha/messageFlowsJSONUpload.js');
const whatsappbusinessencryptionController = require('../../controller/alpha/SetBusinessPublicKey.js');
const getwhatsappbusinessencryptionController = require('../../controller/alpha/GetBusinessPublickey.js');
const getListOfFlowsController = require('../../controller/alpha/getListOfFlows.js');
const sendmessagecontroller = require('../../controller/alpha/sendmessagecontroller');
const setwebhookscontroller = require('../../controller/alpha/setwebhookscontroller');
const getwebhookscontroller = require('../../controller/alpha/getwebhookscontroller');
const partnersdatacontroller = require('../../controller/alpha/partnersdatacontroller');
const partnersclientscontroller = require('../../controller/alpha/partnersclientscontroller');
const getapikeycontroller = require('../../controller/alpha/getapikeycontroller');
const createapikeycontroller = require('../../controller/alpha/createapikeycontroller');
const getclientbalancecontroller = require('../../controller/alpha/getclientbalancecontroller');
const updateclientcontroller = require('../../controller/alpha/updateclientcontroller');
const apikeybywanumbercontroller = require('../../controller/alpha/apikeybywanumbercontroller');
const genrateaccesstoken = require('../../controller/alpha/genrateaccesstoken');
const retriveTemplateController = require('../../controller/alpha/retriveTemplate');
const messageTemplateController = require('../../controller/alpha/messageTemplates');
const deleteTemplateController = require('../../controller/alpha/deleteTemplates');
const uploadmediacontroller = require('../../controller/alpha/uploadmediacontroller');
const downloadmediacontroller = require('../../controller/alpha/downloadmediacontroller');
const msgsettingdetailscontroller = require('../../controller/alpha/msgsettingdetailscontroller');
const fetchaccesstokencontroller = require('../../controller/alpha/fetchaccesstokencontroller');
const getreplymessageforcallback = require('../../controller/alpha/getreplymessageforcallback');
const sentpartnerscallbacks = require('../../controller/alpha/sent_callback_logs');
const templatestatuscontroller = require('../../controller/alpha/templatestatuscontroller');
const assetscontroller = require('../../controller/alpha/assetscontroller');
const botassetscontroller = require('../../controller/alpha/botassetscontroller');
const getFlowDetailsController = require('../../controller/alpha/getFlowDetails.js');
const getFlowAssetsController = require('../../controller/alpha/getFlowAssets.js');
const deleteFlow = require('../../controller/alpha/deleteFlow.js');
const depricateflowcontroller = require('../../controller/alpha/depricateflow.js');
const createflowmessagetemplatecontroller = require('../../controller/alpha/createflowmessagetemplate.js');
const messageTemplatecarouselController = require('../../controller/alpha/messageTemplatescarousel');
const sendmessageflowscontroller = require('../../controller/alpha/sendmessagecontrollerflows.js');
const fetchtemplateidcontroller = require('../../controller/alpha/fetchtemplateid');
const UpdateFlowMetadataController = require('../../controller/alpha/UpdateFlowMetadata.js');
const { paymentname } = require('../../controller/alpha/payment_name_method.js');
const GetBusinessPrivatekeyController = require('../../controller/alpha/GetBusinessPrivatekey.js');


const multer = require('fastify-multer');
const fs = require('fs');
const FormData = require('form-data');

module.exports = (upload) => {

    const whatsappflowsopts = {
        // handler: whatsappflows
        handler: sendmessagecontroller
    };
    const messageTemplatePublishFlowsOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: messageTemplateFlowsPublishController
    };
    const messageTemplateFlowsJSONuploadOpts = {
        preHandler: [
            upload.fields([{
                name: 'file'
            }])
        ],
        handler: messageTemplateFlowsJSONuploadController
    };

    const messageTemplateFlowsOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: messageTemplateFlowsController
    };
    const whatsappbusinessencryptionOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: whatsappbusinessencryptionController
    };
    const getwhatsappbusinessencryptionOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: getwhatsappbusinessencryptionController
    };

    const sendmessageOpts = {
        handler: sendmessagecontroller
    };

    const setwebhooksOpts = {
        handler: setwebhookscontroller
    };

    const getwebhooksOpts = {
        handler: getwebhookscontroller
    };

    const partnersdataOpts = {
        handler: partnersdatacontroller
    };

    const partnersclientsOpts = {
        handler: partnersclientscontroller
    };

    const getapikeyOpts = {
        handler: getapikeycontroller
    };

    const createapikeyOpts = {
        handler: createapikeycontroller
    };

    const getclientbalanceOpts = {
        handler: getclientbalancecontroller
    };

    const updateclientOpts = {
        handler: updateclientcontroller
    };

    const apikeybywanumberOpts = {
        handler: apikeybywanumbercontroller
    };

    const genrateaccesstokenOpts = {
        handler: genrateaccesstoken
    };

    const messageTemplateOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: messageTemplateController
    };

    const retriveTemplateOpts = {
        handler: retriveTemplateController
    };

    const deleteTemplateOpts = {
        handler: deleteTemplateController
    };

    const uploadmediaOpts = {
        preHandler: [
            upload.fields([{
                name: 'sheet',
                maxCount: 1
            }])
        ],
        handler: uploadmediacontroller
    };

    const downloadmediaOpts = {
        handler: downloadmediacontroller
    };

    const msgsettingdetailsOpts = {
        handler: msgsettingdetailscontroller
    };

    const fetchaccesstokenOpts = {
        handler: fetchaccesstokencontroller
    };

    const replymessageOpts = {
        handler: getreplymessageforcallback
    };

    const sentpartnerscallbacksOpts = {
        handler: sentpartnerscallbacks
    };

    const templatestatusOpts = {
        handler: templatestatuscontroller
    };

    const assetsopts = {
        handler: assetscontroller
    };

    // const dummycallbacksOpts = {
    //     handler: dummycallbacks
    // }

    const botassetsopts = {
        handler: botassetscontroller
    };



    const getListOfFlowsOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: getListOfFlowsController
    };

    const getFlowDetailsOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: getFlowDetailsController
    };

    const getFlowAssetsOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: getFlowAssetsController
    };
    const deleteFlowOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: deleteFlow
    };

    const depricateflowOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: depricateflowcontroller
    };

    const createflowmessagetemplateOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: createflowmessagetemplatecontroller
    };

    const messageTemplatecarouselOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: messageTemplatecarouselController
    };
    const sendmessageflowsOpts = {
        handler: sendmessageflowscontroller
    };
    const fetchtemplateidcontrollerOpts = {
        handler: fetchtemplateidcontroller
    };

    const UpdateFlowMetadataOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: UpdateFlowMetadataController
    };

    const payment_name_methodOpts = {
        handler: paymentname
    };

    const GetBusinessPrivatekeyOpts = {
        handler: GetBusinessPrivatekeyController
    };
    return (fastify, opts, done) => {
        fastify.post('/messages', sendmessageOpts);
        fastify.post('/setwebhooks', setwebhooksOpts);
        fastify.get('/getwebhooks', getwebhooksOpts);
        fastify.get('/partnersdata', partnersdataOpts);
        fastify.get('/partnersclients', partnersclientsOpts);
        fastify.get('/getapikey', getapikeyOpts);
        fastify.post('/createapikey', createapikeyOpts);
        fastify.get('/getclientbalance', getclientbalanceOpts);
        fastify.patch('/updateclient', updateclientOpts);
        fastify.post('/apikeybywanumber', apikeybywanumberOpts);
        fastify.post('/genratetoken', genrateaccesstokenOpts);
        fastify.post('/createTemplate', messageTemplateOpts);
        fastify.post('/retriveTemplate', retriveTemplateOpts);
        fastify.post('/deleteTemplate', deleteTemplateOpts);
        fastify.post('/uploadmedia', uploadmediaOpts);
        fastify.get('/downloadmedia/:mediaid', downloadmediaOpts);
        fastify.post('/msgsettingdetails', msgsettingdetailsOpts);// I AM USING THIS API IN CALLBACK FOR RISL TO FETCH MULTIPLE DETAILS FROM MESSAGE SETTING TABLE
        fastify.post('/fetchaccesstoken', fetchaccesstokenOpts); //I AM USING THIS API IN CALLBACK FOR RISL TO FETCH ACCESS TOKEN
        fastify.post('/replymessage', replymessageOpts); //IN THIS API WE ARE USING THOSE VALUES WHICH WE ARE USING IN GETPLYMESSAGE FUNCTION IN CALLBACK
        fastify.post('/sentlogs', sentpartnerscallbacksOpts);
        fastify.post('/templatestatus', templatestatusOpts);
        fastify.post('/assets', assetsopts);
        fastify.post('/botassets', botassetsopts);
        // below apis are whatsapp flow apis
        fastify.post('/whatsappflows', whatsappflowsopts);
        fastify.post('/messagePublishFlow', messageTemplatePublishFlowsOpts);
        fastify.post('/messageFlowsJSONupload', messageTemplateFlowsJSONuploadOpts);
        fastify.post('/messageCreateFlow', messageTemplateFlowsOpts);
        fastify.post('/Set_whatsapp_business_encryption', whatsappbusinessencryptionOpts);
        fastify.get('/Get_whatsapp_business_encryption', getwhatsappbusinessencryptionOpts);
        fastify.get('/getListOfFlows', getListOfFlowsOpts);
        fastify.get('/getFlowDetails', getFlowDetailsOpts);
        fastify.get('/getFlowAssets', getFlowAssetsOpts);
        fastify.post('/deleteFlow', deleteFlowOpts);
        fastify.post('/depricateflow', depricateflowOpts);
        fastify.post('/CreateFlowMessageTemplate', createflowmessagetemplateOpts);
        fastify.post('/SendFlowMessageTemplate', sendmessageflowsOpts);
        fastify.get('/GetBusinessPrivatekey', GetBusinessPrivatekeyOpts);

        // corousal template
        fastify.post('/createCarouselTemplate', messageTemplatecarouselOpts);
        fastify.post('/fetchtemplateid', fetchtemplateidcontrollerOpts);
        fastify.post('/UpdateFlowMetadata', UpdateFlowMetadataOpts);

        // payment method and name
        fastify.post('/paymentmethod', payment_name_methodOpts);

        done();
    };
}; 