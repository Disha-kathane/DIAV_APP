const dbpool = require('../../db/wabot');

const {
    errorLogger,
    infoLogger
} = require('../../applogger');

const {
    TBL_MESSAGE_REQUEST_MASTER,
    TBL_MESSAGE_SENT_MASTER,
    TBL_USERS_MASTER,
    TBL_TEMPLATE_MASTER,
    TBL_API_KEYS_MASTER,
    TBL_WA_MSG_SETTINGS_MASTER,
    TBL_WA_MEDIA_MASTER,
    TBL_SUBSCRIPTION_MASTER,
    TBL_CONTACTS_MASTER
} = require('../../constants/tables');

const MSG_LIMIT = 50;

fetchMessages = async (next) => {

    try {
        // let query = "SELECT * FROM " + TBL_MESSAGE_REQUEST_MASTER + " WHERE appisprocessed = ? AND ismsgsent = ? ORDER BY priority ASC LIMIT ?";
        // let query = "SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string FROM ezb_message_request_master AS a"+
        // " LEFT JOIN ezb_wa_templates AS b ON a.templateid = b.tempid"+
        // " WHERE a.appisprocessed = ? AND a.ismsgsent = ? ORDER BY a.priority ASC LIMIT ?";

        let query = "SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string, b.body_message FROM" +
            " ezb_message_request_master AS a," +
            " ezb_wa_templates AS b," +
            " ezb_users AS c, ezb_wa_campaign_master AS d" +
            " WHERE a.appisprocessed = ?" +
            " AND a.ismsgsent = ?" +
            " AND a.templateid = b.tempid" +
            " AND a.userid=c.userid" +
            " AND c.userid=b.userid" +
            " AND a.campaignid=d.campaignid" +
            " AND d.is_schedule = ?" +
            " AND a.appid = ?" +
            " ORDER BY a.priority ASC LIMIT ?";

        let values = [0, 0, 0, 0, MSG_LIMIT];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
};

fetchScheduledMessages = async (next) => {

    try {
        // let query = "SELECT a.*, d.schedule_datetime, b.placeholder_template_type, b.button_option, b.button_option_string, b.body_message" +
        //     " FROM ezb_message_request_master AS a, ezb_wa_templates AS b, ezb_users AS c, ezb_wa_campaign_master AS d" +
        //     " WHERE a.userid=c.userid" +
        //     " AND c.userid=b.userid" +
        //     " AND b.userid=d.userid" +
        //     " AND a.campaignid=d.campaignid" +
        //     " AND a.appisprocessed = ?" +
        //     " AND a.ismsgsent = ?" +
        //     " AND a.templateid = b.tempid" +
        //     " AND d.is_schedule = ?" +
        //     " AND d.schedule_datetime >= NOW()  - INTERVAL ? MINUTE" +
        //     " ORDER BY a.priority ASC LIMIT ?";

        let query = "SELECT a.*, d.schedule_datetime, b.placeholder_template_type, b.button_option, b.button_option_string, b.body_message" +
            " FROM ezb_message_request_master AS a, ezb_wa_templates AS b, ezb_users AS c, ezb_wa_campaign_master AS d" +
            " WHERE a.userid=c.userid" +
            " AND c.userid=b.userid" +
            " AND b.userid=d.userid" +
            " AND a.campaignid=d.campaignid" +
            " AND a.appisprocessed = ?" +
            " AND a.ismsgsent = ?" +
            " AND a.templateid = b.tempid" +
            " AND d.is_schedule = ?" +
            " AND timestampdiff(MINUTE, NOW(), d.schedule_datetime) BETWEEN ? AND ?" +
            " ORDER BY a.priority ASC LIMIT ?";

        let values = [0, 0, 1, 1, 0, 1, MSG_LIMIT];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
};

fetchUserStatus = async (userid, next) => {
    try {
        let query = "SELECT userstatus FROM " + TBL_USERS_MASTER + " WHERE userid = ?";
        let values = [userid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
};

insertMessageInSentMaster = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, bodyContent, appid, next) => {
    try {
        let query = null;
        let values = null;
        if (id == 0) {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,body_content)" +
                " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?)";
            values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, appid, 0, 0, msgType, 1, campaignid, wanumber, wa_msg_setting_id, direction, bodyContent];

        }
        else {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid,contactno,msg_setting_id,direction,body_content)" +
                " VALUES(?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?)";
            values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, appid, 0, 0, msgType, campaignid, wanumber, wa_msg_setting_id, direction, bodyContent];

        }
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
};

insertMessageInSentMasterAPI = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, clientPayload, bodyContent, countryCodeNumeric,category,categoryId, next) => {
    try {
        let query = null;
        let values = null;
        // objMsg = JSON.stringify(objMsg).replace(/\"/g, '\\\"');
        // console.log(JSON.stringify(clientPayload));
        if (objMsg != undefined && objMsg.text != undefined && objMsg.text.body) {
            objMsg.text.body = objMsg.text.body.replace(/\"/g, '\\\"');
        }

        if (id == 0) {
            // requestid removed from insert query by khushal bhalekar to check deadlock issue - 27/03/2023
            // query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,client_payload, body_content, sentdt, billingdt, countrycode, submissiontype)" +
            //     " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?, NOW(), NOW(),?,'NOTIFICATION')";
            // values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, 0, 0, 0, msgType, 1, campaignid, wanumber, wa_msg_setting_id, direction, JSON.stringify(clientPayload), JSON.stringify(bodyContent), countryCodeNumeric];

            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,client_payload, body_content, sentdt, billingdt, countrycode, submissiontype,category,sessid,category_id)" +
                " VALUES(?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?, NOW(), NOW(),?,'NOTIFICATION',LOWER(?),MD5(?),?)";
            values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, 0, 0, 0, msgType, 1, campaignid, wanumber, wa_msg_setting_id, direction, JSON.stringify(clientPayload), JSON.stringify(bodyContent), countryCodeNumeric, category, waMessageId, categoryId];
        }
        else {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid,contactno,msg_setting_id,direction,client_payload, body_content, sentdt, billingdt, countrycode, submissiontype,category,sessid,category_id)" +
                " VALUES(?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?, NOW(), NOW(),?,'NOTIFICATION',LOWER(?),MD5(?),?)";
            values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, 0, 0, 0, msgType, campaignid, wanumber, wa_msg_setting_id, direction, JSON.stringify(clientPayload), JSON.stringify(bodyContent), countryCodeNumeric, category, waMessageId, categoryId];

        }
        // console.log(query);
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

updateMessageInRequestMaster = async (ismsgsent, error, id, next) => {
    try {
        let query = "UPDATE " + TBL_MESSAGE_REQUEST_MASTER + " SET ismsgsent = ?, error = ? WHERE id = ?";
        let values = [ismsgsent, error, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

deleteMessageFromRequestMaster = async (ismsgsent, id, next) => {
    try {
        let query = "DELETE FROM " + TBL_MESSAGE_REQUEST_MASTER + " WHERE ismsgsent = ? AND id = ?";
        let values = [ismsgsent, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

// getApiKey = async (apikey, next) => {
//     try {
//         let query = "SELECT a.userid, a.apikey, b.userstatus FROM " + TBL_API_KEYS_MASTER + " AS a LEFT JOIN " + TBL_USERS_MASTER + " AS b ON a.userid = b.userid WHERE a.apikey = ? AND a.kstatus = ?";
//         let values = [apikey, 1];
//         let rows = await dbpool.query(query, values);
//         next(null, rows[0]);
//     }
//     catch (err) {
//         console.log(err);
//         next(err);
//     }
// }

getApiKey = async (apikey, next) => {
    try {
        let query = "SELECT a.userid, a.apikey, b.userstatus, b.balance_amt, b.billing_type, b.account_type FROM " + TBL_API_KEYS_MASTER + " AS a LEFT JOIN " + TBL_USERS_MASTER + " AS b ON a.userid = b.userid WHERE a.apikey = ? AND a.kstatus = ?";
        let values = [apikey, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

getTemplate = async (templateid, next) => {
    try {
        let query = "SELECT * FROM " + TBL_TEMPLATE_MASTER + " WHERE tempid = ? AND status = ?";
        let values = [templateid, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        // console.log('getTemplate : '+err);
        next(err);
    }
};

getWabaInfo = async (userid, next) => {
    try {
        let query = "SELECT waurl, authtoken, hsmnamespace FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid = ?";
        let values = [userid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
};

getSpecificWabaInfo = async (userid, wabanumber, next) => {
    try {

        // let query = "SELECT wa_msg_setting_id, wanumber, waurl, authtoken, hsmnamespace FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid = ? AND wanumber LIKE ?";
        // let values = [userid, '%' + wabanumber];

        let query = "SELECT wa_msg_setting_id, wanumber, waurl, authtoken, hsmnamespace FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid = ? AND wanumber = ?";
        let values = [userid, "+" + wabanumber];
        let rows = await dbpool.query(query, values);
        console.log('GET_SPECIFIC_WABA_INFO===============================>' + JSON.stringify(rows[0]), query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchMediaFileName = async (mediaid, next) => {
    try {
        let query = "SELECT medianame, mediatype, mediaurl FROM " + TBL_WA_MEDIA_MASTER + " WHERE mediaid = ?";
        let values = [mediaid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

checkSubscription = async (wanumber, contactno, next) => {
    try {
        // console.log(wanumber);
        let query = "SELECT subflag FROM " + TBL_SUBSCRIPTION_MASTER + " WHERE wanumber = ? AND wabanumber = ?";
        let values = [wanumber, contactno];
        let rows = await dbpool.query(query, values);
        let subflag = rows[0].length > 0 && rows[0][0].subflag == 0 ? 0 : 1;
        // console.log('subflag : ' + subflag);
        next(null, subflag);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

updateUnsubscribedMessage = async (id, next) => {
    try {
        let query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, faileddt = NOW() WHERE requestid = ?";
        let values = [3, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

updateUnsubscribedMessageAPI = async (id, countrycode, next) => {
    try {
        let query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, faileddt = NOW(), countrycode = ?, rate = ? WHERE id = ?";
        let values = [3, countrycode, 0, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const checkOptinContact = async (userId, mobileNo, next) => {
    try {
        let querySel = 'SELECT wanumber FROM ' + TBL_CONTACTS_MASTER + ' WHERE userid = ? AND wanumber = ?';
        let selValues = [userId, mobileNo];
        let rows = await dbpool.query(querySel, selValues);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const checkOptinContactStatus = async (userId, mobileNo, next) => {
    try {
        let querySel = 'SELECT wanumber, wastatus FROM ' + TBL_CONTACTS_MASTER + ' WHERE userid = ? AND wanumber = ? LIMIT 1';
        let selValues = [userId, mobileNo];
        let rows = await dbpool.query(querySel, selValues);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const checkOptinContactStatus_Mod = async (from, mobileNo, next) => {
    try {

        // let querySel = 'SELECT wanumber, wastatus FROM ' + TBL_CONTACTS_MASTER + ' WHERE contactno LIKE ? AND wanumber = ? AND NOW()<=authvalidity LIMIT 1';
        // let selValues = ['%' + from, mobileNo];
        let querySel = 'SELECT wanumber, wastatus FROM ' + TBL_CONTACTS_MASTER + ' WHERE contactno = ? AND wanumber = ? AND NOW()<=authvalidity LIMIT 1';
        let selValues = ['+' + from, mobileNo];
        let rows = await dbpool.query(querySel, selValues);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

const insertOptinContacts = async (mobileNo, userId, campaignId, status, next) => {
    try {
        let queryInsert = 'INSERT INTO ' + TBL_CONTACTS_MASTER + ' (wanumber, userid, source, campaignid, wastatus, authvalidity) VALUES (?,?,?,?,?,DATE_ADD(curdate(), INTERVAL 7 DAY))';
        let values = [mobileNo, userId, 0, campaignId, status];
        let rows = await dbpool.query(queryInsert, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
};

const insertOptinContacts_Mod = async (mobileNo, from, userId, campaignId, status, next) => {
    try {
        let queryInsert = 'INSERT INTO ' + TBL_CONTACTS_MASTER + ' (contactno, wanumber, userid, source, campaignid, wastatus, authvalidity) VALUES (?, ?,?,?,?,?,DATE_ADD(curdate(), INTERVAL 7 DAY))';
        let values = [from, mobileNo, userId, 0, campaignId, status];
        let rows = await dbpool.query(queryInsert, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
};

const updateContactListopin = async (mobileNumber, userId, status, waId) => {
    const query = 'UPDATE ' + TBL_CONTACTS_MASTER + ' SET waid = ?, wastatus = ?, ' +
        'authvalidity = DATE_ADD(curdate(), INTERVAL 7 DAY) WHERE wanumber= ? AND userid = ?;';
    if (/^\+/.test(mobileNumber) == true) {
        mobileNumber = mobileNumber.toString().replace('+', '');
    }
    const values = [waId, status, mobileNumber, userId];
    return dbpool.query(query, values);
};

const insertMedia = async (mediaid, mediatype, mediaurl, medianame, userid, next) => {
    try {
        let queryInsert = 'INSERT INTO ' + TBL_WA_MEDIA_MASTER + ' (mediaid,mediatype,mediaurl,medianame,userid) VALUES (?,?,?,?,?)';
        let values = [mediaid, mediatype, mediaurl, medianame, userid];
        let rows = await dbpool.query(queryInsert, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
};

const fetchTemplate = async (wabaNumber, next) => {
    try {

        // let query = "SELECT a.*, b.hsmnamespace FROM ezb_wa_templates AS a, ezb_wa_msg_settings AS b" +
        //     " WHERE a.userid = b.userid AND CONVERT(a.temptitle USING utf8) = CONVERT(b.hsmname USING utf8) AND b.wanumber LIKE ?";
        // let values = ['%' + wabaNumber];

        let query = "SELECT a.*, b.hsmnamespace FROM ezb_wa_templates AS a, ezb_wa_msg_settings AS b" +
            " WHERE a.userid = b.userid AND CONVERT(a.temptitle USING utf8) = CONVERT(b.hsmname USING utf8) AND b.wanumber = ?";
        let values = ["+" + wabaNumber];

        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};


// For cloud as well as for premises 06/06/2022 added by sneha

const checkWanumber = async (wabanumber, next) => {
    try {

        // let query = "SELECT phone_number_id ,wanumber FROM ezb_wa_msg_settings WHERE wanumber LIKE ? LIMIT 1";
        // let values = ['%' + wabanumber];

        let query = "SELECT phone_number_id ,wanumber FROM ezb_wa_msg_settings WHERE wanumber = ? LIMIT 1";
        let values = ["+" + wabanumber];

        let rows = await dbpool.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }
};



const getSystemAccessToken = async (next) => {
    try {

        let query = "SELECT VALUE FROM ezeebot.ezb_system_config WHERE paramname =? ";
        let values = ['ACCESS_TOKEN'];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }

};

const fetchWabaNumber = async (apikey, next) => {
    try {
        let query = "SELECT a.wanumber, a.waurl," +
            " CASE WHEN a.phone_number_id IS NOT NULL THEN (SELECT value FROM ezb_system_config WHERE paramname = 'ACCESS_TOKEN') ELSE a.authtoken END AS authtoken," +
            " CASE WHEN a.phone_number_id IS NOT NULL THEN 1 ELSE 0 END AS iscloud" +
            " FROM ezb_wa_msg_settings AS a, ezb_wa_api_keys AS b" +
            " WHERE a.userid = b.userid AND b.apikey = ?";
        let values = [apikey];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

const fetchWabaTemplate = async (apikey, next) => {
    try {
        let query = "SELECT a.tempid,a.temptitle,a.category,a.langcode,a.head_temptype,CONVERT(a.head_text_title USING utf8) AS head_text_title," +
            " a.head_mediatype,a.head_media_url,a.head_media_filename,CONVERT(a.body_message USING utf8) AS body_message," +
            " a.placeholders, a.footer_text,a.button_option,a.button_option_string,a.placeholder_template_type" +
            " FROM ezb_wa_templates AS a, ezb_wa_api_keys AS b" +
            " WHERE a.userid = b.userid AND b.apikey = ?";
        let values = [apikey];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};


const validateApikeyWithUser = async (userid, wanumber, next) => {
    try {

        let query = "SELECT userid,phone_number_id,wanumber FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid=? AND wanumber = ?";
        let values = [userid, "+" + wanumber];
        let [result] = await dbpool.query(query, values);
        next(null, result[0]);
    } catch (err) {
        next(err);
    }
};


module.exports = {
    fetchMessages,
    fetchScheduledMessages,
    fetchUserStatus,
    insertMessageInSentMaster,
    insertMessageInSentMasterAPI,
    updateMessageInRequestMaster,
    deleteMessageFromRequestMaster,
    getApiKey,
    getTemplate,
    getWabaInfo,
    getSpecificWabaInfo,
    fetchMediaFileName,
    checkSubscription,
    updateUnsubscribedMessage,
    updateUnsubscribedMessageAPI,
    checkOptinContact,
    insertOptinContacts,
    checkOptinContactStatus,
    checkOptinContactStatus_Mod,
    insertOptinContacts_Mod,
    insertMedia,
    fetchTemplate,
    checkWanumber,
    getSystemAccessToken,
    fetchWabaNumber,
    fetchWabaTemplate,
    validateApikeyWithUser
};