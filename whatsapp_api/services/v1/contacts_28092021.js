const wabot_db = require('../../db/wabot');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
const {
    
    TBL_CONTACTS_MASTER,
    TBL_TEMP_CONTACTS_MASTER,
    TBL_MESSAGE_SENT_MASTER,
    TBL_REQUEST_MASTER,
    TBL_NONWHATSAPP_MASTER,
    TBL_INVALID_CONTACTS_MASTER,

} = require('../../constants/tables');
const { asyncify } = require('async');

const getUserValidation = async() => {
    const selUserval = 'select usrnm, usrpass, authts, authvalidity, authtoken, waurl, wanumber from ezb_wa_msg_settings';
    return wabot_db.query(selUserval);

};

const updateContactList = async (contactList) => {
    const result = await Promise.all(contactList.map(item => {
        const query = 'UPDATE '+TBL_CONTACTS_MASTER+' SET waid = ?, wastatus = ?, '+
                    'authvalidity = DATE_ADD(curdate(), INTERVAL 7 DAY) WHERE `wanumber`=?;';
                    if (/^\+/.test(item.wanumber) == true) {
                        item.wanumber = item.wanumber.replace('+', '');
                    }
        const values = [item.wa_id, item.status, item.wanumber];
        return wabot_db.query(query, values);
    }));
    return result;
}

const updateoptinContactList = async (contactList, userId) => {
    const result = await Promise.all(contactList.map(item => {
        const query = 'UPDATE '+TBL_CONTACTS_MASTER+' SET waid = ?, wastatus = ?, '+
        'authvalidity = DATE_ADD(curdate(), INTERVAL 7 DAY) WHERE `wanumber`=? AND `userid` =?;';
        if (/^\+/.test(item.wanumber) == true) {
            item.wanumber = item.wanumber.replace('+', '');
        }
        const values = [item.wa_id, item.status, item.wanumber, userId];
        return wabot_db.query(query, values);
    }));
    return result;
}

// const getWaNumberFromContacts  = async (userId) => {
//     const query = 'select `wanumber` from `'+TBL_CONTACTS_MASTER+'` where `wastatus` = ? and userid = ?;'
//     const values = [0, userId];
//     const [ waNumberResult ] = await wabot_db.query(query, values);
//     return waNumberResult;
// }


const getWaNumberFromContacts = async (waNumberList, userId) => {
    const query = 'SELECT wanumber FROM `'+TBL_CONTACTS_MASTER+'` WHERE `userid`=? AND `wanumber` in (?) AND `wastatus` = ?';
    const waContacts = waNumberList.map(item => {
        if (/^\+/.test(item.mobileNumber) == true) {
            item.mobileNumber = item.mobileNumber.replace('+', '');
        }
        return item.mobileNumber;
    });
    const values = [userId, waContacts, 0];
    const [ result ] = await wabot_db.query(query, values);
    return result || [];
} 

const getoptinWaNumberFromContacts = async (userId) => {
    //DATEDIFF(NOW(),`authvalidity`) > -1
    const querySel = 'select `wanumber` from `'+TBL_CONTACTS_MASTER+'` where DATEDIFF(NOW(),`authvalidity`) > -1 and userid = ?;'
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

const selectAlreadyOptin = async (waNumberList, userId) => {
    //
    const query = 'SELECT wanumber, wastatus FROM `'+TBL_CONTACTS_MASTER+'` WHERE `userid`=? AND `wanumber` in (?) AND DATEDIFF(`authvalidity`, NOW()) > 0 AND (wastatus = 1 or wastatus = 2)';
    const waContacts = waNumberList.map(item => {
        if (/^\+/.test(item.mobileNumber) == true) {
            item.mobileNumber = item.mobileNumber.replace('+', '');
        }
        return item.mobileNumber;
    });
    const values = [userId, waContacts];
    const [ result ] = await wabot_db.query(query, values);
    return result;
} 

const insertInvalidContacts = async (waNumberList, userId, campaignId) => {
    const queryInsert = 'INSERT INTO `'+TBL_INVALID_CONTACTS_MASTER+'` (`wanumber`, `userid`, `campaignid`, `source`, `wastatus`) VALUES ?;';
    const values = [];
    waNumberList.forEach(item => {
        values.push([item, userId, campaignId, 1, 3]);
    });
    const result = await wabot_db.query(queryInsert, [values]);
    return result;
}

const getOneContact = async (waNumber, userId) => {
    // Validate Contact if it exists
    // Add "USE INDEX(ind_bot_number)" in case when using index
    const query = 'SELECT wanumber FROM `'+TBL_CONTACTS_MASTER+'` WHERE `userid`=? AND `wanumber`=?;';
    if (/^\+/.test(waNumber) == true) {
        waNumber = number.replace('+', '');
    }
    const values = [userId, waNumber];
    const [ result ] = await wabot_db.query(query, values);
    return result;
}

const alreadyInsertWaNumbers = async (userId, waNumberList, campaignId) => {
    const query = 'SELECT wanumber FROM `'+TBL_TEMP_CONTACTS_MASTER+'` WHERE `userid`=? AND `mobileNumber` IN  (?) AND `campaignid` = ?;';
    const waContacts = waNumberList.map(item => {
        if (/^\+/.test(item.mobileNumber) == true) {
            item.mobileNumber = item.mobileNumber.replace('+', '');
        }
        return item.mobileNumber;
    });
    const values = [userId, waContacts, campaignId];
    const [ result ] = await wabot_db.query(query, values);
    return result;
}   


const InsertTempWaNumbers = async (waNumberList, campaignId, userId) => {
    const queryInsert = 'INSERT INTO `'+TBL_TEMP_CONTACTS_MASTER+'` (`mobileNumber`,`campaignid`, `userid`) VALUES ?;';
    const values = [];
    waNumberList.forEach(item => {
        values.push([item.mobileNumber, campaignId, userId]);
    });
    const result = await wabot_db.query(queryInsert, [values]);
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

// const getExpiredContacts = async (userId) => {
//     const querySel = 'select `wanumber` from `'+TBL_CONTACTS_MASTER+'` where DATEDIFF(NOW(),`authvalidity`) > -1 and userid = ?;'
//     const selValues = [userId];
//     const [ waNumberResult ] = await wabot_db.query(querySel, selValues);
//     return waNumberResult;
// }

const getExpiredContacts = async (waNumberList, userId) => {
    const query = 'SELECT wanumber FROM `'+TBL_CONTACTS_MASTER+'` WHERE `userid`=? AND `wanumber` in (?) AND DATEDIFF(NOW(),`authvalidity`) > -1';
    const waContacts = waNumberList.map(item => {
        if (/^\+/.test(item.mobileNumber) == true) {
            item.mobileNumber = item.mobileNumber.replace('+', '');
        }
        return item.mobileNumber;
    });
    const values = [userId, waContacts];
    const [ result ] = await wabot_db.query(query, values);
    return result || [];
} 

const getInvalidWhatsAppNumber = async (waNumberList, userId) => {
    const query = 'SELECT wanumber FROM `'+TBL_CONTACTS_MASTER+'` WHERE `userid`=? AND `wanumber` in (?) and wastatus = ?';
    const waContacts = waNumberList.map(item => {
        if (/^\+/.test(item.mobileNumber) == true) {
            item.mobileNumber = item.mobileNumber.replace('+', '');
        }
        return item.mobileNumber;
    });
    const values = [userId, waContacts, 2];
    const [ result ] = await wabot_db.query(query, values);
    return result;
} 

const deleteTempContacts = async (waNumberList, userId, campaignId) => {
    const query = 'Delete from `'+TBL_TEMP_CONTACTS_MASTER+'` Where `userid` = ? and `mobileNumber` in (?) and `campaignid` = ?;';
    const values = [ userId, waNumberList, campaignId]; 
    const result = await wabot_db.query(query, values);
    return result;
}

const deletefailedTempContacts = async (waNumberList, userId, campaignId) => {
    const query = 'Delete from `'+TBL_TEMP_CONTACTS_MASTER+'` Where `userid` = ? and `mobileNumber` in (?) and `campaignid` = ?;';
    const waContacts = waNumberList.map(item => {
        return item.mobileno;
    });
    const values = [ userId, waContacts, campaignId]; 
    const result = await wabot_db.query(query, values);
    return result;
}

const selectTempContacts = async (userId, campaignId) =>{
    const query = 'SELECT * FROM `'+TBL_TEMP_CONTACTS_MASTER+'` WHERE `userid`= ? AND campaignid = ?';
    const values = [userId, campaignId];
    const [ result ] = await wabot_db.query(query, values);
    return result;
}

const updateTempContacts = async (waNumberList, userId, campaignId) => {
    const result = await Promise.all(waNumberList.map(item => {
        const query = 'UPDATE '+TBL_TEMP_CONTACTS_MASTER+' SET isprocessed = ? '+
        ' WHERE mobileNumber = ? AND `userid` = ? AND `campaignid`= ?;';
        if (/^\+/.test(item.wanumber) == true) {
            item.wanumber = item.wanumber.replace('+', '');
        }
        const values = [1, item.wanumber, userId, campaignId];
        return wabot_db.query(query, values);
    }));
    return result;
}

const updateTempContactsError = async (waNumber, errorcode, errormessage, userId, campaignId) => {
        const query = 'UPDATE '+TBL_TEMP_CONTACTS_MASTER+' SET error_code = ?, error_desc = ?, attempts = ?'+
        ' WHERE `mobileNumber` = ? AND userid = ? AND `campaignid`= ?;';
        if (/^\+/.test(waNumber) == true) {
            waNumber = waNumber.replace('+', '');
        }
        const values = [errorcode, errormessage, 5, waNumber, userId, campaignId];
        const result = wabot_db.query(query, values);
    return result;
}

const insertIntoSendMaster = async (waNumberList, errorcode, errormessage, createDate, userId, campaignId, contactNo) => {
    const queryInsert = 'INSERT INTO `'+TBL_MESSAGE_SENT_MASTER+'` (mobileno, errcode, errdesc, createdt, readstatus, userid, campaignid, contactno) VALUES ?;';
    const values = [];
    waNumberList.forEach(item => {
        values.push([item.wanumber, errorcode, errormessage, createDate, 3, userId, campaignId, contactNo]);
    });
    const result = await wabot_db.query(queryInsert, [values]);
    return result;
}

const selectFailedNumber = async (waNumberList, userId) => {
    const query = 'SELECT wanumber FROM `'+TBL_CONTACTS_MASTER+'` WHERE `userid`=? AND `wanumber` in (?) AND wastatus = ?';
    const waContacts = waNumberList.map(item => {
        if (/^\+/.test(item.mobileNumber) == true) {
            item.mobileNumber = item.mobileNumber.replace('+', '');
        }
        return item.mobileNumber;
    });
    const values = [userId, waContacts, 0];
    const [ result ] = await wabot_db.query(query, values);
    return result || [];
} 


const updateOptinStatus = async (contactList, userId, campaignId, statusCode) => {
    contactList = contactList.map(item => {
        if (/^\+/.test(item.wanumber) == true) {
            item.wanumber = item.wanumber.replace('+', '');
        }
        return item.wanumber;
    })
    const query = 'UPDATE '+TBL_REQUEST_MASTER+' SET isoptin = ? WHERE `mobileno` in (?) AND userid = ? AND campaignid = ? ;';
    const values = [statusCode, contactList, userId, campaignId];
    const result = await wabot_db.query(query, values);
    return result;
}

const deleteInvalidMobileNo = async (inValidContactList, userId, campaignId) => {
    const queryInsert = 'Delete from `'+TBL_REQUEST_MASTER+'` Where `userid` = ? and `mobileno` in (?) and `campaignid` = ?;';
    const waContacts = inValidContactList.map(item => {
        if (/^\+/.test(item.wanumber) == true) {
            item.wanumber = item.wanumber.replace('+', '');
        }
        return item.wanumber;
    });
    const values = [ userId, waContacts, campaignId]; 
    const result = await wabot_db.query(queryInsert, values);
    return result;
}



const insertIntoNonWhatsMaster = async (inValidNumbersList, campaignId, userId) => {
    const query = 'INSERT INTO `'+TBL_NONWHATSAPP_MASTER+'` (`wanumber`, `campaignid`, `userid`) '+
    'VALUES ?;';
    const values = [];
    inValidNumbersList.forEach(item => {
        if (/^\+/.test(item.wanumber) == true) {
            item.wanumber = item.wanumber.replace('+', '');
        }
        values.push([item.wanumber, campaignId ,userId]);
    });
    const result = await wabot_db.query(query, [values]);
    return result;
}


const getMobileNumbersToOptin = async (userId, campaignId, batchSize) =>{
    const query = 'SELECT mobileno, wabaurl, accesstoken, optinattempt FROM `'+TBL_REQUEST_MASTER+'` WHERE `userid`= ? AND campaignid = ? AND isoptin = ? AND optinattempt = ? limit ?';
    const values = [userId, campaignId, 0, 0, batchSize];
    const [ result ] = await wabot_db.query(query, values);
    return result;
}

const getRetryMobileNumbersToOptin = async (userId, campaignId, batchSize) =>{
    const query = 'SELECT mobileno, wabaurl, accesstoken, optinattempt FROM `'+TBL_REQUEST_MASTER+'` WHERE `userid`= ? AND campaignid = ? AND isoptin = ? AND optinattempt > 1 limit ?';
    const values = [userId, campaignId, 0, batchSize];
    const [ result ] = await wabot_db.query(query, values);
    return result;
}

const updateOptinRetryAttempt = async (userId, campaignId, mobileNumber) =>{
    const query = 'UPDATE '+TBL_REQUEST_MASTER+' SET optinattempt = optinattempt + 1 WHERE `userId` = ? AND `campaignid`= ? AND mobileno = ?;';
    if (/^\+/.test(mobileNumber) == true) {
        mobileNumber = mobileNumber.toString().replace('+', '');
    }
    const values = [userId, campaignId, mobileNumber];
    const result = wabot_db.query(query, values);
    return result;
}


const getRetryoptinWaNumberFromContacts = async () => {
    //DATEDIFF(NOW(),`authvalidity`) > -1
    const querySel = 'select `wanumber` from `'+TBL_CONTACTS_MASTER+'` where DATEDIFF(NOW(),`authvalidity`) > -1;'
    //const selValues = [userId];
    const [ waNumberResult ] = await wabot_db.query(querySel);
    return waNumberResult;
}


const checkgetOneContact = async (userId, mobileNo) => {
    const querySel = 'select `wanumber` from `'+TBL_CONTACTS_MASTER+'` where userid = ? AND wanumber = ?;'
    const selValues = [userId, mobileNo];
    const [ result ] = await wabot_db.query(querySel, selValues);

    if (result[0]) {
        return result[0].wanumber;
    }
    return {};
}



const insertoptinContacts = async (mobileNo, userId, campaignId) => {
    const queryInsert = 'INSERT INTO `'+TBL_CONTACTS_MASTER+'` (`wanumber`, `userid`, `source`, `campaignid`) VALUES (?,?,?,?);';
    const values = [mobileNo, userId, 0, campaignId];
    const result = await wabot_db.query(queryInsert, values);
    return result;
}


const updateContactListopin = async (mobileNumber, userId, status, waId) => {
    const query = 'UPDATE '+TBL_CONTACTS_MASTER+' SET waid = ?, wastatus = ?, '+
    'authvalidity = DATE_ADD(curdate(), INTERVAL 7 DAY) WHERE `wanumber`= ? AND `userid` = ?;';
    if (/^\+/.test(mobileNumber) == true) {
        mobileNumber = mobileNumber.toString().replace('+', '');
    }
    const values = [waId, status, mobileNumber, userId];
    return wabot_db.query(query, values);
}

module.exports = {
    updateContactList,
    getWaNumberFromContacts,
    getoptinWaNumberFromContacts,
    insertContacts,
    deleteContacts,
    getOneContact,
    updateoptinContactList,
    insertInvalidContacts,
    getExpiredContacts,
    selectAlreadyOptin,
    getInvalidWhatsAppNumber,
    alreadyInsertWaNumbers,
    InsertTempWaNumbers,
    deleteTempContacts,
    deletefailedTempContacts,
    selectTempContacts,
    updateTempContacts,
    updateTempContactsError,
    insertIntoSendMaster,
    selectFailedNumber,
    updateOptinStatus,
    deleteInvalidMobileNo,
    getMobileNumbersToOptin,
    insertIntoNonWhatsMaster,
    getRetryMobileNumbersToOptin,
    updateOptinRetryAttempt,
    getRetryoptinWaNumberFromContacts,
    checkgetOneContact,
    insertoptinContacts,
    updateContactListopin,
}