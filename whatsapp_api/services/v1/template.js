const wabot_db = require('../../db/wabot');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
const {
    TBL_SYSTEM_CONFIG_MASTER,
    TBL_TEMPLATE_MASTER,
    TBL_MEDIA_MASTER,
    TBL_REQUEST_MASTER,
    TBL_CAMPAIGN_MASTER,
    TBL_NONWHATSAPP_MASTER,
} = require('../../constants/tables');
const { result } = require('lodash');

const getSystemAccessToken = async () => {
    const query = 'select value from ' + TBL_SYSTEM_CONFIG_MASTER + ' where paramname = ?';
    const value = ['ACCESS_TOKEN'];
    const result = await wabot_db.query(query, value);
    return result[0];
};

const getTemplateDetails = async (tempIdList, userId) => {
    const query = 'select * from ' + TBL_TEMPLATE_MASTER + ' where tempid  = ? and userid = ?;';
    const value = [tempIdList, userId];
    const [result] = await wabot_db.query(query, value);
    return result[0];
};

const updateMsgResponseId = async (msgTempID, generateTempID) => {
    const query = 'update ' + TBL_TEMPLATE_MASTER + '  set `waba_approval_response_id` = ? where tempid = ?; ';
    const value = [generateTempID, msgTempID];
    return wabot_db.query(query, value);
};

const updateMsgTemplateStatus = async (statusCode, tempTitle, userId, tempId) => {
    const query = 'update ' + TBL_TEMPLATE_MASTER + '  set `status` = ? where temptitle = ? and userid = ? and tempid = ? ; ';
    const value = [statusCode, tempTitle, userId, tempId];
    return wabot_db.query(query, value);
};

const updateMsgTemplateCategory = async (currentCategory, previousCategory, tempTitle, userId, tempId, waba_approval_response_id) => {
    const query = 'update ' + TBL_TEMPLATE_MASTER + '  set `category` = ?, previouscategory = ?, waba_approval_response_id = ? where temptitle = ? and userid = ? and tempid = ?;';
    const value = [currentCategory, previousCategory, waba_approval_response_id, tempTitle, userId, tempId];
    return wabot_db.query(query, value);
};

const updateCampaignMsgCounts = async (totalCount, campagnId) => {
    const query = 'update ' + TBL_CAMPAIGN_MASTER + '  set `msgcount` = ? where `campaignid` = ?; ';
    const value = [totalCount, campagnId];
    return wabot_db.query(query, value);
};


const getTemplateTitles = async () => {
    const query = 'select `temptitle` from ' + TBL_TEMPLATE_MASTER + ' where status = 0 and waba_approval_response_id is not null';
    const [result] = await wabot_db.query(query);
    return result;
};

const getTemplateTitlesUserid = async () => {
    const query = 'select `temptitle`,`userid`, tempid from ' + TBL_TEMPLATE_MASTER + ' where status IN(0,14) and waba_approval_response_id is not null order by tempid desc';
    const [result] = await wabot_db.query(query);
    return result;
};

const getTemplateCategoryUserid = async () => {
    const query = 'select `temptitle`,`userid`, tempid, waba_approval_response_id from ' + TBL_TEMPLATE_MASTER + ' where status = 1 and previouscategory is null limit 1';
    const [result] = await wabot_db.query(query);
    return result;
};


const getTemplateName = async (tempId, userId) => {
    const query = 'select `temptitle` from ' + TBL_TEMPLATE_MASTER + ' where status = 1 and tempid = ? and userid = ?';
    const value = [tempId, userId];
    const [result] = await wabot_db.query(query);
    return result;
};

const getCampaignDetails = async (userId, campaignId, campaignStatus) => {
    const query = 'SELECT *  FROM `ezb_wa_campaign_master` where userid = ? and campaignid = ? and campaign_status = ?;';
    const values = [userId, campaignId, campaignStatus];
    const [result] = await wabot_db.query(query, values);
    return result[0];
};

const getCampaignDetailsNew = async (userId, campaignId) => {
    const query = 'SELECT *  FROM `ezb_wa_campaign_master` where userid = ? and campaignid = ?';
    const values = [userId, campaignId];
    const [result] = await wabot_db.query(query, values);
    return result[0];
};

const insertMediaDetails = async (mediaToken, mediatype, mediaurl = null, medianame = null, userId) => {
    const query = "INSERT INTO `" + TBL_MEDIA_MASTER + "` (`mediaid`, `mediatype`, `mediaurl`, `medianame`, `userid`) VALUES ('" +
        mediaToken + "', '" + mediatype + "', '" + mediaurl + "', '" + medianame + "', '" + userId + "');";
    // const value = [mediaToken, mediatype, mediaurl, medianame, userId];
    return wabot_db.query(query);
};

const insertIntoRequestMaster = async (validNumbersList, userId) => {
    const queryInsert = 'INSERT INTO `' + TBL_REQUEST_MASTER + '` (`userid`, `mobileno`, `wabaurl`, `templateid`, `botid`, `accesstoken`, `namespace`, `templatetitle`, `messagetype`, `media`, `mediaflag`, `placeholders`, `filename`, `language`, `priority`,`header_placeholder`, `dynamic_url_placeholder`, `appid`, `campaignid`, `contactno`, `msg_setting_id`, `isoptin`) ' +
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
            item.placeholders,
            item.filename,
            item.language,
            item.priority,
            item.header_placeholder,
            item.dynamic_url_placeholder,
            item.appid,
            item.campaignid,
            item.contactno,
            item.msg_setting_id,
            item.isoptin
        ]);
    });
    const result = await wabot_db.query(queryInsert, [values]);
    return result;
};

// const gettemplateuserid = async (temptitle) => {
//     const query = 'select `userid` from '+TBL_TEMPLATE_MASTER+' where temptitle = ?;';
//     const value = [temptitle];
//     const [ result ] = await wabot_db.query(query, value);
//     return result;
// }

const getWabaId = async (temptitle) => {
    const query = 'select b.whatsapp_business_account_id AS wabaId from ezb_wa_api_keys as a, ezb_wa_msg_settings as b, ezb_wa_templates as c where a.userid = b.userid and b.userid = c.userid and c.temptitle = ?;';
    const value = [temptitle];
    const [result] = await wabot_db.query(query, value);
    return result[0].wabaId;
};

const getWabaUserId = async (temptitle, userid, tempid) => {
    const query = 'select b.whatsapp_business_account_id AS wabaId from ezb_wa_api_keys as a, ezb_wa_msg_settings as b, ezb_wa_templates as c, ezb_users AS d' +
        ' where a.userid = b.userid and b.userid = d.userid and c.temptitle = ? and b.wa_msg_setting_id = d.wanumberid and c.userid = ? and c.tempid = ? and c.waba_approval_response_id is not null';
    const value = [temptitle, userid, tempid];
    const [result] = await wabot_db.query(query, value);
    return result[0].wabaId;
};

const getWabaUserId_1 = async (temptitle, userid, tempid) => {
    const query = 'select b.whatsapp_business_account_id AS wabaId from ezb_wa_api_keys as a, ezb_wa_msg_settings as b, ezb_wa_templates as c' +
        ' where a.userid = b.userid and b.userid = c.userid and c.temptitle = ? and c.userid = ? and c.tempid = ? and c.previouscategory is null';
    const value = [temptitle, userid, tempid];
    const [result] = await wabot_db.query(query, value);
    return result[0] != undefined ? result[0].wabaId : 0;
};


const getcampaignStatus = async (campagnId) => {
    const query = 'select `campaign_status` from ' + TBL_CAMPAIGN_MASTER + ' where campaignid = ?;';
    const value = [campagnId];
    const [result] = await wabot_db.query(query, value);
    return result[0].campaign_status;
};

const getCampaignId = async (campaignFileSize) => {
    const query = 'select campaignid as campaignId, userid as userId from `' + TBL_REQUEST_MASTER + '` where isoptin = ? group by campaignid order by priority limit ?;';
    const value = [0, campaignFileSize];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const updateCampaignDetails = async (campStatus, campagnId) => {
    const query = 'update ' + TBL_CAMPAIGN_MASTER + '  set `campaign_status` = ? where `campaignid` = ?; ';
    const value = [campStatus, campagnId];
    return wabot_db.query(query, value);
};

const optinMobileNumbers = async (userId, campaignId) => {
    const query = 'select mobileno from `' + TBL_REQUEST_MASTER + '` where isoptin = ? AND userid = ? AND campainid = ? limit 100;';
    const value = [0, userId, campaignId];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const selectCampaignId = async (limit, campaignStatus) => {
    if (!limit) {
        limit = 5;
    }
    //AND userid = 751 
    const query = 'select campaignid as campaignId, userid as userId from `' + TBL_CAMPAIGN_MASTER + '` where campaign_status = ? limit ?;';
    const value = [campaignStatus, limit];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getPlaceholderfromTempId = async (userId, tempId) => {
    const query = 'select `placeholders` from ' + TBL_TEMPLATE_MASTER + ' where userid = ? and tempid = ?';
    const value = [userId, tempId];
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0].placeholders;
    }
    return {};

};

const getPlaceholderFromTempApprovedId = async (tempApprovalId) => {
    const query = 'select `placeholders` from ' + TBL_TEMPLATE_MASTER + ' where waba_approval_response_id = ?';
    const value = [tempApprovalId];
    console.log(query, value);
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0].placeholders;
    }
    return {};
};


const getPlaceholderFromTempId = async (tempId) => {
    const query = 'select `placeholders` from ' + TBL_TEMPLATE_MASTER + ' where tempid = ?';
    const value = [tempId];
    console.log(query, value);
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0].placeholders;
    }
    return {};
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
    getcampaignStatus,
    updateCampaignMsgCounts,
    selectCampaignId,
    getCampaignId,
    optinMobileNumbers,
    getTemplateTitlesUserid,
    getWabaUserId,
    getCampaignDetailsNew,
    getPlaceholderfromTempId,
    getPlaceholderFromTempApprovedId,
    getPlaceholderFromTempId,
    getTemplateCategoryUserid,
    getWabaUserId_1,
    updateMsgTemplateCategory
};
