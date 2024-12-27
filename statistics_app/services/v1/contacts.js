const wabot_db = require('../../db/wabot');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
const {
    
    TBL_CONTACTS_MASTER

} = require('../../constants/tables');

const getUserValidation = async() => {
    const selUserval = 'select usrnm, usrpass, authts, authvalidity, authtoken, waurl, wanumber from ezb_wa_msg_settings';
    return wabot_db.query(selUserval);

};

const updateContactList = async (contactList) => {
    const result = await Promise.all(contactList.map(item => {
        const query = 'UPDATE '+TBL_CONTACTS_MASTER+' SET waid = ?, wastatus = ?, '+
                    'authvalidity = DATE_ADD(curdate(), INTERVAL 7 DAY) WHERE `wanumber`=?;';
        const waNumber = item.wanumber.replace('+', '');
        const values = [item.wa_id, item.status, waNumber];
        return wabot_db.query(query, values);
    }));
    return result;
}

updateoptinContactList = async (contactList, userId) => {
    const result = await Promise.all(contactList.map(item => {
        const query = 'UPDATE '+TBL_CONTACTS_MASTER+' SET waid = ?, wastatus = ?, '+
        'authvalidity = DATE_ADD(curdate(), INTERVAL 7 DAY) WHERE `wanumber`=? AND `userid` =?;';
        const waNumber = item.wanumber.replace('+', '');
        const values = [item.wa_id, item.status, waNumber, userId];
        return wabot_db.query(query, values);
    }));
    return result;
}

const getWaNumberFromContacts = async () => {
    const querySel = 'select `wanumber` from `'+TBL_CONTACTS_MASTER+'` where `wastatus` = ?;'
    const selValues = [0];
    const [ waNumberResult ] = await wabot_db.query(querySel, selValues);
    return waNumberResult;
}

const getoptinWaNumberFromContacts = async (userId) => {
    const querySel = 'select `wanumber` from `'+TBL_CONTACTS_MASTER+'` where DATEDIFF(NOW(),`authvalidity`) < 6 and userid = ?;'
    const selValues = [userId];
    const [ waNumberResult ] = await wabot_db.query(querySel, selValues);
    return waNumberResult;
}

const insertContacts = async (waNumberList, userId, campaignId) => {
    const queryInsert = 'INSERT INTO `'+TBL_CONTACTS_MASTER+'` (`wanumber`, `userid`, `source`, `campaignid`) VALUES ?;';
    const values = [];
    waNumberList.forEach(item => {
        values.push([item.mobileNumber, userId, 0, campaignId]);
    });
    const result = await wabot_db.query(queryInsert, [values]);
    return result;
}

const insertInvalidContacts = async (waNumberList, botId, userId) => {
    const queryInsert = 'INSERT INTO `'+TBL_CONTACTS_MASTER+'` (`botid`, `wanumber`, `userid`, `source`, `wastatus`) VALUES ?;';
    const values = [];
    waNumberList.forEach(item => {
        values.push([botId, item, userId, 1, 3]);
    });
    const result = await wabot_db.query(queryInsert, [values]);
    return result;
}

const getOneContact = async (waNumber, userId, campaignId) => {
    // Validate Contact if it exists
    // Add "USE INDEX(ind_bot_number)" in case when using index
    const query = 'SELECT wanumber FROM `'+TBL_CONTACTS_MASTER+'` WHERE `userid`=? AND `wanumber`=? AND campaignid =? ';
    if (/^\+/.test(waNumber) == true) {
        waNumber = number.replace('+', '');
    }
    const values = [userId, waNumber, campaignId];
    const [ result ] = await wabot_db.query(query, values);
    return result;
}

const deleteContacts = async (waNumberList, userId) => {
    const queryInsert = 'Delete from `'+TBL_CONTACTS_MASTER+'` Where userid = ? and wanumber in (?);';
    const values = [ userId, waNumberList ];
    // waNumberList.forEach(item => {
    //     values.push([userId, item]);
    // });
    const result = await wabot_db.query(queryInsert, values);
    return result;
}

module.exports = {
    updateContactList,
    getWaNumberFromContacts,
    getoptinWaNumberFromContacts,
    insertContacts,
    deleteContacts,
    getOneContact,
    updateoptinContactList,
    insertInvalidContacts
}