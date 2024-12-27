const dbpool = require('../../db/wabot');
const moment = require('moment');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');

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

validateApiKey = async (apikey, wanumber, next) => {
    try {
        let query = "SELECT a.apikey, a.userid, b.userstatus, c.waurl, c.wa_msg_setting_id, c.wanumber, c.authtoken, c.islivechat, c.livechatwebhook, c.custom_callback, c.isactivepinbotflow FROM "
            + TBL_API_KEYS_MASTER + " AS a,"
            + TBL_USERS_MASTER + " AS b, "
            + TBL_WA_MSG_SETTINGS_MASTER + " AS c"
            + " WHERE a.apikey = ? AND a.userid = b.userid AND b.userid = c.userid AND c.wanumber LIKE ?";

        let values = [apikey, '%' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        //console.log(err);
        next(err);
    }
}

updateDelivery = async (obj, userId, next) => {
    try {
        let query;
        let rows;
        let values;
        let status = obj.statuses[0].status;
        let msgID = obj.statuses[0].id;
        let d = new Date(parseInt(obj.statuses[0].timestamp) * 1000);
        let timestamp = moment(d).format('YYYY-MM-DD HH:mm:ss');

        if (status == 'sent') {
            let sessid = '';
            let billing;
            let pricing_model;
            let submissiontype;
            let wabaCountryCode;
            let wabaCountryCodeNumeric;
            let recipient_id;
            let notificationRate;
            let feedbackRate;
            let responseRate;
            let finalRate;
            let chargeOn;
            let source;

            if (obj.statuses[0].conversation != undefined && obj.statuses[0].conversation.id != undefined) {
                sessid = obj.statuses[0].conversation.id;
                billing = obj.statuses[0].pricing.billable;
                submissiontype = billing == true ? "NOTIFICATION" : "FEEDBACK";
                pricing_model = obj.statuses[0].pricing.pricing_model;
                recipient_id = obj.statuses[0].recipient_id;

                query = "SELECT source FROM " + TBL_MESSAGE_SENT_MASTER + " WHERE messageid = ?";
                values = [msgID];
                rows = await dbpool.query(query, values);
                // //console.log('source======================>'+JSON.stringify(rows[0]));
                source = rows != undefined && rows[0].length>0 ? rows[0][0].source : -1;

                // source = rows[0][0].source;

                if (botUtils.isMobileInternational(recipient_id)) {
                    wabaCountryCode = botUtils.getCountryCode(recipient_id);
                    wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(recipient_id);

                    if (source == 0) {
                        query = "SELECT IFNULL((SELECT notification_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                            "(SELECT notification_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate";
                        values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                        rows = await dbpool.query(query, values);
                        notificationRate = rows[0][0].notification_rate;
                        feedbackRate = 0;

                        finalRate = billing == true ? notificationRate : feedbackRate;
                    }
                    else if (source == 1) {
                        query = "SELECT chargeon_flag_api FROM " + TBL_USERS_MASTER + " WHERE userid = ?";
                        values = [userId];
                        rows = await dbpool.query(query, values);

                        chargeOn = rows[0][0].chargeon_flag_api;
                        // //console.log(chargeOn);

                        if (chargeOn == 1) {
                            query = "SELECT IFNULL((SELECT notification_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT notification_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate," +
                                "IFNULL((SELECT feedback_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT feedback_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS feedback_rate," +
                                "IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric,
                                wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric,
                                wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = rows[0][0].notification_rate;
                            feedbackRate = rows[0][0].feedback_rate;
                            responseRate = rows[0][0].response_rate;
                        }
                        else if (chargeOn == 2) {
                            query = "SELECT IFNULL((SELECT notification_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT notification_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate," +
                                "IFNULL((SELECT feedback_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT feedback_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS feedback_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric, wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = rows[0][0].notification_rate;
                            feedbackRate = rows[0][0].feedback_rate;
                            responseRate = 0;
                        }
                        else if (chargeOn == 3) {
                            query = "SELECT IFNULL((SELECT notification_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT notification_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate," +
                                "IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric, wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = rows[0][0].notification_rate;
                            feedbackRate = 0;
                            responseRate = rows[0][0].response_rate;
                        }
                        else if (chargeOn == 4) {
                            query = "SELECT IFNULL((SELECT feedback_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT feedback_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS feedback_rate," +
                                "IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric, wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = 0;
                            feedbackRate = rows[0][0].feedback_rate;
                            responseRate = rows[0][0].response_rate;
                        }
                        else if (chargeOn == 5) {
                            query = "SELECT IFNULL((SELECT notification_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT notification_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = rows[0][0].notification_rate;
                            feedbackRate = 0;
                            responseRate = 0;
                        }
                        else if (chargeOn == 6) {
                            query = "SELECT IFNULL((SELECT feedback_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT feedback_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS feedback_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = 0;
                            feedbackRate = rows[0][0].feedback_rate;
                            responseRate = 0;
                        }
                        else if (chargeOn == 7) {
                            query = "SELECT IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = 0;
                            feedbackRate = 0;
                            responseRate = rows[0][0].response_rate;
                        }

                        finalRate = billing == true ? notificationRate : feedbackRate;
                    }
                }
            }
            query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, sessid = ?, sentdt = ?, billing = ?, pricing_model = ?, submissiontype = ?, countrycode = ?, rate = ?, billingdt = IF(billingdt IS NULL, ?, billingdt) WHERE messageid = ?";
            values = [0, sessid, timestamp, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, msgID];
            rows = await dbpool.query(query, values);
            // //console.log('sent status('+msgID+'):'+JSON.stringify(rows[0]));
        }
        if (status == 'delivered') {
            let sessid = '';
            let billing;
            let pricing_model;
            let submissiontype;
            let wabaCountryCode;
            let wabaCountryCodeNumeric;
            let recipient_id;
            let notificationRate;
            let feedbackRate;
            let responseRate;
            let finalRate;
            let chargeOn;
            let source;

            if (obj.statuses[0].conversation != undefined && obj.statuses[0].conversation.id != undefined) {
                sessid = obj.statuses[0].conversation.id;
                billing = obj.statuses[0].pricing.billable;
                submissiontype = billing == true ? "NOTIFICATION" : "FEEDBACK";
                pricing_model = obj.statuses[0].pricing.pricing_model;
                recipient_id = obj.statuses[0].recipient_id;

                query = "SELECT source FROM " + TBL_MESSAGE_SENT_MASTER + " WHERE messageid = ?";
                values = [msgID];
                rows = await dbpool.query(query, values);
                // //console.log('delivery rows source : '+JSON.stringify(rows[0][0])+', for message id:'+msgID);
                if (rows[0][0] != undefined && rows[0][0].source != undefined) {
                    source = rows[0][0].source;
                }

                if (botUtils.isMobileInternational(recipient_id)) {
                    wabaCountryCode = botUtils.getCountryCode(recipient_id);
                    wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(recipient_id);

                    if (source == 0) {
                        query = "SELECT IFNULL((SELECT notification_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                            "(SELECT notification_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate";
                        values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                        rows = await dbpool.query(query, values);
                        notificationRate = rows[0][0].notification_rate;
                        feedbackRate = 0;

                        finalRate = billing == true ? notificationRate : feedbackRate;
                    }
                    else if (source == 1) {
                        query = "SELECT chargeon_flag_api FROM " + TBL_USERS_MASTER + " WHERE userid = ?";
                        values = [userId];
                        rows = await dbpool.query(query, values);

                        chargeOn = rows[0][0].chargeon_flag_api;
                        // //console.log(chargeOn);

                        if (chargeOn == 1) {
                            query = "SELECT IFNULL((SELECT notification_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT notification_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate," +
                                "IFNULL((SELECT feedback_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT feedback_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS feedback_rate," +
                                "IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric,
                                wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric,
                                wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = rows[0][0].notification_rate;
                            feedbackRate = rows[0][0].feedback_rate;
                            responseRate = rows[0][0].response_rate;
                        }
                        else if (chargeOn == 2) {
                            query = "SELECT IFNULL((SELECT notification_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT notification_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate," +
                                "IFNULL((SELECT feedback_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT feedback_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS feedback_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric, wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = rows[0][0].notification_rate;
                            feedbackRate = rows[0][0].feedback_rate;
                            responseRate = 0;
                        }
                        else if (chargeOn == 3) {
                            query = "SELECT IFNULL((SELECT notification_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT notification_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate," +
                                "IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric, wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = rows[0][0].notification_rate;
                            feedbackRate = 0;
                            responseRate = rows[0][0].response_rate;
                        }
                        else if (chargeOn == 4) {
                            query = "SELECT IFNULL((SELECT feedback_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT feedback_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS feedback_rate," +
                                "IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric, wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = 0;
                            feedbackRate = rows[0][0].feedback_rate;
                            responseRate = rows[0][0].response_rate;
                        }
                        else if (chargeOn == 5) {
                            query = "SELECT IFNULL((SELECT notification_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT notification_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS notification_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = rows[0][0].notification_rate;
                            feedbackRate = 0;
                            responseRate = 0;
                        }
                        else if (chargeOn == 6) {
                            query = "SELECT IFNULL((SELECT feedback_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT feedback_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS feedback_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = 0;
                            feedbackRate = rows[0][0].feedback_rate;
                            responseRate = 0;
                        }
                        else if (chargeOn == 7) {
                            query = "SELECT IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                                "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate";
                            values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                            rows = await dbpool.query(query, values);
                            notificationRate = 0;
                            feedbackRate = 0;
                            responseRate = rows[0][0].response_rate;
                        }

                        finalRate = billing == true ? notificationRate : feedbackRate;
                    }
                }
            }
            query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, sessid = ?, dlvrddt = ?, billing = ?, pricing_model = ?, submissiontype = ?, countrycode = ?, rate = ?, billingdt = IF(billingdt IS NULL, ?, billingdt) WHERE messageid = ?";
            values = [1, sessid, timestamp, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, msgID];
            rows = await dbpool.query(query, values);
            // //console.log('delivered status('+msgID+'):'+JSON.stringify(rows[0]));
        }
        if (status == 'read') {
            query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, readdt = ?, billingdt = IF(billingdt IS NULL, ?, billingdt) WHERE messageid = ?";
            values = [2, timestamp, timestamp, msgID];
            rows = await dbpool.query(query, values);
            // //console.log('read status('+msgID+'):'+JSON.stringify(rows[0]));
        }
        if (status == 'failed') {
            let errorCode = obj.statuses[0].errors[0].code;
            let errorDesc = obj.statuses[0].errors[0].title;
            query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, errcode = ?, errdesc = ?, faileddt = ?, billingdt = IF(billingdt IS NULL, ?, billingdt) WHERE messageid = ?";
            values = [3, errorCode, errorDesc, timestamp, timestamp, msgID];
            rows = await dbpool.query(query, values);
            // //console.log('failed status('+msgID+'):'+JSON.stringify(rows[0]));
        }
        if (status == 'deleted') {
            query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, deletedt = ?, isdeleted = ?, billingdt = IF(billingdt IS NULL, ?, billingdt) WHERE messageid = ?";
            values = [4, timestamp, 1, timestamp, msgID];
            rows = await dbpool.query(query, values);
            // //console.log('deleted status('+msgID+'):'+JSON.stringify(rows[0]));
        }

        next(null, rows[0]);
    }
    catch (err) {
        //console.log(err);
        next(err);
    }
}

getReplyMessage = async (message, wanumber, next) => {
    try {
        let query = "SELECT auto_response," +
            " (SELECT stopword FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE stopword IN (LOWER(?)) AND wanumber=M.wanumber) AS stopword," +
            " (SELECT unsubmsg FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE stopword IN (LOWER(?)) AND wanumber=M.wanumber) AS unsubmsg," +
            " (SELECT resubword FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE resubword IN (LOWER(?)) AND wanumber=M.wanumber) AS resubword," +
            " (SELECT resubmsg FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE resubword IN (LOWER(?)) AND wanumber=M.wanumber) AS resubmsg" +
            " FROM " + TBL_WA_MSG_SETTINGS_MASTER + " AS M" +
            " WHERE wanumber LIKE ?";

        let values = [message, message, message, message, '%' + wanumber];
        let rows = await dbpool.query(query, values);
        console.log('GET REPLY MESSAGE =======================>'+JSON.stringify(rows[0]));
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

updateSubscription = async (wanumber, subflag, wabanumber, subkeyword, unsubkeyword, next) => {
    try {
        //console.log('updateSubscription : ' + wanumber, subflag, wabanumber, subkeyword, unsubkeyword);
        let query = "INSERT INTO " + TBL_SUBSCRIPTION_MASTER + " (wanumber, subflag, wabanumber, subkeyword, unsubkeyword)" +
            " VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE subflag = ?, subkeyword = ?, unsubkeyword = ?";

        let values = [wanumber, subflag, wabanumber, subkeyword, unsubkeyword, subflag, subkeyword, unsubkeyword];
        let rows = await dbpool.query(query, values);
        //console.log('updateSubscription insert: ' + JSON.stringify(rows));
        next(null, rows[0]);
    }
    catch (err) {
        //console.log('updateSubscription err: ' + err);
        next(err);
    }
}

getResponseRate = async (recipient_id, userId, next) => {
    try {
        let query;
        let values;
        let rows;
        let responseRate;

        if (botUtils.isMobileInternational(recipient_id)) {
            let wabaCountryCode = botUtils.getCountryCode(recipient_id);
            let wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(recipient_id);

            query = "SELECT chargeon_flag_api FROM " + TBL_USERS_MASTER + " WHERE userid = ?";
            values = [userId];
            rows = await dbpool.query(query, values);

            let chargeOn = rows[0][0].chargeon_flag_api;

            if (chargeOn == 1 || chargeOn == 3 || chargeOn == 4 || chargeOn == 7) {
                query = "SELECT IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                    "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate";
                values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                rows = await dbpool.query(query, values);
                responseRate = rows[0][0].response_rate;
            }
            else {
                responseRate = 0;
            }

            let objData = {
                rate: responseRate,
                countrycode: wabaCountryCodeNumeric
            }
            next(null, objData);
        }
    }
    catch (err) {
        next(err);
    }
}

module.exports = {
    validateApiKey,
    updateDelivery,
    getReplyMessage,
    updateSubscription,
    getResponseRate
}