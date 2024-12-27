
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
    TBL_CONTACTS_MASTER
} = require('../../constants/tables');

const MSG_LIMIT = 50;


const getOptoutUserId = async (apikeys, next) => {
    try {
        const query = 'SELECT userid FROM ezb_wa_api_keys WHERE apikey=?';
        const value = [apikeys];
        const [result] = await dbpool.query(query, value);
        return result;
    } catch (err) {
        return err;
    }
};

const deleteContact = async (userid, contactno, wanumber, next) => {
    try {

        const query = 'DELETE from `ezb_wa_contacts` WHERE userid=? AND contactno =? AND wanumber=?';
        const value = [userid, contactno, wanumber];
        const [result] = await dbpool.query(query, value);
        return result;
    } catch (err) {
        return err;
    }
};


module.exports = {
    getOptoutUserId,
    deleteContact
};