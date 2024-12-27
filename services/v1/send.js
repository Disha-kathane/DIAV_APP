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
    TBL_CUSTOM_RATE_MASTER,
    TBL_DEFAULT_RATE_MASTER,
    TBL_INVALID_CONTACTS
} = require('../../constants/tables');

const MSG_LIMIT = 50;
const RETRY_MSG_LIMIT = 500;
const RETRY_COUNT = 2;
const IS_OPTIN = 2;

fetchMessageConfig = async (next) => {
    try {
        let query = "SELECT (SELECT value FROM ezb_system_config WHERE paramname = 'RETRY_COUNT') AS retry_count," +
            "(SELECT value FROM ezb_system_config WHERE paramname = 'MSG_LIMIT') AS msg_limit" +
            " FROM ezb_system_config LIMIT ?;";
        let values = [1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

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

fetchFailedMessages = async (retry_count, next) => {

    try {
        let query = "SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string, b.body_message FROM" +
            " ezb_message_request_master AS a," +
            " ezb_wa_templates AS b," +
            " ezb_users AS c, ezb_wa_campaign_master AS d" +
            " WHERE a.appisprocessed = ?" +
            // " AND a.ismsgsent = ?" +
            " AND a.templateid = b.tempid" +
            " AND a.userid=c.userid" +
            " AND c.userid=b.userid" +
            " AND a.campaignid=d.campaignid" +
            " AND (a.isoptin = ? OR (a.retrycount >= ? AND a.retrycount!=?))" +
            " ORDER BY a.createdt ASC" +
            " LIMIT ?";

        // let values = [0, 0, IS_OPTIN, RETRY_COUNT, RETRY_MSG_LIMIT];
        let values = [0, IS_OPTIN, retry_count, 7, RETRY_MSG_LIMIT];

        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};


fetchFailedMessages_1 = async (retry_count, next) => {

    try {
        let query = "SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string, b.body_message FROM" +
            " ezb_message_request_master AS a," +
            " ezb_wa_templates AS b," +
            " ezb_users AS c" +
            " WHERE a.appisprocessed = ?" +
            " AND a.templateid = b.tempid" +
            " AND a.userid=c.userid" +
            " AND c.userid=b.userid" +
            " AND a.campaignid = ?" +
            " AND (a.isoptin = ? OR (a.retrycount >= ?))" +
            " ORDER BY a.createdt ASC" +
            " LIMIT ?";

        // SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string, b.body_message 
        // FROM ezb_message_request_master AS a, ezb_wa_templates AS b, ezb_users AS c 
        // WHERE a.appisprocessed = 0 
        // AND a.templateid = b.tempid 
        // AND a.userid = c.userid 
        // AND c.userid = b.userid 
        // AND a.campaignid = 0;
        //         AND(a.isoptin = 2 OR(a.retrycount >= 5)) 
        // ORDER BY a.createdt ASC LIMIT 10;


        // let values = [0, 0, IS_OPTIN, RETRY_COUNT, RETRY_MSG_LIMIT];
        let values = [0, 0, IS_OPTIN, retry_count, RETRY_MSG_LIMIT];

        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchFailedMessages_2 = async (retry_count, next) => {

    try {
        let query = "SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string, b.body_message FROM" +
            " ezb_message_request_master_M14August AS a," +
            " ezb_wa_templates AS b," +
            " ezb_users AS c, ezb_wa_campaign_master AS d" +
            " WHERE a.appisprocessed = ?" +
            " AND a.templateid = b.tempid" +
            " AND a.userid=c.userid" +
            " AND c.userid=b.userid" +
            " AND a.campaignid=d.campaignid" +
            " AND (a.isoptin = ? OR (a.retrycount >= ? AND a.retrycount!=?))" +
            " ORDER BY a.createdt ASC" +
            " LIMIT ?";

        // let values = [0, 0, IS_OPTIN, RETRY_COUNT, RETRY_MSG_LIMIT];
        let values = [0, IS_OPTIN, retry_count, 7, RETRY_MSG_LIMIT];

        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchFailedMessages_7 = async (retry_count, next) => {

    try {
        let query = "SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string, b.body_message FROM" +
            " ezb_message_request_master AS a," +
            " ezb_wa_templates AS b," +
            " ezb_users AS c, ezb_wa_campaign_master AS d" +
            " WHERE a.appisprocessed = ?" +
            // " AND a.ismsgsent = ?" +
            " AND a.templateid = b.tempid" +
            " AND a.userid=c.userid" +
            " AND c.userid=b.userid" +
            " AND a.campaignid=d.campaignid" +
            " AND a.retrycount = ?" +
            " ORDER BY a.createdt ASC" +
            " LIMIT ?";

        // let values = [0, 0, IS_OPTIN, RETRY_COUNT, RETRY_MSG_LIMIT];
        let values = [0, 7, RETRY_MSG_LIMIT];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
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

insertMessageInSentMaster = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, bodyContent, appid, rate, countrycode, next) => {
    try {
        let query;
        let values;
        if (id == 0) {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,body_content,rate,countrycode,submissiontype,faileddt,billing,pricing_model)" +
                " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)";
            values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, appid, 0, 3, msgType, 1, campaignid, wanumber, wa_msg_setting_id, direction, bodyContent, rate, countrycode, 'NOTIFICATION', 1, 'NBP'];

        }
        else {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid,contactno,msg_setting_id,direction,body_content,rate,countrycode,submissiontype,faileddt,billing,pricing_model)" +
                " VALUES(?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)";
            values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, appid, 0, 3, msgType, campaignid, wanumber, wa_msg_setting_id, direction, bodyContent, rate, countrycode, 'NOTIFICATION', 1, 'NBP'];

        }
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

insertMessageInSentMasterAPI = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, clientPayload, next) => {
    try {
        let query;
        let values;

        console.log(JSON.stringify(clientPayload));

        if (id == 0) {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,client_payload)" +
                " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?)";
            values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, 0, 0, 0, msgType, 1, campaignid, wanumber, wa_msg_setting_id, direction, JSON.stringify(clientPayload)];

        }
        else {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid,contactno,msg_setting_id,direction,client_payload)" +
                " VALUES(?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?)";
            values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, 0, 0, 0, msgType, campaignid, wanumber, wa_msg_setting_id, direction, JSON.stringify(clientPayload)];

        }
        console.log(query);
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
};

insertFailedMessageInSentMaster = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, bodyContent, appid, rate, countrycode, readstatus, fbtrace_id, retrycount, next) => {
    try {
        let query;
        let values;
        readstatus == 0 ? 3 : readstatus;
        errorCode == null ? '131009' : errorCode;
        errorDesc == null ? '(#131009) Parameter value is not valid' : errorDesc;

        if (id == 0) {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,body_content,rate,countrycode,submissiontype,faileddt,billing,pricing_model,ismodified,modifieddt,fbtrace_id,retrycount)" +
                " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,NOW(), ?,?)";
            values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, appid, 0, readstatus, msgType, 1, campaignid, wanumber, wa_msg_setting_id, direction, bodyContent, rate, countrycode, 'NOTIFICATION', 1, 'CBP', 1, fbtrace_id, retrycount];

        }
        else {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid,contactno,msg_setting_id,direction,body_content,rate,countrycode,submissiontype,faileddt,billing,pricing_model,ismodified,modifieddt,fbtrace_id,retrycount)" +
                " VALUES(?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,NOW(), ?,?)";
            values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, appid, 0, readstatus, msgType, campaignid, wanumber, wa_msg_setting_id, direction, bodyContent, rate, countrycode, 'NOTIFICATION', 1, 'CBP', 1, fbtrace_id, retrycount];

        }
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

insertFailedMessageInSentMaster_7 = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, bodyContent, appid, rate, countrycode, readstatus, fbtrace_id, retrycount, next) => {
    try {
        let query;
        let values;
        if (id == 0) {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,body_content,rate,countrycode,submissiontype,dlvrddt,billing,pricing_model,ismodified,modifieddt,fbtrace_id,billingdt,retrycount)" +
                " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,NOW(), ?,NOW(),?)";
            values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, appid, 0, readstatus, msgType, 1, campaignid, wanumber, wa_msg_setting_id, direction, bodyContent, rate, countrycode, 'NOTIFICATION', 1, 'CBP', 1, fbtrace_id, retrycount];

        }
        else {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid,contactno,msg_setting_id,direction,body_content,rate,countrycode,submissiontype,dlvrddt,billing,pricing_model,ismodified,modifieddt,fbtrace_id,billingdt,retrycount)" +
                " VALUES(?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,NOW(), ?,NOW(),?)";
            values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, errorCode, errorDesc, appid, 0, readstatus, msgType, campaignid, wanumber, wa_msg_setting_id, direction, bodyContent, rate, countrycode, 'NOTIFICATION', 1, 'CBP', 1, fbtrace_id, retrycount];

        }
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
        // console.log('deleteMessageFromRequestMaster : '+id);
        let query = "DELETE FROM ezb_message_request_master WHERE id = ?";
        let values = [id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

deleteMessageFromRequestMaster_Mod = async (id, next) => {
    try {
        // console.log('deleteMessageFromRequestMaster : '+id);
        let query = "DELETE FROM ezb_message_request_master WHERE id = ?";
        let values = [id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

getApiKey = async (apikey, next) => {
    try {
        let query = "SELECT a.userid, a.apikey, b.userstatus FROM " + TBL_API_KEYS_MASTER + " AS a LEFT JOIN " + TBL_USERS_MASTER + " AS b ON a.userid = b.userid WHERE a.apikey = ? AND a.kstatus = ?";
        let values = [apikey, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
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
        console.log(userid, '%' + wabanumber);
        let query = "SELECT wa_msg_setting_id, wanumber, waurl, authtoken, hsmnamespace FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid = ? AND wanumber LIKE ?";
        let values = [userid, '%' + wabanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
};

fetchMediaFileName = async (mediaid, next) => {
    try {
        let query = "SELECT medianame, mediatype FROM " + TBL_WA_MEDIA_MASTER + " WHERE mediaid = ?";
        let values = [mediaid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

checkSubscription = async (wanumber, contactno, next) => {
    try {
        console.log(wanumber);
        let query = "SELECT subflag FROM " + TBL_SUBSCRIPTION_MASTER + " WHERE wanumber = ? AND wabanumber = ?";
        let values = [wanumber, contactno];
        let rows = await dbpool.query(query, values);
        let subflag = rows[0].length > 0 && rows[0][0].subflag == 0 ? 0 : 1;
        console.log('subflag : ' + subflag);
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

getNotificationRate = async (countrycode, userid, next) => {
    try {
        let query = "SELECT IFNULL((SELECT bic_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
            "(SELECT bic_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate";
        let values = [countrycode, userid, countrycode];
        let rows = await dbpool.query(query, values);
        next(null, rows[0][0].notification_rate);
    } catch (err) {
        next(err);
    }
};

insertInvalidContact = async (mobileno, campaignid, userid, next) => {
    try {
        let values;
        let query = "INSERT INTO " + TBL_INVALID_CONTACTS + "(wanumber,campaignid,userid,source,wastatus)" +
            " VALUES(?,?,?,?,?)";
        values = [mobileno, campaignid, userid, 1, 3];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

getUndeletedProcessedMessages = async (next) => {
    try {
        let values;
        // let query = "SELECT * FROM ezb_message_request_master WHERE DATE(createdt) = CURDATE() LIMIT ?";
        // let query = "SELECT * FROM ezb_message_request_master WHERE DATE(createdt) = CURDATE() AND isoptin = 1 and isoptinpicked = 1 and issentpicked = 1 LIMIT ?";
        // let query = "SELECT * FROM ezb_message_request_master WHERE DATE(createdt) = CURDATE() AND isoptinpicked = 1 LIMIT ?";
        let query = "SELECT * FROM ezb_message_request_master WHERE isoptinpicked = 1 LIMIT ?";
        values = [50];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

getUndeletedProcessedCloudMessages = async (next) => {
    try {
        let values;
        // let query = "SELECT * FROM ezb_message_request_master WHERE DATE(createdt) = CURDATE() LIMIT ?";
        // let query = "SELECT * FROM ezb_message_request_master WHERE DATE(createdt) = CURDATE() AND isoptin = 1 and isoptinpicked = 1 and issentpicked = 1 LIMIT ?";
        // let query = "SELECT * FROM ezb_message_request_master WHERE DATE(createdt) = CURDATE() AND isoptinpicked = 1 LIMIT ?";
        let query = "SELECT * FROM ezb_message_request_master WHERE issentpicked = 1 AND phone_number_id > 0 LIMIT ?";
        values = [500];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

checkIfPresentInSentMaster = async (mobileno, campaignid, next) => {
    try {
        let values;
        let query = "SELECT COUNT(1) AS c FROM ezb_message_sent_master WHERE mobileno = ? and campaignid = ?";
        values = [mobileno, campaignid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

updateUnprocessedMessages = async (mobileno, campaignid, appid, next) => {
    try {
        let values;
        let query = "UPDATE ezb_message_request_master SET isoptin = ?, isoptinpicked = ?, issentpicked = ?, retrycount = ?, retrydt = NOW(), ismsgsent = ? WHERE mobileno = ? and campaignid = ? AND appid = ?";
        values = [0, 0, 0, 0, 0, mobileno, campaignid, appid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

updateUnprocessedMessages_Mod = async (id, next) => {
    try {
        let values;
        let query = "UPDATE ezb_message_request_master SET isoptin = ?, isoptinpicked = ?, issentpicked = ?, retrycount = retrycount + ?, retrydt = NOW(), ismsgsent = ? WHERE id = ?";
        values = [0, 0, 0, 1, 0, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

removeUnprocessedMessages_Mod = async (id, next) => {
    try {
        let values;
        let query = "DELETE t1 FROM ezb_message_sent_master t1" +
            " INNER JOIN ezb_message_sent_master t2 " +
            " WHERE t1.id > t2.id AND t1.mobileno = t2.mobileno AND t1.campaignid = t2.campaignid AND t1.campaignid = ?";
        values = [id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchStoppedCampaignMessages = async (next) => {

    try {
        let query = "SELECT a.* FROM ezb_message_request_master AS a, ezb_wa_campaign_master as b" +
            " WHERE a.campaignid = b.campaignid and b.campaign_status IN(?,?) LIMIT ?";

        let values = [3, 5, 500];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

insertStoppedMessagesInStoppedRequestMaster = async (id, next) => {
    try {
        let query = "INSERT INTO ezb_stopped_campaign_request_master (SELECT id,userid,mobileno,wabaurl,templateid,botid,accesstoken,namespace,templatetitle,messagetype,media,mediaflag,header_placeholder,dynamic_url_placeholder,placeholders,filename,language,appid,appisprocessed,createdt,ismsgsent,error,priority,source,campaignid,contactno,msg_setting_id,retrycount,retrydt,isoptin,optinattempt,nextoptinretry,isoptinpicked,issentpicked,optinerror,senderrorcode FROM ezb_message_request_master WHERE id = ?)";

        let values = [id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
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
    fetchFailedMessages,
    getNotificationRate,
    RETRY_MSG_LIMIT,
    IS_OPTIN,
    insertFailedMessageInSentMaster,
    fetchMessageConfig,
    insertInvalidContact,
    getUndeletedProcessedMessages,
    checkIfPresentInSentMaster,
    updateUnprocessedMessages,
    updateUnprocessedMessages_Mod,
    deleteMessageFromRequestMaster_Mod,
    removeUnprocessedMessages_Mod,
    fetchStoppedCampaignMessages,
    insertStoppedMessagesInStoppedRequestMaster,
    fetchFailedMessages_7,
    insertFailedMessageInSentMaster_7,
    getUndeletedProcessedCloudMessages,
    fetchFailedMessages_1,
    fetchFailedMessages_2
};