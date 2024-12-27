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

// stable cloud update delivery for pricing update dated 10th Aug 2023 --- deployed By Disha Kathane and Khushal Bhalekar
updateDeliveryCloud100823 = async (job, done) => {
    console.log('====================================================================> + UPDATE DELIVERY PRODUCTION AS PER NEW PRICING');
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
        let postpaid_credit_limit_flag = null;
        let postpaid_credit_amt = null;
        let wanumber = job.data.entry[0].changes[0].value.metadata.display_phone_number;
        let phoneNumberId = job.data.entry[0].changes[0].value.metadata.phone_number_id;
        recipient_id = job.data.entry[0].changes[0].value.statuses[0].recipient_id;
        query = 'SELECT b.userid, b.balance_amt, b.billing_type, b.account_type,' +
            ' b.free_conversation, b.is_free_conversation,' +
            ' b.postpaid_credit_limit_flag, b.postpaid_credit_amt FROM '
            + TBL_WA_MSG_SETTINGS_MASTER + ' AS a INNER JOIN '
            + TBL_USERS_MASTER + ' AS b ON a.wa_msg_setting_id = b.wanumberid AND a.wanumber = ?';
        values = ['+' + wanumber];
        rows = await pool.query(query, values);
        // console.log(JSON.stringify(rows[0]));

        if (rows[0][0] != undefined) {
            userId = rows[0][0].userid;
            free_conversation = rows[0][0].free_conversation;
            is_free_conversation = rows[0][0].is_free_conversation;
            balance_amt = rows[0][0].balance_amt;
            billing_type = rows[0][0].billing_type;
            account_type = rows[0][0].account_type;
            postpaid_credit_amt = rows[0][0].postpaid_credit_amt;
            postpaid_credit_limit_flag = rows[0][0].postpaid_credit_limit_flag;

            // console.log('USER : (' + job.data.entry[0].changes[0].value.metadata.display_phone_number + ')::' + JSON.stringify(rows[0]));

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

                let marketing_rate = 0;
                let utility_rate = 0;
                let feedback_rate = 0;
                let authentication_rate = 0;
                let service_rate = 0;



                let outgoingRate = 0;

                let category = null;
                let deliveryStatus = 0;

                let expiration_timestamp = null;

                let isSessIdExists = 0;
                let category_id = 0;
                let isConversationBased = 0;
                let subscriberId = null;
                let finalBICRate = null;
                let finalUICRate = null;


                // recipient_id = job.data.entry[0].changes[0].value.statuses[0].recipient_id;
                // // console.log({ recipient_id });

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
                        // // console.log(expiration_timestamp)
                        // // console.log(deliveryStatus)


                        query = 'SELECT COUNT(1) AS C FROM ' + TBL_MESSAGE_SENT_MASTER + ' WHERE sessid=?';
                        values = [sessid];
                        rows = await pool.query(query, values);
                        console.log('SENT SELECT COUNT(1) AS C (' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + ') (' + msgId + ')::' + JSON.stringify(rows[0]));
                        isSessIdExists = rows[0][0].C;
                        // // console.log({ isSessIdExists })
                        // submissiontype = isSessIdExists == 0 && category != 'service' ? "NOTIFICATION" : "FEEDBACK";
                        submissiontype = isSessIdExists == 0 ? "NOTIFICATION" : "FEEDBACK";


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
                        // // console.log(isSessIdExists)
                        // submissiontype = isSessIdExists == 0 && category != 'service' ? "NOTIFICATION" : "FEEDBACK";
                        submissiontype = isSessIdExists == 0 ? "NOTIFICATION" : "FEEDBACK";

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
                        // // console.log(isSessIdExists)
                        // submissiontype = isSessIdExists == 0 && category != 'service' ? "NOTIFICATION" : "FEEDBACK";
                        submissiontype = isSessIdExists == 0 ? "NOTIFICATION" : "FEEDBACK";
                    }
                    else if (status === 'read') {
                        deliveryStatus = 2;
                    }

                    query = "SELECT subscriberid FROM " + TBL_MESSAGE_SENT_MASTER + " WHERE messageid = ?";
                    values = [msgId];
                    rows = await pool.query(query, values);
                    subscriberId = rows[0][0] != undefined ? rows[0][0].subscriberid : 0;
                    // console.log('subscriberId======================>' + subscriberId);

                    // recipient_id = job.data.entry[0].changes[0].statuses[0].recipient_id;
                    // // console.log({recipient_id})
                    wabaCountryCode = botUtils.getCountryCode(recipient_id);
                    // // console.log({ wabaCountryCode })
                    wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(recipient_id);
                    // // console.log({ wabaCountryCodeNumeric })

                    let customizeQuery = null;
                    let user_id = (subscriberId > 0) ? subscriberId : userId;
                    customizeQuery = "SELECT * FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE userid=? AND countrycode=?";
                    values = [user_id, wabaCountryCodeNumeric];
                    rows = await pool.query(customizeQuery, values);
                    if (rows[0].length > 0) {
                        console.log("inside if of rate master");
                        console.log("SELECT * FROM " + TBL_CUSTOM_RATE_MASTER + " WHERE userid=? AND countrycode=?", JSON.stringify(rows[0]));
                        marketing_rate = rows[0][0].marketing_rate != null ? rows[0][0].marketing_rate : 0;
                        utility_rate = rows[0][0].utility_rate != null ? rows[0][0].utility_rate : 0;
                        authentication_rate = rows[0][0].authentication_rate ? rows[0][0].authentication_rate : 0;
                        service_rate = rows[0][0].service_rate ? rows[0][0].service_rate : 0;
                        feedback_rate = rows[0][0].feedback_rate ? rows[0][0].feedback_rate : 0;

                        console.log('SELECT RATE (' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + ') (' + msgId + ')::' + JSON.stringify(rows[0]));
                    }
                    else {
                        customizeQuery = "SELECT * FROM " + TBL_DEFAULT_RATE_MASTER + " WHERE countrycode=?";
                        values = [wabaCountryCodeNumeric];
                        rows = await pool.query(customizeQuery, values);
                        console.log("inside else of rate master");
                        if (rows[0].length > 0) {

                            marketing_rate = rows[0][0].marketing_rate != null ? rows[0][0].marketing_rate : 0;
                            utility_rate = rows[0][0].utility_rate != null ? rows[0][0].utility_rate : 0;
                            authentication_rate = rows[0][0].authentication_rate ? rows[0][0].authentication_rate : 0;
                            service_rate = rows[0][0].service_rate ? rows[0][0].service_rate : 0;
                            feedback_rate = rows[0][0].feedback_rate ? rows[0][0].feedback_rate : 0;

                            console.log('SELECT RATE (' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + ') (' + msgId + ')::' + JSON.stringify(rows[0]));
                        }
                    }
                    console.log('SELECT RATE (' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + ') (' + msgId + ')::' + JSON.stringify(rows[0]));

                    responseRate = rows[0][0].response_rate != null ? rows[0][0].response_rate : 0;

                    outgoingRate = rows[0][0].feedback_rate != null ? rows[0][0].feedback_rate : 0;

                    console.log("feedback_rate=====>", feedback_rate);
                    let finalMarketing_rate = parseFloat(marketing_rate) + parseFloat(outgoingRate);
                    let finalUtility_rate = parseFloat(utility_rate) + parseFloat(outgoingRate);
                    let finalAuthentication_rate = parseFloat(authentication_rate) + parseFloat(outgoingRate);
                    let finalService_rate = parseFloat(service_rate) + parseFloat(outgoingRate);

                    if (category === 'authentication') {
                        // finalBICRate = '0.3082';
                        // finalRate = isSessIdExists > 0 ? outgoingRate : finalBICRate;
                        finalRate = isSessIdExists > 0 ? outgoingRate : finalAuthentication_rate;
                        console.log(`finalRate authentication rate ${finalRate}`);
                        category_id = 1;
                    }
                    else if (category === 'marketing') {
                        // finalBICRate = '0.7265';
                        // finalRate = isSessIdExists > 0 ? outgoingRate : finalBICRate;
                        finalRate = isSessIdExists > 0 ? outgoingRate : finalMarketing_rate;
                        console.log(`finalRate marketing rate ${finalRate}`);
                        category_id = 1;
                    }
                    else if (category === 'utility') {
                        // finalBICRate = '0.3082';
                        // finalRate = isSessIdExists > 0 ? outgoingRate : finalBICRate;
                        finalRate = isSessIdExists > 0 ? outgoingRate : finalUtility_rate;
                        console.log(`finalRate utility rate ${finalRate}`);
                        category_id = 1;
                    }
                    else if (category === 'service') {
                        // finalUICRate = '0.2906';
                        finalRate = isSessIdExists > 0 ? outgoingRate : finalService_rate;
                        console.log(`finalRate service rate ${finalRate}`);
                        category_id = 2;
                    }
                    else if (category === 'referral_conversion') {
                        finalRate = outgoingRate;
                        console.log("inside the referral_conversion");
                        console.log(`finalRate referal conversation rate ${finalRate}`);
                        category_id = 3;
                    }

                    console.log(finalMarketing_rate + ',' + finalUtility_rate + ',' + finalAuthentication_rate + ',' + finalService_rate + ',' + feedback_rate + ',' + finalRate + ',' + free_conversation + ',' + is_free_conversation + ',' + isSessIdExists + ',' + balance_amt + ',' + account_type + ',' + billing_type + ',' + recipient_id);

                    console.log({ free_conversation, is_free_conversation });
                    if (free_conversation === 0 && is_free_conversation !== 0) {
                        query = 'UPDATE ' + TBL_USERS_MASTER + ' SET is_free_conversation = ? WHERE userid = ?';
                        values = [0, userId];
                        rows = await pool.query(query, values);
                        console.log(JSON.stringify(rows[0]));
                        is_free_conversation = 0;
                    };

                    if (status === 'sent' && is_free_conversation === 1) {
                        if (isSessIdExists === 0 && free_conversation > 0) {
                            console.log({ free_conversation, is_free_conversation });
                            if (category === 'service') {
                                console.log("service1");
                                query = 'UPDATE ' + TBL_USERS_MASTER + ' SET free_conversation = free_conversation - ? WHERE userid = ?';
                                values = [1, userId];
                                rows = await pool.query(query, values);
                                console.log(JSON.stringify(rows[0]));
                                category_id = 4;
                                category = category + '_free_tier';
                            }


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

                            // 0- postpaid, 1- prepaid
                            //Prepaid Account
                            if (account_type === 1 && billing_type === 2) {
                                console.log('CONVERSATION BASED DEDUCTION BLOCK ====================> PREPAID');
                                if (isSessIdExists === 0 && billing_type == 2 && outgoingRate !== null && free_conversation !== 0 && balance_amt > 0) {
                                    console.log('======================================================> ' + userId + ' ' + finalRate + ' ' + recipient_id);
                                    // console.log({ outgoingRate });
                                    if (category === 'authentication') {
                                        finalRate = finalAuthentication_rate;
                                        category_id = 1;
                                        console.log();
                                    } else if (category === 'utility') {
                                        finalRate = finalUtility_rate;
                                        category_id = 1;

                                    } else if (category === 'marketing') {
                                        finalRate = finalMarketing_rate;
                                        category_id = 1;

                                    }
                                    else if (category === 'service') {
                                        finalRate = outgoingRate;
                                    } else if (category_id === 4) { //service_free_tier
                                        finalRate = outgoingRate;
                                    }

                                    console.log({ finalRate });
                                    query = 'UPDATE ' + TBL_USERS_MASTER + ' SET balance_amt = balance_amt - ? WHERE userid = ?';
                                    console.log('1. UPDATE ezb_users SET balance_amt = ' + balance_amt + ' WHERE userid = ' + userId + ', finalRate = ' + finalRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                                    values = [finalRate, userId];
                                    rows = await pool.query(query, values);
                                    console.log(JSON.stringify(rows[0]));
                                }
                            }
                            else if (account_type === 0 && billing_type === 2) {
                                console.log('CONVERSATION BASED DEDUCTION BLOCK ====================> POSTPAID');
                                if (category === 'authentication') {
                                    finalRate = finalAuthentication_rate;
                                    category_id = 1;
                                } else if (category === 'utility') {
                                    finalRate = finalUtility_rate;
                                    category_id = 1;
                                } else if (category === 'marketing') {
                                    finalRate = finalMarketing_rate;
                                    category_id = 1;
                                }
                                else if (category === 'service') {
                                    finalRate = outgoingRate;
                                } else if (category_id === 4) {  //service_free_tier
                                    finalRate = outgoingRate;
                                }
                                // finalRate = outgoingRate;
                                console.log({ finalRate });
                                if (isSessIdExists === 0 && billing_type == 2 && outgoingRate !== null && free_conversation !== 0) {
                                    console.log('======================================================> ' + userId + ' ' + outgoingRate + ' ' + recipient_id + " " + category);
                                    if (postpaid_credit_limit_flag == 1 && postpaid_credit_amt > 0) {
                                        query = 'UPDATE ' + TBL_USERS_MASTER + ' SET postpaid_credit_amt = postpaid_credit_amt - ? WHERE userid = ?';
                                        console.log('1. UPDATE ezb_users SET postpaid_credit_amt = ' + postpaid_credit_amt + ' WHERE userid = ' + userId + ', finalRate = ' + finalRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                                        values = [finalRate, userId];
                                        rows = await pool.query(query, values);
                                        console.log(JSON.stringify(rows[0]));
                                    }
                                }
                            }


                        }
                        else if (isSessIdExists > 0 && free_conversation > 0) {
                            console.log({ free_conversation, is_free_conversation });

                            if (category === 'service') {
                                console.log("inside service 2");
                                category_id = 4;
                                category = category + '_free_tier';
                            };

                            if (billing_type == 2 && account_type === 1) {
                                console.log(category);
                                console.log("inside billing type ==2");
                                finalRate = 0;
                                if (category === 'marketing' || category === 'utility' || category === 'authentication') {
                                    finalRate = outgoingRate;
                                }

                                console.log({ finalRate });
                                query = 'UPDATE ' + TBL_USERS_MASTER + ' SET balance_amt = balance_amt - ? WHERE userid = ?';
                                console.log('2. UPDATE ezb_users SET balance_amt = ' + balance_amt + ' WHERE userid = ' + userId + ', finalRate = ' + finalRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                                values = [finalRate, userId];
                                rows = await pool.query(query, values);
                                console.log(JSON.stringify(rows[0]));

                            }
                            else if (billing_type == 2 && account_type === 0) {
                                finalRate = 0;
                                if (category === 'marketing' || category === 'utility' || category === 'authentication') {
                                    finalRate = outgoingRate;
                                }

                                if (postpaid_credit_limit_flag == 1 && postpaid_credit_amt > 0) {
                                    query = 'UPDATE ' + TBL_USERS_MASTER + ' SET postpaid_credit_amt = postpaid_credit_amt - ? WHERE userid = ?';
                                    console.log('2. UPDATE ezb_users SET postpaid_credit_amt = ' + postpaid_credit_amt + ' WHERE userid = ' + userId + ', finalRate = ' + finalRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                                    values = [finalRate, userId];
                                    rows = await pool.query(query, values);
                                    console.log(JSON.stringify(rows[0]));
                                }

                                console.log({ finalRate });
                            }
                        }
                        else if (free_conversation <= 0) {
                            console.log({ free_conversation, is_free_conversation });
                            query = 'UPDATE ' + TBL_USERS_MASTER + ' SET is_free_conversation = ?, free_conversation = ? WHERE userid = ?';
                            values = [0, 0, userId];
                            rows = await pool.query(query, values);
                            console.log(JSON.stringify(rows[0]));
                        }


                        let query1 = 'SELECT free_conversation, is_free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                        let values1 = [userId];
                        rows = await pool.query(query1, values1);
                        let temp_free_conversation = rows[0][0].free_conversation;
                        let temp_is_free_conversation = rows[0][0].is_free_conversation;
                        console.log({ temp_free_conversation, temp_is_free_conversation });


                        //TRANSACTION BASED DEDUCTION BLOCK
                        if (account_type == 1 && billing_type === 1 && outgoingRate !== null && balance_amt > 0) {

                            if (isSessIdExists === 0 && free_conversation > 0) {
                                if (isSessIdExists === 0 && free_conversation > 0) {
                                    console.log({ free_conversation, is_free_conversation });
                                    if (category === 'marketing' || category === "utility" || category === "authentication") {
                                        console.log("inside service 3");
                                        console.log("object inside if category");
                                        // query = 'UPDATE ' + TBL_USERS_MASTER + ' SET free_conversation = free_conversation - ? WHERE userid = ?';
                                        // values = [1, userId];
                                        // rows = await pool.query(query, values);
                                        // console.log(JSON.stringify(rows[0]));
                                        category_id = 1;

                                    }
                                    else if (category === 'service') {
                                        finalRate = outgoingRate;
                                    } else if (category_id === 4) { //service_free_tier
                                        finalRate = outgoingRate;
                                    }
                                }
                                else if (isSessIdExists > 0 && free_conversation > 0) {
                                    console.log({ free_conversation, is_free_conversation });
                                    if (category === 'service') {
                                        console.log("inside service 41");
                                        category_id = 2;
                                        category = category;
                                    };
                                }


                                let query1 = 'SELECT free_conversation, is_free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                                let values1 = [userId];
                                rows = await pool.query(query1, values1);
                                let temp_free_conversation = rows[0][0].free_conversation;
                                let temp_is_free_conversation = rows[0][0].is_free_conversation;
                                console.log({ temp_free_conversation });
                                if (temp_free_conversation === 0) {
                                    query = 'UPDATE ' + TBL_USERS_MASTER + ' SET is_free_conversation = 0 WHERE userid = ?';
                                    values = [userId];
                                    rows = await pool.query(query, values);
                                    console.log(JSON.stringify(rows[0]));
                                };

                            }
                            console.log('TRANSACTION BASED DEDUCTION BLOCK ======================> PREPAID');
                            console.log({ category });


                            // console.log({ free_conversation, is_free_conversation });
                            // let tempFinalRate = temp_free_conversation <= 0 && temp_is_free_conversation > 0 ? finalRate : outgoingRate;
                            // console.log({ tempFinalRate });
                            // finalRate = tempFinalRate;
                            // console.log('======================================================> ' + userId + ' ' + tempFinalRate + ' ' + recipient_id);

                            if (category === 'service') {
                                let tempFinalRate = temp_free_conversation <= 0 && temp_is_free_conversation > 0 ? finalRate : outgoingRate;

                                console.log({ tempFinalRate });
                                finalRate = tempFinalRate;
                                console.log('======================================================> ' + userId + ' ' + tempFinalRate + ' ' + recipient_id);
                            }
                            else {
                                // let tempFinalRate = finalRate;
                                // console.log({ tempFinalRate });
                                // finalRate = tempFinalRate;
                                console.log('======================================================> ' + userId + ' ' + finalRate + ' ' + recipient_id);
                            }

                            query = 'UPDATE ' + TBL_USERS_MASTER + ' SET balance_amt = balance_amt - ? WHERE userid = ?';
                            console.log('3. UPDATE ezb_users SET balance_amt = ' + balance_amt + ' WHERE userid = ' + userId + ', finalRate = ' + finalRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                            values = [finalRate, userId];
                            rows = await pool.query(query, values);
                            // console.log(JSON.stringify(rows[0]));

                        }
                        else if (account_type == 0 && billing_type === 1 && outgoingRate !== null) {
                            if (isSessIdExists === 0 && free_conversation > 0) {
                                console.log({ free_conversation, is_free_conversation });

                                if (category === 'marketing' || category === "utility" || category === "authentication") {
                                    console.log("inside service 3");
                                    console.log("object inside if category");
                                    // query = 'UPDATE ' + TBL_USERS_MASTER + ' SET free_conversation = free_conversation - ? WHERE userid = ?';
                                    // values = [1, userId];
                                    // rows = await pool.query(query, values);
                                    // console.log(JSON.stringify(rows[0]));
                                    category_id = 1;
                                    finalRate = outgoingRate;

                                }
                                else if (category === 'service') {
                                    finalRate = outgoingRate;
                                } else if (category_id === 4) { //service_free_tier
                                    finalRate = outgoingRate;
                                }
                            }
                            else if (isSessIdExists > 0 && free_conversation > 0) {
                                console.log({ free_conversation, is_free_conversation });
                                if (category === 'service') {
                                    console.log("inside service 41");
                                    category_id = 2;
                                    category = category;
                                };
                            }



                            let query1 = 'SELECT free_conversation, is_free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                            let values1 = [userId];
                            rows = await pool.query(query1, values1);
                            let temp_free_conversation = rows[0][0].free_conversation;
                            let temp_is_free_conversation = rows[0][0].is_free_conversation;
                            console.log({ temp_free_conversation });
                            if (temp_free_conversation === 0) {
                                query = 'UPDATE ' + TBL_USERS_MASTER + ' SET is_free_conversation = 0 WHERE userid = ?';
                                values = [userId];
                                rows = await pool.query(query, values);
                                console.log(JSON.stringify(rows[0]));
                            };

                            if (postpaid_credit_limit_flag == 1 && postpaid_credit_amt > 0) {
                                query = 'UPDATE ' + TBL_USERS_MASTER + ' SET postpaid_credit_amt = postpaid_credit_amt - ? WHERE userid = ?';
                                console.log('3. UPDATE ezb_users SET postpaid_credit_amt = ' + postpaid_credit_amt + ' WHERE userid = ' + userId + ', finalRate = ' + finalRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                                values = [finalRate, userId];
                                rows = await pool.query(query, values);
                                console.log(JSON.stringify(rows[0]));
                            }

                        }

                        console.log('TRANSACTION BASED DEDUCTION BLOCK ======================> POSTPAID');
                        console.log({ category });

                        // console.log({ free_conversation, is_free_conversation });

                        // console.log({ free_conversation, is_free_conversation });
                        // let tempFinalRate = temp_free_conversation <= 0 && temp_is_free_conversation > 0 ? finalRate : outgoingRate;
                        // console.log({ tempFinalRate });
                        // finalRate = tempFinalRate;
                        // console.log('======================================================> ' + userId + ' ' + tempFinalRate + ' ' + recipient_id);

                        if (category === 'service') {
                            let tempFinalRate = temp_free_conversation <= 0 && temp_is_free_conversation > 0 ? finalRate : outgoingRate;

                            console.log({ tempFinalRate });
                            finalRate = tempFinalRate;
                            console.log('service based deductions for transaction based ======================================================> ' + userId + ' ' + tempFinalRate + ' ' + recipient_id);
                        }
                        else {
                            // let tempFinalRate = finalRate;
                            // console.log({ tempFinalRate });
                            // finalRate = tempFinalRate;
                            console.log('======================================================> ' + userId + ' ' + finalRate + ' ' + recipient_id);
                        }




                    }
                    else if (status === 'sent' && is_free_conversation === 0 && finalRate !== null) {
                        // else if (status === 'sent' && is_free_conversation === 0 && finalRate !== null) {


                        if (account_type === 1 && balance_amt > 0) {
                            console.log('=================================> PREPAID BLOCK');
                            console.log("freeconversation ===0");
                            console.log({ category });
                            if (isSessIdExists > 0 && billing_type == 2) {
                                finalRate = outgoingRate;

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
                            console.log('4. UPDATE ezb_users SET balance_amt = ' + balance_amt + ' WHERE userid = ' + userId + ', finalRate = ' + finalRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                            values = [finalRate, userId];
                            rows = await pool.query(query, values);
                            console.log(JSON.stringify(rows[0]));
                        }
                        else if (account_type === 0) {
                            console.log('=================================> POSTPAID BLOCK');
                            if (isSessIdExists > 0 && billing_type == 2) {
                                // finalRate = 0;
                                if (category === 'authentication') {
                                    finalRate = outgoingRate;
                                } else if (category === 'utility') {
                                    finalRate = outgoingRate;
                                } else if (category === 'marketing') {
                                    finalRate = outgoingRate;
                                }
                            }

                            console.log('=================================> POSTPAID BLOCK ' + finalRate);

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

                            if (postpaid_credit_limit_flag == 1 && postpaid_credit_amt > 0) {
                                query = 'UPDATE ' + TBL_USERS_MASTER + ' SET postpaid_credit_amt = postpaid_credit_amt - ? WHERE userid = ?';
                                console.log('4. UPDATE ezb_users SET postpaid_credit_amt = ' + postpaid_credit_amt + ' WHERE userid = ' + userId + ', finalRate = ' + finalRate + ', wabaCountryCodeNumeric = ' + wabaCountryCodeNumeric + ', recipient_id = ' + recipient_id);
                                values = [finalRate, userId];
                                rows = await pool.query(query, values);
                                console.log(JSON.stringify(rows[0]));
                            }
                        }


                    }
                }
                // submissiontype = isSessIdExists === 0 && category != 'service' ? "NOTIFICATION" : "FEEDBACK";
                submissiontype = isSessIdExists === 0 ? "NOTIFICATION" : "FEEDBACK";

                console.log('submission type ================> ' + recipient_id + submissiontype);

                if (status === 'sent') {
                    category = job.data.entry[0].changes[0].value.statuses[0].pricing.category;
                    if (category === 'authentication') {
                        category_id = 1;
                    } else if (category === 'marketing') {
                        category_id = 1;
                    } else if (category === 'utility') {
                        category_id = 1;
                    }
                    else if (category === 'service') {
                        category_id = 2;
                    }
                    else if (category === 'referral_conversion') {
                        category_id = 3;
                    }
                    let query1 = 'SELECT free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                    let values1 = [userId];
                    rows = await pool.query(query1, values1);
                    let temp_free_conversation = rows[0][0].free_conversation;
                    console.log({ temp_free_conversation });
                    if (temp_free_conversation > 0 && category === 'service') {
                        category_id = 4;
                        category = category + '_free_tier';
                    }

                    console.log('FINAL_RATE SENT = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                    query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, sentdt = ?, sessid = ?, billing = ?, pricing_model = ?, submissiontype = ?, countrycode = ?, rate = ?, billingdt = ?,category = ?, expiration_timestamp = ?, category_id = ?, errcode = NULL, errdesc = NULL WHERE messageid = ? AND sessid IS NULL';
                    console.log('SENT_CALLBACK_LOGS_1 =================> ' + recipient_id + timestamp, sessid, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, category, expiration_timestamp, category_id, msgId);
                    values = [0, timestamp, sessid, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, category, expiration_timestamp, category_id, msgId];
                    // console.log(values)
                    rows = await pool.query(query, values);
                    console.log('SENT_CALLBACK_LOGS_1(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(values));
                    console.log('SENT_CALLBACK_LOGS_1(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
                }
                else if (status === 'delivered') {
                    // console.log('Delivered payload ========================> ' + JSON.stringify(job.data));
                    if (job.data.entry[0].changes[0].value.statuses[0].pricing !== undefined) {
                        category = job.data.entry[0].changes[0].value.statuses[0].pricing.category;
                        if (category === 'authentication') {
                            category_id = 1;
                        } else if (category === 'marketing') {
                            category_id = 1;
                        } else if (category === 'utility') {
                            category_id = 1;
                        }
                        else if (category === 'service') {
                            category_id = 2;
                        }
                        else if (category === 'referral_conversion') {
                            category_id = 3;
                        }

                        let query1 = 'SELECT free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                        let values1 = [userId];
                        rows = await pool.query(query1, values1);
                        let temp_free_conversation = rows[0][0].free_conversation;
                        if (temp_free_conversation > 0 && category === 'service') {
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
                            // console.log('DELIVERED_CALLBACK_LOGS_1 =================> ' + recipient_id, submissiontype);
                            query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, sessid = ?,dlvrddt = ?, billing = ?, pricing_model = ?,submissiontype = (CASE WHEN submissiontype IS NULL THEN ? ELSE submissiontype END),countrycode = ?, rate = (CASE WHEN rate IS NULL THEN ? ELSE rate END), billingdt= ?, errcode = NULL, errdesc = NULL,category = ?, category_id = ? WHERE messageid = ? AND readstatus = 0';
                            // query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, sessid = ?,dlvrddt = ?, billing = ?, pricing_model = ?,submissiontype = ?,countrycode = ?, rate = (CASE WHEN rate IS NULL THEN ? ELSE rate END), billingdt= ?, errcode = NULL, errdesc = NULL,category = ?, category_id = ? WHERE messageid = ? AND readstatus = 0';
                            console.log('DELIVERED_CALLBACK_LOGS_1 =================> ' + sessid, timestamp, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, category, category_id, msgId);
                            values = [1, sessid, timestamp, billing, pricing_model, submissiontype, wabaCountryCodeNumeric, finalRate, timestamp, category, category_id, msgId];
                            // console.log(values)
                            rows = await pool.query(query, values);
                            console.log('DELIVERED_CALLBACK_LOGS_1(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(values));
                        }
                        console.log('DELIVERED_CALLBACK_LOGS_1(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
                    }
                    else {
                        // // console.log('FINAL_RATE DELIVERED = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                        query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, dlvrddt = ?, errcode = NULL, errdesc = NULL WHERE messageid = ? AND readstatus = 0';
                        values = [1, timestamp, msgId];
                        // // console.log(values)
                        rows = await pool.query(query, values);
                        console.log('DELIVERED(' + job.data.entry[0].changes[0].value.statuses[0].recipient_id + '):' + JSON.stringify(rows[0]));
                    }

                }
                else if (status === 'read' && job.data.entry[0].changes[0].value.statuses[0].pricing !== undefined) {
                    category = job.data.entry[0].changes[0].value.statuses[0].pricing.category;
                    if (category === 'authentication') {
                        category_id = 1;
                    } else if (category === 'marketing') {
                        category_id = 1;
                    } else if (category === 'utility') {
                        category_id = 1;
                    }
                    else if (category === 'service') {
                        category_id = 2;
                    }
                    else if (category === 'referral_conversion') {
                        category_id = 3;
                    }

                    let query1 = 'SELECT free_conversation FROM ' + TBL_USERS_MASTER + ' WHERE userid = ?';
                    let values1 = [userId];
                    rows = await pool.query(query1, values1);
                    let temp_free_conversation = rows[0][0].free_conversation;
                    if (temp_free_conversation > 0 && category === 'service') {
                        category_id = 4;
                        category = category + '_free_tier';
                    }
                    console.log('READ_CALLBACK_LOGS_1 =================> ' + recipient_id, submissiontype);
                    // console.log('FINAL_RATE READ = ' + finalRate + ', CATEGORY_ID = ' + category_id + ', CATEGORY = ' + category);
                    query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ?, sessid = ?, readdt = ?,billing = ?,pricing_model = ?,submissiontype = (CASE WHEN submissiontype IS NULL THEN ? ELSE submissiontype END),billingdt = ?, dlvrddt = IF(dlvrddt IS NULL, ?, dlvrddt), errcode = NULL, errdesc = NULL,category = ?, category_id = ? WHERE messageid = ? AND readstatus!=2';
                    console.log('READ_CALLBACK_LOGS_1' + sessid, timestamp, billing, pricing_model, submissiontype, timestamp, timestamp, category, category_id, msgId);
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
            if (job.data.entry[0].changes[0].value.statuses[0].type === 'payment') {
                // console.log('Payment status : ' + recipient_id);
                // if (status === 'success') {
                // console.log({ msgId });
                recipient_id = job.data.entry[0].changes[0].value.statuses[0].recipient_id;
                let paymentReferenceId = job.data.entry[0].changes[0].value.statuses[0].payment.reference_id;
                let transactionId = 0;;
                let transactionType = 0;
                // let totalAmount = 0;
                // let currency = 0;
                let orderFlag = 0;
                let paymentData = null;
                let outgoingMessageType = null;
                let wabaCountryCodeNumeric = null;

                // console.log({ paymentReferenceId, transactionId, transactionType, timestamp, status, orderFlag, msgId, recipient_id });

                // console.log('updateDataIntoPurchaseMaster====================>' + recipient_id);
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
                    // console.log('Success payment==========================================> ' + recipient_id);
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
                    orderFlag = 1;
                }
                else if (status === 'captured') {
                    // console.log('Captured payment==========================================> ' + recipient_id);
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
                                // "parameters": JSON.stringify(parameters)
                                "parameters": parameters
                            }
                        }
                    };
                    orderFlag = 1;
                }
                else if (status === 'failed') {
                    // console.log('Failed payment==========================================> ' + recipient_id);
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
                    orderFlag = 0;
                }
                outgoingMessageType = 9;
                wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(recipient_id);
                // console.log(JSON.stringify(paymentData));
                await botUtils.axiosPostData(phoneNumberId, JSON.stringify(paymentData), userId, recipient_id, outgoingMessageType, wanumber, wabaCountryCodeNumeric);
                // console.log('axiosPostData====================>' + recipient_id);

                let res = await sendService.updateDataIntoPurchaseMaster(paymentReferenceId, transactionId, transactionType, status, orderFlag, timestamp, msgId, recipient_id);
                // console.log({ res, recipient_id });
                // query = 'UPDATE ' + TBL_MESSAGE_SENT_MASTER + ' SET readstatus = ? WHERE messageid = ?';
                // values = [5, msgId];
                // rows = await pool.query(query, values);
                // // console.log('payment status(' + msgId + '):' + JSON.stringify(rows[0]));
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
            done();
        } else {
            done();
        }

    }

    catch (err) {
        console.log('updateDelivery error=======================>' + err);
        console.log(err);
        // next(err);
        done(err);
    }
};


storeContactPayloadLogs = async (job) => {
    try {
        let msgID = job.data.entry[0].changes[0].value.statuses[0].id;
        let wabanumber = job.data.entry[0].changes[0].value.metadata.display_phone_number;

        let type = 2;
        let category = job.data.entry[0].changes[0].value.statuses[0].pricing != undefined ? job.data.entry[0].changes[0].value.statuses[0].pricing.category : null;
        let query = "INSERT INTO ezb_old_callbacks_logs(payload, messageid, logdate, type, category, wabanumber) VALUES(?,?,DATE(NOW()),?,?, ?)";
        let values = [JSON.stringify(job.data), msgID, type, category, wabanumber];
        let rows = await pool.query(query, values);
        console.log('statuses payload result : ' + JSON.stringify(rows));
    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    storeContactPayloadLogs,
    updateDeliveryCloud100823
};