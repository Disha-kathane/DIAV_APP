const dbpool = require('../../db/wabot');

const {
    errorLogger,
    infoLogger
} = require('../../applogger');

const {
    TBL_WA_MSG_SETTINGS_MASTER,
    TBL_SYSTEM_CONFIG_MASTER
} = require('../../constants/tables');

let getSystemAccessToken = async (next) => {
    try {
        let query = 'SELECT value FROM ' + TBL_SYSTEM_CONFIG_MASTER + ' WHERE paramname = ?';
        let value = ['ACCESS_TOKEN'];
        let rows = await dbpool.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

let getWabaInfo = async (userid, next) => {
    try {
        let query = 'SELECT a.whatsapp_business_account_id AS wabaid, a.wanumber FROM ezb_wa_msg_settings as a,ezb_users as b WHERE a.wa_msg_setting_id = b.wanumberid and b.userid = ? limit 1';
        let values = [userid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

module.exports = {
    getSystemAccessToken,
    getWabaInfo
}