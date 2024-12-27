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

storeContactPayloadLogs = async (job) => {
    try{
        let msgID = job.data.entry[0].changes[0].value.messages[0].id;
        let wabanumber = job.data.entry[0].changes[0].value.metadata.display_phone_number;

        let type = 1;
        let query = "INSERT INTO ezb_old_callbacks_logs(payload, messageid, logdate, type, wabanumber) VALUES(?,?,DATE(NOW()),?,?)";
        let values = [JSON.stringify(job.data), msgID, type, wabanumber];
        let rows = await pool.query(query, values);
        console.log('contacts payload result : '+JSON.stringify(rows));
    }catch(err){
        console.log(err);
    }
}

module.exports = {
    storeContactPayloadLogs
};