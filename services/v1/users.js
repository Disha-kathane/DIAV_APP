const wabot_db = require('../../db/wabot');
var appLoggers = require('../../applogger.js');

const addUser = (user) => {
    return wabot_db.query(`insert into users(name, age) values(${user.name}, ${user.age}) `);
}

const getUserSettings = async (userId) => {
    const query = 'select `usrnm`, `usrpass`, `authts`, `authvalidity`, `authtoken`, `waurl`, `wanumber`, `hsmnamespace` from `ezb_wa_msg_settings` where userid = ?; ';
    const value = userId;
    const [ result ] = await wabot_db.query(query, value);
    return result[0];
}

const updateUserSettings = async (authToken, expiryDate, userId) => {
    const query = 'update `ezb_wa_msg_settings` set `authtoken` = ?, `authvalidity` = ? where userid = ?; ';
    const value = [authToken, expiryDate, userId];
    const [ result ] = await wabot_db.query(query, value);
    return result;
}

const getUserId = async (apiKey) => {
    const query = 'select `a`.`userid` AS userId, `b`.`whatsapp_business_account_id` AS wabaId from `ezb_wa_api_keys`  AS a' +
        ' left join `ezb_wa_msg_settings` AS b ON `a`.`userid` = `b`.`userid`' +
        ' where `a`.`apikey` = ?';
    const value = apiKey;
    const [ result ] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0];
    }
    return {};
}

const getExpiredUsers = async () => {    
    // or DATEDIFF(NOW(),`authvalidity`) < 6
    const query = 'SELECT `userid` FROM `ezb_wa_msg_settings` where authvalidity is null or DATEDIFF(NOW(),`authvalidity`) < 6;';
    const [ result ] = await wabot_db.query(query);
    return result;
}

const getoptinusers  = async () => {
    const query = 'select `userid`, `authtoken`, `waurl` from `ezb_wa_msg_settings`; ';
    const [ result ] = await wabot_db.query(query);
    return result;
}

const getWaHealthStatus = async (userId, waGetHealth) => {
    const query = 'update `ezb_users` set `waba_health_status` = ? where userid = ?; ';
    const value = [waGetHealth, userId];
    return result = await wabot_db.query(query, value);            
}

module.exports = {
    addUser,
    getUserSettings,
    updateUserSettings,
    getExpiredUsers,
    getUserId,
    getoptinusers,
    getWaHealthStatus
}