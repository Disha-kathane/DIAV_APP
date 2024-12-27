
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



const checkOptinContactStatus_Mod = async (from, mobileNo) => {
    try {
        console.log(from, mobileNo);
        // let querySel = 'SELECT wanumber, wastatus FROM ' + TBL_CONTACTS_MASTER + ' WHERE contactno LIKE ? AND wanumber = ? AND NOW()<=authvalidity LIMIT 1';
        // let selValues = ['%' + from, mobileNo];

        let querySel = 'SELECT wanumber, wastatus FROM ' + TBL_CONTACTS_MASTER + ' WHERE contactno = ? AND wanumber = ? AND NOW()<=authvalidity LIMIT 1';
        let selValues = ['+' + from, mobileNo];
        let [result] = await dbpool.query(querySel, selValues);
        return result;
    } catch (err) {
        return err;
    }
};


const insertOptinContacts_Mod = async (mobileNo, from, userId, campaignId, status) => {
    try {
        let queryInsert = 'INSERT INTO ' + TBL_CONTACTS_MASTER + ' (contactno, wanumber, userid, source, campaignid, wastatus, authvalidity) VALUES (?, ?,?,?,?,?,DATE_ADD(curdate(), INTERVAL 7 DAY))';
        let values = [from, mobileNo, userId, 0, campaignId, status];
        let [result] = await dbpool.query(queryInsert, values);
        return result;
    }
    catch (err) {
        return err;
    }
};



module.exports = {
    checkOptinContactStatus_Mod,
    insertOptinContacts_Mod

};