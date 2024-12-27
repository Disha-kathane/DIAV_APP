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


validatewanumber = async (wabaNumber, next) => {
    try {
        let query = "SELECT  b.userid, b.userstatus, c.waurl, c.wa_msg_setting_id, c.wanumber, c.authtoken, c.islivechat, c.livechatwebhook, c.custom_callback, c.isactivepinbotflow, c.custom_parameters FROM " +
            TBL_USERS_MASTER + " AS b, " +
            TBL_WA_MSG_SETTINGS_MASTER + " AS c" +
            " WHERE b.wanumberid = c.wa_msg_setting_id AND c.wanumber = ?";

        let values = ["+" + wabaNumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};


updateDelivery = async (obj, userId, next) => {
    try {
        console.log('UPDATE_DELIVERY : ' + JSON.stringify(obj) + ", USERID : " + userId);
        let query;
        let rows;
        let values;
        let status = obj.statuses[0].status;
        let msgID = obj.statuses[0].id;
        let d = null;
        let timestamp = null;

        if (obj.statuses[0].timestamp.length == 10) {
            d = new Date(parseInt(obj.statuses[0].timestamp) * 1000);
            timestamp = moment(d).format('YYYY-MM-DD HH:mm:ss');
        } else if (obj.statuses[0].timestamp.length == 13) {
            d = new Date(parseInt(obj.statuses[0].timestamp));
            timestamp = moment(d).format('YYYY-MM-DD HH:mm:ss');
        }

        if (status == 'sent' || status == 'delivered' || status == 'read') {
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
            let finalRate = 0;
            let chargeOn;
            let source;

            let businessInitiatedRate;
            let userInitiatedRate;

            let pinnacleBusinessInitiatedRate;
            let pinnacleUserInitiatedRate;

            let outgoingRate;

            let category;
            let deliveryStatus = 0;

            let expiration_timestamp = null;

            let isPinnaclePlatformFeeApplicable = 0;
            let category_id = 0;
            let isConversationBased = 0;

            if (obj.statuses[0].conversation != undefined && obj.statuses[0].conversation.id != undefined) {


                if (status == 'sent') {
                    sessid = obj.statuses[0].conversation.id;
                    billing = obj.statuses[0].pricing.billable;
                    category = obj.statuses[0].pricing.category;
                    // submissiontype = billing == true ? "NOTIFICATION" : "FEEDBACK";
                    pricing_model = obj.statuses[0].pricing.pricing_model;
                    recipient_id = obj.statuses[0].recipient_id;
                    deliveryStatus = 0;
                    let exp_d = new Date(parseInt(obj.statuses[0].conversation.expiration_timestamp) * 1000);
                    expiration_timestamp = moment(exp_d).format('YYYY-MM-DD HH:mm:ss');

                    query = "SELECT COUNT(1) AS C FROM " + TBL_MESSAGE_SENT_MASTER + " WHERE sessid = ?";
                    values = [sessid];
                    rows = await dbpool.query(query, values);
                    console.log('SENT SELECT COUNT(1) AS C (' + obj.statuses[0].recipient_id + ') (' + msgID + ')::' + JSON.stringify(rows[0]));
                    isPinnaclePlatformFeeApplicable = rows[0][0].C;
                    submissiontype = isPinnaclePlatformFeeApplicable == 0 && category != 'user_initiated' ? "NOTIFICATION" : "FEEDBACK";
                }
                else if (status == 'delivered') {
                    sessid = obj.statuses[0].conversation.id;
                    billing = obj.statuses[0].pricing.billable;
                    category = obj.statuses[0].pricing.category;
                    // submissiontype = billing == true ? "NOTIFICATION" : "FEEDBACK";
                    pricing_model = obj.statuses[0].pricing.pricing_model;
                    recipient_id = obj.statuses[0].recipient_id;
                    deliveryStatus = 1;

                    query = "SELECT COUNT(1) AS C FROM " + TBL_MESSAGE_SENT_MASTER + " WHERE sessid = ?";
                    values = [sessid];
                    rows = await dbpool.query(query, values);
                    console.log('DELIVERED SELECT COUNT(1) AS C (' + obj.statuses[0].recipient_id + ') (' + msgID + ')::' + JSON.stringify(rows[0]));
                    isPinnaclePlatformFeeApplicable = rows[0][0].C;
                    submissiontype = isPinnaclePlatformFeeApplicable == 0 && category != 'user_initiated' ? "NOTIFICATION" : "FEEDBACK";
                }
                else if (status == 'read' && obj.statuses[0].pricing != undefined) {
                    sessid = obj.statuses[0].conversation.id;
                    billing = obj.statuses[0].pricing.billable;
                    category = obj.statuses[0].pricing.category;
                    // submissiontype = billing == true ? "NOTIFICATION" : "FEEDBACK";
                    pricing_model = obj.statuses[0].pricing.pricing_model;
                    recipient_id = obj.statuses[0].recipient_id;
                    deliveryStatus = 2;

                    query = "SELECT COUNT(1) AS C FROM " + TBL_MESSAGE_SENT_MASTER + " WHERE sessid = ?";
                    values = [sessid];
                    rows = await dbpool.query(query, values);
                    console.log('READ SELECT COUNT(1) AS C (' + obj.statuses[0].recipient_id + ') (' + msgID + ')::' + JSON.stringify(rows[0]));
                    isPinnaclePlatformFeeApplicable = rows[0][0].C;
                    submissiontype = isPinnaclePlatformFeeApplicable == 0 && category != 'user_initiated' ? "NOTIFICATION" : "FEEDBACK";
                }
                else if (status == 'read') {
                    deliveryStatus = 2;
                }

                if (botUtils.isMobileInternational(recipient_id)) {
                    wabaCountryCode = botUtils.getCountryCode(recipient_id);
                    wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(recipient_id);

                    query = "SELECT IFNULL((SELECT bic_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                        "(SELECT bic_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS bic_rate," +
                        "IFNULL((SELECT uic_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                        "(SELECT uic_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS uic_rate," +
                        "IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                        "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate," +
                        "(SELECT bic_pin_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?) AS bic_pin_rate," +
                        "(SELECT uic_pin_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?) AS uic_pinnacle_rate," +
                        "IFNULL((SELECT feedback_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
                        "(SELECT feedback_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS feedback_rate";
                    values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric,
                        wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric,
                        wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric, wabaCountryCodeNumeric, wabaCountryCodeNumeric,
                        wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
                    rows = await dbpool.query(query, values);
                    console.log('SELECT RATE (' + obj.statuses[0].recipient_id + ') (' + msgID + ')::' + JSON.stringify(rows[0]));
                    businessInitiatedRate = rows[0][0].bic_rate;
                    userInitiatedRate = rows[0][0].uic_rate;
                    responseRate = rows[0][0].response_rate;
                    pinnacleBusinessInitiatedRate = rows[0][0].bic_pin_rate;
                    pinnacleUserInitiatedRate = rows[0][0].uic_pinnacle_rate;
                    outgoingRate = rows[0][0].feedback_rate;

                    finalBICRate = parseFloat(businessInitiatedRate) + parseFloat(outgoingRate);
                    finalUICRate = parseFloat(userInitiatedRate) + parseFloat(outgoingRate);

                    if (category == 'business_initiated') {
                        finalRate = isPinnaclePlatformFeeApplicable > 0 ? outgoingRate : finalBICRate;
                        category_id = 1;
                    }
                    else if (category == 'user_initiated') {
                        finalRate = isPinnaclePlatformFeeApplicable > 0 ? outgoingRate : finalUICRate;
                        category_id = 2;
                    }
                    else if (category == 'referral_conversion') {
                        finalRate = pinnacleUserInitiatedRate;
                        category_id = 3;
                    }

                    query = "SELECT account_type, billing_type, free_conversation, is_free_conversation, balance_amt FROM " + TBL_USERS_MASTER +
                        " WHERE userid = ?";
                    values = [userId];
                    rows = await dbpool.query(query, values);
                    console.log('SELECT account_type (' + obj.statuses[0].recipient_id + ') (' + msgID + ')::' + JSON.stringify(rows[0]));
                    let accountType = rows[0][0].account_type;                  //0- postpaid, 1- prepaid
                    let billingType = rows[0][0].billing_type;                  //1- transaction based, 2 - conversation based
                    let freeConversation = rows[0][0].free_conversation;        //1000 free conversations
                    let isFreeConversation = rows[0][0].is_free_conversation;   //0-no free tier,1-free tier
                    let balanceAmt = rows[0][0].balance_amt;                    //user account balance


                    if ((accountType == 0 || accountType == 1) && isFreeConversation == 1 && billingType == 2 && freeConversation > 0) {
                        // covnersation based
                        isConversationBased = 1;

                        // finalRate = 0;
                        finalRate = outgoingRate;
                        category_id = 4;
                        category = category + '_free_tier';
                    }
                    else if ((accountType == 0 || accountType == 1) && isFreeConversation == 1 && billingType == 1 && freeConversation > 0) {
                        // transaction based
                        // isConversationBased = 2;
                        isConversationBased = 1;

                        // finalRate = 0;
                        finalRate = outgoingRate;
                        category_id = 4;
                        category = category + '_free_tier';
                    }

                    if (status == 'sent') {
                        console.log('isPinnaclePlatformFeeApplicable = ' + isPinnaclePlatformFeeApplicable + ', isConversationBased = ' + isConversationBased + ', freeConversation = ' + freeConversation + ', USERID : ' + userId + ', recipient_id : ' + obj.statuses[0].recipient_id);
                        if (isPinnaclePlatformFeeApplicable == 0 && isConversationBased == 1 && freeConversation > 0) {
                            // query = "UPDATE " + TBL_USERS_MASTER + " SET free_conversation = free_conversation - ? WHERE userid = ?";
                            query = "UPDATE " + TBL_USERS_MASTER + " SET free_conversation = (CASE WHEN free_conversation > 0 THEN free_conversation - ? ELSE 0 END)," +
                                " is_free_conversation = (CASE WHEN free_conversation > 0 THEN 1 ELSE 0 END) WHERE userid = ?";
                            values = [1, userId];
                            rows = await dbpool.query(query, values);
                            console.log('UPDT_1 (' + obj.statuses[0].recipient_id + ') (' + msgID + ')::' + JSON.stringify(rows[0]));
                        }
                        else if (isPinnaclePlatformFeeApplicable > 0 && isConversationBased == 1 && freeConversation > 0) {
                            // query = "UPDATE " + TBL_USERS_MASTER + " SET free_conversation = free_conversation - ? WHERE userid = ?";
                            // values = [1, userId];
                            // rows = await dbpool.query(query, values);
                        }
                        else if (isConversationBased == 2 && freeConversation > 0) {
                            // query = "UPDATE " + TBL_USERS_MASTER + " SET free_conversation = free_conversation - ? WHERE userid = ?";
                            query = "UPDATE " + TBL_USERS_MASTER + " SET free_conversation = (CASE WHEN free_conversation > 0 THEN free_conversation - ? ELSE 0 END)," +
                                " is_free_conversation = (CASE WHEN free_conversation > 0 THEN 1 ELSE 0 END) WHERE userid = ?";
                            values = [1, userId];
                            rows = await dbpool.query(query, values);
                            console.log('UPDT_2 (' + obj.statuses[0].recipient_id + ') (' + msgID + ')::' + JSON.stringify(rows[0]));
                        }
                        else if (accountType == 1) {
                            query = "UPDATE " + TBL_USERS_MASTER + " SET balance_amt = balance_amt - ?, is_free_conversation = ? WHERE userid = ?";
                            values = [finalRate, 0, userId];
                            rows = await dbpool.query(query, values);
                            console.log('UPDT_3 (' + obj.statuses[0].recipient_id + ') (' + msgID + ')::' + JSON.stringify(rows[0]));
                        }
                    }
                    else if (status == 'delivered' || status == 'read') {
                        console.log('isPinnaclePlatformFeeApplicable = ' + isPinnaclePlatformFeeApplicable + ', isConversationBased = ' + isConversationBased + ', freeConversation = ' + freeConversation + ', USERID : ' + userId + ', recipient_id : ' + obj.statuses[0].recipient_id);

                        query = "SELECT category FROM " + TBL_MESSAGE_SENT_MASTER + " WHERE messageid = ?";
                        values = [msgID];
                        rows = await dbpool.query(query, values);
                        console.log('SELECT category (' + obj.statuses[0].recipient_id + ') (' + msgID + ')::' + JSON.stringify(rows[0]));
                        console.log('SUBMISSION_TYPE : ' + JSON.stringify(rows[0][0]));
                        if (rows[0][0] != undefined && rows[0][0].category == category + '_free_tier') {
                            // finalRate = 0;
                            finalRate = outgoingRate;
                            category_id = 4;
                            category = category + '_free_tier';
                        }
                    }
                }
            }


            if (status == 'sent') {
                // if(category!=undefined && category.includes('free_tier')){
                //     finalRate = 0;
                // }

                console.log('FINAL_RATE SENT = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, sessid = ?, sentdt = ?, billing = ?, pricing_model = ?, submissiontype = ?, countrycode = ?, rate = ?, billingdt = ?, category = ?, expiration_timestamp = ?, category_id = ?, errcode = NULL, errdesc = NULL WHERE messageid = ?";
                values = [0, sessid, timestamp, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, category, expiration_timestamp, category_id, msgID];
                rows = await dbpool.query(query, values);
                console.log('SENT_CALLBACK_LOGS_1(' + obj.statuses[0].recipient_id + '):' + JSON.stringify(values));
                console.log('SENT_CALLBACK_LOGS_1(' + obj.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
            }
            else if (status == 'delivered') {
                // if(category!=undefined && category.includes('free_tier')){
                //     finalRate = 0;
                // }

                console.log('FINAL_RATE DELIVERED = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                if (submissiontype == null) {
                    query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, dlvrddt = IF(dlvrddt IS NULL, ?, dlvrddt), errcode = NULL, errdesc = NULL, billingdt = ? WHERE messageid = ?";
                    values = [1, timestamp, timestamp, msgID];
                    rows = await dbpool.query(query, values);
                } else {
                    query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, sessid = ?, dlvrddt = IF(dlvrddt IS NULL, ?, dlvrddt), billing = ?, pricing_model = ?, submissiontype = (CASE WHEN submissiontype IS NULL THEN ? ELSE submissiontype END), countrycode = ?, rate = (CASE WHEN rate IS NULL THEN ? ELSE rate END), billingdt = ?, category = ?, category_id = ?, errcode = NULL, errdesc = NULL WHERE messageid = ?";
                    values = [1, sessid, timestamp, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, category, category_id, msgID];
                    rows = await dbpool.query(query, values);
                    console.log('DELIVERED_CALLBACK_LOGS_1(' + obj.statuses[0].recipient_id + '):' + JSON.stringify(values));
                }
                console.log('DELIVERED_CALLBACK_LOGS_1(' + obj.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
            }
            else if (status == 'read' && obj.statuses[0].pricing != undefined) {
                // if(category!=undefined && category.includes('free_tier')){
                //     finalRate = 0;
                // }

                console.log('FINAL_RATE READ = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, sessid = ?, readdt = ?, billing = ?, pricing_model = ?, submissiontype = (CASE WHEN submissiontype IS NULL THEN ? ELSE submissiontype END), countrycode = ?, rate = (CASE WHEN rate IS NULL THEN ? ELSE rate END), billingdt = ?, category = ?, category_id = ?, errcode = NULL, errdesc = NULL, dlvrddt = IF(dlvrddt IS NULL, ?, dlvrddt) WHERE messageid = ?";
                values = [2, sessid, timestamp, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, category, category_id, timestamp, msgID];
                rows = await dbpool.query(query, values);
                console.log('READ_CALLBACK_LOGS_1(' + obj.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
            }
            else if (status == 'read') {
                // if(category!=undefined && category.includes('free_tier')){
                //     finalRate = 0;
                // }

                console.log('FINAL_RATE READ = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, readdt = ?, billingdt = ?, errcode = NULL, errdesc = NULL, dlvrddt = IF(dlvrddt IS NULL, ?, dlvrddt) WHERE messageid = ?";
                values = [2, timestamp, timestamp, timestamp, msgID];
                rows = await dbpool.query(query, values);
                console.log('READ_CALLBACK_LOGS_2(' + obj.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
            }
        }
        if (status == 'failed') {
            let errorCode = obj.statuses[0].errors[0].code;
            let errorDesc = obj.statuses[0].errors[0].title;
            query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, errcode = ?, errdesc = ?, faileddt = ?, billingdt = ? WHERE messageid = ?";
            values = [3, errorCode, errorDesc, timestamp, timestamp, msgID];
            rows = await dbpool.query(query, values);
            console.log('failed status(' + msgID + '):' + JSON.stringify(rows[0]));
        }
        if (status == 'deleted') {
            query = "UPDATE " + TBL_MESSAGE_SENT_MASTER + " SET readstatus = ?, deletedt = ?, isdeleted = ?, billingdt = ? WHERE messageid = ?";
            values = [4, timestamp, 1, timestamp, msgID];
            rows = await dbpool.query(query, values);
            console.log('deleted status(' + msgID + '):' + JSON.stringify(rows[0]));
        }

        next(null, rows[0]);
    }
    catch (err) {
        console.log('updateDelivery error=======================>' + err);
        console.log(err);
        next(err);
    }
};


updateSubscription = async (wanumber, subflag, wabanumber, subkeyword, unsubkeyword, next) => {
    try {
        console.log('updateSubscription : ' + wanumber, subflag, wabanumber, subkeyword, unsubkeyword);
        let query = "INSERT INTO " + TBL_SUBSCRIPTION_MASTER + " (wanumber, subflag, wabanumber, subkeyword, unsubkeyword)" +
            " VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE subflag = ?, subkeyword = ?, unsubkeyword = ?";

        let values = [wanumber, subflag, wabanumber, subkeyword, unsubkeyword, subflag, subkeyword, unsubkeyword];
        let rows = await dbpool.query(query, values);
        //console.log('updateSubscription insert: ' + JSON.stringify(rows));
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);

    }
};

getResponseRate = async (recipient_id, userId, wanumber, next) => {
    try {
        let query = null;
        let values = null;
        let rows = null;
        let responseRate = null;
        let balance_amt = null;

        let wabaCountryCode = botUtils.getCountryCode(recipient_id);
        let wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(recipient_id);

        query = "SELECT chargeon_flag_api FROM " + TBL_USERS_MASTER + " WHERE userid = ?";
        values = [userId];
        rows = await dbpool.query(query, values);

        let chargeOn = rows[0][0].chargeon_flag_api;


        query = "SELECT IFNULL((SELECT response_rate FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE countrycode = ? AND userid = ?)," +
            "(SELECT response_rate FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode = ?)) AS response_rate";
        values = [wabaCountryCodeNumeric, userId, wabaCountryCodeNumeric];
        rows = await dbpool.query(query, values);
        responseRate = rows[0][0].response_rate;

        console.log('getResponseRate -------------' + recipient_id + '----------------------> : ' + JSON.stringify(rows[0][0]));


        console.log({ wanumber });

        query = "SELECT b.userid, b.balance_amt, b.billing_type, b.account_type, b.free_conversation, b.is_free_conversation FROM " + TBL_WA_MSG_SETTINGS_MASTER + " AS a INNER JOIN " + TBL_USERS_MASTER + " AS b ON a.wa_msg_setting_id = b.wanumberid AND a.wanumber = ?";
        values = [wanumber];
        rows = await dbpool.query(query, values);
        let billing_type = rows[0][0].billing_type;
        let account_type = rows[0][0].account_type;
        console.log({ billing_type, account_type });


        if (account_type === 1) {
            responseRate = billing_type === 1 ? responseRate : 0;
            console.log('PREPAID RESPONSE RATE ======================================================> ' + userId + ' ' + responseRate + ' ' + recipient_id);
            query = 'UPDATE ' + TBL_USERS_MASTER + ' SET balance_amt = balance_amt - ? WHERE userid = ?';
            console.log('UPDATE ezb_users SET balance_amt = ' + balance_amt + ' WHERE userid = ' + userId + ', responseRate = ' + responseRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
            values = [responseRate, userId];
            rows = await dbpool.query(query, values);
            console.log(JSON.stringify(rows[0]));
        }
        else if (account_type === 0) {
            responseRate = billing_type === 1 ? responseRate : 0;
            console.log('POSTPAID RESPONSE RATE ======================================================> ' + userId + ' ' + responseRate + ' ' + recipient_id);

        }
        else {
            console.log('No account type and billing details found');
        }

        let objData = {
            rate: responseRate,
            countrycode: wabaCountryCodeNumeric
        };
        next(null, objData);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

getReplyMessage = async (message, wanumber, next) => {

    try {
        console.log({ message, wanumber });
        let query = "SELECT auto_response, userid, hsmname, auto_response_flag, flowid," +
            " (SELECT stopword FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE FIND_IN_SET(?,stopword) > 0 AND wanumber=M.wanumber) AS stopword," +
            " (SELECT unsubmsg FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE FIND_IN_SET(?,stopword) > 0  AND wanumber=M.wanumber) AS unsubmsg," +
            " (SELECT resubword FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE FIND_IN_SET(?,resubword) > 0  AND wanumber=M.wanumber) AS resubword," +
            " (SELECT resubmsg FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE FIND_IN_SET(?,resubword) > 0  AND wanumber=M.wanumber) AS resubmsg" +
            " FROM " + TBL_WA_MSG_SETTINGS_MASTER + " AS M" +
            " WHERE wanumber = ?";

        let values = [message, message, message, message, wanumber];
        let rows = await dbpool.query(query, values);
        console.log('GET REPLY MESSAGE =======================>' + JSON.stringify(rows[0]));
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

downloadCloudMedia = async (url, SystemAccessToken, next) => {

    const instanceUrl = url;
    const httpMethod = 0;
    const requestType = 0;
    const apiHeaders = [
        {
            'headerName': 'Authorization',
            'headerVal': 'Bearer ' + SystemAccessToken
        },
        {
            'headerName': 'Content-Type',
            'headerVal': 'application/json'
        }
    ];


    await botUtils.downloadWhatsappMediaCloud(instanceUrl, apiHeaders)
        .then((response) => {
            // console.log(response);
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });
};

storeContactPayloadLogs = async (obj, msgID, type, next) => {
    let query = "INSERT INTO ezb_old_callbacks_logs(payload, messageid, logdate, type) VALUES(?,?,DATE(NOW()),?)";
    let values = [JSON.stringify(obj), msgID, type];
    let rows = await dbpool.query(query, values);
    next(null, rows[0]);
};

module.exports = {
    validatewanumber,
    updateDelivery,
    updateSubscription,
    getResponseRate,
    getReplyMessage,
    downloadCloudMedia,
    storeContactPayloadLogs
};