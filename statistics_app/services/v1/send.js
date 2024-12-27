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
    TBL_WA_MEDIA_MASTER
} = require('../../constants/tables');

const MSG_LIMIT = 50;

fetchMessages = async (next) => {

    try {
        // let query = "SELECT * FROM " + TBL_MESSAGE_REQUEST_MASTER + " WHERE appisprocessed = ? AND ismsgsent = ? ORDER BY priority ASC LIMIT ?";
        // let query = "SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string FROM ezb_message_request_master AS a"+
        // " LEFT JOIN ezb_wa_templates AS b ON a.templateid = b.tempid"+
        // " WHERE a.appisprocessed = ? AND a.ismsgsent = ? ORDER BY a.priority ASC LIMIT ?";

        let query = "SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string FROM" +
        " ezb_message_request_master AS a," +
        " ezb_wa_templates AS b," +
        " ezb_users AS c" +
        " WHERE a.appisprocessed = ? AND" +
        " a.ismsgsent = ? AND" +
        " a.templateid = b.tempid AND" +
        " b.userid = c.userid AND" +
        " c.expirydate >= CURDATE()" +
        " ORDER BY a.priority ASC LIMIT ?";
        
        let values = [0, 0, MSG_LIMIT];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

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
}

insertMessageInSentMaster = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, next) => {
    try {
        let query;
        let values;
        if (id == 0) {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid)" +
                " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,NULL,NULL,NOW(),?,?,?,?,?,?)";
            values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, 0, 0, 0, msgType, 1, campaignid];

        }
        else {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid)" +
                " VALUES(?,?,?,?,?,?,NULL,NULL,NOW(),?,?,?,?,?)";
            values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, 0, 0, 0, msgType, campaignid];

        }
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

updateMessageInRequestMaster = async (ismsgsent, error, id, next) => {
    try {
        let query = "UPDATE " + TBL_MESSAGE_REQUEST_MASTER + " SET ismsgsent = ?, error = ? WHERE id = ?";
        let values = [ismsgsent, error, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

getApiKey = async(apikey, next) => {
    try{
        let query = "SELECT a.userid, a.apikey, b.userstatus FROM " + TBL_API_KEYS_MASTER + " AS a LEFT JOIN " + TBL_USERS_MASTER + " AS b ON a.userid = b.userid WHERE a.apikey = ? AND a.kstatus = ?";
        let values = [apikey, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch(err){
        next(err);
    }
}

getTemplate = async (templateid, next) => {
    try{
        let query = "SELECT * FROM " + TBL_TEMPLATE_MASTER + " WHERE tempid = ? AND status = ?";
        let values = [templateid, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }catch(err){
        next(err);
    }
}

getWabaInfo = async(userid, next) => {
    try{
        let query = "SELECT waurl, authtoken, hsmnamespace FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid = ?";
        let values = [userid, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch(err){
        next(err);
    }
}

fetchMediaFileName = async (mediaid, next) => {
    try{
        let query = "SELECT medianame, mediatype FROM " + TBL_WA_MEDIA_MASTER + " WHERE mediaid = ?";
        let values = [mediaid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }catch(err){
        next(err);
    }
}


fetchwanumberuserid = async (wabanumber,next) => {
    try{
        let query = "SELECT userid FROM ezb_wa_msg_settings where wanumber = ?";
        let values = [wabanumber];
        let rows = await dbpool.query(query,values);
        next(null, rows[0]);
    }
    catch(err) {
        console.log(err);
        next(err);
    }
}


endLiveChatMessage = async (mobileno, userId, next) => {
    try {
        let query = "UPDATE ezb_flowbuilder_session SET is_session_end = ? WHERE is_livechat = ? AND mobileno = ? AND is_session_end = ? AND userid = ?";
        let values = [1, 1, mobileno, 0, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}


module.exports = {
    fetchMessages,
    fetchUserStatus,
    insertMessageInSentMaster,
    updateMessageInRequestMaster,
    getApiKey,
    getTemplate,
    getWabaInfo,
    fetchMediaFileName,
    fetchwanumberuserid,
    endLiveChatMessage
}