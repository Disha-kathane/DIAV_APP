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
    TBL_FLOWBUILDER_MASTER,
    TBL_FLOWBUILDER_NODE,
    TBL_FLOWBUILDER_NODE_OPTION,
    TBL_FLOWBUILDER_SESSION,
    TBL_FLOWBUILDER_ATTRIBUTE
} = require('../../constants/tables');

const MSG_LIMIT = 50;

fetchMessages = async (next) => {

    try {
        // let query = "SELECT * FROM " + TBL_MESSAGE_REQUEST_MASTER + " WHERE appisprocessed = ? AND ismsgsent = ? ORDER BY priority ASC LIMIT ?";
        // let query = "SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string FROM ezb_message_request_master AS a"+
        // " LEFT JOIN ezb_wa_templates AS b ON a.templateid = b.tempid"+
        // " WHERE a.appisprocessed = ? AND a.ismsgsent = ? ORDER BY a.priority ASC LIMIT ?";

        let query = "SELECT a.*, b.placeholder_template_type, b.button_option, b.button_option_string FROM" +
            " ezb_message_request_master AS a," +
            " ezb_wa_templates AS b," +
            " ezb_users AS c" +
            " WHERE a.appisprocessed = ?" +
            " AND a.ismsgsent = ?" +
            " AND a.templateid = b.tempid" +
            " AND a.userid=c.userid" +
            " AND c.userid=b.userid" +
            " ORDER BY a.priority ASC LIMIT ?";

        let values = [0, 0, MSG_LIMIT];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

fetchScheduledMessages = async (next) => {

    try {
        let query = "SELECT a.*, d.schedule_datetime, b.placeholder_template_type, b.button_option, b.button_option_string" +
            " FROM ezb_message_request_master AS a, ezb_wa_templates AS b, ezb_users AS c, ezb_wa_campaign_master AS d" +
            " WHERE a.userid=c.userid" +
            " AND c.userid=b.userid" +
            " AND b.userid=d.userid" +
            " AND a.campaignid=d.campaignid" +
            " AND a.appisprocessed = ?" +
            " AND a.ismsgsent = ?" +
            " AND a.templateid = b.tempid" +
            " AND d.is_schedule = ?" +
            " AND d.schedule_datetime >= NOW()  - INTERVAL ? MINUTE" +
            " ORDER BY a.priority ASC LIMIT ?";

        let values = [0, 0, 1, 1, MSG_LIMIT];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

fetchUserStatus = async (userid, next) => {
    try {
        let query = "SELECT userstatus FROM " + TBL_USERS_MASTER + " WHERE userid = ?";
        let values = [userid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

// insertMessageInSentMaster = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, direction, next) => {
//     try {
//         let query;
//         let values;
//         if (id == 0) {
//             query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,direction)" +
//                 " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,NULL,NULL,NOW(),?,?,?,?,?,NULL,?)";
//             values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, 0, 0, 0, msgType, 1, direction];

//         }
//         else {
//             query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid,direction)" +
//                 " VALUES(?,?,?,?,?,?,NULL,NULL,NOW(),?,?,?,?,NULL,?)";
//             values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, 0, 0, 0, msgType, direction];

//         }
//         let rows = await dbpool.query(query, values);
//         next(null, rows[0]);
//     }
//     catch (err) {
//         next(err);
//     }
// }

insertMessageInSentMaster = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, direction, wabanumber, wabid, bodyContent, next) => {
    try {
        //console.log('insertMessageInSentMaster: ' + mobileno);
        let query;
        let values;
        if (id == 0) {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,direction,contactno,msg_setting_id,body_content,billingdt)" +
                " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,NULL,NULL,NOW(),?,?,?,?,?,?,?,?,?,?,NOW())";
            values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, 0, 0, 0, msgType, 1, campaignid, direction, wabanumber, wabid, JSON.stringify(bodyContent)];

        }
        else {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid,direction,contactno,msg_setting_id,body_content,billingdt)" +
                " VALUES(?,?,?,?,?,?,NULL,NULL,NOW(),?,?,?,?,?,?,?,?,?,NOW())";
            values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, 0, 0, 0, msgType, campaignid, direction, wabanumber, wabid, JSON.stringify(bodyContent)];

        }
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

insertMessageInSentMasterAPI = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, direction, wabanumber, wabid, countrycode, rate, billing, pricing_model, submissiontype, bodyContent, profileName, next) => {
    try {
        // console.log('insertMessageInSentMasterAPI: ' + mobileno);
        let query;
        let values;
        if (id == 0) {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,direction,contactno,msg_setting_id, countrycode, rate, billing, pricing_model, submissiontype, body_content, profile_name, billingdt)" +
                " VALUES(((SELECT MAX( requestid ) FROM ezb_message_sent_master C) + 1),?,?,?,?,?,NULL,NULL,NOW(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())";
            values = [botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, 0, 0, 0, msgType, 1, campaignid, direction, wabanumber, wabid, countrycode, rate, billing, pricing_model, submissiontype, JSON.stringify(bodyContent), profileName];

        }
        else {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(requestid,botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,campaignid,direction,contactno,msg_setting_id, countrycode, rate, billing, pricing_model, submissiontype, body_content, profile_name, billingdt)" +
                " VALUES(?,?,?,?,?,?,NULL,NULL,NOW(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())";
            values = [id, botid, userid, mobileno, JSON.stringify(objMsg), waMessageId, 0, 0, 0, msgType, campaignid, direction, wabanumber, wabid, countrycode, rate, billing, pricing_model, submissiontype, JSON.stringify(bodyContent), profileName];

        }
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

updateMessageInRequestMaster = async (ismsgsent, error, id, next) => {
    try {
        let query = "UPDATE " + TBL_MESSAGE_REQUEST_MASTER + " SET ismsgsent = ?, error = ? WHERE id = ?";
        let values = [ismsgsent, error, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

getApiKey = async (apikey, next) => {
    try {
        let query = "SELECT a.userid, a.apikey, b.userstatus FROM " + TBL_API_KEYS_MASTER + " AS a LEFT JOIN " + TBL_USERS_MASTER + " AS b ON a.userid = b.userid WHERE a.apikey = ? AND a.kstatus = ?";
        let values = [apikey, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

getTemplate = async (templateid, next) => {
    try {
        let query = "SELECT * FROM " + TBL_TEMPLATE_MASTER + " WHERE tempid = ? AND status = ?";
        let values = [templateid, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

getWabaInfo = async (userid, next) => {
    try {
        let query = "SELECT waurl, authtoken, hsmnamespace FROM " + TBL_WA_MSG_SETTINGS_MASTER + " WHERE userid = ?";
        let values = [userid, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        next(err);
    }
}

fetchMediaFileName = async (mediaid, next) => {
    try {
        let query = "SELECT medianame, mediatype FROM " + TBL_WA_MEDIA_MASTER + " WHERE mediaid = ?";
        let values = [mediaid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

fetchFlowId = async (userid, searchKeyword, next) => {
    try {
        // let query = "SELECT count(1) AS c, flowid FROM " + TBL_FLOWBUILDER_MASTER + " WHERE userid = ? AND LOWER(keywords) LIKE LOWER(?)";
        // let values = [userid, '%' + searchKeyword + '%'];
        // let query = "SELECT count(1) AS c, flowid FROM " + TBL_FLOWBUILDER_MASTER + " WHERE userid = ? AND LOWER(keywords) RLIKE LOWER(?)";
        // let values = [userid, '[[:<:]]' + searchKeyword + '[[:>:]]'];
        let query = "SELECT count(1) AS c, flowid FROM " + TBL_FLOWBUILDER_MASTER + " WHERE userid = ? AND FIND_IN_SET(LOWER(?),LOWER(keywords))";
        let values = [userid, searchKeyword];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

fetchFlowSession = async (mobileno, userId, next) => {
    try {
        // let query = "SELECT id, COUNT(1) AS session, flowid, next_message_id, current_message_id, is_node_option, current_message_type," +
        //     " is_placeholder, placeholder, is_variant" +
        //     " FROM " + TBL_FLOWBUILDER_SESSION + " WHERE mobileno = ? AND (TIME_TO_SEC(TIMEDIFF(NOW(), session_createdt)) / ?) <=? AND is_session_end = ?";

        // let query = "SELECT a.mobileno, a.id, COUNT(1) AS session, a.flowid, a.next_message_id, a.current_message_id, a.is_node_option, a.current_message_type," +
        //     " a.is_placeholder, a.placeholder, a.is_variant, b.is_validator, b.validator, b.error_message" +
        //     " FROM ezb_flowbuilder_session AS a, ezb_flowbuilder_attributes AS b" +
        //     " WHERE mobileno = ? AND (TIME_TO_SEC(TIMEDIFF(NOW(), session_createdt)) / ?) <=? AND is_session_end = ?" +
        //     " AND a.id = b.flowid AND a.current_message_id = b.current_message_id AND a.userid = ?";
        // // " AND a.current_message_id = b.current_message_id";

        // let values = [mobileno, 3600, 24, 0, userId];

    //     let query = "SELECT a.mobileno, a.id, COUNT(1) AS session, a.flowid, a.next_message_id, a.current_message_id, a.is_node_option, a.current_message_type," +
    //     " a.is_placeholder, a.placeholder, a.is_variant, c.is_validator, c.validator, c.error_message" +
    //     " FROM ezb_flowbuilder_session AS a, ezb_flowbuilder_attributes AS b, ezb_flowbuilder_node AS c" +
    //     " WHERE mobileno = ? AND (TIME_TO_SEC(TIMEDIFF(NOW(), session_createdt)) / ?) <=? AND is_session_end = ?" +
    //     " AND a.id = b.flowid AND a.current_message_id = b.current_message_id AND a.userid = ? AND c.id = a.current_message_id";
    // // " AND a.current_message_id = b.current_message_id";

    // let values = [mobileno, 3600, 24, 0, userId];

    let query = "SELECT a.mobileno, a.id, COUNT(1) AS session, a.flowid, a.next_message_id, a.current_message_id, a.is_node_option, a.current_message_type," +
    " a.is_placeholder, a.placeholder, a.is_variant, c.is_validator, c.validator, c.error_message" +
    " FROM ezb_flowbuilder_session AS a, ezb_flowbuilder_attributes AS b, ezb_flowbuilder_node AS c" +
    " WHERE mobileno = ? AND is_session_end = ?" +
    " AND a.id = b.flowid AND a.current_message_id = b.current_message_id AND a.userid = ? AND c.id = a.current_message_id";
// " AND a.current_message_id = b.current_message_id";

let values = [mobileno, 0, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

setFlowSession = async (mobileno, flowID, userId, next_message_id, current_message_id, type, payload, placeholder, next) => {
    try {
        let is_node_option = 0;
        let is_livechat = 0;
        if (type == "List") {
            is_node_option = 1;
        }
        else if (type == "Button") {
            is_node_option = 1;
        }
        else if (type == "Condition") {
            is_node_option = 1;
        }
        else if (type == "Question" && payload.variants != undefined) {
            is_node_option = 1;
        }
        else if (type == "LiveChat") {
            is_livechat = 1;
        }

        let is_placeholder = 0;
        let placeholderkey = null;
        if (placeholder != null) {
            if (placeholder.length > 0) {
                is_placeholder = 1;
                placeholderkey = placeholder;
            }
        }

        let query = "INSERT INTO " + TBL_FLOWBUILDER_SESSION + "(flowid,userid,mobileno,next_message_id,current_message_id,current_message_type,session_createdt,is_session_created,session_enddt,is_session_end,is_node_option,is_placeholder,placeholder,is_variant,is_livechat)" +
            " VALUES(?,?,?,?,?,?,NOW(),1,NULL,0,?,?,?,?,?)";
        let values = [flowID, userId, mobileno, next_message_id, current_message_id, type, is_node_option, is_placeholder, placeholderkey, is_node_option, is_livechat];
        let rows = await dbpool.query(query, values);
        next(null, rows[0].insertId);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

fetchInitialMessage = async (flowID, next) => {
    try {
        let query = "SELECT id, next_message_id, node_body, typenode, placeholder, is_placeholder, validator, is_validator," +
            " error_message, is_webhook, webhook FROM " + TBL_FLOWBUILDER_NODE + " WHERE flow_id = ? AND startnode = ?";
        let values = [flowID, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchNextMessage = async (flowID, next_message_id, next) => {
    try {
        let query = "SELECT id, next_message_id, node_body, typenode, placeholder, is_placeholder, validator, is_validator," +
            " error_message, is_webhook, webhook FROM " + TBL_FLOWBUILDER_NODE + " WHERE flow_id = ? AND id = ?";
        let values = [flowID, next_message_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchNextNodeOption = async (flowID, inputText, contactno, next) => {
    try {
        let query = "SELECT a.id, a.next_message_id, a.node_body, a.typenode, a.placeholder, a.is_placeholder, a.validator, a.is_validator," +
            " a.error_message, a.is_webhook, a.webhook FROM ezb_flowbuilder_node AS a, ezb_flowbuilder_node_option AS b, ezb_flowbuilder_session AS c" +
            " WHERE a.id = b.next_node_id AND a.flow_id = ? AND LOWER(b.opt_value) = LOWER(?) AND b.nodeid = c.current_message_id" +
            " AND c.mobileno = ? AND c.is_session_end = ?";

        // let query = "SELECT a.id, a.next_message_id, a.node_body, a.typenode, a.placeholder, a.is_placeholder, a.validator, a.is_validator," +
        // " a.error_message, a.is_webhook, a.webhook FROM ezb_flowbuilder_node AS a, ezb_flowbuilder_node_option AS b, ezb_flowbuilder_session AS c" +
        // " WHERE a.flow_id = ? AND LOWER(b.opt_value) = LOWER(?) AND b.nodeid = c.current_message_id AND a.id = c.next_message_id";
        let values = [flowID, inputText, contactno, 0];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

updateNextMessageIdInSession = async (id, next_message_id, current_message_id, is_node_option, type, placeholder, next) => {
    try {
        let query = null;
        let value = null;

        let is_placeholder = 0;
        let placeholderkey = null;
        if (placeholder != null) {
            if (placeholder.length > 0) {
                is_placeholder = 1;
                placeholderkey = placeholder;
            }
        }

        let is_livechat = 0;
        if (type == "LiveChat") {
            is_livechat = 1;
        }


        if (next_message_id > 0 || is_livechat == 1) {
            query = "UPDATE " + TBL_FLOWBUILDER_SESSION + " SET next_message_id = ?, current_message_id = ?, is_node_option = ?, current_message_type = ?, is_placeholder = ?, placeholder = ?, is_variant = ?, is_livechat = ? WHERE id = ?";
            values = [next_message_id, current_message_id, is_node_option, type, is_placeholder, placeholderkey, is_node_option, is_livechat, id];
        }
        else {
            query = "UPDATE " + TBL_FLOWBUILDER_SESSION + " SET next_message_id = ?, current_message_id = ?, is_node_option = ?, current_message_type = ?, is_session_end = ?, session_enddt = NOW(), is_placeholder = ?, placeholder = ?, is_variant = ?, is_livechat = ? WHERE id = ?";
            values = [next_message_id, current_message_id, is_node_option, type, 1, is_placeholder, placeholderkey, is_node_option, is_livechat, id];
        }
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchNextMessageModule = async (flowID, next_message_id, next) => {
    try {
        let query = "SELECT next_message_id, node_body, typenode FROM " + TBL_FLOWBUILDER_NODE + " WHERE flow_id = ? AND id = ?";
        let values = [flowID, next_message_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

setChatAttributes = async (flowid, current_message_id, attrkey, attrvalue, session_id, mobileno, messageContent, messageType, payload, next) => {
    // console.log('setChatAttributes query=================>' + JSON.stringify(payload));
    try {
        let is_placeholder = payload.nextMessageResult.is_placeholder;
        let is_validator = payload.nextMessageResult.is_validator;
        let validator = payload.nextMessageResult.validator;
        let is_webhook = payload.nextMessageResult.is_webhook;
        let webhook = payload.nextMessageResult.webhook;
        let error_message = payload.nextMessageResult.error_message;

        let query = "INSERT INTO " + TBL_FLOWBUILDER_ATTRIBUTE + "(flowid,current_message_id,attrkey,attrvalue,session_id,session_mobile,message_content,message_type,is_placeholder,is_validator,validator,is_webhook,webhook,error_message)" +
            " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        let values = [flowid, current_message_id, attrkey, attrvalue, session_id, mobileno, messageContent, messageType, is_placeholder, is_validator, validator, is_webhook, webhook, error_message];
        let rows = await dbpool.query(query, values);
        next(null, rows[0].insertId);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

updateChatAttributes = async (session_id, attrval, next) => {
    try {
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET attrvalue = ? WHERE session_id = ?";
        let values = [attrval, session_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

fetchLastTextMessage = async (mobileno, userId, next) => {
    try {
        // let query = "SELECT session_id FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE id = (SELECT MAX(id) FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE message_type = 'text' AND attrvalue IS NULL AND session_mobile = ?)";
        // let query = "SELECT MAX(a.id), a.session_id, b.flowid FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " AS a, " + TBL_FLOWBUILDER_SESSION + " AS b" +
        //     " WHERE message_type = 'text' AND attrvalue IS NULL AND session_mobile = ? AND a.flowid = b.id";

        // let query = "SELECT session_id FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE id = (SELECT MAX(id) FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE message_type = 'text' AND session_mobile = ?)";
        // let query = "SELECT session_id FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE id = (SELECT MAX(id) FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE message_type IN ('text','interactive') AND session_mobile = ?)";
        // let query = "SELECT session_id FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE id = (SELECT MAX(id) FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE message_type IN ('text') AND session_mobile = ?)";
        let query = "SELECT session_id FROM ezb_flowbuilder_attributes"+
        " WHERE id = (SELECT MAX(a.id) FROM ezb_flowbuilder_attributes AS a, ezb_flowbuilder_session AS b"+
        " WHERE a.message_type IN ('text') AND a.session_mobile = ? AND b.id = a.flowid AND b.userid = ?)";
        let values = [mobileno, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

updateTextAttributes = async (session_id, attrval, next) => {
    try {
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET attrvalue = ? WHERE session_id = ?";
        let values = [attrval, session_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

fetchValidator = async (mobileno, next) => {
    try {
        let query = "SELECT b.error_message, b.validator, b.is_validator FROM ezb_flowbuilder_session AS a, ezb_flowbuilder_attributes AS b" +
            " WHERE a.current_message_id = b.current_message_id" +
            " AND a.mobileno = b.session_mobile" +
            " AND a.id = b.flowid" +
            " AND b.attrvalue IS NULL" +
            " AND a.mobileno = ? AND a.current_message_type = ?";

        let values = [mobileno, 'Question'];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

isFlowChatKeyword = async (searchKeyword, userId, next) => {
    try {
        // let query = "SELECT count(1) AS c FROM " + TBL_FLOWBUILDER_MASTER + " WHERE LOWER(keywords) RLIKE LOWER(?)";
        // let values = ['[[:<:]]' + searchKeyword + '[[:>:]]'];
        let query = "SELECT count(1) AS c FROM ezb_flowbuilder_master WHERE FIND_IN_SET(LOWER(?),LOWER(keywords)) AND userid = ?";
        let values = [searchKeyword, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

fetchLastTextMessageWithPlaceholder = async (mobileno, placeholder, next) => {
    try {
        // let query = "SELECT MAX(a.id), a.attrvalue FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " AS a, " + TBL_FLOWBUILDER_SESSION + " AS b" +
        //     " WHERE message_type = 'text' AND attrkey = ? AND session_mobile = ? AND a.flowid = b.id";

        let query = "SELECT attrvalue FROM ezb_flowbuilder_attributes WHERE id = " +
            "(SELECT MAX(a.id) FROM ezb_flowbuilder_attributes AS a, ezb_flowbuilder_session AS b" +
            " WHERE a.message_type = 'text' AND a.attrkey = ? AND a.session_mobile = ? AND a.flowid = b.id)"
        let values = [placeholder, mobileno];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

checkConditionInNodeOption = async (flowID, inputText, contactno, next) => {
    try {
        let query = "SELECT a.id, a.next_message_id, a.node_body, a.typenode, a.placeholder, a.is_placeholder, a.validator, a.is_validator," +
            " a.error_message, a.is_webhook, a.webhook FROM ezb_flowbuilder_node AS a, ezb_flowbuilder_node_option AS b, ezb_flowbuilder_session AS c" +
            " WHERE a.id = b.next_node_id AND b.nodeid = ? AND LOWER(b.opt_value) = LOWER(?) AND b.nodeid = c.current_message_id"+
            " AND c.mobileno = ? AND c.is_session_end = ?";
        // let query = "SELECT a.id, a.next_message_id, a.node_body, a.typenode, a.placeholder, a.is_placeholder, a.validator, a.is_validator," +
        // " a.error_message, a.is_webhook, a.webhook FROM ezb_flowbuilder_node AS a, ezb_flowbuilder_node_option AS b, ezb_flowbuilder_session AS c" +
        // " WHERE b.nodeid = ? AND LOWER(b.opt_value) = LOWER(?) AND b.nodeid = c.current_message_id AND a.id = c.next_message_id";
        let values = [flowID, inputText, contactno, 0];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchPlaceholderValue = async (mobileno, attrkey, next) => {
    try {
        let query = "SELECT attrvalue FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE id =" +
            "(SELECT MAX(id) FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE message_type IN('text','interactive') AND attrkey = ? AND session_mobile = ?)";

        let values = [attrkey, mobileno];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchWebhookPlaceholderValue = async (mobileno, attrkey, next) => {
    try {
        let query = "SELECT attrvalue FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE id =" +
            "(SELECT MAX(id) FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE message_type = 'webhook' AND attrkey = ? AND session_mobile = ?)";

        let values = [attrkey, mobileno];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

updateMessageIdForFlowId = async () => {
    try {
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET attrvalue = ? WHERE session_id = ?";
        let values = [attrval, session_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

updateMessageIdByAttrId = async (id, session_id, next) => {
    try {
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET session_id = ? WHERE id = ?";
        let values = [session_id, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

fetchPreviousButtonClick = async (mobileno, session_id, attrvalue, next) => {
    try {
        let query = "SELECT a.id, COUNT(1) AS session, a.flowid, c.next_node_id AS next_message_id, c.nodeid AS current_message_id, a.is_node_option," +
            " d.typenode AS current_message_type," +
            " d.is_placeholder, d.placeholder, a.is_variant, d.is_validator, d.validator, d.error_message" +
            " FROM ezb_flowbuilder_session AS a, ezb_flowbuilder_attributes AS b, ezb_flowbuilder_node_option AS c, ezb_flowbuilder_node AS d" +
            " WHERE mobileno = ? AND b.session_id = ? AND LOWER(c.opt_value) = LOWER(?)" +
            " AND a.id = b.flowid AND b.current_message_id = c.nodeid AND d.id = c.next_node_id";

        let values = [mobileno, session_id, attrvalue];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

updatePreviousButtonNextMessageIdInSession = async (id, next_message_id, current_message_id, is_node_option, type, placeholder, next) => {
    try {
        let query = null;
        let value = null;

        let is_placeholder = 0;
        let placeholderkey = null;
        if (placeholder != null) {
            if (placeholder.length > 0) {
                is_placeholder = 1;
                placeholderkey = placeholder;
            }
        }

        let is_livechat = 0;
        if (type == "LiveChat") {
            is_livechat = 1;
        }


        if (next_message_id > 0 || is_livechat == 1) {
            query = "UPDATE " + TBL_FLOWBUILDER_SESSION + " SET next_message_id = ?, current_message_id = ?, is_node_option = ?, current_message_type = ?, is_placeholder = ?, placeholder = ?, is_variant = ?, is_session_end = ?, is_livechat = ? WHERE id = ?";
            values = [next_message_id, current_message_id, is_node_option, type, is_placeholder, placeholderkey, is_node_option, 0, is_livechat, id];
        }
        else {
            query = "UPDATE " + TBL_FLOWBUILDER_SESSION + " SET next_message_id = ?, current_message_id = ?, is_node_option = ?, current_message_type = ?, is_session_end = ?, session_enddt = NOW(), is_placeholder = ?, placeholder = ?, is_variant = ?, is_livechat = ? WHERE id = ?";
            values = [next_message_id, current_message_id, is_node_option, type, 1, is_placeholder, placeholderkey, is_node_option, is_livechat, id];
        }
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

updateWebhookByAttrId = async (id, session_id, attrvalue, next) => {
    try {
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET session_id = ?, attrvalue = ? WHERE id = ?";
        let values = [session_id, attrvalue, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

updateWebhookAttrValueById = async (id, attrvalue, next) => {
    try {
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET attrvalue = ? WHERE id = ?";
        let values = [attrvalue, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log('updateWebhookAttrValueById : ' + err);
        next(err);
    }
}

fetchNextNodeOptionWebhook = async (inputText, contactno, next) => {
    try {
        let query = "SELECT c.id, c.flowid, a.next_message_id, a.id AS current_message_id, a.node_body, a.typenode, a.placeholder, a.is_placeholder, a.validator, a.is_validator," +
            " a.error_message, a.is_webhook, a.webhook FROM ezb_flowbuilder_node AS a, ezb_flowbuilder_node_option AS b, ezb_flowbuilder_session AS c" +
            " WHERE a.id = b.next_node_id AND a.flow_id = c.flowid AND LOWER(b.opt_value) = LOWER(?) AND b.nodeid = c.current_message_id"+
            " AND c.mobileno = ? AND c.is_session_end = ?";
        let values = [inputText, contactno, 0];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchEmailData = async (current_message_id, next) => {
    try {
        let query = "SELECT is_email_set, email_ids, email_content FROM " + TBL_FLOWBUILDER_NODE + " WHERE id = ?";
        let values = [current_message_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchLiveChatCustomMessage = async (mobileno, next) => {
    try {
        let query = "SELECT a.live_chat_custom_message FROM ezb_flowbuilder_master AS a, ezb_flowbuilder_session AS b" +
            " WHERE a.flowid = b.flowid AND b.mobileno = ? and b.is_livechat = ?";
        let values = [mobileno, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0][0].live_chat_custom_message);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchLiveChatSettings = async (mobileno, userId, next) => {
    try {
        let query = "SELECT a.live_chat_webhook, a.live_chat_token, COUNT(1) AS c FROM ezb_flowbuilder_master AS a, ezb_flowbuilder_session AS b" +
            " WHERE a.flowid = b.flowid AND b.mobileno = ? and b.is_livechat = ? AND b.is_session_end = ? AND a.userid = ?";
        let values = [mobileno, 1, 0, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchEndLiveChatMessage = async (mobileno, text, userId, next) => {
    try {
        let query = "SELECT a.end_chat_message, COUNT(1) AS c FROM ezb_flowbuilder_master AS a, ezb_flowbuilder_session AS b" +
            " WHERE a.flowid = b.flowid AND b.mobileno = ? AND b.is_livechat = ? AND b.is_session_end = ? AND LOWER(end_chat_keyword)= LOWER(?) AND a.userid = ?";
        let values = [mobileno, 1, 0, text, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

endLiveChatMessage = async (mobileno, userId, next) => {
    try {
        let query = "UPDATE ezb_flowbuilder_session SET is_session_end = ? WHERE is_livechat = ? AND mobileno = ? AND is_session_end = ? AND userid = ?";
        let values = [1, 1, mobileno, 0, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

checkLiveChatStatus = async (mobileno, userId, next) => {
    try {
        let query = "SELECT COUNT(1) AS c FROM ezb_flowbuilder_master AS a, ezb_flowbuilder_session AS b" +
            " WHERE a.flowid = b.flowid AND b.mobileno = ? AND b.is_livechat = ? AND b.is_session_end = ? AND a.userid = ?";
        let values = [mobileno, 1, 0, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchPushWebhookData = async (sessionId, userId, next) => {
    try {
        let query = "SELECT a.webhook, c.session_mobile, c.message_content, c.attrkey, c.attrvalue" +
            " FROM ezb_flowbuilder_master AS a, ezb_flowbuilder_session AS b, ezb_flowbuilder_attributes AS c" +
            " WHERE a.flowid = b.flowid AND b.id = c.flowid AND a.userid = b.userid" +
            " AND c.session_id = ? AND a.userid = ?";

        let values = [sessionId, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

fetchCurrentSession = async (mobileno, userId, bodytext, next) => {
    try {
        let query = "SELECT GROUP_CONCAT(id SEPARATOR ',') AS id FROM ezb_flowbuilder_session WHERE mobileno = ? AND userid = ? AND is_session_end = ?" +
            " AND flowid = (SELECT flowid FROM ezb_flowbuilder_master WHERE userid = ? AND FIND_IN_SET(LOWER(?),LOWER(keywords)))";

        let values = [mobileno, userId, 0, userId, bodytext];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

resetSessionByFlowSessionId = async(id, next)=>{
    try {
        let query = "UPDATE ezb_flowbuilder_session SET is_session_end = ? WHERE id IN ("+id+")";

        let values = [1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

resetSessionByFlowUserId = async(userId, contactno, next)=>{
    try {
        let query = "UPDATE ezb_flowbuilder_session SET is_session_end = ? WHERE userid = ? AND mobileno = ?";

        let values = [1, userId, contactno];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

module.exports = {
    fetchMessages,
    fetchScheduledMessages,
    fetchUserStatus,
    insertMessageInSentMaster,
    insertMessageInSentMasterAPI,
    updateMessageInRequestMaster,
    getApiKey,
    getTemplate,
    getWabaInfo,
    fetchMediaFileName,
    fetchFlowId,
    fetchFlowSession,
    setFlowSession,
    fetchInitialMessage,
    fetchNextMessage,
    updateNextMessageIdInSession,
    fetchNextNodeOption,
    setChatAttributes,
    updateChatAttributes,
    fetchLastTextMessage,
    fetchValidator,
    isFlowChatKeyword,
    fetchLastTextMessageWithPlaceholder,
    checkConditionInNodeOption,
    fetchPlaceholderValue,
    updateMessageIdByAttrId,
    fetchPreviousButtonClick,
    updatePreviousButtonNextMessageIdInSession,
    updateWebhookByAttrId,
    updateWebhookAttrValueById,
    fetchNextNodeOptionWebhook,
    fetchWebhookPlaceholderValue,
    fetchEmailData,
    fetchLiveChatCustomMessage,
    fetchLiveChatSettings,
    fetchEndLiveChatMessage,
    endLiveChatMessage,
    checkLiveChatStatus,
    fetchPushWebhookData,
    fetchCurrentSession,
    resetSessionByFlowSessionId,
    resetSessionByFlowUserId
}