const sendmessagecontroller = require('../../controller/v1/sendmessagecontroller');
const setwebhookscontroller = require('../../controller/v1/setwebhookscontroller');
const getwebhookscontroller = require('../../controller/v1/getwebhookscontroller');
const partnersdatacontroller = require('../../controller/v1/partnersdatacontroller');
const partnersclientscontroller = require('../../controller/v1/partnersclientscontroller');
const getapikeycontroller = require('../../controller/v1/getapikeycontroller');
const createapikeycontroller = require('../../controller/v1/createapikeycontroller');
const getclientbalancecontroller = require('../../controller/v1/getclientbalancecontroller');
const updateclientcontroller = require('../../controller/v1/updateclientcontroller');
const apikeybywanumbercontroller = require('../../controller/v1/apikeybywanumbercontroller');
const genrateaccesstoken = require('../../controller/v1/genrateaccesstoken');
const retriveTemplateController = require('../../controller/v1/retriveTemplate');
const messageTemplateController = require('../../controller/v1/messageTemplates');
const deleteTemplateController = require('../../controller/v1/deleteTemplates');
const uploadmediacontroller = require('../../controller/v1/uploadmediacontroller');
const downloadmediacontroller = require('../../controller/v1/downloadmediacontroller');
const msgsettingdetailscontroller = require('../../controller/v1/msgsettingdetailscontroller');
const fetchaccesstokencontroller = require('../../controller/v1/fetchaccesstokencontroller');
const getreplymessageforcallback = require('../../controller/v1/getreplymessageforcallback');
const sentpartnerscallbacks = require('../../controller/v1/sent_callback_logs');
const templatestatuscontroller = require('../../controller/v1/templatestatuscontroller');
const assetscontroller = require('../../controller/v1/assetscontroller');
const botassetscontroller = require('../../controller/v1/botassetscontroller');
const fetchtemplateidcontroller = require('../../controller/v1/fetchtemplateid');
const generatefilecontroller = require('../../controller/v1/generatefilecontroller');
const fetchtemplateidinfocontroller = require('../../controller/v1/fetchtemplateidinfo');
const retriveTemplateByTypeController = require('../../controller/v1/retriveTemplateByTypeController');

const sendmessagecontroller1 = require('../../controller/v1/sendmessagecontrollerflows');
const messageTemplateFlowsPublishController = require('../../controller/v1/messagePublishFlows.js');
const messageTemplateFlowsJSONuploadController = require('../../controller/v1/messageFlowsJSONUpload.js');
const messageTemplateFlowsController = require('../../controller/v1/messageCreateFlow.js');
const whatsappbusinessencryptionController = require('../../controller/v1/SetBusinessPublicKey.js');
const getwhatsappbusinessencryptionController = require('../../controller/v1/GetBusinessPublickey.js');
const getListOfFlowsController = require('../../controller/v1/getListOfFlows.js');
const getFlowDetailsController = require('../../controller/v1/getFlowDetails.js');
const getFlowAssetsController = require('../../controller/v1/getFlowAssets.js');
const deleteFlow = require('../../controller/v1/deleteFlow.js');
const depricateflowcontroller = require('../../controller/v1/depricateflow.js');
const createflowmessagetemplatecontroller = require('../../controller/v1/createflowmessagetemplate.js');
const sendmessageflowscontroller = require('../../controller/v1/sendmessagecontrollerflows.js');
const messageTemplatecarouselController = require('../../controller/v1/messageTemplatescarousel');
const UpdateFlowMetadataController = require('../../controller/v1/UpdateFlowMetadata.js');
const { paymentname } = require('../../controller/v1/payment_name_method.js');

// const dummycallbacks = require('../../controller/v1/dummycallbacks');

const multer = require('fastify-multer');
const fs = require('fs');
const FormData = require('form-data');

module.exports = (upload) => {

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
    const fetchtemplateidcontrollerOpts = {
        handler: fetchtemplateidcontroller
    };
    const generatefileopts = {
        handler: generatefilecontroller
    };
    const fetchtemplateidinfocontrollerOpts = {
        handler: fetchtemplateidinfocontroller
    };

    const retriveTemplateByTypeOpts = {
        handler: retriveTemplateByTypeController
    };

    const whatsappflowsopts = {
        // handler: whatsappflows
        handler: sendmessagecontroller1
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
    const sendmessageflowsOpts = {
        handler: sendmessageflowscontroller
    };
    const messageTemplatecarouselOpts = {
        preHandler: [
            upload.fields([{
                name: 'media'
            }])
        ],
        handler: messageTemplatecarouselController
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
        fastify.post('/fetchtemplateid', fetchtemplateidcontrollerOpts);
        fastify.post('/generatefile', generatefileopts);
        fastify.post('/fetchtemplateidinfo', fetchtemplateidinfocontrollerOpts);
        fastify.post('/retriveTemplateByType', retriveTemplateByTypeOpts);
        // fastify.post('/api/data',dummycallbacksOpts);

          // below apis are whatsapp flow apis
          fastify.post('/whatsappflows', whatsappflowsopts);  //done
          fastify.post('/messagePublishFlow', messageTemplatePublishFlowsOpts); // done
          fastify.post('/messageFlowsJSONupload', messageTemplateFlowsJSONuploadOpts);//done
          fastify.post('/messageCreateFlow', messageTemplateFlowsOpts);//done
          fastify.post('/Set_whatsapp_business_encryption', whatsappbusinessencryptionOpts);//done
          fastify.get('/Get_whatsapp_business_encryption', getwhatsappbusinessencryptionOpts);//done
          fastify.get('/getListOfFlows', getListOfFlowsOpts);//done
          fastify.get('/getFlowDetails', getFlowDetailsOpts);//done
          fastify.get('/getFlowAssets', getFlowAssetsOpts);//done
          fastify.post('/deleteFlow', deleteFlowOpts);//done
          fastify.post('/depricateflow', depricateflowOpts);//done
          fastify.post('/CreateFlowMessageTemplate', createflowmessagetemplateOpts);//done
          fastify.post('/SendFlowMessageTemplate', sendmessageflowsOpts);//done
  
          // corousal template
          fastify.post('/createCarouselTemplate', messageTemplatecarouselOpts);//done
          fastify.post('/UpdateFlowMetadata', UpdateFlowMetadataOpts);//done
  
          // payment method and name
          fastify.post('/paymentmethod', payment_name_methodOpts);
        done();
    };
};
