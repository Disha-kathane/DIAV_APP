const whatsappService = require('../../services/v1/whatsapp');
const {getUserId,getWabaId,getAccessToken,getPaymentName} = require('../../services/v1/userStat_async');
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

let paymentname = async function (req, res) {
    try {

        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        // let id = req.body.catalogid;
        let userid = null;
        let wabaid = null;
        let SystemAccessToken = null;
        // console.log({ wanumber, id });

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


        let apikeyResult = await getUserId(apikeys, wanumber);
        // console.log("apikeyResult -------------------> ", apikeyResult);
        if (apikeyResult != null && apikeyResult.length > 0) {
            userid = apikeyResult[0][0].userid;
            // console.log("userid -------------------> ", userid);
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
            // console.log("wabaid -------------------> ", wabaid);
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
            // console.log("SystemAccessToken =====================> ", getAccessTokenResult[0][0].value);

            SystemAccessToken = getAccessTokenResult[0][0].value;
        }

        let getpaymentname = await getPaymentName(userid);

        console.log("getpaymentname --------------->  ", getpaymentname);

        if (getpaymentname != null && getpaymentname.length > 0) {
            // console.log("fetcatlogresult =====================> ", fetcatlogresult);
            return res.send({
                code: 200,
                status: 'SUCCESS',
                message: "Payment data fetch successfully",
                data: getpaymentname[0]
            });
        } else {
            return res.send({
                code: '100',
                status: 'FAILED',
                message: 'something went wrong',
                data: {}
            });;
        }
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
module.exports = { paymentname };
