const wabot_db = require('../../db/wabot');
const appLoggers = require('../../applogger.js');
const {
    result
} = require('lodash');


const getApiKey = async (next) => {
    try {
        const query = 'SELECT apikey FROM ezb_wa_api_keys LIMIT 50';
        const rows = await wabot_db.query(query);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getUserId = async (apikeys, next) => {
    try {
        const query = 'SELECT userid FROM ezb_wa_api_keys WHERE apikey=?';
        const value = [apikeys];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getUserStatus = async (userid, next) => {
    try {
        const query = 'SELECT userstatus FROM ezb_users WHERE userid=?';
        const value = [userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const fetchUserId = async (userid, next) => {
    try {
        const query = 'SELECT userid FROM ezb_wa_db_stats WHERE userid=?;';
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
            // console.log('wanumber: ' + wanumber);
            query = 'SELECT a.usrnm, a.usrpass, a.authts, a.authvalidity, a.authtoken, a.waurl, a.wanumber FROM ezb_wa_msg_settings as a, ezb_users as b WHERE a.wa_msg_setting_id = b.wanumberid and b.userid =  AND a.wanumber = ?';
        } else {
            query = 'SELECT a.usrnm, a.usrpass, a.authts, a.authvalidity, a.authtoken, a.waurl, a.wanumber FROM ezb_wa_msg_settings as a, ezb_users as b WHERE a.wa_msg_setting_id = b.wanumberid and b.userid = ?';
        }
        // console.log(query);
        const value = [userid, wanumber];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}


const insertDBStats = async (userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, next) => {
    try {
        const query = 'INSERT INTO ezb_wa_db_stats (userid,db_contacts_nonuser_value,db_contacts_user_value,db_message_receipts,type_object,db_pending_callbacks,db_pending_messages) VALUES(?,?,?,?,?,?,?)';
        const value = [userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const updateDBStats = async (userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, next) => {
    try {
        const query = 'UPDATE ezb_wa_db_stats set db_contacts_nonuser_value=?,db_contacts_user_value=?,db_message_receipts=?,type_object=?,db_pending_callbacks=?,db_pending_messages=? WHERE userid=?';
        const value = [NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getWaHealthStatus = async (userid, updatewaGetHealthStatus, next) => {
    try {
        const query = 'UPDATE ezb_users set waba_health_status = ? WHERE userid = ?';
        const value = [updatewaGetHealthStatus, userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getWabaId = async (userid, next) => {
    try {
        const query = 'SELECT a.whatsapp_business_account_id FROM ezb_wa_msg_settings as a, ezb_users as b WHERE a.wa_msg_setting_id = b.wanumberid and b.userid = ?';
        const value = [userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getAccessToken = async (next) => {
    try {
        const query = 'SELECT value FROM ezb_system_config WHERE paramname = ?';
        const value = ['ACCESS_TOKEN'];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }

}

const getWebhookSetting = async (wamsgsettingid, next) => {
    try {
        const query = 'SELECT waurl , authtoken FROM ezb_wa_msg_settings WHERE  wa_msg_setting_id =?';
        const value = [wamsgsettingid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}



// const getCampaignStatus = async (next) => {
//     try {
//         const query = 'UPDATE ezb_wa_campaign_master AS C LEFT JOIN ezb_message_request_master AS r ON C.campaignid = r.campaignid SET campaign_status=6 WHERE C.campaign_status=0 AND r.campaignid IS NULL';
//         const rows = await wabot_db.query(query);
//         //console.log("affected", rows);
//         next(null, rows[0]);
//     } catch (err) {
//         next(err);
//     }
// }

const updateStatuscompleted = async (campaignid, next) => {
    try {
        const query = 'UPDATE ezb_wa_campaign_master SET campaign_status=6 WHERE campaignid IN(?)';
        const value = [campaignid];
        const rows = await wabot_db.query(query, value);
        // console.log("affected", rows);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

const getCampaignStatus = async (next) => {
    try {
	  const query = 'SELECT campaignid, campaign_status, is_schedule FROM ezb_wa_campaign_master WHERE campaign_status IN (0,1) ';
        const rows = await wabot_db.query(query);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const checkINReqMaster = async (campaignid, next) => {
    try {
        const query = 'select count(1) AS c from ezb_message_request_master where campaignid=?';
        const value = [campaignid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}
const updateCampaignStatus = async (campaignid, next) => {
    try {
        const query = 'UPDATE ezb_wa_campaign_master SET campaign_status=1 WHERE campaignid IN(?)';
        const value = [campaignid];
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
    getAccessToken,
    getWebhookSetting,
    getCampaignStatus,
    updateStatuscompleted,
    checkINReqMaster,
    updateCampaignStatus
}
