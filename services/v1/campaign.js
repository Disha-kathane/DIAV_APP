const dbpool = require('../../db/wabot');

const {
    errorLogger,
    infoLogger
} = require('../../applogger');

const {
    TBL_MESSAGE_REQUEST_MASTER,
    TBL_MESSAGE_SENT_MASTER,
    TBL_USERS_MASTER,
    TBL_TEMPLATE_MASTER,
    TBL_API_KEYS_MASTER,
    TBL_WA_MSG_SETTINGS_MASTER,
    TBL_WA_MEDIA_MASTER,
    TBL_SUBSCRIPTION_MASTER,
    TBL_CAMPAIGN_MASTER
} = require('../../constants/tables');

const MSG_LIMIT = 50;

fetchCampaigns = async (next) => {

    try {
        // let query = "SELECT a.*, b.apikey FROM " + TBL_CAMPAIGN_MASTER + " AS a, " + TBL_API_KEYS_MASTER + " AS b" +
        //     " WHERE a.is_schedule = ? AND" +
        //     " a.isschedulerprocessed = ? AND" +
        //     " a.userid = b.userid AND" +
        //     " TIMESTAMPDIFF(SECOND, NOW(), a.schedule_datetime) BETWEEN ? AND ?";
        // let values = [1, 0, 5, 10];

        let query = "SELECT a.*, b.apikey FROM " + TBL_CAMPAIGN_MASTER + " AS a, " + TBL_API_KEYS_MASTER + " AS b" +
            " WHERE a.is_schedule = ? AND" +
            " a.isschedulerprocessed = ? AND" +
            " a.userid = b.userid AND" +
            " a.schedule_datetime <= NOW()";
        let values = [1, 0];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

updateCampaignSchedulerProcessed = async (id, next) => {
    try {
        let query = "UPDATE " + TBL_CAMPAIGN_MASTER + " SET isschedulerprocessed = ? WHERE campaignid = ?";
        let values = [1, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    fetchCampaigns,
    updateCampaignSchedulerProcessed
}