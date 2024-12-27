const whatsappService = require('../../services/v1/whatsapp');
const { getUserId,getWabaId,getAccessToken} = require('../../services/v1/userStat_async');
const async = require('async');
const wabot_db = require('../../db/database');
const appLoggers = require('../../applogger.js');
const botUtils = require('../../utils/bot');
const http = require('http');
const https = require('https');
const httpUrl = require('url');
const axios = require('axios');

const {
    result
} = require('lodash');


const catlogueget = async (accesstoken, catalogid) => {
    let messageUrl = 'http://68.183.90.255:5000/pincatalog/catalogProducts';

    let data = JSON.stringify({
        "catalogid": catalogid
    });

    let config = {
        method: 'post',
        url: messageUrl,
        headers: {
            'accesstoken': accesstoken,
            'Content-Type': 'application/json'
        },
        data: data
    };

    let protocol = httpUrl.parse(messageUrl).protocol;
    if (protocol != null && protocol == "https:") {
        config.httpsAgent = new https.Agent({
            keepAlive: false,
            rejectUnauthorized: false
        }); //secureProtocol: 'TLSv1_method'
    } else {
        config.httpAgent = new http.Agent({
            keepAlive: false,
            rejectUnauthorized: false
        }); //secureProtocol: 'TLSv1_method'
    }

    let response = await axios(config);
    console.log("response of axios url -----------------> ", response.data.data);
    return response.data.data;

};

const updateCatalogFuction = async (catalogid, accesstoken, requestPayload) => {
    console.log({ catalogid, accesstoken, requestPayload });
    let data = JSON.stringify({
        "catalogid": catalogid,
        "request": requestPayload
    });
    let messageUrl = 'http://68.183.90.255:5000/pincatalog/updateCatalog';


    let config = {
        method: 'post',
        url: messageUrl,
        headers: {
            'accesstoken': accesstoken,
            'Content-Type': 'application/json'
        },
        data: data
    };

    let protocol = httpUrl.parse(messageUrl).protocol;
    if (protocol != null && protocol == "https:") {
        config.httpsAgent = new https.Agent({
            keepAlive: false,
            rejectUnauthorized: false
        }); //secureProtocol: 'TLSv1_method'
    } else {
        config.httpAgent = new http.Agent({
            keepAlive: false,
            rejectUnauthorized: false
        }); //secureProtocol: 'TLSv1_method'
    }

    let response = await axios(config);
    console.log("update response of axios url -----------------> ", response.data);
    return response.data;

};

const deleteCatalogFuction = async (catalogid, accesstoken, requestPayload) => {
    try{
        console.log({ catalogid, accesstoken, requestPayload });
        let data = JSON.stringify({
            "catalogid": catalogid,
            "request": requestPayload
        });
            let messageUrl = 'http://68.183.90.255:5000/pincatalog/deleteCatalog';

        let config = {
            method: 'post',
            url: messageUrl,
            headers: {
                'accesstoken': accesstoken,
                'Content-Type': 'application/json'
            },
            data: data
        };
    
        let protocol = httpUrl.parse(messageUrl).protocol;
        if (protocol != null && protocol == "https:") {
            config.httpsAgent = new https.Agent({
                keepAlive: false,
                rejectUnauthorized: false
            }); //secureProtocol: 'TLSv1_method'
        } else {
            config.httpAgent = new http.Agent({
                keepAlive: false,
                rejectUnauthorized: false
            }); //secureProtocol: 'TLSv1_method'
        }
    
        let response = await axios(config);
        console.log("delete response of axios url -----------------> ", response.data);
        return response.data;

    }catch(error){
        console.log(error);
        return res.send({
            code: 'WA006',
            status: 'Failed',
            message: 'Something went wrong',
            data: {}
        }); 
    }
   

};


const createCatalogFuction = async (catalogid, accesstoken, requestPayload) => {
    try{
        console.log({ catalogid, accesstoken, requestPayload });
        let data = JSON.stringify({
            "catalogid": catalogid,
            "request": requestPayload
        });
        let messageUrl = 'http://68.183.90.255:5000/pincatalog/createCatalog';
    
        let config = {
            method: 'post',
            url: messageUrl,
            headers: {
                'accesstoken': accesstoken,
                'Content-Type': 'application/json'
            },
            data: data
        };
    
        let protocol = httpUrl.parse(messageUrl).protocol;
        if (protocol != null && protocol == "https:") {
            config.httpsAgent = new https.Agent({
                keepAlive: false,
                rejectUnauthorized: false
            }); //secureProtocol: 'TLSv1_method'
        } else {
            config.httpAgent = new http.Agent({
                keepAlive: false,
                rejectUnauthorized: false
            }); //secureProtocol: 'TLSv1_method'
        }
    
        let response = await axios(config);
        console.log("Create response of axios url -----------------> ", JSON.stringify(response.data));
        console.log(response)
        return response.data;
    }catch(error){
        console.log(error);
        return res.send({
            code: 'WA006',
            status: 'Failed',
            message: 'Something went wrong',
            data: {}
        }); 
    }
   
};



let fetchcatalogproduct = async function (req, res) {
    try {

        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let id = req.body.catalogid;
        let userid = null;
        let wabaid = null;
        let SystemAccessToken = null;
        console.log({ apikeys, wanumber, id });

        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        if (!req.headers.wanumber) {
            return {
                code: 'WA002',
                status: 'FAILED',
                message: 'Wanumber Key is required',
                data: {}
            };
        }
        if (!id) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'Catalogid Name is required',
                data: {}
            };
        }

        let apikeyResult = await getUserId(apikeys, wanumber);
        console.log("apikeyResult -------------------> ", apikeyResult);
        if (apikeyResult != null && apikeyResult.length > 0) {
            userid = apikeyResult[0][0].userid;
            console.log("userid -------------------> ", userid);
        } else {
            return res.send({
                code: 'WA006',
                status: 'FAILED',
                message: 'Correct API Key is required',
                data: {}
            });
        }

        let getWabaIdResult = await getWabaId(userid, wanumber);
        if (getWabaIdResult != null && getWabaIdResult.length > 0) {
            wabaid = getWabaIdResult[0][0].whatsapp_business_account_id;
            console.log("wabaid -------------------> ", wabaid);
        } else {
            return res.send({
                code: 'WA006',
                status: 'FAILED',
                message: 'correct credential Key is required',
                data: {}
            });
        }


        let getAccessTokenResult = await getAccessToken();

        if (getAccessTokenResult != null && getAccessTokenResult.length > 0) {
            console.log("SystemAccessToken =====================> ", getAccessTokenResult[0][0].value);

            SystemAccessToken = getAccessTokenResult[0][0].value;
        }

        let fetcatlogresult = await catlogueget(SystemAccessToken, id);

        if (fetcatlogresult != null && fetcatlogresult.length > 0) {
            // console.log("fetcatlogresult =====================> ", fetcatlogresult);
            return res.send({
                code: 200,
                status: 'SUCCESS',
                message: "Catalog data fetch successfully",
                data: fetcatlogresult
            });
        } else {
            return res.send({
                code: '100',
                status: 'FAILED',
                message: 'Invalid catalog id',
                data: {}
            });;
        }
        // return res.send("api working fine");
    } catch (error) {

        console.log(error);
        return res.send({
            code: 'WA006',
            status: 'Failed',
            message: 'Something went wrong',
            data: {}
        });
    }
};


let updateCatalog = async function (req, res) {
    try {
        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let id = req.body.catalogid;
        let requestbody = req.body.request;
        let userid = null;
        let wabaid = null;
        let SystemAccessToken = null;
        console.log({ apikeys, wanumber, id });

        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        if (!req.headers.wanumber) {
            return {
                code: 'WA002',
                status: 'FAILED',
                message: 'Wanumber Key is required',
                data: {}
            };
        }
        if (!id) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'Catalogid Name is required',
                data: {}
            };
        }

        let apikeyResult = await getUserId(apikeys, wanumber);
        console.log("apikeyResult -------------------> ", apikeyResult);
        if (apikeyResult != null && apikeyResult.length > 0) {
            userid = apikeyResult[0][0].userid;
            console.log("userid -------------------> ", userid);
        } else {
            return res.send({
                code: 'WA006',
                status: 'FAILED',
                message: 'Correct API Key is required',
                data: {}
            });
        }

        let getWabaIdResult = await getWabaId(userid, wanumber);
        if (getWabaIdResult != null && getWabaIdResult.length > 0) {
            wabaid = getWabaIdResult[0][0].whatsapp_business_account_id;
            console.log("wabaid -------------------> ", wabaid);
        } else {
            return res.send({
                code: 'WA006',
                status: 'FAILED',
                message: 'correct credential Key is required',
                data: {}
            });
        }


        let getAccessTokenResult = await getAccessToken();

        if (getAccessTokenResult != null && getAccessTokenResult.length > 0) {
            console.log("SystemAccessToken =====================> ", getAccessTokenResult[0][0].value);

            SystemAccessToken = getAccessTokenResult[0][0].value;
        }

        let updateCatalogresult = await updateCatalogFuction(id, SystemAccessToken, requestbody);
        console.log("update catalog result ------------------->  ", updateCatalogresult);
        if (updateCatalogresult != null) {
            // console.log("fetcatlogresult =====================> ", fetcatlogresult);
            return res.send({
                data: updateCatalogresult
            });
        } else {
            return res.send({
                code: '100',
                status: 'FAILED',
                message: 'Invalid catalog id',
                data: {}
            });;
        }
        // return res.send("working....................");



    } catch (err) {
        console.log("inside the catch----------> ", err);
        return res.send({
            code: 'WA006',
            status: 'failed',
            message: 'Something went wrong',
            data: {}
        });
    }
};

let deleteCatalog = async function (req, res) {
    try {
        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let id = req.body.catalogid;
        let requestbody = req.body.request;
        let userid = null;
        let wabaid = null;
        let SystemAccessToken = null;
        console.log({ apikeys, wanumber, id });

        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        if (!req.headers.wanumber) {
            return {
                code: 'WA002',
                status: 'FAILED',
                message: 'Wanumber Key is required',
                data: {}
            };
        }
        if (!id) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'Catalogid Name is required',
                data: {}
            };
        }

        let apikeyResult = await getUserId(apikeys, wanumber);
        console.log("apikeyResult -------------------> ", apikeyResult);
        if (apikeyResult != null && apikeyResult.length > 0) {
            userid = apikeyResult[0][0].userid;
            console.log("userid -------------------> ", userid);
        } else {
            return res.send({
                code: 'WA006',
                status: 'FAILED',
                message: 'Correct API Key is required',
                data: {}
            });
        }

        let getWabaIdResult = await getWabaId(userid, wanumber);
        if (getWabaIdResult != null && getWabaIdResult.length > 0) {
            wabaid = getWabaIdResult[0][0].whatsapp_business_account_id;
            console.log("wabaid -------------------> ", wabaid);
        } else {
            return res.send({
                code: 'WA006',
                status: 'FAILED',
                message: 'correct credential Key is required',
                data: {}
            });
        }


        let getAccessTokenResult = await getAccessToken();

        if (getAccessTokenResult != null && getAccessTokenResult.length > 0) {
            console.log("SystemAccessToken =====================> ", getAccessTokenResult[0][0].value);

            SystemAccessToken = getAccessTokenResult[0][0].value;
        }

        let updateCatalogresult = await deleteCatalogFuction(id, SystemAccessToken, requestbody);
        console.log("update catalog result ------------------->  ", updateCatalogresult);
        if (updateCatalogresult != null) {
            // console.log("fetcatlogresult =====================> ", fetcatlogresult);
            return res.send({
                data: updateCatalogresult
            });
        } else {
            return res.send({
                code: '100',
                status: 'FAILED',
                message: 'Invalid catalog id',
                data: {}
            });;
        }
        // return res.send("working....................");



    } catch (err) {
        console.log("inside the catch----------> ", err);
        return res.send({
            code: 'WA006',
            status: 'failed',
            message: 'Something went wrong',
            data: {}
        });
    }
};

let createCatalog = async function (req, res) {
    try {
        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let id = req.body.catalogid;
        let requestbody = req.body.request;
        let userid = null;
        let wabaid = null;
        let SystemAccessToken = null;
        console.log({ apikeys, wanumber, id });

        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        if (!req.headers.wanumber) {
            return {
                code: 'WA002',
                status: 'FAILED',
                message: 'Wanumber Key is required',
                data: {}
            };
        }
        if (!id) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'Catalogid Name is required',
                data: {}
            };
        }

        let apikeyResult = await getUserId(apikeys, wanumber);
        console.log("apikeyResult -------------------> ", apikeyResult);
        if (apikeyResult != null && apikeyResult.length > 0) {
            userid = apikeyResult[0][0].userid;
            console.log("userid -------------------> ", userid);
        } else {
            return res.send({
                code: 'WA006',
                status: 'FAILED',
                message: 'Correct API Key is required',
                data: {}
            });
        }

        let getWabaIdResult = await getWabaId(userid, wanumber);
        if (getWabaIdResult != null && getWabaIdResult.length > 0) {
            wabaid = getWabaIdResult[0][0].whatsapp_business_account_id;
            console.log("wabaid -------------------> ", wabaid);
        } else {
            return res.send({
                code: 'WA006',
                status: 'FAILED',
                message: 'correct credential Key is required',
                data: {}
            });
        }


        let getAccessTokenResult = await getAccessToken();

        if (getAccessTokenResult != null && getAccessTokenResult.length > 0) {
            console.log("SystemAccessToken =====================> ", getAccessTokenResult[0][0].value);

            SystemAccessToken = getAccessTokenResult[0][0].value;
        }

        let updateCatalogresult = await createCatalogFuction(id, SystemAccessToken, requestbody);
        console.log("update catalog result ------------------->  ", updateCatalogresult);
        if (updateCatalogresult != null) {
            // console.log("fetcatlogresult =====================> ", fetcatlogresult);
            return res.send({
                data: updateCatalogresult
            });
        } else {
            return res.send({
                code: '100',
                status: 'FAILED',
                message: 'Invalid catalog id',
                data: {}
            });;
        }
        // return res.send("working....................");



    } catch (err) {
        console.log("inside the catch----------> ", err);
        return res.send({
            code: 'WA006',
            status: 'failed',
            message: 'Something went wrong',
            data: {}
        });
    }
};
module.exports = { fetchcatalogproduct, updateCatalog, deleteCatalog, createCatalog };
