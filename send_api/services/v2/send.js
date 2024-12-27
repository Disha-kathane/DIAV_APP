const dbpool = require('../../db/wabot');

const {
    errorLogger,
    infoLogger
} = require('../../applogger1.js');

const {
    TBL_MESSAGE_REQUEST_MASTER,
    TBL_MESSAGE_SENT_MASTER,
    TBL_USERS_MASTER,
    TBL_TEMPLATE_MASTER,
    TBL_API_KEYS_MASTER,
    TBL_WA_MSG_SETTINGS_MASTER,
    TBL_WA_MEDIA_MASTER,
    TBL_SUBSCRIPTION_MASTER,
    TBL_CONTACTS_MASTER,
    TBL_SYSTEM_CONFIG_MASTER,
    TBL_EZB_CATLOUGE_MASTER
} = require('../../constants/tables');

const MSG_LIMIT = 50;






const insertMessageInSentMasterAPI = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, clientPayload, bodyContent, countryCodeNumeric,category,categoryId) => {
    try {
        let query;
        let values;

        // console.log(JSON.stringify(clientPayload));
        if (objMsg != undefined && objMsg.text != undefined && objMsg.text.body) {
            objMsg.text.body = objMsg.text.body.replace(/\"/g, '\\\"');
        }

        if (id == 0) {
            // query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,client_payload, body_content, sentdt, billingdt, countrycode, submissiontype)" +
            //     " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?, NOW(), NOW(),?,'NOTIFICATION')";
            // values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, 0, 0, 0, msgType, 1, campaignid, wanumber, wa_msg_setting_id, direction, JSON.stringify(clientPayload), JSON.stringify(bodyContent), countryCodeNumeric];
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,client_payload, body_content, sentdt, billingdt, countrycode, submissiontype,category,sessid,category_id)" +
                " VALUES(?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?, NOW(), NOW(),?,'NOTIFICATION',LOWER(?),MD5(?),?)";
            values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, 0, 0, 0, msgType, 1, campaignid, wanumber, wa_msg_setting_id, direction, JSON.stringify(clientPayload), JSON.stringify(bodyContent), countryCodeNumeric, category, waMessageId, categoryId];
        }
        // else {
        //     query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid,contactno,msg_setting_id,direction,client_payload, body_content, sentdt, billingdt, countrycode, submissiontype)" +
        //         " VALUES(?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?, NOW(),NOW(),?,'NOTIFICATION')";
        //     values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, 0, 0, 0, msgType, campaignid, wanumber, wa_msg_setting_id, direction, JSON.stringify(clientPayload), JSON.stringify(bodyContent), countryCodeNumeric];

        // }
        let [result] = await dbpool.query(query, values);
        return result;
    }
    catch (err) {
        return err;
    }
};





const getApiKey = async (apikey) => {
    try {
        let query = "SELECT a.userid, a.apikey, b.userstatus, b.balance_amt, b.billing_type, b.account_type FROM " + TBL_API_KEYS_MASTER + " AS a LEFT JOIN " + TBL_USERS_MASTER + " AS b ON a.userid = b.userid WHERE a.apikey = ? AND a.kstatus = ?";
        let values = [apikey, 1];
        const [result] = await dbpool.query(query, values);
        return result;
    } catch (err) {
        return err;

    }
};


const checkWanumber = async (wabanumber) => {
    try {
        let query = "SELECT phone_number_id ,wanumber FROM ezb_wa_msg_settings WHERE wanumber = ?;";
        let values = ["+" + wabanumber];
        let [result] = await dbpool.query(query, values);
        return result;

    } catch (err) {
        return err;
    }
};

const getTemplate = async (templateid) => {
    try {
        let query = "SELECT * FROM " + TBL_TEMPLATE_MASTER + " WHERE tempid = ? AND status = ?";
        let values = [templateid, 1];
        let [result] = await dbpool.query(query, values);
        return result; sendCloudApi;
    } catch (err) {
        return err;
    }
};



const getSpecificWabaInfo = async (userid, wabanumber) => {
    try {
        // let query = "SELECT wa_msg_setting_id, wanumber, waurl, authtoken, hsmnamespace FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid = ? AND wanumber LIKE ?";
        // let values = [userid, '%' + wabanumber];

        let query = "SELECT wa_msg_setting_id, wanumber, waurl, authtoken, hsmnamespace FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid = ? AND wanumber = ?";
        let values = [userid, "+" + wabanumber];
        let [result] = await dbpool.query(query, values);
        return result;
    }
    catch (err) {
        return err;
    }
};

const fetchMediaFileName = async (mediaid) => {
    try {
        let query = "SELECT medianame, mediatype, mediaurl FROM " + TBL_WA_MEDIA_MASTER + " WHERE mediaid = ?";
        let values = [mediaid];
        let [result] = await dbpool.query(query, values);
        return result;
    } catch (err) {
        return err;
    }
};

const checkSubscription = async (wanumber, contactno) => {
    try {

        let query = "SELECT subflag FROM " + TBL_SUBSCRIPTION_MASTER + " WHERE wanumber = ? AND wabanumber = ?";
        let values = [wanumber, contactno];
        let rows = await dbpool.query(query, values);
        let subflag = rows[0].length > 0 && rows[0][0].subflag == 0 ? 0 : 1;
        // console.log('subflag : ' + subflag);
        return subflag;
    } catch (err) {
        return err;
    }
};



const updateUnsubscribedMessageAPI = async (id, countrycode) => {
    try {
        let query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, faileddt = NOW(), countrycode = ?, rate = ? WHERE id = ?";
        let values = [3, countrycode, 0, id];
        let [result] = await dbpool.query(query, values);
        return result;
    } catch (err) {
        return err;
    }
};


const getSystemAccessToken = async () => {
    try {

        let query = "SELECT VALUE FROM " + TBL_SYSTEM_CONFIG_MASTER + " WHERE paramname =? ";
        let values = ['ACCESS_TOKEN'];
        let [result] = await dbpool.query(query, values);
        return result;
    } catch (err) {
        return err;
    }

};


const validateApikeyWithUser = async (userid, wanumber) => {
    try {

        let query = "SELECT userid,phone_number_id,wanumber FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid=? AND wanumber = ?";
        let values = [userid, "+" + wanumber];
        let [result] = await dbpool.query(query, values);
        return result;
    } catch (err) {
        return err;
    }
};



const getCatlogID = async (userid, wanumber) => {
    try {
        let query = "SELECT catlogid FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid =? AND wanumber =?";
        let values = [userid, "+" + wanumber];
        let [result] = await dbpool.query(query, values);
        return result[0].catlogid;
    } catch (err) {
        return err;
    }
};


const getCatlogIdinfo = async (userid) => {
    try {

        let query = `SELECT userid, catalogid, retailerid, product_type from ${TBL_EZB_CATLOUGE_MASTER} WHERE userid = ?`;
        let values = [userid];
        let [result] = await dbpool.query(query, values);
        return result;
    } catch (err) {
        return err;
    }
};

const getAccesstoken = async () => {
    try {
        let query = "select value from " + TBL_SYSTEM_CONFIG_MASTER + " WHERE paramname = 'ACCESS_TOKEN' ";
        let values = [];
        let [result] = await dbpool.query(query, values);

        // console.log({ result });
        return result;

    } catch (err) {
        return err;
    }
};

insertcurrentdatetime = async (currentdatetime, mobileno, browser, os, campaignid, next) => {
    try {
        let query = "Insert into calltoaction_table(datetime,mobilenumber,browser,os,campaignid) values(?,?,?,?,?)";
        let values = [currentdatetime, mobileno, browser, os, campaignid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

module.exports = {
    insertMessageInSentMasterAPI,
    getApiKey,
    checkWanumber,
    getTemplate,
    getSpecificWabaInfo,
    fetchMediaFileName,
    checkSubscription,
    updateUnsubscribedMessageAPI,
    getSystemAccessToken,
    validateApikeyWithUser,
    getCatlogID,
    getCatlogIdinfo,
    getAccesstoken,
    insertcurrentdatetime
};