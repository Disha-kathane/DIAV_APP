const wabot_db = require('../../db/wabot');
var appLoggers = require('../../applogger.js');
const {

    TBL_USERS_MASTER

} = require('../../constants/tables');

const addUser = (user) => {
    return wabot_db.query(`insert into users(name, age) values(${user.name}, ${user.age})`);
};

const getUserSettings = async (userId) => {
    const query = 'select usrnm, usrpass, authts, authvalidity, authtoken, waurl, wanumber, hsmnamespace from ezb_wa_msg_settings where userid = ?; ';
    const value = userId;
    const [result] = await wabot_db.query(query, value);
    return result[0];
};

const getUserSettingsFromUserId = async (userId) => {
    const query = 'select b.authtoken, b.waurl, b.wanumber, b.hsmnamespace from ezb_wa_msg_settings AS b, ezb_users AS c where b.wa_msg_setting_id = c.wanumberid and c.userid = ?; ';
    const value = userId;
    const [result] = await wabot_db.query(query, value);
    console.log(result[0]);
    return result[0];
};

const getWabanumber = async (userId) => {
    const query = 'select b.whatsapp_business_account_id from ezb_wa_msg_settings AS b, ezb_users AS c where b.wa_msg_setting_id = c.wanumberid and c.userid = ?; ';
    const value = userId;
    const [result] = await wabot_db.query(query, value);
    return result[0].whatsapp_business_account_id;
};


const updateUserSettings = async (authToken, expiryDate, waNumber, userId) => {
    const query = 'update ezb_wa_msg_settings set authtoken = ?, authvalidity = ? where userid = ? AND wanumber = ?; ';
    const value = [authToken, expiryDate, userId, waNumber];
    console.log("-----------", query, value);
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getUserId = async (apiKey) => {
    const query = 'select a.userid AS userId, b.whatsapp_business_account_id AS wabaId, b.wa_msg_setting_id from' +
        ' ezb_wa_api_keys AS a, ezb_wa_msg_settings AS b, ezb_users AS c' +
        ' where a.userid = c.userid and b.wa_msg_setting_id = c.wanumberid' +
        ' and a.apikey = ?';
    const value = [apiKey];
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0];
    }
    return {};
};

const getUserIdFromWaNumber = async (wanumber) => {
    const query = 'select c.userid AS userId, b.whatsapp_business_account_id AS wabaId, b.wa_msg_setting_id from' +
        ' ezb_wa_msg_settings AS b, ezb_users AS c' +
        ' where b.wa_msg_setting_id = c.wanumberid' +
        ' and b.wanumber = ?';
    const value = [wanumber];
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0];
    }
    return {};
};

const getExpiredUsers = async () => {
    // or DATEDIFF(NOW(),authvalidity) < 6
    const query = 'SELECT userid FROM ezb_wa_msg_settings where authvalidity is null or DATEDIFF(NOW(),authvalidity) < 1;';
    const [result] = await wabot_db.query(query);
    return result;
};

/*const getLoginExpiredUsers = async () => {    
    // or DATEDIFF(NOW(),authvalidity) < 6
    //DATEDIFF(authvalidity, NOW()) < 1
    const query = 'SELECT userid,wanumber FROM ezb_wa_msg_settings where' + 
    'authvalidity is null or DATEDIFF(NOW(),authvalidity) < 1;';
    const [ result ] = await wabot_db.query(query);
    return result;
}*/

const getLoginExpiredUsers = async () => {
    // or DATEDIFF(NOW(),authvalidity) < 6
    //DATEDIFF(authvalidity, NOW()) < 1
    const query = 'SELECT us.userstatus,se.* FROM ezb_wa_msg_settings se' +
        ' left JOIN ezb_users us' +
        ' on us.userid = se.userid' +
        ' where us.userstatus = 1' +
        ' and (DATEDIFF(se.authvalidity, NOW()) = 1 or se.authvalidity is null);';
    const [result] = await wabot_db.query(query);
    return result;
};

const getoptinusers = async () => {
    const query = 'SELECT userid, authtoken, waurl from ezb_wa_msg_settings' +
        'INNER JOIN ezb_users USING (userid) where ezb_users.userstatus = 1 group by userid;';
    const [result] = await wabot_db.query(query);
    return result;
};

const getWaHealthStatus = async (userId, waGetHealth) => {
    const query = 'update ezb_users set waba_health_status = ? where userid = ?; ';
    const value = [waGetHealth, userId];
    return result = await wabot_db.query(query, value);
};

const getLoginSettings = async (waNumber) => {
    const query = 'select usrnm, usrpass, authts, authvalidity, authtoken, waurl, wanumber, hsmnamespace from ezb_wa_msg_settings where wanumber = ?; ';
    const value = [waNumber];
    const [result] = await wabot_db.query(query, value);
    return result[0];
};

const getWaUserSettings = async (campaignId) => {
    const query = 'select a.usrnm, a.usrpass, a.authts, a.authvalidity, a.authtoken, a.waurl, a.wanumber, a.hsmnamespace,a.phone_number_id' +
        ' from ezb_wa_msg_settings AS a, ezb_wa_campaign_master as b, ezb_users AS c' +
        ' where a.wa_msg_setting_id = c.wanumberid AND' +
        ' a.wanumber = b.contactno AND' +
        ' b.campaignid = ?;';
    const value = [campaignId];
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0];
    }
    return {};
};

const fetchAccessToken = async () => {
    let query = "SELECT VALUE FROM ezb_system_config WHERE paramname  = ?";
    let values = ['ACCESS_TOKEN'];
    let [result] = await wabot_db.query(query, values);
    return result[0].VALUE;
};

const getUserIdPriority = async (userId) => {
    const query = 'select priority from ' + TBL_USERS_MASTER + ' where userid = ?; ';
    const value = [userId];
    const [result] = await wabot_db.query(query, value);
    return result[0].priority;
};

const checkWabaNumber = async (userId, wabaNumber) => {
    const query = 'select wanumber from ezb_wa_msg_settings where userid = ? AND wanumber = ?;';
    const value = [userId, wabaNumber];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getDBStatusers = async () => {
    const query = 'SELECT userid, wanumber, waurl, authtoken FROM ezeebot.ezb_wa_msg_settings;';
    const [result] = await wabot_db.query(query);
    return result;
};

const getUserStatCount = async (userId, wabaNumber) => {
    const query = 'select wanumber from ezeebot.ezb_wa_db_stats where userid = ? AND wanumber = ?';
    const value = [userId, wabaNumber];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const updateUserDBStats = async (whatsappUser, nonWhatsappUser, dbMessageReceipts, hsm, revoked, buttonsResponse, listResponse, button, template, image, document, location, listRequest, undefinedValue, pendingCb, pendingMessages, userId, wabaNumber) => {
    const query = 'update ezeebot.ezb_wa_db_stats set whatsppuser = ?,' +
        'nonwhatsappuser = ?, ' +
        'messagereceipts = ?, ' +
        'hsm = ?, ' +
        'revoked = ?, ' +
        'buttonresponse = ?, ' +
        'listresponse = ?, ' +
        'button = ?, ' +
        'template = ?, ' +
        'image = ?, ' +
        'document = ?, ' +
        'location = ?, ' +
        'listrequest = ?,' +
        'undefinedvalue = ?,' +
        'pendingcb = ?,' +
        'createdate = NOW(),' +
        'pendingmessages = ? where userid = ? AND wanumber = ?';
    const values = [whatsappUser, nonWhatsappUser, dbMessageReceipts, hsm, revoked, buttonsResponse, listResponse, button, template, image, document, location, listRequest, undefinedValue, pendingCb, pendingMessages, userId, wabaNumber];
    const [result] = await wabot_db.query(query, values);
    return result;
};

const insertUserDBStats = async (userId, wabaNumber, whatsappUser, nonWhatsappUser, dbMessageReceipts, hsm, revoked, buttonsResponse, listResponse, button, template, image, document, location, listRequest, undefinedValue, pendingCb, pendingMessages) => {
    const query = 'insert into ezeebot.ezb_wa_db_stats (userid, wanumber, whatsppuser, nonwhatsappuser, messagereceipts, hsm, revoked,' +
        'buttonresponse, listresponse, button, template, image, document,  location, listrequest, undefinedvalue,' +
        'pendingcb, pendingmessages, createdate = NOW()) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    const values = [userId, wabaNumber, whatsappUser, nonWhatsappUser, dbMessageReceipts, hsm, revoked, buttonsResponse, listResponse, button, template, image, document, location, listRequest, undefinedValue, pendingCb, pendingMessages];
    const [result] = await wabot_db.query(query, values);
    // console.log(query, values);
    return result;
};

const getUserIdWithWabaNumber = async (wabaNumber) => {
    const query = "select userid from ezb_wa_msg_settings where wanumber = ? ";
    const value = [wabaNumber];
    const [result] = await wabot_db.query(query, value);
    return result[0].userid;
};

const getApiKeyfromWabaNumber = async (userId) => {
    const query = "select apikey from ezb_wa_api_keys where userid = ? ";
    const value = [userId];
    const [result] = await wabot_db.query(query, value);
    return result[0].apikey;
};


const validUserNameandPassword = async (username, password, wabanumber) => {
    const query = "SELECT a.userid FROM ezb_users as a LEFT JOIN ezb_wa_msg_settings as b" +
        " on a.userid = b.userid where a.username = ? and a.userpass = md5(?) and b.wanumber = ?";
    const value = [username, password, wabanumber];
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0].userid;
    }
    return {};
};

const getUserAPIKey = async (apiKey, wabanumber) => {
    const query = "SELECT a.userid  FROM ezb_wa_api_keys as a LEFT JOIN ezb_wa_msg_settings as b" +
        " on a.userid = b.userid where a.apikey = ? and b.wanumber = ?";
    const value = [apiKey, wabanumber];
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0].userid;
    }
    return {};
};

const getUserNameandPassword = async (userid) => {
    const query = "select username, userpass FROM ezb_users where userid = ?";
    const value = [userid];
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0];
    }
    return {};
};

const getAPIKeyForLeadSqared = async (waNumber, apiKeyID) => {
    const query = "SELECT a.apikey FROM ezeebot.ezb_wa_api_keys as a LEFT JOIN ezeebot.ezb_wa_msg_settings as b " +
        " on a.userid = b.userid where b.wanumber = ? and a.apikey = ?;";
    const value = [waNumber, apiKeyID];
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return 1;
    }
    return 0;
};

const getAPIKeyForLeadSqaredthroughwaba = async (waNumber) => {
    const query = "SELECT a.apikey FROM ezeebot.ezb_wa_api_keys as a LEFT JOIN ezeebot.ezb_wa_msg_settings as b " +
        " on a.userid = b.userid where b.wanumber = ?;";

    const value = [waNumber];
    // console.log("=======================", query, value)
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0].apikey;
    }
    return {};
};

const getTempIdFromResponceId = async (responceId) => {
    const query = "select tempid FROM ezb_wa_templates where waba_approval_response_id = ?";
    const value = [responceId];
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0].tempid;
    }
    return {};
};

const getUserIdFromUsernameandPassword = async (userName, passWord) => {
    const query = "select  u.userid,u.username,u.userpass ,u.firstname,u.lastname, s.wanumber as wabanumber," +
        "s.hsmnamespace,s.langcode,s.usrnm as wausername, s.usrpass as wapassword , s.waurl from ezb_users u " +
        "left join ezb_wa_msg_settings s on s.userid = u.userid " +
        "where  u.username = ? and u.userpass = md5(?)";
    const value = [userName, passWord];
    //console.log("--------------",query,value);
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getDetailFromTokenNumber = async (tokenNumber) => {
    const query = "SELECT ws.wanumber as wanumber, wk.apikey as apikey, 0 as tempid, ws.waurl as waurl, ws.hsmnamespace as hsmnamespace, ws.langcode as langcode, ws.userid  as userid FROM ezeebot.ezb_wa_msg_settings ws" +
        " left join ezb_wa_api_keys wk on wk.userid = ws.userid" +
        " where authtoken = ?";
    const value = [tokenNumber];
    //console.log(query, value);
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getDetailFromTokenNumberTempName = async (tokenNumber, tempName) => {
    const query = "SELECT ws.wanumber as wanumber, wk.apikey as apikey, wt.tempid as tempid ,ws.waurl as waurl, ws.hsmnamespace as hsmnamespace, ws.langcode as langcode, ws.userid as userid FROM ezeebot.ezb_wa_msg_settings ws" +
        " left join ezb_wa_templates wt on wt.userid = ws.userid" +
        " left join ezb_wa_api_keys wk on wk.userid = ws.userid" +
        " where authtoken = ? and  wt.temptitle = ?";
    const value = [tokenNumber, tempName];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const checkTempId = async (userId, tempID) => {
    const query = "Select count(tempid) as tempCount FROM ezeebot.ezb_wa_templates where userid = ? and tempid = ?";
    const value = [userId, tempID];
    const [result] = await wabot_db.query(query, value);
    return result[0].tempCount;
};

const updateWebhookURL = async (URL, wabaNumber) => {
    const query = "update ezb_wa_msg_settings set custom_callback = ? where wanumber = ?";
    const value = [URL, wabaNumber];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getUserName = async (userid) => {
    const query = "SELECT username FROM ezeebot.ezb_users where userid = ?;";
    const value = [userid];
    console.log(query, value);
    const [result] = await wabot_db.query(query, value);
    return result[0].username;
};

const getUserIdFromWanumber = async (waNumber) => {
    const query = "SELECT userid FROM ezeebot.ezb_wa_msg_settings where wanumber = ?;";
    const value = [waNumber];
    const [result] = await wabot_db.query(query, value);
    return result[0].userid;
};

const getUserIDFromUserName = async (userName) => {
    const query = "SELECT userid FROM ezeebot.ezb_users where username = ?;";
    const value = [userName];
    const [result] = await wabot_db.query(query, value);
    return result[0].userid;
};

const getFlowTitles = async (userID) => {
    const query = "SELECT flowid, flowtitle FROM ezb_flowbuilder_master where userid = ?;";
    const value = [userID];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getAttributeDetails = async (flowID, fromDate, toDate) => {
    const query = "SELECT * from ezb_flowbuilder_attributes where DATE_FORMAT(sessiondt,'%Y-%m-%d') BETWEEN ? AND ? AND flowid IN (SELECT id FROM ezb_flowbuilder_session WHERE flowid = ?) AND attrkey !='' AND attrvalue !='' order by session_mobile , sessiondt;";
    const value = [fromDate, toDate, flowID];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getAttributewithAttrkey = async (flowID, fromDate, toDate, attrKey) => {
    const query = "SELECT * from ezb_flowbuilder_attributes where DATE_FORMAT(sessiondt,'%Y-%m-%d') BETWEEN ? AND ? AND flowid IN (SELECT id FROM ezb_flowbuilder_session WHERE flowid = ?) AND attrkey = ? AND attrvalue !='' order by session_mobile , sessiondt;";
    const value = [fromDate, toDate, flowID, attrKey];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getAttributeAttrkey = async (flowID, fromDate, toDate, attrKey) => {
    const query = "SELECT DISTINCT(attrkey) from ezb_flowbuilder_attributes where DATE_FORMAT(sessiondt,'%Y-%m-%d') BETWEEN ? AND ? AND flowid IN (SELECT id FROM ezb_flowbuilder_session WHERE flowid = ?) AND attrkey !='' AND attrvalue !='' order by session_mobile , sessiondt;";
    const value = [fromDate, toDate, flowID, attrKey];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getAttributewithAttrkeyAndMobile = async (flowID, fromDate, toDate, attrKey, mobileNumber) => {
    const query = "SELECT * from ezb_flowbuilder_attributes where DATE_FORMAT(sessiondt,'%Y-%m-%d') BETWEEN ? AND ? AND flowid IN (SELECT id FROM ezb_flowbuilder_session WHERE flowid = ?) AND attrkey = ? AND attrvalue !='' AND session_mobile = ? order by session_mobile , sessiondt;";
    const value = [fromDate, toDate, flowID, attrKey, mobileNumber];
    const [result] = await wabot_db.query(query, value);
    return result;
};

const getLoginDetails = async (userName, password) => {
    const query = "select u.userid, wms.wanumber, wak.apikey from ezb_users u " +
        "left join ezb_wa_msg_settings wms on wms.userid = u.userid " +
        "left join ezb_wa_api_keys wak on wak.userid = u.userid " +
        "where u.username = ? and u.userpass = md5(?);";
    const value = [userName, password];
    const [result] = await wabot_db.query(query, value);
    return result;
};


const getImagePath = async (messageId, mobileNo) => {
    try {
        const query = 'SELECT CAST(wabapayload AS CHAR) string_field FROM ezb_message_sent_master WHERE messageid = ? AND mobileno= ?';
        const values = [messageId, mobileNo];
        const [result] = await wabot_db.query(query, values);

        if (result[0]) {
            return result[0].string_field;
        }
        return {};


    } catch (error) {
        console.log(error);
    }

};
const validateUser = async (apiKey, wabanumber) => {
    // const query = 'select `a`.`userid` AS userId, `b`.`whatsapp_business_account_id` AS wabaId,`b`.`wanumber` AS wanumber from `ezb_wa_api_keys`  AS a' +
    //     ' left join `ezb_wa_msg_settings` AS b ON `a`.`userid` = `b`.`userid`' +
    //     ' where `a`.`apikey` = ?  AND `b`.`wanumber` = ? ';

    const query = 'select a.userid AS userId, b.whatsapp_business_account_id AS wabaId,b.wanumber AS wanumber' +
        ' from ezb_wa_api_keys  AS a, ezb_wa_msg_settings AS b, ezb_users as c WHERE a.userid = c.userid and b.wa_msg_setting_id = c.wanumberid' +
        ' and a.apikey = ?  AND b.wanumber = ? ';
    const value = [apiKey, "+" + wabanumber];
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0];
    }
    return {};
};

module.exports = {
    addUser,
    getUserSettings,
    updateUserSettings,
    getExpiredUsers,
    getUserId,
    getoptinusers,
    getWaHealthStatus,
    getLoginSettings,
    getLoginExpiredUsers,
    getWaUserSettings,
    getUserIdPriority,
    checkWabaNumber,
    getDBStatusers,
    getUserStatCount,
    updateUserDBStats,
    insertUserDBStats,
    getUserIdWithWabaNumber,
    getUserNameandPassword,
    getAPIKeyForLeadSqared,
    getUserAPIKey,
    validUserNameandPassword,
    getApiKeyfromWabaNumber,
    getAPIKeyForLeadSqaredthroughwaba,
    getTempIdFromResponceId,
    getWabanumber,
    fetchAccessToken,
    getUserIdFromUsernameandPassword,
    getDetailFromTokenNumber,
    checkTempId,
    getDetailFromTokenNumberTempName,
    updateWebhookURL,
    getUserIdFromWanumber,
    getUserName,
    getUserIDFromUserName,
    getFlowTitles,
    getAttributeDetails,
    getAttributewithAttrkey,
    getAttributeAttrkey,
    getAttributewithAttrkeyAndMobile,
    getImagePath,
    getLoginDetails,
    getUserIdFromWaNumber,
    getUserSettingsFromUserId,
    validateUser
};