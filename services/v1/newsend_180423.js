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
    TBL_FLOWBUILDER_ATTRIBUTE,
    TBL_NON_CATALOG_MASTER,
    TBL_PURCHASE_MASTER,
    TBL_SYSTEM_CONFIG_MASTER,
    TBL_NON_CATALOG_PRODUCT_COMMON_DETAILS
} = require('../../constants/tables');

const MSG_LIMIT = 50;


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
};

updateChatAttributes = async (session_id, attrval, next) => {
    try {
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET attrvalue = ? WHERE session_id = ? AND attrvalue IS NULL";
        let values = [attrval, session_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);


    }
};

updateInteractiveChatAttributes = async (session_id, attrval, next) => {
    try {
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET attrvalue = ? WHERE session_id = ?";
        let values = [attrval, session_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);


    }
};

resetChatAttributes = async (session_id, attrval, next) => {
    try {
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET attrvalue = ? WHERE session_id = ?";
        let values = [attrval, session_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);


    }
};

fetchLastTextMessage = async (mobileno, userId, next) => {
    try {
        let query = "SELECT session_id FROM ezb_flowbuilder_attributes" +
            " WHERE id = (SELECT MAX(a.id) FROM ezb_flowbuilder_attributes AS a, ezb_flowbuilder_session AS b" +
            " WHERE a.message_type IN ('text') AND a.session_mobile = ? AND b.id = a.flowid AND b.userid = ?)";
        let values = [mobileno, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

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
};

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
};

resetSessionByFlowUserId = async (userId, contactno, next) => {
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
};

isFlowChatKeyword = async (searchKeyword, userId, next) => {
    try {
        // let query = "SELECT count(1) AS c FROM " + TBL_FLOWBUILDER_MASTER + " WHERE LOWER(keywords) RLIKE LOWER(?)";
        // let values = ['[[:<:]]' + searchKeyword + '[[:>:]]'];
        let query = "SELECT count(1) AS c FROM ezb_flowbuilder_master WHERE FIND_IN_SET(LOWER(?),LOWER(keywords)) AND userid = ? AND status = ?";
        let values = [searchKeyword, userId, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

fetchFlowSession = async (mobileno, userId, next) => {
    try {
        let query = "SELECT d.status, a.mobileno, a.id, COUNT(1) AS session, a.flowid, a.next_message_id, a.current_message_id, a.is_node_option, a.current_message_type," +
            " a.is_placeholder, a.placeholder, a.is_variant, c.is_validator, c.validator, c.error_message" +
            " FROM ezb_flowbuilder_session AS a, ezb_flowbuilder_attributes AS b, ezb_flowbuilder_node AS c, ezb_flowbuilder_master AS d" +
            " WHERE mobileno = ? AND is_session_end = ?" +
            " AND a.id = b.flowid AND a.current_message_id = b.current_message_id AND a.userid = ? AND c.id = a.current_message_id" +
            " AND a.flowid = d.flowid AND d.status = ?";
        // " AND a.current_message_id = b.current_message_id";

        let values = [mobileno, 0, userId, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        sessid;
        console.log(err);
        next(err);
    }
};

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
};

resetSessionByFlowSessionId = async (id, next) => {
    try {
        let query = "UPDATE ezb_flowbuilder_session SET is_session_end = ? WHERE id IN (" + id + ")";

        let values = [1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchFlowId = async (userid, searchKeyword, next) => {
    try {
        let query = "SELECT count(1) AS c, flowid FROM " + TBL_FLOWBUILDER_MASTER + " WHERE userid = ? AND FIND_IN_SET(LOWER(?),LOWER(keywords)) AND status = ?";
        let values = [userid, searchKeyword, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log('fetchFlowId: ' + err);
        next(err);
    }
};


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
};

fetchNextNodeOption = async (flowID, inputText, contactno, next) => {
    try {
        let query = "SELECT a.id, a.next_message_id, a.node_body, a.typenode, a.placeholder, a.is_placeholder, a.validator, a.is_validator," +
            " a.error_message, a.is_webhook, a.webhook FROM ezb_flowbuilder_node AS a, ezb_flowbuilder_node_option AS b, ezb_flowbuilder_session AS c" +
            " WHERE a.id = b.next_node_id AND a.flow_id = ? AND LOWER(b.opt_value) = LOWER(?) AND b.nodeid = c.current_message_id" +
            " AND c.mobileno = ? AND c.is_session_end = ?";


        let values = [flowID, inputText, contactno, 0];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

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
};

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
};

fetchAccessToken = async (next) => {
    try {
        let query = "SELECT VALUE FROM `ezb_system_config` WHERE paramname  = ?";
        let values = ['ACCESS_TOKEN'];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

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
};

updateMessageIdByAttrId = async (id, session_id, next) => {
    try {
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET session_id = ? WHERE id = ?";
        let values = [session_id, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};


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
};

insertMessageInSentMaster = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, direction, wabanumber, wabid, bodyContent, next) => {
    try {
        //console.log('insertMessageInSentMaster: ' + mobileno);
        let query;
        let values;
        if (id == 0) {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,direction,contactno,msg_setting_id,body_content,billingdt)" +
                " VALUES(?,?,?,?,?,NULL,NULL,NOW(),?,?,?,?,?,?,?,?,?,?,NOW())";
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
        console.log(err);
        next(err);
    }
};

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
};

insertMessageInSentMasterAPI = async (id, botid, userid, mobileno, objMsg, waMessageId, msgType, campaignid, direction, wabanumber, wabid, countrycode, rate, billing, pricing_model, submissiontype, bodyContent, profileName, next) => {
    try {
        // console.log('insertMessageInSentMasterAPI: ' + mobileno);
        let query;
        let values;
        if (id == 0) {
            query = "INSERT INTO " + TBL_MESSAGE_SENT_MASTER + "(botid,userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,appid,status,readstatus,messagetype,source,campaignid,direction,contactno,msg_setting_id, countrycode, rate, billing, pricing_model, submissiontype, body_content, profile_name, billingdt)" +
                " VALUES(?,?,?,?,?,NULL,NULL,NOW(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())";
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
};

fetchLiveChatSettings = async (mobileno, userId, next) => {
    try {
        let query = "SELECT a.live_chat_webhook, a.live_chat_token, COUNT(1) AS c FROM ezb_flowbuilder_master AS a, ezb_flowbuilder_session AS b" +
            " WHERE a.flowid = b.flowid AND b.mobileno = ? and b.is_livechat = ? AND b.is_session_end = ? AND a.userid = ?";
        let values = [mobileno, 1, 0, userId];
        // let query = "Select  live_chat_webhook, live_chat_token, userid, COUNT(1) AS s  from ezb_flowbuilder_master where is_live_chat = ? and userid = ?"; 
        // let values = [1,userId];
        // let query = " select  live_chat_webhook, live_chat_token, userid from `ezb_flowbuilder_master` where is_live_chat = 1 ;"
        // let values = [1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

updateMediaChatAttributes = async (session_id, attrval, mediatype, mediaid, mediaurl, next) => {
    try {
        let query = null;
        let values = null;
        let rows = null;

        query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET attrvalue = ? WHERE session_id = ? AND attrvalue IS NULL";
        values = [attrval, session_id];
        rows = await dbpool.query(query, values);

        query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET mediatype = ?, mediaid = ?, mediaurl = ? WHERE session_id = ?";
        values = [mediatype, mediaid, mediaurl, session_id];
        rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

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
};

fetchLastTextMessageWithPlaceholder = async (mobileno, placeholder, next) => {
    try {
        // let query = "SELECT MAX(a.id), a.attrvalue FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " AS a, " + TBL_FLOWBUILDER_SESSION + " AS b" +
        //     " WHERE message_type = 'text' AND attrkey = ? AND session_mobile = ? AND a.flowid = b.id";

        let query = "SELECT LOWER(CONVERT(attrvalue USING utf8)) AS attrvalue FROM ezb_flowbuilder_attributes WHERE id = " +
            "(SELECT MAX(a.id) FROM ezb_flowbuilder_attributes AS a, ezb_flowbuilder_session AS b" +
            " WHERE a.message_type = 'text' AND a.attrkey = ? AND a.session_mobile = ? AND a.flowid = b.id)";
        let values = [placeholder, mobileno];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

checkConditionInNodeOption = async (flowID, inputText, contactno, next) => {
    try {
        let query = "SELECT a.id, a.next_message_id, a.node_body, a.typenode, a.placeholder, a.is_placeholder, a.validator, a.is_validator," +
            " a.error_message, a.is_webhook, a.webhook FROM ezb_flowbuilder_node AS a, ezb_flowbuilder_node_option AS b, ezb_flowbuilder_session AS c" +
            " WHERE a.id = b.next_node_id AND b.nodeid = ? AND LOWER(b.opt_value) = LOWER(?) AND b.nodeid = c.current_message_id" +
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
};

fetchNextNodeOptionWebhook = async (inputText, contactno, userId, next) => {
    try {
        let query = "SELECT c.id, c.flowid, a.next_message_id, a.id AS current_message_id, a.node_body, a.typenode, a.placeholder, a.is_placeholder, a.validator, a.is_validator," +
            " a.error_message, a.is_webhook, a.webhook FROM ezb_flowbuilder_node AS a, ezb_flowbuilder_node_option AS b, ezb_flowbuilder_session AS c" +
            " WHERE a.id = b.next_node_id AND a.flow_id = c.flowid AND LOWER(b.opt_value) = LOWER(?) AND b.nodeid = c.current_message_id" +
            " AND c.mobileno = ? AND c.is_session_end = ? AND c.userid = ?";
        let values = [inputText, contactno, 0, userId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

updateWebhookAttrValueById = async (id, attrvalue, next) => {
    try {
        console.log('updateWebhookAttrValueById : ' + id, attrvalue);
        let query = "UPDATE " + TBL_FLOWBUILDER_ATTRIBUTE + " SET attrvalue = ? WHERE id = ?";
        let values = [attrvalue, id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log('updateWebhookAttrValueById : ' + err);
        next(err);
    }
};

fetchPlaceholderValue = async (mobileno, attrkey, userId, next) => {
    try {
        // let query = "SELECT attrvalue FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE id =" +
        //     "(SELECT MAX(id) FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE message_type IN('text','interactive') AND attrkey = ? AND session_mobile = ?)";

        let query = "SELECT attrvalue FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " WHERE id =" +
            "(SELECT MAX(a.id) FROM " + TBL_FLOWBUILDER_ATTRIBUTE + " AS a," + TBL_FLOWBUILDER_SESSION + " AS b" +
            " WHERE a.message_type IN('text','interactive','webhook') AND a.attrkey = ? AND a.session_mobile = ?" +
            " AND a.flowid = b.id AND b.userid = ? AND b.is_session_end IN (?,?))";

        let values = [attrkey, mobileno, userId, 0, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchTemplate = async (templateName, userId, wabaNumber, next) => {
    try {
        let query = "SELECT a.*, b.hsmnamespace FROM ezb_wa_templates AS a, ezb_wa_msg_settings AS b" +
            " WHERE a.userid = b.userid AND a.temptitle = ? and a.userid = ? AND b.wanumber LIKE ?";
        let values = [templateName, userId, '%' + wabaNumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

updatewabaapprovalresponseid = async (status, msgtempid, title, desc, next) => {
    try {
        let query = "UPDATE ezb_wa_templates set status = ?, error_title = ?, error_desc = ? where waba_approval_response_id = ? ;";
        let values = [status, msgtempid];
        let rows = await dbpool.query(query, values);
        //console.log("\n rows == "+JSON.stringify(rows));
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

updatephonenumbernameupdate = async (requestname, wanumber, next) => {
    try {
        let query = "Update ezb_wa_msg_settings set phone_number_name_update = ? where wanumber = ?;";
        let values = [requestname, '+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

updatephonenumberqualityupdate = async (currentlimit, eventquality, wanumber, next) => {
    try {
        let query = "update ezb_wa_msg_settings set currentlimit = ?, eventquality = ? where wanumber = ?";
        let values = [currentlimit, eventquality, '+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

// fetchEmailData = async (current_message_id, next) => {
//     try {
//         let query = "SELECT is_email_set, email_ids, email_content FROM " + TBL_FLOWBUILDER_NODE + " WHERE id = ?";
//         let values = [current_message_id];
//         let rows = await dbpool.query(query, values);
//         next(null, rows[0]);
//     }
//     catch (err) {
//         console.log(err);
//         next(err);
//     }
// };

fetchEmailData = async (userId, wa_id, next) => {
    try {
        let query = "SELECT is_email_set, email_ids, email_content, email_subject  FROM " + TBL_FLOWBUILDER_NODE + " WHERE id = (SELECT current_message_id FROM ezb_flowbuilder_session WHERE userid = ? AND mobileno = ? ORDER BY id DESC LIMIT 1)";
        let values = [userId, wa_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

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
};

customecallbackpayloadflag = async (callback_wanumber, next) => {
    try {
        let query = "Select custom_callback_payload_flag FROM ezb_wa_msg_settings where wanumber like ?;";
        let values = ['%' + callback_wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchOtp = async (userid, contactno, next) => {
    try {
        let query = "SELECT otp FROM ezb_flowbuilder_session WHERE mobileno LIKE ? AND is_session_end = ? AND userid = ? AND isotp = ?";
        let values = [contactno, 0, userid, 1];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

getWaSettingsForTemplateStatus = async (msgtempid, next) => {
    try {
        let query = "select wanumber,custom_callback,custom_parameters from ezb_wa_msg_settings as a, ezb_wa_templates as b where a.userid=b.userid and b.waba_approval_response_id = ?";
        let values = [msgtempid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

checkResponseMessageID = async (waMessageId, next) => {
    try {
        let query = "SELECT COUNT(1) AS C FROM ezb_message_sent_master WHERE messageid = ?";
        let values = [waMessageId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};


unsubkeyword = async (wanumber, next) => {
    try {
        let query = "Select stopword from ezb_wa_msg_settings where wanumber like ?;";
        let values = ['%' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

getDataFromNonCatalogueMaster = async (userId, productRetailerId) => {
    try {
        query = 'SELECT * FROM ' + TBL_NON_CATALOG_MASTER + ' WHERE userid = ? AND productretailerid = ?';
        values = [userId, productRetailerId];
        rows = await dbpool.query(query, values);
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};


insertDataIntoPurchaseMaster = async (userId, mobileNumber, nonCatalogueId, productRetailerId, orderId, messageID, paymentReferenceId, transactionId, transactionType, totalAmount, currency, orderStatus, orderFlag, catalogueType, product_image) => {
    try {
        query = 'INSERT INTO ' + TBL_PURCHASE_MASTER + ' (userid, mobileno, non_catalog_id, product_retailer_id, orderid, order_detail_messageid, referenceid, transactionid, transaction_type, total_amount, currency, timestamp, order_status, order_flag, catalog_type, product_image) VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?)';
        values = [userId, mobileNumber, nonCatalogueId, productRetailerId, orderId, messageID, paymentReferenceId, transactionId, transactionType, totalAmount, currency, orderStatus, orderFlag, catalogueType, product_image];
        rows = await dbpool.query(query, values);
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};


updateDataIntoPurchaseMaster = async (paymentReferenceId, transactionId, transactionType, timestamp, orderStatus, orderFlag, messageID, mobileNumber) => {
    try {
        query = 'UPDATE ' + TBL_PURCHASE_MASTER + ' SET referenceid = ?, transactionid =?, transaction_type =? , timestamp = ?, order_status =? , order_flag =?, payment_status_message_id = ? WHERE mobileno = ? AND orderid = ?';
        values = [paymentReferenceId, transactionId, transactionType, timestamp, orderStatus, orderFlag, messageID, mobileNumber, paymentReferenceId];
        rows = await dbpool.query(query, values);
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};

customCallbackPayloadData = async (wanumber) => {
    try {
        query = 'SELECT * FROM ' + TBL_WA_MSG_SETTINGS_MASTER + ' WHERE wanumber LIKE ?';
        values = ['%' + wanumber];
        rows = await dbpool.query(query, values);
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};

insertPaymentMessageInSentMaster = async (userId, mobileNumber, data, msgId1, messageTypeNumber, direction, wanumber, msgSettingId, countryCode) => {
    try {
        query = 'INSERT INTO ' + TBL_MESSAGE_SENT_MASTER + ' (botid, userid, mobileno, wabapayload, body_content, messageid, errcode, errdesc, createdt, appid, status, readstatus, messagetype, source, campaignid,direction, contactno, msg_setting_id, countrycode, rate, pricing_model, submissiontype, sentdt, billingdt)' +
            ' VALUES (?,?,?,?,?,?,?,?, NOW(),?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())';
        values = [null, userId, mobileNumber, data, data, msgId1, null, null, 0, 0, 0, messageTypeNumber, 1, 0, direction, '+' + wanumber, msgSettingId, countryCode, '0.00000', 'CBP', 'NOTIFICATION'];
        rows = await dbpool.query(query, values);
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};


fetchSystemAccessToken = async () => {
    try {
        let paramName = 'ACCESS_TOKEN';
        query = 'SELECT value FROM ' + TBL_SYSTEM_CONFIG_MASTER + ' WHERE paramname = ?';
        values = [paramName];
        rows = await dbpool.query(query, values);
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};

getPaymentName = async (userId) => {
    try {
        query = 'SELECT payment_name FROM ' + TBL_NON_CATALOG_PRODUCT_COMMON_DETAILS + ' WHERE userid = ?';
        values = [userId];
        rows = await dbpool.query(query, values);
        return rows[0];
    } catch (err) {
        console.log(err);
    }
};

getPaymentNameForWebhook = async (userId, next) => {
    try {
        query = 'SELECT * FROM ' + TBL_NON_CATALOG_PRODUCT_COMMON_DETAILS + ' WHERE userid = ?';
        values = [userId];
        rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);

    }
};




module.exports = {
    checkLiveChatStatus,
    updateChatAttributes,
    fetchLastTextMessage,
    fetchPreviousButtonClick,
    updatePreviousButtonNextMessageIdInSession,
    resetSessionByFlowUserId,
    isFlowChatKeyword,
    fetchFlowSession,
    fetchCurrentSession,
    resetSessionByFlowSessionId,
    fetchFlowId,
    fetchInitialMessage,
    fetchNextNodeOption,
    fetchNextMessage,
    setFlowSession,
    fetchAccessToken,
    updateNextMessageIdInSession,
    updateMessageIdByAttrId,
    setChatAttributes,
    insertMessageInSentMaster,
    fetchPushWebhookData,
    insertMessageInSentMasterAPI,
    fetchLiveChatSettings,
    updateMediaChatAttributes,
    fetchEndLiveChatMessage,
    endLiveChatMessage,
    fetchLastTextMessageWithPlaceholder,
    checkConditionInNodeOption,
    fetchNextNodeOptionWebhook,
    updateWebhookAttrValueById,
    fetchPlaceholderValue,
    fetchTemplate,
    updatewabaapprovalresponseid,
    updatephonenumbernameupdate,
    updatephonenumberqualityupdate,
    fetchEmailData,
    customecallbackpayloadflag,
    fetchOtp,
    resetChatAttributes,
    updateInteractiveChatAttributes,
    getWaSettingsForTemplateStatus,
    checkResponseMessageID,
    unsubkeyword,
    getDataFromNonCatalogueMaster,
    insertDataIntoPurchaseMaster,
    updateDataIntoPurchaseMaster,
    customCallbackPayloadData,
    insertPaymentMessageInSentMaster,
    fetchSystemAccessToken,
    getPaymentName,
    getPaymentNameForWebhook
}


