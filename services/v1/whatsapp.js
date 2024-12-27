const botUtils = require('../../utils/bot');
const contactsService = require('./contacts');
const appLoggers = require('../../applogger.js');
const errorLogger = appLoggers.errorLogger;
const fs = require('fs/promises');
const config = require('../../config');

//const instanceUrl = "https://192.168.1.240:9093";

const userLogin = async (instanceUrl, waUsername, waPassword) => {
    const objData = {
        "new_password": waPassword
    };
    
    const api = '/v1/users/login';
    const httpMethod = 1;
    const requestType = 1;
    const contentLength = Buffer.byteLength(JSON.stringify(objData));
    const base64Creds = Buffer.from(waUsername + ":" + waPassword).toString('base64');
    const apiHeaders = [{
        'headerName': 'Authorization',
        'headerVal': 'Basic ' + base64Creds
    }, {
        'headerName': 'content-length',
        'headerVal': contentLength
    }];

    //To gerenate AuthToken
    const waApiLoginUserResponse = await botUtils.callWhatsAppApi(instanceUrl, api, objData, httpMethod, requestType, apiHeaders);
    return {
        token: waApiLoginUserResponse.users[0].token,
        expires_after: waApiLoginUserResponse.users[0].expires_after
    };
}

const getContactList = async (waAuthToken, instanceUrl, waIdList) => {
    const api = '/v1/contacts';
    const objData = {
        "blocking": "wait",
        "contacts": waIdList
    };
    const httpMethod = 1;
    const requestType = 1;
    const contentLength = Buffer.byteLength(JSON.stringify(objData));
    const apiHeaders = [{
        'headerName': 'Authorization',
        'headerVal': 'Bearer ' + waAuthToken
    }, {
        'headerName': 'content-length',
        'headerVal': contentLength
    }];
    const waApiContactResult = await botUtils.callWhatsAppApi(instanceUrl, api, objData, httpMethod, requestType, apiHeaders);
    return waApiContactResult.contacts;
}

const getoptinContactList = async (userId, waAuthToken, instanceUrl) => {
    // Select contact list for optin
    const waNumberResult = await contactsService.getoptinWaNumberFromContacts(userId);

    if (!(waNumberResult && waNumberResult.length)) {
        return;
    }

    const waIdList = waNumberResult.map(item => {
        const countryCode = botUtils.getCountryCode(item.wanumber);
        item.wanumber = botUtils.formatMobileLocal(item.wanumber, countryCode);
        return botUtils.formatMobileWhatsapp(item.wanumber,countryCode);
    })

    const api = '/v1/contacts';
    const objData = {
        "blocking": "wait",
        "contacts": waIdList
    };
    const httpMethod = 1;
    const requestType = 1;
    const contentLength = Buffer.byteLength(JSON.stringify(objData));
    const apiHeaders = [{
        'headerName': 'Authorization',
        'headerVal': 'Bearer ' + waAuthToken
    }, {
        'headerName': 'content-length',
        'headerVal': contentLength
    }];
    const waApiContactResult = await botUtils.callWhatsAppApi(instanceUrl, api, objData, httpMethod, requestType, apiHeaders);
    return waApiContactResult.contacts;
}

const getHealth = async (waAuthToken, instanceUrl, api, next) => {
    try {
        const httpMethod = 0;
        const requestType = 0;
        const apiHeaders = [{
            'headerName': 'Authorization',
            'headerVal': 'Bearer ' + waAuthToken
        }];
        const wagetHealthResult = await botUtils.callWhatsAppApi(instanceUrl, api, null, httpMethod, requestType, apiHeaders);
        // console.log(wagetHealthResult);
        next(null, wagetHealthResult);
    } catch (err) {
        next(err);
    }
}

const getDbStat = async (waAuthToken, instanceUrl, api, next) => {
    try {
        const httpMethod = 0;
        const requestType = 0;
        const apiHeaders = [{
            'headerName': 'Authorization',
            'headerVal': 'Bearer ' + waAuthToken
        }];
        const getDbStatResult = await botUtils.callWhatsAppApi(instanceUrl, api, null, httpMethod, requestType, apiHeaders);
        next(null, getDbStatResult );
    } catch (err) {
        next(err);
    }
}

const getQualitySignal = async (access_token, wabaId, next) => {
    const instanceUrl = 'https://graph.facebook.com';
    const api = '/v11.0/' + wabaId +'/phone_numbers';
    const httpMethod = 0;
    const requestType = 0;
    const apiHeaders = [];
    const objData = {
        access_token
    }

    botUtils.callWhatsAppApi(instanceUrl, api, objData, httpMethod, requestType, apiHeaders)
        .then((response) => {
            next(null, response);
        })
        .catch((err) => {
            next(err);
        })
}

const messageTemplate = (name, category, language, components, access_token, wabaId) => {
    const instanceUrl = config.graphFacebookUrl;
    const api = '/v11.0/'+wabaId+'/message_templates';
    const httpMethod = 1;
    const requestType = 0;
    const apiHeaders = [];
    const objData =  {
        category,
        components: JSON.stringify(components),
        name,
        access_token,
        language
    }
    return botUtils.callWhatsAppApi(instanceUrl, api, objData, httpMethod, requestType, apiHeaders);
}

const getUploadTokenAndSignature = (instanceUrl, access_token, fileLength, fileType) => {
    const api = 'app/uploads';
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [];
    const objData = {
        access_token,
        file_length: fileLength,
        file_type: fileType
    }

    return botUtils.callWhatsAppApi(instanceUrl, api, objData, httpMethod, requestType, apiHeaders);
}

const whatsappMediaUpload = async (instanceUrl, access_token, api, fileBuffer) => {
    const httpMethod = 1;
    const requestType = 1;
    const apiHeaders = [{
        'headerName': 'Authorization',
        'headerVal': 'OAuth ' + access_token
    }]
    const uploadResponse = await botUtils.callWhatsAppApi(instanceUrl, api, fileBuffer, httpMethod, requestType, apiHeaders);
    return uploadResponse;
}

const getMsgTemplateStatus = async (name, access_token, wabaId) => {
    const instanceUrl = config.graphFacebookUrl;
    const api = '/v11.0/'+wabaId+'/message_templates';
    const httpMethod = 0;
    const requestType = 0;
    const apiHeaders = [];
    const objData = {       
        name,
        access_token,
    }
    const msgTemplateIdStatus = await botUtils.callWhatsAppApi(instanceUrl, api, objData, httpMethod, requestType, apiHeaders);
    return msgTemplateIdStatus.data[0].status;
}

const getWhatsappMediaId = async (instanceUrl, waAuthToken, mediaFileBuffer, contentType) => {
    const apiHeaders = [{
        'headerName': 'Authorization',
        'headerVal': 'Bearer ' + waAuthToken
    }, {
        'headerName': 'Content-Type',
        'headerVal': contentType
    }];
    const objData = mediaFileBuffer;
    const whatsappMediaId = await botUtils.uploadWhatsappMedia(instanceUrl, objData, apiHeaders);
    return whatsappMediaId.media[0].id;
}

const deleteMsgTemplate = async (access_token, templateName, whatsappAccountId) => {
      const data = {
        access_token,
        name: templateName
    }
    const headers = [];
    return botUtils.deleteWhatsappTemplate(data, whatsappAccountId, headers);
}

const getMetrics = async (fields, access_token, wabaId, next) => {
    const instanceUrl = 'https://graph.facebook.com';
    const api = '/v11.0/' + wabaId;
    const httpMethod = 0;
    const requestType = 0;
    const apiHeaders = [];
    const objData = {
        fields,
        access_token
    }

    await botUtils.callWhatsAppApi(instanceUrl, api, objData, httpMethod, requestType, apiHeaders)
        .then((response) => {
            next(null, response);
        })
        .catch((err) => {
            next(err);
        })
}



module.exports = {
    userLogin,
    getContactList,
    getHealth,
    getoptinContactList,
    messageTemplate,
    getWhatsappMediaId,
    getUploadTokenAndSignature,
    whatsappMediaUpload,
    getMsgTemplateStatus,
    deleteMsgTemplate,
    getMetrics,
    getQualitySignal, 
    getDbStat
}