
const wabot_db = require('../../db/database');
const fs = require('fs');
const async = require('async');
const AWS = require('aws-sdk');
const path = require('path');


const getUserId = async (apikeys, wanumber) => {
    try {
        console.log("paymentmethod getUserId -------------------> "+apikeys, wanumber);
        const query = 'SELECT a.userid FROM ezb_wa_api_keys AS a , ezb_wa_msg_settings AS b WHERE a.userid = b.userid AND a.apikey = ? AND  b.wanumber = ?';
        const value = [apikeys, '+' + wanumber];
        const rows = await wabot_db.query(query, value);
        console.log("paymentmethod getUserId -------------------> "+JSON.stringify(rows));
        return rows;
        // next(null, rows[0]);
    } catch (err) {
        console.log(err);
    }
};

const getWabaId = async (userid, wanumber) => {
    try {
        const query = 'SELECT whatsapp_business_account_id FROM `ezb_wa_msg_settings` WHERE userid =? AND wanumber=?';
        const value = [userid, '+' + wanumber];
        const rows = await wabot_db.query(query, value);
        // console.log("getWabaId -------------->", rows);
        return rows;
    } catch (err) {
        console.log(err);
    }
};

const getAccessToken = async () => {
    try {
        const query = 'select value from `ezb_system_config` where paramname = ?';
        const value = ['ACCESS_TOKEN'];
        const rows = await wabot_db.query(query, value);
        // next(null, rows[0]);
        // console.log("getAccessToken -------------> ", rows);
        return rows;
    } catch (err) {
        console.log(err);
    }

};


const getPaymentName = async (userid) => {
    try {
        const query = 'SELECT payment_name, payment_method, payment_currency FROM ezb_non_catalog_product_common_details where userid =?';
        const value = [userid];
        const rows = await wabot_db.query(query, value);
        return rows;
    } catch (err) {
        console.log(err);
    }

};

module.exports = {
    getUserId,
    getWabaId,
    getAccessToken,
    getPaymentName
}