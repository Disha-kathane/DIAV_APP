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
        let query = 'SELECT whatsapp_business_account_id AS wabaid, wanumber FROM ' + TBL_WA_MSG_SETTINGS_MASTER + ' WHERE userid = ?';
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