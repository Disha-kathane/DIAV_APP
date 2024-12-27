const wabot_db = require('../../db/database');
const appLoggers = require('../../applogger.js');
const {
    result
} = require('lodash');
const errorLogger = appLoggers.errorLogger;

const getApiKey = async (next) => {
    try {
        const query = 'SELECT `apikey` FROM `ezb_wa_api_keys` LIMIT 50';
        const rows = await wabot_db.query(query);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const getUserId = async (apikeys, wanumber, next) => {
    try {
        console.log(apikeys);
        const query = 'SELECT a.userid FROM ezb_wa_api_keys AS a , ezb_wa_msg_settings AS b WHERE a.userid = b.userid AND a.apikey = ? AND  b.wanumber = ?';
        const value = [apikeys, '+' + wanumber];
        const rows = await wabot_db.query(query, value);

        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const getUserStatus = async (userid, next) => {
    try {
        const query = 'select `userstatus` from `ezb_users` where userid=?';
        const value = [userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const fetchUserId = async (userid, next) => {
    try {
        const query = 'select `userid` from `ezb_wa_db_stats` where userid=?;';
        const values = [userid];
        const rows = await wabot_db.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const getUserSettings = async (userid, wanumber, next) => {
    try {
        let query;
        if (wanumber != '') {
            query = 'select `usrnm`, `usrpass`, `authts`, `authvalidity`, `authtoken`, `waurl`, `wanumber` from `ezb_wa_msg_settings` where userid = ? AND wanumber LIKE ?';
        } else {
            query = 'select `usrnm`, `usrpass`, `authts`, `authvalidity`, `authtoken`, `waurl`, `wanumber` from `ezb_wa_msg_settings` where userid = ?';
        }
        console.log(query);
        const value = [userid, '%' + wanumber + '%'];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};


const insertDBStats = async (userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, next) => {
    try {
        const query = 'INSERT INTO `ezb_wa_db_stats` (`userid`,`db_contacts_nonuser_value`,`db_contacts_user_value`,`db_message_receipts`,`type_object`,`db_pending_callbacks`,`db_pending_messages`) VALUES(?,?,?,?,?,?,?)';
        const value = [userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const updateDBStats = async (userid, NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, next) => {
    try {
        const query = 'update `ezb_wa_db_stats` set `db_contacts_nonuser_value`=?,`db_contacts_user_value`=?,`db_message_receipts`=?,`type_object`=?,`db_pending_callbacks`=?,`db_pending_messages`=? where userid=?';
        const value = [NonWhatsappUserValue, WhatsappUserValue, MessageReceiptValue, DbMessages, DbPendingCallbacksValue, DbPendingMessagesValue, userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const getWaHealthStatus = async (userid, updatewaGetHealthStatus, next) => {
    try {
        const query = 'update `ezb_users` set `waba_health_status` = ? where userid = ?';
        const value = [updatewaGetHealthStatus, userid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const getWabaId = async (userid, wanumber, next) => {
    try {
        const query = 'SELECT whatsapp_business_account_id FROM `ezb_wa_msg_settings` WHERE userid =? AND wanumber=?';
        const value = [userid, '+' + wanumber];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const getAccessToken = async (next) => {
    try {
        const query = 'select value from `ezb_system_config` where paramname = ?';
        const value = ['ACCESS_TOKEN'];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }

};


const insertTemplateDetails = async (result, data, next) => {

    try {
        let queryInsert = 'INSERT INTO `ezb_wa_templates` (botid,temptitle,category,langcode,userid,head_temptype,head_text_title,head_mediatype,head_media_url,head_media_filename,body_message,placeholders,footer_text,button_option,button_option_string,request_to_admin,status,placeholder_template_type,waba_approval_response_id,is_email_sent,sample_content,auserid,euserid,entrytime,lastupdatetime,marketing_opt_out,marketing_consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW(),?,?)';
        let values = [null, data.name, data.category, data.language, data.userid, data.head_temptype, data.head_text_title, data.head_mediatype, data.head_media_url, data.head_media_filename, data.body_message, data.bodyplaceholders, data.footer_text, data.button_option, JSON.stringify(data.button_option_string), data.request_to_admin, data.status, data.placeholder_template_type, result.id, data.is_email_sent, JSON.stringify(data.sample_content), data.userid, data.userid, data.marketing_opt_out, data.marketing_consent];
        let rows = await wabot_db.query(queryInsert, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const getTemplateName = async (id, next) => {

    try {
        const query = 'SELECT temptitle FROM `ezb_wa_templates` WHERE waba_approval_response_id =?';
        const value = [id];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }


};

const gettemplatestatus = async (id, next) => {

    try {
        const query = 'SELECT * FROM `ezb_wa_templates` WHERE waba_approval_response_id =?';
        const value = [id];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }


};

const getUserId1 = async (apikeys, wanumber, next) => {
    try {
        console.log({ apikeys, wanumber });
        const query = 'SELECT a.userid FROM ezb_wa_api_keys AS a, ezb_wa_msg_settings AS b WHERE a.userid = b.userid AND a.apikey = ? AND  b.wanumber = ?';
        const value = [apikeys, '+' + wanumber];
        console.log({ value });
        const rows = await wabot_db.query(query, value);
        // console.log('getUserId result : ' + rows[0]);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

let UpdateWhatsappFlowStatus = async (flowid, next) => {
    try {
        const query = 'update `ezb_whatsapp_flows_master` set `status`=? where flowid=?';
        const value = [1, flowid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};
let insertWhatsappFlow = async (userid, wanumber, name, categories, status, flowid, next) => {
    try {
        let queryInsert = 'INSERT INTO `ezb_whatsapp_flows_master` (userid,wabanumber,name,category,status,flowid) VALUES (?,?,?,?,?,?)';
        let values = [userid, wanumber, name, categories, status, flowid];
        let rows = await wabot_db.query(queryInsert, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

let GetBusinessPublicKeyStatus = async (business_public_key, phonenumberid, next) => {
    try {
        const query = 'update `ezb_whatsapp_flows_config_master` set `business_public_key`=? where phone_number_id =?';
        const value = [business_public_key, phonenumberid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

// let SetBusinessPublicKeyStatus = async (wanumber, phonenumberid, wabaid, userid, business_public_key, next) => {
//     try {
//         const query = 'insert into ezb_whatsapp_flows_config_master (wabanumber,phone_number_id,waba_id,userid,business_public_key,createdt) values (?,?,?,?,?,now())';
//         const value = [wanumber, phonenumberid, wabaid, userid, business_public_key];
//         const rows = await wabot_db.query(query, value);
//         next(null, rows[0]);
//     } catch (err) {
//         next(err);
//     }
// };

let UpdateWhatsappFlowStatustoDelete = async (flowid, next) => {
    try {
        const query = 'update `ezb_whatsapp_flows_master` set `status`=? where flowid=?';
        const value = [5, flowid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

let UpdateWhatsappFlowStatustoDepricate = async (flowid, next) => {
    try {
        const query = 'update `ezb_whatsapp_flows_master` set `status`=? where flowid=?';
        const value = [2, flowid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

let updateWabaApprovalResponseId = async (status, msgtempid, next) => {
    try {
        query = 'UPDATE `ezb_wa_templates` SET status = ? WHERE waba_approval_response_id = ? ';
        values = [status, msgtempid];
        rows = await wabot_db.query(query, values);
        // return rows[0];
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);

    }
};

const phonenumberid1 = async (wanumber, next) => {
    try {
        const query = 'SELECT phone_number_id FROM ezb_wa_msg_settings Where wanumber=?';;
        const value = ['+' + wanumber];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const insertFlowsTemplateDetails = async (result, data, flowid1, next) => {
    try {
        let queryInsert = 'INSERT INTO `ezb_wa_templates` (botid,temptitle,category,langcode,userid,head_temptype,head_text_title,head_mediatype,head_media_url,head_media_filename,body_message,placeholders,footer_text,flowid,flows_button,request_to_admin,status,placeholder_template_type,waba_approval_response_id,is_email_sent,sample_content,auserid,euserid,entrytime,lastupdatetime,marketing_opt_out,marketing_consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW(),?,?)';
        let values = [null, data.name, data.category, data.language, data.userid, data.head_temptype, data.head_text_title, data.head_mediatype, data.head_media_url, data.head_media_filename, data.body_message, data.bodyplaceholders, data.footer_text, flowid1, JSON.stringify(data.button_option_string), data.request_to_admin, data.status, data.placeholder_template_type, result.id, data.is_email_sent, JSON.stringify(data.sample_content), data.userid, data.userid, data.marketing_opt_out, data.marketing_consent];
        let rows = await wabot_db.query(queryInsert, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};


const fetchtemplateId = async (responseid, next) => {
    try {
        const query = 'SELECT tempid, waba_approval_response_id,temptitle, status FROM ezb_wa_templates Where waba_approval_response_id = ?';
        const value = [responseid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }


};

let UpdateWhatsappFlowMetaData = async (flowid, name, categories, next) => {
    try {
        let queryInsert = ' Update `ezb_whatsapp_flows_master` SET name =?, category=? where flowid=?';
        let values = [name, categories, flowid];
        let rows = await wabot_db.query(queryInsert, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const fetchtemplateIdinfo = async (tempid, next) => {
    try {
        const query = 'SELECT tempid as pinnacle_template_id,waba_approval_response_id as meta_template_id,temptitle,category,langcode,head_temptype,head_text_title,head_mediatype,head_media_url,body_message,placeholders,footer_text,button_option,button_option_string FROM ezb_wa_templates Where tempid = ?';
        const value = [tempid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const fetchalltemplateinfo = async (userid, mediatype, next) => {
    try {
        let query = null;
        let values = null;
        if (mediatype == 0) {
            query = "SELECT tempid as pinnacle_template_id,waba_approval_response_id as meta_template_id,temptitle,category,langcode,head_text_title,head_media_url,CONVERT(body_message using utf8) AS body_message,placeholders,footer_text,button_option,button_option_string FROM ezb_wa_templates Where userid = ? AND head_temptype IN (0,'',null) AND status = ?";
            values = [userid, 1];
        } else if (mediatype != 6) {
            query = 'SELECT tempid as pinnacle_template_id,waba_approval_response_id as meta_template_id,temptitle,category,langcode,head_text_title,head_media_url,CONVERT(body_message using utf8) AS body_message,placeholders,footer_text,button_option,button_option_string FROM ezb_wa_templates Where userid = ? AND head_mediatype = ? AND status = ?';
            values = [userid, mediatype, 1];
        }
        else if (mediatype == 6) {
            query = 'SELECT tempid as pinnacle_template_id,waba_approval_response_id as meta_template_id,temptitle,category,langcode,head_text_title,head_media_url,CONVERT(body_message using utf8) AS body_message,placeholders,footer_text,button_option,button_option_string,carousal_payload FROM ezb_wa_templates Where userid = ? AND head_mediatype = ? AND status = ?';
            values = [userid, mediatype, 1];
        }
        const rows = await wabot_db.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};


const insertTemplateDetailscarousel1 = async (result, data, carousal_payload1, body_messageM, bodyplaceholdersM, next) => {
    try {
        let queryInsert = 'INSERT INTO ezb_wa_templates set temptitle= ?,category= ?,allow_category_change= ? ,langcode=?,userid=?,head_temptype=?,head_mediatype=?,body_message=?,placeholders=?,request_to_admin=?,carousal_payload=?,status=?,placeholder_template_type=?,waba_approval_response_id="?",is_email_sent=?,sample_content=?,auserid=?,euserid=?,entrytime=now(),lastupdatetime=now(),marketing_opt_out=?,marketing_consent=?';
        let values = [data.name, data.category, 0, data.language, data.userid, data.head_temptype, 6, body_messageM, bodyplaceholdersM, data.request_to_admin, JSON.stringify(carousal_payload1), data.status, data.placeholder_template_type, JSON.parse(result.id), data.is_email_sent, JSON.stringify(data.sample_content), data.userid, data.userid, 0, 0];
        let rows = await wabot_db.query(queryInsert, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const insertTemplateDetailsV2 = async (result, data, flowid1, carousel_payload, category_change, type_of_marketing, marketing_template_format, head_media_url, next) => {

    try {
        let queryInsert = 'INSERT INTO `ezb_wa_templates` (botid,temptitle,category,langcode,userid,head_temptype,head_text_title,head_mediatype,head_media_url,head_media_filename,body_message,placeholders,footer_text,button_option,button_option_string,request_to_admin,status,placeholder_template_type,waba_approval_response_id,is_email_sent,sample_content,auserid,euserid,entrytime,lastupdatetime,marketing_opt_out,marketing_consent,flowid,carousal_payload,allow_category_change,type_of_marketing,marketing_template_format) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW(),?,?,?,?,?,?,?)';
        let values = [null, data.name, data.category, data.language, data.userid, data.head_temptype, data.head_text_title, data.head_mediatype, head_media_url, data.head_media_filename, data.body_message, data.bodyplaceholders, data.footer_text, data.button_option, JSON.stringify(data.button_option_string), data.request_to_admin, data.status, data.placeholder_template_type, result.id, data.is_email_sent, JSON.stringify(data.sample_content), data.userid, data.userid, data.marketing_opt_out, data.marketing_consent, flowid1, JSON.stringify(carousel_payload), category_change, type_of_marketing, marketing_template_format];
        console.log(queryInsert, values);
        let rows = await wabot_db.query(queryInsert, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};


const get_URL_headerhandel = async (temp_h, next) => {
    try {
        let queryInsert = 'select url,mime_type from `ezb_handler` where header_handle = ?';
        let values = temp_h;
        // console.log(queryInsert, values);
        let rows = await wabot_db.query(queryInsert, values);
        console.log(rows, "rows");
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const insertheaderdata = async (wanumber, head_media_url, temp_h, FileType, next) => {
    try {
        let queryInsert = 'INSERT INTO `ezb_handler` (wanumber,header_handle,url,create_date,mime_type) VALUES (?,?,?,NOW(),?)';
        let values = [wanumber, temp_h, head_media_url, FileType];
        console.log(queryInsert, values);
        let rows = await wabot_db.query(queryInsert, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

const checkwabaBusinessPublicKey = async (wabaid, next) => {
    try {
        let queryInsert = 'select count(1) as c from `ezb_whatsapp_flows_config_master` where waba_id = ?';
        let values = [wabaid];
        console.log(queryInsert, values);
        let rows = await wabot_db.query(queryInsert, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};
let SetBusinessPublicKeyStatus = async (wabaid, userid, publicKey, privateKey, next) => {
    try {
        let publicKeycon;
        let privateKeycon;
        if (publicKey.endsWith('\n')) {
            publicKeycon = publicKey.slice(0, -1);
            // console.log(publicKeycon);
        }
        if (privateKey.endsWith('\n')) {
            privateKeycon = privateKey.slice(0, -1);
            // console.log(privateKeycon);
        }
        // let convertedpublicKey = publicKey.replace(/\r\n|\n|\r/g, "\\n");
        // console.log(convertedpublicKey);
        // let  publicKey1 =  publicKey.toString()
        // console.log('publicKey1',publicKey1);
        const query = 'insert into ezb_whatsapp_flows_config_master (waba_id ,userid ,business_public_key,business_private_key,createdt) VALUES (?,?,?,?,NOW())';
        const value = [wabaid, userid, publicKeycon, privateKeycon];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};
let GetpublicKeyfromdb = async (wabaid, next) => {
    try {
        const query = 'select business_public_key from ezb_whatsapp_flows_config_master where waba_id =?';
        const value = [wabaid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};
let GetprivateKeyfromdb = async (wabaid, next) => {
    try {
        const query = 'select business_private_key from ezb_whatsapp_flows_config_master where waba_id =?';
        const value = [wabaid];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

let gettemplatedetails = async (name, language, category, next) => {
    try {
        const query = 'select waba_approval_response_id,resubmit_counter from ezb_wa_templates where temptitle = ? AND category = ? AND langcode = ?';
        const value = [name, category, language];
        const rows = await wabot_db.query(query, value);
        // console.log("rows -----------------------> ", rows)
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

let updateTemplateDetails = async (waba_approval_response_id, resubmit_counter, data, carousel_payload, flowid1, next) => {
    try {
        resubmit_counter = resubmit_counter + 1;

        // let queryupdate = 'update `ezb_wa_templates` set botid=?,userid=?,head_temptype=?,head_text_title=?,head_mediatype=?,head_media_url=?,head_media_filename=?,body_message=?,placeholders=?,footer_text=?,button_option=?,button_option_string=?,request_to_admin=?,status=?,placeholder_template_type=?,is_email_sent=?,sample_content=?,auserid=?,euserid=?,entrytime=NOW(),lastupdatetime=NOW(),marketing_opt_out=?,marketing_consent=?, resubmit_counter = ? where temptitle=? AND waba_approval_response_id=?';

        let queryupdate = "update   ezb_wa_templates set botid=?,userid=?,head_temptype=?,head_text_title=?,head_mediatype=?,head_media_url=?,head_media_filename=?,body_message=?,placeholders=?,footer_text=?,button_option=?,button_option_string=?,request_to_admin=?,status=?,placeholder_template_type=?,is_email_sent=?,sample_content=?,auserid=?,euserid=?,entrytime=NOW(),lastupdatetime=NOW(),marketing_opt_out=?,marketing_consent=?, flowid=?,carousal_payload=?,resubmit_counter = ? where temptitle=? AND waba_approval_response_id=?";

        let values = [null, data.userid, data.head_temptype, data.head_text_title, data.head_mediatype, data.head_media_url, data.head_media_filename, data.body_message, data.bodyplaceholders, data.footer_text, data.button_option, JSON.stringify(data.button_option_string), data.request_to_admin, 14, data.placeholder_template_type, data.is_email_sent, JSON.stringify(data.sample_content), data.userid, data.userid, data.marketing_opt_out, data.marketing_consent, flowid1, JSON.stringify(carousel_payload), resubmit_counter, data.name, waba_approval_response_id];
        console.log("values", values);
        let rows = await wabot_db.query(queryupdate, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};

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
    insertTemplateDetails,
    getTemplateName,
    gettemplatestatus,
    getUserId1,
    UpdateWhatsappFlowStatus,
    insertWhatsappFlow,
    GetBusinessPublicKeyStatus,
    SetBusinessPublicKeyStatus,
    UpdateWhatsappFlowStatustoDelete,
    UpdateWhatsappFlowStatustoDepricate,
    updateWabaApprovalResponseId,
    phonenumberid1,
    insertFlowsTemplateDetails,
    fetchtemplateId,
    UpdateWhatsappFlowMetaData,
    fetchtemplateIdinfo,
    fetchalltemplateinfo,
    insertTemplateDetailscarousel1,
    insertTemplateDetailsV2,
    get_URL_headerhandel,
    insertheaderdata,
    checkwabaBusinessPublicKey,
    GetpublicKeyfromdb,
    GetprivateKeyfromdb,
    gettemplatedetails,
    updateTemplateDetails
};