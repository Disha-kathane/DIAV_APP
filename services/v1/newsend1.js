const pool = require('../../db/wabot');

const {
    errorLogger,
    infoLogger
} = require('../../applogger');

const {
    TBL_TEMPLATE_MASTER,
    TBL_WA_MSG_SETTINGS_MASTER,
} = require('../../constants/tables');


let query = null;
let values = null;
let rows = null;

fetchTemplate = async (templateName, userId, wabaNumber) => {
    try {
        query = 'SELECT a.*, b.hsmnamespace FROM ' + TBL_TEMPLATE_MASTER + ' AS a, ' + TBL_WA_MSG_SETTINGS_MASTER + ' AS b ' + ' WHERE a.userid = b.userid AND a.temptitle = ? and a.userid = ? AND b.wanumber LIKE ?';
        values = [templateName, userId, '%' + wabaNumber];
        rows = await pool.query(query, values);
        console.log('result : ' + JSON.stringify(rows[0]));
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};

updateWabaApprovalResponseId = async (status, msgtempid) => {
    try {
        query = 'UPDATE ' + TBL_TEMPLATE_MASTER + ' SET status = ? WHERE waba_approval_response_id = ? ';
        values = [status, msgtempid];
        rows = await pool.query(query, values);
        console.log('result : ' + JSON.stringify(rows[0]));
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};

updatePhoneNumberNameUpdate = async (requestedVerifiedName, wanumber) => {
    try {
        query = 'UPDATE ' + TBL_WA_MSG_SETTINGS_MASTER + ' SET phone_number_name_update = ? where wanumber = ?';
        values = [requestedVerifiedName, '+' + wanumber];
        rows = await pool.query(query, values);
        console.log('result : ' + JSON.stringify(rows[0]));
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};

updatePhoneNumberQualityUpdate = async (currentlimit, eventquality, wanumber) => {
    try {
        query = 'UPDATE ' + TBL_WA_MSG_SETTINGS_MASTER + ' SET currentlimit = ?, eventquality = ? where wanumber = ?';
        values = [currentlimit, eventquality, '+' + wanumber];
        rows = await pool.query(query, values);
        console.log('result : ' + JSON.stringify(rows[0]));
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};

updateTemplateCategory = async (previouscategory, newcategory, msgtempid) => {
    try {
        query = 'UPDATE ' + TBL_TEMPLATE_MASTER + ' SET previouscategory = ?, category = ? WHERE waba_approval_response_id = ?';
        values = [previouscategory, newcategory, msgtempid];
        rows = await pool.query(query, values);
        console.log('result : ' + JSON.stringify(rows[0]));
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};

updateTemplatePerformance = async (top_block_reason, messages_sent_7d, messages_opened_7d, msgtempid) => {
    try {
        query = 'UPDATE ' + TBL_TEMPLATE_MASTER + ' SET block_reason = ?, messages_sent_7d = ?, messages_opened_7d = ? WHERE waba_approval_response_id = ?';
        values = [top_block_reason, messages_sent_7d, messages_opened_7d, msgtempid];
        rows = await pool.query(query, values);
        console.log('result : ' + JSON.stringify(rows[0]));
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};

updateEmailSentStatus = async (status, msgtempid) => {
    try {
        query = 'UPDATE ' + TBL_TEMPLATE_MASTER + ' SET status = ?, is_email_sent = IF(is_email_sent = 1 ,0, is_email_sent) WHERE waba_approval_response_id = ?';
        values = [status, msgtempid];
        rows = await pool.query(query, values);
        // console.log('result : ' + JSON.stringify(rows[0]));
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};


module.exports = {
    fetchTemplate,
    updateWabaApprovalResponseId,
    updatePhoneNumberNameUpdate,
    updatePhoneNumberQualityUpdate,
    updateTemplateCategory,
    updateTemplatePerformance,
    updateEmailSentStatus
}


