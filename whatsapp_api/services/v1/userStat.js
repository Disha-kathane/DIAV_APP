const wabot_db = require('../../db/wabot');
const appLoggers = require('../../applogger.js');
const {
    result
} = require('lodash');
const errorLogger = appLoggers.errorLogger;

const getApiKey = async (next) => {
    try {
        const query = 'SELECT `apikey` FROM `ezb_wa_api_keys` LIMIT 50';
        const rows = await wabot_db.query(query);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getUserId = async (apikeys, next) => {
    try {
        const query = 'SELECT `userid` FROM `ezb_wa_api_keys` WHERE apikey=?';
        const value = [apikeys];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getUserStatus = async (userid, next) => {
    try {
        const query = 'select `userstatus` from `ezb_users` where userid=?';
        const value = [userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const fetchUserId = async (userid, next) => {
    try {
        const query = 'select `userid` from `ezb_wa_db_stats` where userid=?;';
        const values = [userid]
        const rows = await wabot_db.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getUserSettings = async (userid, wanumber, next) => {
    try {
        let query;
        if (wanumber != '') {
            query = 'select `usrnm`, `usrpass`, `authts`, `authvalidity`, `authtoken`, `waurl`, `wanumber` from `ezb_wa_msg_settings` where userid = ? AND wanumber LIKE ?';
        } else {
            query = 'select `usrnm`, `usrpass`, `authts`, `authvalidity`, `authtoken`, `waurl`, `wanumber` from `ezb_wa_msg_settings` where userid = ?';
        }
        console.log(query);
        const value = [userid, '%'+wanumber+'%'];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}


const insertDBStats = async (userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, next) => {
    try {
        const query = 'INSERT INTO `ezb_wa_db_stats` (`userid`,`db_contacts_nonuser_value`,`db_contacts_user_value`,`db_message_receipts`,`type_object`,`db_pending_callbacks`,`db_pending_messages`) VALUES(?,?,?,?,?,?,?)';
        const value = [userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const updateDBStats = async (userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, next) => {
    try {
        const query = 'update `ezb_wa_db_stats` set `db_contacts_nonuser_value`=?,`db_contacts_user_value`=?,`db_message_receipts`=?,`type_object`=?,`db_pending_callbacks`=?,`db_pending_messages`=? where userid=?';
        const value = [NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getWaHealthStatus = async (userid, updatewaGetHealthStatus, next) => {
    try {
        const query = 'update `ezb_users` set `waba_health_status` = ? where userid = ?';
        const value = [updatewaGetHealthStatus, userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getWabaId = async (userid, next) => {
    try {
        const query = 'SELECT whatsapp_business_account_id FROM `ezb_wa_msg_settings` WHERE userid =?';
        const value = [userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getAccessToken = async (next) => {
    try {
        const query = 'select value from `ezb_system_config` where paramname = ?';
        const value = ['ACCESS_TOKEN'];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }

}
module.exports = {
    getApiKey,
    getUserId,
    getUserStatus,
    fetchUserId,
    getUserSettings,
    insertDBStats,
    updateDBStats,
    getWaHealthStatus,
    getWabaId,
    getAccessToken
}