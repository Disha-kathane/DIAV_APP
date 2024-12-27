const wabot_db = require('../../db/wabot');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
const {    
    TBL_SYSTEM_CONFIG_MASTER,  
    TBL_TEMPLATE_MASTER,
    TBL_MEDIA_MASTER,
    TBL_REQUEST_MASTER,
    TBL_CAMPAIGN_MASTER,
} = require('../../constants/tables');
const { result } = require('lodash');

const getSystemAccessToken = async() => {
    const query = 'select value from '+TBL_SYSTEM_CONFIG_MASTER+' where paramname = ?';
    const value = ['ACCESS_TOKEN'];
    const result = await wabot_db.query(query,value);
    return result[0];
};

const getTemplateDetails = async(tempIdList, userId) => {
    const query = 'select * from '+TBL_TEMPLATE_MASTER+' where tempid in (?) and userid = ?;';
    const value = [tempIdList, userId];
    const [ result ] = await wabot_db.query(query, value);
    return result;
};

const updateMsgResponseId = async (msgTempID, generateTempID) => {
    const query = 'update '+TBL_TEMPLATE_MASTER+'  set `waba_approval_response_id` = ? where tempid = ?; ';
    const value = [generateTempID, msgTempID];
    return wabot_db.query(query, value);    
};

const updateMsgTemplateStatus = async (statusCode, tempTitle) => {
    const query = 'update '+TBL_TEMPLATE_MASTER+'  set `status` = ? where temptitle = ?; ';
    const value = [statusCode, tempTitle];
    return wabot_db.query(query, value);    
}

const getTemplateTitles = async () => {
    const query = 'select `temptitle` from '+TBL_TEMPLATE_MASTER+' where status = 0 and waba_approval_response_id is not null';
    const [ result ] = await wabot_db.query(query);
    return result;
}
 
const getTemplateName = async (tempId, userId) => {
    const query = 'select `temptitle` from '+TBL_TEMPLATE_MASTER+' where status = 1 and tempid = ? and userid = ?';
    const value = [tempId, userId];
    const [ result ] = await wabot_db.query(query);
    return result;
}

const getCampaignDetails = async (userId, campaignId) => {    
    const query = 'SELECT `campaignid`, `campaign_title`, `userid`, `template_type`, `templateid`, `is_schedule`, `schedule_datetime`, `campaign_status`, `csv_filename`  FROM `ezb_wa_campaign_master` where userid = ? and campaignid = ? ;';
    const values = [userId, campaignId];
    const [ result ] = await wabot_db.query(query, values);
    return result[0];
}

const insertMediaDetails = async (mediaToken, mediatype, mediaurl = null, medianame = null, userId) => {
    const query = "INSERT INTO `"+TBL_MEDIA_MASTER+"` (`mediaid`, `mediatype`, `mediaurl`, `medianame`, `userid`) VALUES ('"+
                    mediaToken+"', '"+mediatype+"', '"+mediaurl+"', '"+medianame+"', '"+userId+"');"
    // const value = [mediaToken, mediatype, mediaurl, medianame, userId];
    return wabot_db.query(query);    
}

const insertIntoRequestMaster = async (validNumbersList, userId) => {
        const queryInsert = 'INSERT INTO `'+TBL_REQUEST_MASTER+'` (`userid`, `mobileno`, `wabaurl`, `templateid`, `botid`, `accesstoken`, `namespace`, `templatetitle`, `messagetype`, `media`, `mediaflag`, `placeholders`, `filename`, `language`, `priority`,`header_placeholder`, `dynamic_url_placeholder`, `appid`, `campaignid`) '+
                        'VALUES ?;';
        const values = [];
        validNumbersList.forEach(item => {
            values.push([
                    item.userid,
                    item.mobileno,
                    item.wabaurl,
                    item.templateid,
                    item.botid,
                    item.accesstoken,
                    item.namespace,
                    item.templatetitle,
                    item.messagetype,
                    item.media,
                    item.mediaflag,
                    JSON.stringify(item.placeholders),
                    item.filename,
                    item.language,
                    item.priority,
                    item.header_placeholder,                    
                    item.dynamic_url_placeholder,
                    item.appid,
                    item.campaignid
            ]);
        });
        const result = await wabot_db.query(queryInsert, [values]);
        return result;
    }

// const gettemplateuserid = async (temptitle) => {
//     const query = 'select `userid` from '+TBL_TEMPLATE_MASTER+' where temptitle = ?;';
//     const value = [temptitle];
//     const [ result ] = await wabot_db.query(query, value);
//     return result;
// }

const getWabaId = async (temptitle) => {
    const query = 'select b.whatsapp_business_account_id AS wabaId from ezb_wa_api_keys as a, ezb_wa_msg_settings as b, ezb_wa_templates as c where a.userid = b.userid and b.userid = c.userid and c.temptitle = ?;';
    const value = [temptitle];
    const [ result ] = await wabot_db.query(query, value);
    return result[0].wabaId;
};

const updateCampaignDetails = async (campagnId) => {
    const query = 'update '+TBL_CAMPAIGN_MASTER+'  set `campaign_status` = ? where campaignid = ?; ';
    const value = [1, campagnId];
    return wabot_db.query(query, value);    
};

const getcampaignStatus = async (campagnId) => {
    const query = 'select `campaign_status` from '+TBL_CAMPAIGN_MASTER+' where campaignid = ?;';
    const value = [campagnId];
    const [ result ] = await wabot_db.query(query, value);
    return result[0].campaign_status;
};

module.exports = {
    getSystemAccessToken,
    getTemplateDetails,
    updateMsgResponseId,
    updateMsgTemplateStatus,
    getTemplateTitles,
    getTemplateName,
    getCampaignDetails,
    insertMediaDetails,
    insertIntoRequestMaster,
    updateCampaignDetails,
    getWabaId,
    getcampaignStatus
}