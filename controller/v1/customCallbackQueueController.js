const Queue = require('bull');
const moment = require('moment');
const redis = require('../../redis/redis');
const pool = require('../../db/wabot');
const botUtils = require('../../utils/bot');

const {
    TBL_API_KEYS_MASTER,
    TBL_USERS_MASTER,
    TBL_MESSAGE_SENT_MASTER,
    TBL_WA_MSG_SETTINGS_MASTER,
    TBL_CUSTOM_RATE_MASTER,
    TBL_DEFAULT_RATE_MASTER,
    TBL_SUBSCRIPTION_MASTER
} = require('../../constants/tables');

const sendService = require('../../services/v1/newsend');

storeCustomCallbackPayloadLogs = async (job) => {
    try {
        console.log(job.data);
        // let msgID = job.data.entry[0].changes[0].value.messages[0].id;
        // let wabanumber = job.data.entry[0].changes[0].value.metadata.display_phone_number;

        // let type = 1;
        // let query = "INSERT INTO ezb_old_callbacks_logs(payload, messageid, logdate, type, wabanumber) VALUES(?,?,DATE(NOW()),?,?)";
        // let values = [JSON.stringify(job.data), msgID, type, wabanumber];
        // let rows = await pool.query(query, values);
        // console.log('contacts payload result : '+JSON.stringify(rows));

        let msgID = null;
        let type = 0;
        let wabanumber = job.data.callback_wanumber;
        let url = job.data.url;
        let request_data = JSON.stringify(job.data.request_data);
        let headers = JSON.stringify(job.data.headers);
        let response_data = JSON.stringify(job.data.response_data);
        let responseTime = job.data.responseTime;
        let responseStatus = job.data.response_status;


        if (job.data.request_data.entry[0].changes[0].value.hasOwnProperty('contacts') &&
            job.data.request_data.entry[0].changes[0].value.hasOwnProperty('messages')) {
            msgID = job.data.request_data.entry[0].changes[0].value.messages[0].id;
            type = 1;
            wabanumber = job.data.request_data.entry[0].changes[0].value.metadata.display_phone_number;
        }
        else if (job.data.request_data.entry[0].changes != undefined &&
            job.data.request_data.entry[0].changes[0].value.hasOwnProperty('statuses')) {
            msgID = job.data.request_data.entry[0].changes[0].value.statuses[0].id;
            type = 2;
            wabanumber = job.data.request_data.entry[0].changes[0].value.metadata.display_phone_number
        }

        let query = "INSERT INTO ezeebot.ezb_custom_callback_log_master(wabanumber,url,request_data,headers,responseTime,response_data,messageid,type, response_status)" +
            " VALUES(?,?,?,?,?,?,?,?,?)";
        let values = [wabanumber,url,request_data,headers,responseTime,response_data,msgID,type,responseStatus];
        let rows = await pool.query(query, values);
        console.log('custom callback payload result : '+JSON.stringify(rows));
    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    storeCustomCallbackPayloadLogs
};