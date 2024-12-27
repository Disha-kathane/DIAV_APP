const dbpool = require('../../db/wabot');
const moment = require('moment');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');

const {
    TBL_API_KEYS_MASTER,
    TBL_USERS_MASTER,
    TBL_MESSAGE_SENT_MASTER,
    TBL_WA_MSG_SETTINGS_MASTER
} = require('../../constants/tables');

validateApiKey = async (apikey, wanumber, next) => {
    try {
        let query = "SELECT a.apikey, a.userid, b.userstatus, c.waurl, c.authtoken FROM "
            + TBL_API_KEYS_MASTER + " AS a,"
            + TBL_USERS_MASTER + " AS b, "
            + TBL_WA_MSG_SETTINGS_MASTER + " AS c"
            + " WHERE a.apikey = ? AND a.userid = b.userid AND b.userid = c.userid AND c.wanumber LIKE ?";

        let values = [apikey, '%' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

updateDelivery = async (obj, next) => {
    try {
        let query;
        let rows;
        let values;
        let status = obj.statuses[0].status;
        let msgID = obj.statuses[0].id;
        let d = new Date(parseInt(obj.statuses[0].timestamp) * 1000);
        let timestamp = moment(d).format('YYYY-MM-DD HH:mm:ss');

        if (status == 'sent') {
            let sessid = '';
            if (obj.statuses[0].conversation.id != undefined) {
                sessid = obj.statuses[0].conversation.id;
            }
            query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, sessid = ?, sentdt = ? WHERE messageid = ?";
            values = [0, sessid, timestamp, msgID];
            rows = await dbpool.query(query, values);
        }
        if (status == 'delivered') {
            query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, dlvrddt = ? WHERE messageid = ?";
            values = [1, timestamp, msgID];
            rows = await dbpool.query(query, values);
            console.log(s.sql);
        }
        if (status == 'read') {
            query = "UPDATE ezb_message_sent_master SET readstatus = ?, readdt = ? WHERE messageid = ?";
            values = [2, timestamp, msgID];
            rows = await dbpool.query(query, values);
            console.log(s.sql);
        }
        if (status == 'failed') {
            let errorCode = obj.statuses[0].errors[0].code;
            let errorDesc = obj.statuses[0].errors[0].title;
            query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, errcode = ?, errdesc = ?, faileddt = ? WHERE messageid = ?";
            values = [3, errorCode, errorDesc, timestamp, msgID];
            rows = await dbpool.query(query, values);
        }
        if (status == 'deleted') {
            query = "UPDATE ezb_message_sent_master SET readstatus = ?, deletedt = ? WHERE messageid = ?";
            values = [4, timestamp, msgID];
            rows = await dbpool.query(query, values);
            console.log(s.sql);
        }
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

getReplyMessage = async (message, wanumber, next) => {
    try {
        let query = "SELECT auto_response,"+
        " (SELECT unsubmsg FROM ezb_wa_msg_settings WHERE stopword IN (LOWER(?)) AND wanumber=M.wanumber) AS unsubmsg,"+
        " (SELECT resubmsg FROM ezb_wa_msg_settings WHERE resubword IN (LOWER(?)) AND wanumber=M.wanumber) AS resubmsg"+
        " FROM ezb_wa_msg_settings AS M"+
        " WHERE wanumber LIKE ?";

        let values = [message, message, '%' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

updateSubscription = async(wanumber, subflag, wabanumber, subkeyword, unsubkeyword, next)=>{
    try{
        let query = "INSERT INTO ezb_subscription_master (wanumber, subflag, wabanumber, subkeyword, unsubkeyword)"+
        " VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE subflag = ?, subkeyword = ?, unsubkeyword = ?";

        let values = [wanumber, subflag, wabanumber, subkeyword, unsubkeyword, subflag, subkeyword, unsubkeyword];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch(err){
        next(err);
    }
}

module.exports = {
    validateApiKey,
    updateDelivery,
    getReplyMessage,
    updateSubscription
}