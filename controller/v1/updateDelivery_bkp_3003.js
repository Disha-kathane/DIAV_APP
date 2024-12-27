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

updateDelivery = async (job, next) => {
    console.log('====================================================================> + UPDATE DELIVERY PRODUCTION');
    try {
        console.log(JSON.stringify(job.data));
        let query = null;
        let rows = null;
        let values = null;
        let status = job.data.entry[0].changes[0].value.statuses[0].status;
        let msgId = job.data.entry[0].changes[0].value.statuses[0].id;
        let d = null;
        let timestamp = null;
        let recipient_id = null;

        if (job.data.entry[0].changes[0].value.statuses[0].timestamp.length === 10) {
            d = new Date(parseInt(job.data.entry[0].changes[0].value.statuses[0].timestamp) * 1000);
            timestamp = moment(d).format('YYYY-MM-DD HH:mm:ss');
        } else if (job.data.entry[0].changes[0].value.statuses[0].timestamp.length === 13) {
            d = new Date(parseInt(job.data.entry[0].changes[0].value.statuses[0].timestamp));
            timestamp = moment(d).format('YYYY-MM-DD HH:mm:ss');
        }

        let userId = null;
        let free_conversation = null;
        let is_free_conversation = null;
        let balance_amt = null;
        let billing_type = null;
        let account_type = null;
        let wanumber = job.data.entry[0].changes[0].value.metadata.display_phone_number;
        let phoneNumberId = job.data.entry[0].changes[0].value.metadata.phone_number_id;
        recipient_id = job.data.entry[0].changes[0].value.statuses[0].recipient_id;
        query = 'SELECT b.userid, b.balance_amt, b.billing_type, b.account_type, b.free_conversation, b.is_free_conversation FROM ' + TBL_WA_MSG_SETTINGS_MASTER + ' AS a INNER JOIN ' + TBL_USERS_MASTER + ' AS b ON a.userid = b.userid AND a.wanumber = ?';
        values = ['+' + wanumber];
        rows = await pool.query(query, values);
        console.log(JSON.stringify(rows[0]));

        userId = rows[0][0].userid;
        free_conversation = rows[0][0].free_conversation;
        is_free_conversation = rows[0][0].is_free_conversation;
        balance_amt = rows[0][0].balance_amt;
        billing_type = rows[0][0].billing_type;
        account_type = rows[0][0].account_type;

        console.log('USER : (' + job.data.entry[0].changes[0].value.metadata.display_phone_number + ')::' + JSON.stringify(rows[0]));

        if (status === 'sent' || status === 'delivered' || status === 'read') {
            let sessid = null;
            let billing = null;
            let pricing_model = null;
            let submissiontype = null;
            let wabaCountryCode = null;
            let wabaCountryCodeNumeric = null;
            let notificationRate = 0;
            let feedbackRate = 0;
            let responseRate = null;
            let finalRate = null;
            let chargeOn = null;
            let source = null;


            let businessInitiatedRate = 0;
            let userInitiatedRate = 0;

            let pinnacleBusinessInitiatedRate = 0;
            let pinnacleUserInitiatedRate = 0;

            let outgoingRate = 0;

            let category = null;
            let deliveryStatus = 0;

            let expiration_timestamp = null;

            let isSessIdExists = 0;
            let category_id = 0;
            let isConversationBased = 0;


            // recipient_id = job.data.entry[0].changes[0].value.statuses[0].recipient_id;
            // console.log({ recipient_id });

            if (job.data.entry[0].changes[0].value.statuses[0].conversation !== undefined && job.data.entry[0].changes[0].value.statuses[0].conversation.id !== undefined) {
                if (status === 'sent') {
                    sessid = job.data.entry[0].changes[0].value.statuses[0].conversation.id;
                    billing = job.data.entry[0].changes[0].value.statuses[0].pricing.billable;
                    deliveryStatus = 0;
                    category = job.data.entry[0].changes[0].value.statuses[0].pricing.category;
                    pricing_model = job.data.entry[0].changes[0].value.statuses[0].pricing.pricing_model;
                    // submissiontype = billing = true ? 'NOTIFICATION' : 'FEEDBACK'

                    let exp_d = new Date(parseInt(job.data.entry[0].changes[0].value.statuses[0].conversation.expiration_timestamp) * 1000);
                    expiration_timestamp = moment(exp_d).format('YYYY-MM-DD HH:mm:ss');
                    // console.log(expiration_timestamp)
                    // console.log(deliveryStatus)


                    query = 'SELECT COUNT(1) AS C FROM ' + TBL_MESSAGE_SENT_MASTER + ' WHERE sessid=?';
                    values = [sessid];
                    rows = await pool.query(query, values);
                    console.log('SENT SELECT COUNT(1) AS C (' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + ') (' + msgId + ')::' + JSON.stringify(rows[0]));
                    isSessIdExists = rows[0][0].C;
                    // console.log({ isSessIdExists })
                    submissiontype = isSessIdExists == 0 && category != 'user_initiated' ? "NOTIFICATION" : "FEEDBACK";


                }
                else if (status === 'delivered') {
                    sessid = job.data.entry[0].changes[0].value.statuses[0].conversation.id;
                    billing = job.data.entry[0].changes[0].value.statuses[0].pricing.billable;
                    deliveryStatus = 1;
                    category = job.data.entry[0].changes[0].value.statuses[0].pricing.category;
                    pricing_model = job.data.entry[0].changes[0].value.statuses[0].pricing.pricing_model;
                    // submissiontype = billing = true ? 'NOTIFICATION' : 'FEEDBACK'

                    query = 'SELECT COUNT(1) AS C FROM ' + TBL_MESSAGE_SENT_MASTER + ' WHERE sessid=?';
                    values = [sessid];
                    rows = await pool.query(query, values);
                    console.log('DELIVERED SELECT COUNT(1) AS C (' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + ') (' + msgId + ')::' + JSON.stringify(rows[0]));
                    isSessIdExists = rows[0][0].C;
                    // console.log(isSessIdExists)
                    submissiontype = isSessIdExists == 0 && category != 'user_initiated' ? "NOTIFICATION" : "FEEDBACK";

                }
                else if (status === 'read' && job.data.entry[0].changes[0].value.statuses[0].pricing !== undefined) {
                    sessid = job.data.entry[0].changes[0].value.statuses[0].conversation.id;
                    billing = job.data.entry[0].changes[0].value.statuses[0].pricing.billable;
                    deliveryStatus = 2;
                    category = job.data.entry[0].changes[0].value.statuses[0].pricing.category;
                    pricing_model = job.data.entry[0].changes[0].value.statuses[0].pricing.pricing_model;
                    // submissiontype = billing = true ? 'NOTIFICATION' : 'FEEDBACK'

                    query = 'SELECT COUNT(1) AS C FROM ' + TBL_MESSAGE_SENT_MASTER + ' WHERE sessid=?';
                    values = [sessid];
                    rows = await pool.query(query, values);
                    console.log('READ SELECT COUNT(1) AS C (' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + ') (' + msgId + ')::' + JSON.stringify(rows[0]));
                    isSessIdExists = rows[0][0].C;
                    // console.log(isSessIdExists)
                    submissiontype = isSessIdExists == 0 && category != 'user_initiated' ? "NOTIFICATION" : "FEEDBACK";
                }
                else if (status === 'read') {
                    deliveryStatus = 2;
                }

                query = "SELECT subscriberid FROM " + TBL_MESSAGE_SENT_MASTER + " WHERE messageid = ?";
                values = [msgId];
                rows = await pool.query(query, values);
                subscriberId = rows[0][0] != undefined ? rows[0][0].subscriberid : 0;
                console.log('subscriberId======================>' + subscriberId);

                // recipient_id = job.data.entry[0].changes[0].statuses[0].recipient_id;
                // console.log({recipient_id})
                wabaCountryCode = botUtils.getCountryCode(recipient_id);
                // console.log({ wabaCountryCode })
                wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(recipient_id);
                // console.log({ wabaCountryCodeNumeric })

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
                values = [wabaCountryCodeNumeric, subscriberId > 0 ? subscriberId : userId, wabaCountryCodeNumeric,
                    wabaCountryCodeNumeric, subscriberId > 0 ? subscriberId : userId, wabaCountryCodeNumeric,
                    wabaCountryCodeNumeric, subscriberId > 0 ? subscriberId : userId, wabaCountryCodeNumeric, wabaCountryCodeNumeric, wabaCountryCodeNumeric,
                    wabaCountryCodeNumeric, subscriberId > 0 ? subscriberId : userId, wabaCountryCodeNumeric
                ];
                rows = await pool.query(query, values);
                console.log('SELECT RATE (' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + ') (' + msgId + ')::' + JSON.stringify(rows[0]));
                businessInitiatedRate = rows[0][0].bic_rate != null ? rows[0][0].bic_rate : 0;
                userInitiatedRate = rows[0][0].uic_rate != null ? rows[0][0].uic_rate : 0;
                responseRate = rows[0][0].response_rate != null ? rows[0][0].response_rate : 0;
                pinnacleBusinessInitiatedRate = rows[0][0].bic_pin_rate != null ? rows[0][0].bic_pin_rate : 0;
                pinnacleUserInitiatedRate = rows[0][0].uic_pinnacle_rate != null ? rows[0][0].uic_pinnacle_rate : 0;
                outgoingRate = rows[0][0].feedback_rate != null ? rows[0][0].feedback_rate : 0;

                finalBICRate = parseFloat(businessInitiatedRate) + parseFloat(outgoingRate);
                finalUICRate = parseFloat(userInitiatedRate) + parseFloat(outgoingRate);

                if (category === 'business_initiated') {
                    finalRate = isSessIdExists > 0 ? outgoingRate : finalBICRate;
                    category_id = 1;
                }
                else if (category === 'user_initiated') {
                    finalRate = isSessIdExists > 0 ? outgoingRate : finalUICRate;
                    category_id = 2;
                }
                else if (category === 'referral_conversion') {
                    finalRate = pinnacleUserInitiatedRate;
                    category_id = 3;
                }

                console.log({ businessInitiatedRate, userInitiatedRate, responseRate, pinnacleBusinessInitiatedRate, pinnacleUserInitiatedRate, outgoingRate, finalBICRate, finalUICRate, finalRate, free_conversation, is_free_conversation, billing_type, isSessIdExists });

                if (free_conversation === 0) {
                    query = 'UPDATE ' + TBL_USERS_MASTER + ' SET is_free_conversation = ? WHERE userid = ?';
                    values = [0, userId];
                    rows = await pool.query(query, values);
                    console.log(JSON.stringify(rows[0]));
                };

                if (status === 'sent' && is_free_conversation === 1) {
                    if (isSessIdExists === 0 && free_conversation > 0) {
                        console.log({ free_conversation, is_free_conversation });
                        query = 'UPDATE ' + TBL_USERS_MASTER + ' SET free_conversation = free_conversation - ? WHERE userid = ?';
                        values = [1, userId];
                        rows = await pool.query(query, values);
                        console.log(JSON.stringify(rows[0]));
                        category_id = 4;
                        category = category + '_free_tier';

                        let query1 = 'SELECT free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                        let values1 = [userId];
                        rows = await pool.query(query1, values1);
                        let temp_free_conversation = rows[0][0].free_conversation;
                        console.log({ temp_free_conversation });
                        if (temp_free_conversation === 0) {
                            query = 'UPDATE ' + TBL_USERS_MASTER + ' SET is_free_conversation = 0 WHERE userid = ?';
                            values = [userId];
                            rows = await pool.query(query, values);
                            console.log(JSON.stringify(rows[0]));
                        };

                        //CONVERSATION BASED DEDUCTION BLOCK
                        if (isSessIdExists === 0 && billing_type == 2 && outgoingRate !== null && free_conversation !== 0) {
                            console.log('======================================================> ' + userId + ' ' + outgoingRate + ' ' + recipient_id);
                            console.log({ outgoingRate });
                            finalRate = outgoingRate;
                            query = 'UPDATE ' + TBL_USERS_MASTER + ' SET balance_amt = balance_amt - ? WHERE userid = ?';
                            console.log('UPDATE ezb_users SET balance_amt = ' + balance_amt + ' WHERE userid = ' + userId + ', finalRate = ' + outgoingRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                            values = [outgoingRate, userId];
                            rows = await pool.query(query, values);
                            console.log(JSON.stringify(rows[0]));
                        }

                    }
                    else if (isSessIdExists > 0 && free_conversation > 0) {
                        console.log({ free_conversation, is_free_conversation });
                        category_id = 4;
                        category = category + '_free_tier';

                        if (billing_type == 2) {
                            finalRate = 0;
                        }
                    }
                    else if (free_conversation <= 0) {
                        console.log({ free_conversation, is_free_conversation });
                        query = 'UPDATE ' + TBL_USERS_MASTER + ' SET is_free_conversation = ?, free_conversation = ? WHERE userid = ?';
                        values = [0, 0, userId];
                        rows = await pool.query(query, values);
                        console.log(JSON.stringify(rows[0]));
                    }


                    let query1 = 'SELECT free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                    let values1 = [userId];
                    rows = await pool.query(query1, values1);
                    let temp_free_conversation = rows[0][0].free_conversation;
                    let temp_is_free_conversation = rows[0][0].free_conversation;
                    console.log({ temp_free_conversation, temp_is_free_conversation });


                    //TRANSACTION BASED DEDUCTION BLOCK
                    if (account_type == 1 && billing_type === 1 && outgoingRate !== null) {

                        console.log('block 1');

                        // console.log({ free_conversation, is_free_conversation });
                        let tempFinalRate = temp_free_conversation <= 0 && temp_is_free_conversation > 0 ? finalRate : outgoingRate;
                        console.log({ tempFinalRate });
                        finalRate = tempFinalRate;
                        console.log('======================================================> ' + userId + ' ' + tempFinalRate + ' ' + recipient_id);
                        query = 'UPDATE ' + TBL_USERS_MASTER + ' SET balance_amt = balance_amt - ? WHERE userid = ?';
                        console.log('UPDATE ezb_users SET balance_amt = ' + balance_amt + ' WHERE userid = ' + userId + ', finalRate = ' + tempFinalRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                        values = [tempFinalRate, userId];
                        rows = await pool.query(query, values);
                        console.log(JSON.stringify(rows[0]));

                    }


                }
                else if (status === 'sent' && is_free_conversation === 0 && account_type == 1 && finalRate !== null) {
                    // else if (status === 'sent' && is_free_conversation === 0 && finalRate !== null) {

                    if (isSessIdExists > 0 && billing_type == 2) {
                        finalRate = 0;
                    }

                    console.log('block 2');
                    console.log({ free_conversation, is_free_conversation });
                    if (free_conversation <= 0) {
                        console.log({ free_conversation, is_free_conversation });
                        query = 'UPDATE ' + TBL_USERS_MASTER + ' SET is_free_conversation = ?, free_conversation = ? WHERE userid = ?';
                        values = [0, 0, userId];
                        rows = await pool.query(query, values);
                        console.log(JSON.stringify(rows[0]));
                    }
                    console.log('==================================> + free_conversation  = ' + free_conversation + ' ,is_free_conversation = ' + is_free_conversation);
                    console.log(finalRate);
                    console.log('======================================================> ' + userId + ' ' + finalRate + ' ' + recipient_id);
                    query = 'UPDATE ' + TBL_USERS_MASTER + ' SET balance_amt = balance_amt - ? WHERE userid = ?';
                    console.log('UPDATE ezb_users SET balance_amt = ' + balance_amt + ' WHERE userid = ' + userId + ', finalRate = ' + finalRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                    values = [finalRate, userId];
                    rows = await pool.query(query, values);
                    console.log(JSON.stringify(rows[0]));
                }
            }
            submissiontype = isSessIdExists === 0 && category != 'user_initiated' ? "NOTIFICATION" : "FEEDBACK";

            if (status === 'sent') {
                category = job.data.entry[0].changes[0].value.statuses[0].pricing.category;
                if (category === 'business_initiated') {
                    category_id = 1;
                }
                else if (category === 'user_initiated') {
                    category_id = 2;
                }
                else if (category === 'referral_conversion') {
                    category_id = 3;
                }

                let query1 = 'SELECT free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                let values1 = [userId];
                rows = await pool.query(query1, values1);
                let temp_free_conversation = rows[0][0].free_conversation;
                if (temp_free_conversation > 0) {
                    category_id = 4;
                    category = category + '_free_tier';
                }


                console.log('FINAL_RATE SENT = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, sentdt = ?, sessid = ?, billing = ?, pricing_model = ?, submissiontype = ?, countrycode = ?, rate = ?, billingdt = ?,category = ?, expiration_timestamp = ?, category_id = ?, errcode = NULL, errdesc = NULL WHERE messageid = ? AND sessid IS NULL';
                values = [0, timestamp, sessid, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, category, expiration_timestamp, category_id, msgId];
                // console.log(values)
                rows = await pool.query(query, values);
                console.log('SENT_CALLBACK_LOGS_1(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(values));
                console.log('SENT_CALLBACK_LOGS_1(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
            }
            else if (status === 'delivered') {
                category = job.data.entry[0].changes[0].value.statuses[0].pricing.category;
                if (category === 'business_initiated') {
                    category_id = 1;
                }
                else if (category === 'user_initiated') {
                    category_id = 2;
                }
                else if (category === 'referral_conversion') {
                    category_id = 3;
                }

                let query1 = 'SELECT free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                let values1 = [userId];
                rows = await pool.query(query1, values1);
                let temp_free_conversation = rows[0][0].free_conversation;
                if (temp_free_conversation > 0) {
                    category_id = 4;
                    category = category + '_free_tier';
                }

                // console.log('FINAL_RATE DELIVERED = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                if (submissiontype === null) {
                    query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, dlvrddt = ?, errcode = NULL, errdesc = NULL,category = ?, category_id = ? WHERE messageid = ? AND readstatus = 0';
                    values = [1, timestamp, category, category_id, msgId];
                    // console.log(values)
                    rows = await pool.query(query, values);

                } else {
                    query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, sessid = ?,dlvrddt = ?, billing = ?, pricing_model = ?,submissiontype = (CASE WHEN submissiontype IS NULL THEN ? ELSE submissiontype END),countrycode = ?, rate = (CASE WHEN rate IS NULL THEN ? ELSE rate END), billingdt= ?, errcode = NULL, errdesc = NULL,category = ?, category_id = ? WHERE messageid = ? AND readstatus = 0';
                    values = [1, sessid, timestamp, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, category, category_id, msgId];
                    // console.log(values)
                    rows = await pool.query(query, values);
                    console.log('DELIVERED_CALLBACK_LOGS_1(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(values));
                }
                console.log('DELIVERED_CALLBACK_LOGS_1(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
            }
            else if (status === 'read' && job.data.entry[0].changes[0].value.statuses[0].pricing !== undefined) {
                category = job.data.entry[0].changes[0].value.statuses[0].pricing.category;
                if (category === 'business_initiated') {
                    category_id = 1;
                }
                else if (category === 'user_initiated') {
                    category_id = 2;
                }
                else if (category === 'referral_conversion') {
                    category_id = 3;
                }

                let query1 = 'SELECT free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                let values1 = [userId];
                rows = await pool.query(query1, values1);
                let temp_free_conversation = rows[0][0].free_conversation;
                if (temp_free_conversation > 0) {
                    category_id = 4;
                    category = category + '_free_tier';
                }

                // console.log('FINAL_RATE READ = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, sessid = ?, readdt = ?,billing = ?,pricing_model = ?,submissiontype = (CASE WHEN submissiontype IS NULL THEN ? ELSE submissiontype END),billingdt = ?, dlvrddt = IF(dlvrddt IS NULL, ?, dlvrddt), errcode = NULL, errdesc = NULL,category = ?, category_id = ? WHERE messageid = ? AND readstatus!=2';
                values = [2, sessid, timestamp, billing, pricing_model, submissiontype, timestamp, timestamp, category, category_id, msgId];
                // console.log(values)
                rows = await pool.query(query, values);
                console.log('READ_CALLBACK_LOGS_1(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
            }
            else if (status === 'read') {
                // console.log('FINAL_RATE READ = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, readdt = ?, errcode = NULL, errdesc = NULL WHERE messageid = ? AND readstatus!=2';
                values = [2, timestamp, msgId];
                // console.log(values)
                rows = await pool.query(query, values);
                console.log('READ_CALLBACK_LOGS_2(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
            }
        }
        // if (status === 'failed') {
        //     let errorCode = job.data.entry[0].changes[0].value.statuses[0].errors[0].code;
        //     let errorDesc = job.data.entry[0].changes[0].value.statuses[0].errors[0].title;
        //     query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET  readstatus = ?, errcode = ?, errdesc = ?, faileddt = ?, billingdt = ? WHERE messageid = ?';
        //     values = [3, errorCode, errorDesc, timestamp, timestamp, msgId];
        //     rows = await pool.query(query, values);
        //     console.log('failed status(' + msgId + '):' + JSON.stringify(rows[0]));
        // }
        if (job.data.entry[0].changes[0].value.statuses[0].type === 'payment') {
            console.log('Payment status : ' + recipient_id);
            // if (status === 'success') {
            console.log({ msgId });
            recipient_id = job.data.entry[0].changes[0].value.statuses[0].recipient_id;
            let paymentReferenceId = job.data.entry[0].changes[0].value.statuses[0].payment.reference_id;
            let transactionId = 0;;
            let transactionType = 0;
            // let totalAmount = 0;
            // let currency = 0;
            let orderFlag = 0;
            let paymentData = null;

            console.log({ paymentReferenceId, transactionId, transactionType, timestamp, status, orderFlag, msgId, recipient_id });
            let res = await sendService.updateDataIntoPurchaseMaster(paymentReferenceId, transactionId, transactionType, timestamp, status, orderFlag, msgId, recipient_id);
            console.log({ res, recipient_id });
            console.log('updateDataIntoPurchaseMaster====================>' + recipient_id);
            let parameters = {
                "reference_id": paymentReferenceId,
                "order": {
                    "status": "completed",
                    "description": status
                }
            };
            let parameters1 = {
                "reference_id": paymentReferenceId,
                "order": {
                    "status": "canceled",
                    "description": status
                }
            };

            if (status === 'success') {
                console.log('Success payment==========================================> ' + recipient_id);
                paymentData = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": recipient_id,
                    "type": "interactive",
                    "interactive": {
                        "type": "order_status",
                        "body": {
                            "text": "Your order is completed."
                        },
                        "action": {
                            "name": "review_order",
                            "parameters": parameters
                        }
                    }
                };
            } else if (status === 'failed') {
                console.log('Failed payment==========================================> ' + recipient_id);
                paymentData = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": recipient_id,
                    "type": "interactive",
                    "interactive": {
                        "type": "order_status",
                        "body": {
                            "text": "Your order is cancelled due to payment failure."
                        },
                        "action": {
                            "name": "review_order",
                            "parameters": parameters1
                        }
                    }
                };
            }
            outgoingMessageType = 9;
            wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(recipient_id);
            await botUtils.axiosPostData(phoneNumberId, JSON.stringify(paymentData), userId, recipient_id, outgoingMessageType, wanumber, wabaCountryCodeNumeric);
            console.log('axiosPostData====================>' + recipient_id);
            // query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ? WHERE messageid = ?';
            // values = [5, msgId];
            // rows = await pool.query(query, values);
            // console.log('payment status(' + msgId + '):' + JSON.stringify(rows[0]));
            // }
        }
        else if (job.data.entry[0].changes[0].value.statuses[0].type !== 'payment') {
            if (status === 'failed') {
                let errorCode = job.data.entry[0].changes[0].value.statuses[0].errors[0].code;
                let errorDesc = job.data.entry[0].changes[0].value.statuses[0].errors[0].title;
                query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET  readstatus = ?, errcode = ?, errdesc = ?, faileddt = ?, billingdt = ? WHERE messageid = ?';
                values = [3, errorCode, errorDesc, timestamp, timestamp, msgId];
                rows = await pool.query(query, values);
                console.log('failed status(' + msgId + '):' + JSON.stringify(rows[0]));
            }
        }
        if (status === 'deleted') {
            query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, deletedt = ?, isdeleted = ?, billingdt = ? WHERE messageid = ?';
            values = [4, timestamp, 1, timestamp, msgId];
            rows = await pool.query(query, values);
            console.log('deleted status(' + msgId + '):' + JSON.stringify(rows[0]));
        }
        // next(null, rows[0]);
    }
    catch (err) {
        console.log('updateDelivery error=======================>' + err);
        console.log(err);
        // next(err);
    }
};

storeContactPayloadLogs = async (job) => {
    try {
        let msgID = job.data.entry[0].changes[0].value.statuses[0].id;
        let type = 2;
        let category = job.data.entry[0].changes[0].value.statuses[0].pricing != undefined ? job.data.entry[0].changes[0].value.statuses[0].pricing.category : null;
        let query = "INSERT INTO ezb_old_callbacks_logs(payload, messageid, logdate, type, category) VALUES(?,?,DATE(NOW()),?,?)";
        let values = [JSON.stringify(job.data), msgID, type, category];
        let rows = await pool.query(query, values);
        console.log('statuses payload result : ' + JSON.stringify(rows));
    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    updateDelivery,
    storeContactPayloadLogs
};