const sendmessagecontroller = require('../../controller/v2/sendmessagecontroller');
const setwebhookscontroller = require('../../controller/v2/setwebhookscontroller');
const getwebhookscontroller = require('../../controller/v2/getwebhookscontroller');
const partnersdatacontroller = require('../../controller/v2/partnersdatacontroller');
const partnersclientscontroller = require('../../controller/v2/partnersclientscontroller');
const getapikeycontroller = require('../../controller/v2/getapikeycontroller');
const createapikeycontroller = require('../../controller/v2/createapikeycontroller');
const getclientbalancecontroller = require('../../controller/v2/getclientbalancecontroller');
const updateclientcontroller = require('../../controller/v2/updateclientcontroller');
const apikeybywanumbercontroller = require('../../controller/v2/apikeybywanumbercontroller');
const genrateaccesstoken = require('../../controller/v2/genrateaccesstoken');
const retriveTemplateController = require('../../controller/v2/retriveTemplate');
const messageTemplateController = require('../../controller/v2/messageTemplates');
const deleteTemplateController = require('../../controller/v2/deleteTemplates');
const uploadmediacontroller = require('../../controller/v2/uploadmediacontroller');
const downloadmediacontroller = require('../../controller/v2/downloadmediacontroller');
const msgsettingdetailscontroller = require('../../controller/v2/msgsettingdetailscontroller');
const fetchaccesstokencontroller = require('../../controller/v2/fetchaccesstokencontroller');
const getreplymessageforcallback = require('../../controller/v2/getreplymessageforcallback');
const sentpartnerscallbacks = require('../../controller/v2/sent_callback_logs');
const templatestatuscontroller = require('../../controller/v2/templatestatuscontroller');
const assetscontroller = require('../../controller/v2/assetscontroller');
const botassetscontroller = require('../../controller/v2/botassetscontroller');
const fetchtemplateidcontroller = require('../../controller/v2/fetchtemplateid');
const generatefilecontroller = require('../../controller/v2/generatefilecontroller');
const fetchtemplateidinfocontroller = require('../../controller/v2/fetchtemplateidinfo');
const retriveTemplateByTypeController = require('../../controller/v2/retriveTemplateByTypeController');

const sendmessagecontroller1 = require('../../controller/v2/sendmessagecontrollerflows');
const messageTemplateFlowsPublishController = require('../../controller/v2/messagePublishFlows.js');
const messageTemplateFlowsJSONuploadController = require('../../controller/v2/messageFlowsJSONUpload.js');
const messageTemplateFlowsController = require('../../controller/v2/messageCreateFlow.js');
const whatsappbusinessencryptionController = require('../../controller/v2/SetBusinessPublicKey.js');
const getwhatsappbusinessencryptionController = require('../../controller/v2/GetBusinessPublickey.js');
const getListOfFlowsController = require('../../controller/v2/getListOfFlows.js');
const getFlowDetailsController = require('../../controller/v2/getFlowDetails.js');
const getFlowAssetsController = require('../../controller/v2/getFlowAssets.js');
const deleteFlow = require('../../controller/v2/deleteFlow.js');
const depricateflowcontroller = require('../../controller/v2/depricateflow.js');
// const createflowmessagetemplatecontroller = require('../../controller/v2/createflowmessagetemplate.js');
const sendmessageflowscontroller = require('../../controller/v2/sendmessagecontrollerflows.js');
const messageTemplatecarouselController = require('../../controller/v2/messageTemplatescarousel');
const UpdateFlowMetadataController = require('../../controller/v2/UpdateFlowMetadata.js');
const { paymentname } = require('../../controller/v2/payment_name_method.js');
const retrive_header_handleController = require('../../controller/v2/retrive_header_handle.js');

// const dummycallbacks = require('../../controller/v2/dummycallbacks');

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
        // preHandler: [
        //     upload.fields([{
        //         name: 'media'
        //     }])
        // ],
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
    // const createflowmessagetemplateOpts = {
    //     preHandler: [
    //         upload.fields([{
    //             name: 'media'
    //         }])
    //     ],
    //     handler: createflowmessagetemplatecontroller
    // };
    const sendmessageflowsOpts = {
        handler: sendmessageflowscontroller
    };
    const messageTemplatecarouselOpts = {
        // preHandler: [
        //     upload.fields([{
        //         name: 'media'
        //     }])
        // ],
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
    const retrive_header_handleOpts = {
        
            preHandler: [
                upload.fields([{
                    name: 'media'
                }])
            ],
        handler: retrive_header_handleController
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
        //   fastify.post('/CreateFlowMessageTemplate', createflowmessagetemplateOpts);//done
          fastify.post('/SendFlowMessageTemplate', sendmessageflowsOpts);//done
  
          // corousal template
          fastify.post('/createCarouselTemplate', messageTemplatecarouselOpts);//done
          fastify.post('/UpdateFlowMetadata', UpdateFlowMetadataOpts);//done
  
          // payment method and name
          fastify.post('/paymentmethod', payment_name_methodOpts);

          //retrive header handel
          fastify.post('/retrive_header_handle', retrive_header_handleOpts);

        done();
    };
};
