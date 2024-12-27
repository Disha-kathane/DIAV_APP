const botUtils = require('../../utils/bot');
// const contactsService = require('./contacts');
const appLoggers = require('../../applogger.js');
const errorLogger = appLoggers.errorLogger;
const fs = require('fs/promises');
const fs1 = require('fs');
const config = require('../../config');
const FormData = require('form-data');
const {
    Console
} = require('console');



const messageTemplate = async (objData, wabaid, next) => {

    const instanceUrl = config.graphFacebookUrl;
    const api = 'v14.0/' + wabaid + '/message_templates';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [];
    await botUtils.callWhatsAppApiMedia(instanceUrl, api, objData, httpMethod, requestType, apiHeaders)
        .then((response) => {
            // console.log(response)
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });
};

const messageTemplate11 = async (objData, wabaid, wabaAproovalid, next) => {

    const instanceUrl = config.graphFacebookUrl;
    const api = 'v16.0/' + wabaAproovalid;
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [];

    console.log({ instanceUrl, api, objData, httpMethod, requestType, apiHeaders })
    await botUtils.callWhatsAppApiMedia(instanceUrl, api, objData, httpMethod, requestType, apiHeaders)
        .then((response) => {
            console.log("response whatsapp --------- ", response)
            next(null, response);
        })
        .catch((err) => {
            console.log(err)
            console.log("err whatsapp -------->", err)
            next(err);
        });
};

const uploadMedia = async (FileLength, FileType, access_token, next) => {
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v14.0/app/uploads';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [];
    objData = {
        access_token: access_token,
        file_length: FileLength,
        file_type: FileType
    };

    await botUtils.uploadTemplateMedia(instanceUrl, api, objData, httpMethod, requestType, apiHeaders)
        .then((response) => {
            // console.log({response})
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });

};


const uploads = async (id, access_token, filedata, FileType, next) => {
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v14.0/';
    const apiHeaders = [{
        'headerName': 'Authorization',
        'headerVal': 'OAuth ' + access_token
    },
    {
        'headerName': 'Content-Type',
        'headerVal': FileType
    }
    ];


    await botUtils.uploadTemplate(instanceUrl, api, id, filedata, apiHeaders)
        .then((response) => {
            // console.log({response})
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });


};


const retriveTemplate = async (access_token, wabaId, limit, name, next) => {
    const apiHeaders = [];
    objData = {
        access_token: access_token,
        limit: limit,
        name: name

    };

    await botUtils.retriveWhatsAppTemplate(objData, wabaId, apiHeaders)
        .then((response) => {
            // console.log({response})
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });

};


const deleteTemplate = async (access_token, wabaId, templateName, next) => {
    const apiHeaders = [];
    objData = {
        access_token: access_token,
        name: templateName

    };
    // console.log({objData})
    await botUtils.deleteWhatsappTemplate(objData, wabaId, apiHeaders)
        .then((response) => {
            // console.log({response})
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });

};

const getMediaUrl = async (MediaId, SystemAccessToken, next) => {
    const instanceUrl = 'https://graph.facebook.com';
    const api = '/v13.0/' + MediaId;
    const apiHeaders = [
        {
            'headerName': 'Authorization',
            'headerVal': 'Bearer ' + SystemAccessToken
        },
        {
            'headerName': 'Content-Type',
            'headerVal': 'application/json'
        }
    ];


    await botUtils.getMediaUrlCloud(instanceUrl + api, apiHeaders)
        .then((response) => {
            console.log(response);
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });
};


const downloadCloudMedia = async (url, SystemAccessToken, next) => {

    const instanceUrl = url;
    const httpMethod = 0;
    const requestType = 0;
    const apiHeaders = [
        {
            'headerName': 'Authorization',
            'headerVal': 'Bearer ' + SystemAccessToken
        },
        {
            'headerName': 'Content-Type',
            'headerVal': 'application/json'
        }
    ];


    await botUtils.downloadWhatsappMediaCloud(instanceUrl, apiHeaders)
        .then((response) => {
            console.log(response);
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });
};

const GetListOfFlows1 = async (token, wabaid, next) => {
    console.log({ token, wabaid });
    // token = 'EAAaSEd3mKP8BO723rdGzJlCXSo92l0d7dZA8E0KewDnbrCF9AziPxiPB4nfzYGgtPv6LuMbMu3IqmrURr8iOBkhAhZCjwgkWLOjTLtJ9kZA9SU3iS2kOggtnTJTPSRNKhPU9uwba3UF2hBgkvP4TrBjacLdctPgZBhnTceZCwLfdCwIj0ZCal5RIrT7X7DlBPO'
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + wabaid + '/flows?limit=9999';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];


    await botUtils.getbusinesspublickey1(instanceUrl + api, '', apiHeaders)
        .then((response) => {
            // console.log("response----------------------->", response.data);
            next(null, response);
        })
        .catch((err) => {
            console.log("err1------------------------------------>", err);
            next(err);
        });
};

const messageFlow1 = async (token, flowID, next) => {
    // console.log({ token, flowID });
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + flowID + '/publish';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];
    await botUtils.callWhatsAppApi1(instanceUrl, api, null, httpMethod, requestType, apiHeaders)
        .then((response) => {
            // console.log(response)
            next(null, response);
        })
        .catch((err) => {
            console.log(err);
            next(err);
        });
};

const messageFlowJSON = async (token, flowID, name, asset_type, file, next) => {
    // console.log({ token, flowID, name, asset_type, file });
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + flowID + '/assets';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];

    // let objData = {
    //     name, asset_type, file
    // }

    let objData = new FormData();
    objData.append('file', fs1.createReadStream(file));
    objData.append('name', name);
    objData.append('asset_type', asset_type);

    await botUtils.uploadTemplate(instanceUrl + api, '', '', objData, apiHeaders)
        .then((response) => {
            // console.log(response)
            next(null, response);
        })
        .catch((err) => {
            console.log(err);
            next(err);
        });
};
const messageFlow = async (token, wabaid, name, categories, clone_flow_id, next) => {
    console.log({ token, wabaid, name, categories });
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + wabaid + '/flows';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];
    let objData = {
        name, categories, clone_flow_id
    };
    await botUtils.callWhatsAppApi1(instanceUrl, api, objData, httpMethod, requestType, apiHeaders)
        .then((response) => {
            // console.log(response)
            next(null, response);
        })
        .catch((err) => {
            // console.log(err);
            next(err);
        });
};

const GetBusinessPublicKey = async (token, phonenumberid, next) => {
    // console.log({ token, phonenumberid });
    // token = 'EAAaSEd3mKP8BO723rdGzJlCXSo92l0d7dZA8E0KewDnbrCF9AziPxiPB4nfzYGgtPv6LuMbMu3IqmrURr8iOBkhAhZCjwgkWLOjTLtJ9kZA9SU3iS2kOggtnTJTPSRNKhPU9uwba3UF2hBgkvP4TrBjacLdctPgZBhnTceZCwLfdCwIj0ZCal5RIrT7X7DlBPO'
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + phonenumberid + '/whatsapp_business_encryption';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];


    await botUtils.getbusinesspublickey1(instanceUrl + api, '', apiHeaders)
        .then((response) => {
            console.log("response----------------------->", response.data);
            next(null, response);
        })
        .catch((err) => {
            console.log("err1------------------------------------>", err);
            next(err);
        });
};

const SetBusinessPublicKey = async (token, phonenumberid, business_public_key, next) => {
    // console.log({ token, phonenumberid, business_public_key });
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + phonenumberid + '/whatsapp_business_encryption';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];
    let objData = new FormData();
    objData.append('business_public_key', business_public_key);
    await botUtils.uploadTemplate(instanceUrl + api, '', '', objData, apiHeaders)
        .then((response) => {
            next(null, response);
        })
        .catch((err) => {
            console.log(err);
            next(err);
        });
};

const GetFlowDetails = async (token, flowid, fields, next) => {
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + flowid + "?fields=" + fields;
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];


    await botUtils.getbusinesspublickey1(instanceUrl + api, '', apiHeaders)
        .then((response) => {
            next(null, response);
        })
        .catch((err) => {
            console.log("err1------------------------------------>", err);
            next(err);
        });
};

const GetFlowAssets = async (token, flowid, next) => {

    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + flowid + "/assets";
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];
    await botUtils.getbusinesspublickey1(instanceUrl + api, '', apiHeaders)
        .then((response) => {
            // console.log("response----------------------->", response);
            next(null, response);
        })
        .catch((err) => {
            console.log("err1------------------------------------>", err);
            next(err);
        });
};

const DeleteFlow = async (token, flowid, next) => {

    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + flowid;
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];
    await botUtils.deleteFlowsq(instanceUrl + api, '', apiHeaders)
        .then((response) => {
            // console.log("response----------------------->", response);
            next(null, response);
        })
        .catch((err) => {
            console.log("err1------------------------------------>", err);
            next(err);
        });
};


const depricateflow = async (token, flowid, next) => {
    console.log({ token, flowid });
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + flowid + '/deprecate';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];
    let objData = new FormData();
    await botUtils.uploadTemplate(instanceUrl + api, '', '', '', apiHeaders)
        .then((response) => {
            next(null, response);
        })
        .catch((err) => {
            console.log(err);
            next(err);
        });
};

const CreateFlowMessageTemplate = async (token, wabaid, name, language, category, components, next) => {
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + wabaid + '/message_templates';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];
    let objData = new FormData();
    objData.append('name', name);
    objData.append('language', language);
    objData.append('category', category);
    objData.append('components', components);
    await botUtils.uploadTemplate(instanceUrl + api, '', '', objData, apiHeaders)
        .then((response) => {
            next(null, response);
        })
        .catch((err) => {
            console.log(err);
            next(err);
        });
};

const messageCarouselTemplate = async (objData, wabaid, next) => {

    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + wabaid + '/message_templates';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [];
    await botUtils.callWhatsAppApiMedia(instanceUrl, api, objData, httpMethod, requestType, apiHeaders)
        .then((response) => {
            // console.log(response)
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });
};


const UpdateFlowMetadataurl = async (token, flowid, name, categories, next) => {
    const instanceUrl = config.graphFacebookUrl;
    const api = 'v18.0/' + flowid;
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        headerName: 'Authorization',
        headerVal: 'Bearer ' + token
    }];
    let objData = {
        name, categories
    };
    await botUtils.callWhatsAppApi(instanceUrl, api, objData, httpMethod, requestType, apiHeaders)
        .then((response) => {
            console.log(response);
            next(null, response);
        })
        .catch((err) => {
            console.log(err);
            next(err);
        });
};
module.exports = {
    messageTemplate,
    uploadMedia,
    uploads,
    retriveTemplate,
    deleteTemplate,
    getMediaUrl,
    downloadCloudMedia,
    GetListOfFlows1,
    messageFlow1,
    messageFlowJSON,
    messageFlow,
    GetBusinessPublicKey,
    SetBusinessPublicKey,
    GetFlowDetails,
    GetFlowAssets,
    DeleteFlow,
    depricateflow,
    CreateFlowMessageTemplate,
    messageCarouselTemplate,
    UpdateFlowMetadataurl,
    messageTemplate11
};