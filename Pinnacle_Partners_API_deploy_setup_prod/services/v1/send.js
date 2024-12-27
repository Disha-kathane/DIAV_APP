const dbpool = require('../../db/database');
const botUtils = require('../../utils/bot');



fetchphonenumberid = async (wanumber, next) => {
    try {
        let query = "Select count(1) as c from ezb_wa_msg_settings where wanumber = ? and phone_number_id is not null";
        let values = ['+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};


selectapikey = async (apikey, next) => {
    try {
        let query = "Select count(1) as c from ezb_wa_api_keys where apikey = ?";
        let values = [apikey];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

selectwanumber = async (wanumber, next) => {
    try {
        let query = "Select count(1) as c from ezb_wa_msg_settings where wanumber = ?";
        let values = ['+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

countaccesstoken = async (wanumber, next) => {
    try {
        let query = "Select count(1) as c from ezb_wa_accesstoken where wanumber = ?";
        let values = ['+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};


fetchapikeywanumber = async (wanumber, apikey, next) => {
    try {
        let query = "select a.apikey, b.userid,b.waurl,b.wa_msg_setting_id,b.whatsapp_business_account_id,(select value from ezb_system_config where paramname  = 'ACCESS_TOKEN') AS authtoken," +
            " b.wanumber from ezb_wa_api_keys as a, ezb_wa_msg_settings as b " +
            " where a.userid = b.userid and b.wanumber = ? and a.apikey = ?;";
        let values = ['+' + wanumber, apikey];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

insertMessageInSentMasterAPI = async (id, userid, recipientnumber, objMsg, messageid, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, clientPayload, bodycontent, fbtrace_id, category, categoryId, templateid, next) => {
    try {
        let query = "insert into ezb_message_sent_master(userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,client_payload, body_content,fbtrace_id, category, sessid, category_id,templateid)" +
            " values (?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,LOWER(?),MD5(?),?,?)";
        let values = [userid, recipientnumber, JSON.stringify(objMsg), messageid, errorCode, errorDesc, 0, 0, msgType, 1, 0, '+' + wanumber, wa_msg_setting_id, 1, JSON.stringify(objMsg), JSON.stringify(bodycontent), fbtrace_id, category, messageid, categoryId, templateid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

insertMessageInSentMasterAPI00 = async (id, userid, recipientnumber, objMsg, messageid, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, clientPayload, bodycontent, fbtrace_id, category, categoryId, templateid, next) => {
    try {
        let query = "insert into ezb_message_sent_master(userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,client_payload, body_content,fbtrace_id, category, sessid, category_id,templateid)" +
            " values (?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,LOWER(?),MD5(?),?,?)";
        let values = [userid, recipientnumber, JSON.stringify(objMsg), messageid, errorCode, errorDesc, 0, 0, msgType, 1, 0, '+' + wanumber, wa_msg_setting_id, 1, JSON.stringify(objMsg), JSON.stringify(bodycontent), fbtrace_id, category, messageid, categoryId, templateid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

templatetitleuserid = async (temptitle, userid, next) => {
    try {
        let query = "Select * from ezb_wa_templates where temptitle = ? and userid = ?;";
        let values = [temptitle, userid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

templatetitlewabaid = async (temptitle, whatsapp_business_account_id, next) => {
    try {
        let query = "select a.* from ezb_wa_templates as a left join ezb_wa_msg_settings as b on" +
            " a.userid = b.userid where a.temptitle = ? and b.whatsapp_business_account_id = ? LIMIT 1";
        let values = [temptitle, whatsapp_business_account_id];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchuserid = async (wanumber, apikey, next) => {
    try {
        let query = "Select a.userid from ezb_wa_msg_settings as a, ezb_wa_api_keys as b " +
            "  where a.userid = b.userid and wanumber = ? and apikey = ?;";
        let values = ['+' + wanumber, apikey];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

updatewebhooks = async (custom_callback, custom_parameters, userid, wanumber, next) => {
    try {
        let query = "Update ezb_wa_msg_settings set custom_callback = ?,custom_parameters = ? where userid = ? and wanumber = ?;";
        let values = [custom_callback, JSON.stringify(custom_parameters), userid, '+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchwebhookurl = async (wanumber, apikey, next) => {
    try {
        let query = "Select a.custom_callback,a.custom_parameters from ezb_wa_msg_settings as a, ezb_wa_api_keys as b" +
            " where a.userid = b.userid and wanumber = ? and apikey = ?;";
        let values = ['+' + wanumber, apikey];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchusernameuseridcustomcallback = async (wanumber, apikey, next) => {
    try {
        let query = "Select a.username,a.companyname,b.custom_callback from ezb_users as a, ezb_wa_msg_settings as b,ezb_wa_api_keys as c" +
            " where a.userid = b.userid and wanumber = ? and c.apikey = ?;";
        let values = ['+' + wanumber, apikey];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchpartnersclients = async (wanumber, next) => {
    try {
        let query = "Select a.username,a.firstname,a.companyname,a.mobile,a.email,a.expirydate,a.lastupdatetime,a.auserid,a.euserid,b.wanumber  from ezb_users as a,ezb_wa_msg_settings as b" +
            " where a.userid = b.userid and a.userid = (Select userid from ezb_wa_msg_settings where wanumber = ?);";
        let values = ['+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

fetchapikeyappid = async (wanumber, next) => {
    try {
        let query = "Select a.apikey, a.apikey_id,c.username from ezb_wa_api_keys as a, ezb_wa_msg_settings as b, ezb_users as c " +
            " where a.userid = b.userid and a.userid = c.userid and b.wanumber = ?;";
        let values = ['+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

updateapikey = async (apikey, userid, next) => {
    try {
        let query = "Update ezb_wa_api_keys set apikey = ? where userid = ? ;";
        let values = [apikey, userid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

getbalanceamt = async (wanumber, next) => {
    try {
        let query = "Select a.balance_amt,a.free_conversation from ezb_users as a, ezb_wa_msg_settings as b where a.userid = b.userid and wanumber = ?;";
        let values = ['+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

getbicuicrate = async (wabaCountryCodeNumeric, userid, next) => {
    try {
        let wanumber;
        let query = "SELECT IFNULL((SELECT bic_rate FROM ezb_wa_customize_rate WHERE countrycode = ? AND userid = ?)," +
            " (SELECT bic_rate FROM ezb_wa_rate_master WHERE countrycode = ?)) AS bic_rate," +
            " IFNULL((SELECT uic_rate FROM ezb_wa_customize_rate WHERE countrycode = ? AND userid = ?)," +
            " (SELECT uic_rate FROM ezb_wa_rate_master WHERE countrycode = ?)) AS uic_rate";

        // let query = "SELECT IFNULL((SELECT bic_rate FROM ezb_wa_customize_rate WHERE countrycode = 91 AND userid = 760)," +
        //     " (SELECT bic_rate FROM ezb_wa_rate_master WHERE countrycode = 91)) AS bic_rate," +
        //     " IFNULL((SELECT uic_rate FROM ezb_wa_customize_rate WHERE countrycode = 91 AND userid = 760)," +
        //     " (SELECT uic_rate FROM ezb_wa_rate_master WHERE countrycode = 91)) AS uic_rate;"
        let values = [wabaCountryCodeNumeric, userid, wabaCountryCodeNumeric, wabaCountryCodeNumeric, userid, wabaCountryCodeNumeric];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

getlastrenewal = async (wanumber, next) => {
    try {
        let query = "Select ifnull(a.amt, ?) AS Amount, ifnull(MAX(a.transactiondate), ?) AS transactiondate  from ezb_billing_master as a, ezb_wa_msg_settings as b " +
            " where a.userid = b.userid and b.wanumber = ?;";
        let values = ['NA', 'NA', '+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

updateclient = async (firstname, mobile, email, companyname, wanumber, apikey, next) => {
    try {
        let query = "Update ezb_wa_msg_settings as a, ezb_users as b, ezb_wa_api_keys as c set" +
            " b.firstname = ?, b.mobile = ?, b.email = ?, b.companyname = ? " +
            " where a.userid = b.userid and a.userid = c.userid and a.wanumber = ? and c.apikey = ?;";
        let values = [firstname, mobile, email, companyname, '+' + wanumber, apikey];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

getapikeybywanumber = async (wanumber, accesstoken, next) => {
    try {
        // let query = "Select a.apikey from ezb_wa_api_keys as a,ezb_wa_msg_settings as b" +
        //     " where a.userid = b.userid and b.wanumber = ?;"
        let query = "Select a.apikey  from ezb_wa_api_keys as a,ezb_wa_msg_settings as b,ezb_wa_accesstoken as c" +
            " where a.userid = b.userid and b.wanumber = c.wanumber and  b.wanumber = ?" +
            " and c.accesstoken = ?" +
            " and NOW() <= expiresin;";
        let values = ['+' + wanumber, accesstoken];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

insertinwaaccesstoken = async (wanumber, token, next) => {
    try {
        let query = "Replace into ezb_wa_accesstoken(wanumber,accesstoken,expiresin) values(?,?,DATE_ADD(NOW(), INTERVAL 5 MINUTE));";
        let values = ['+' + wanumber, token];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

selectaccesstoken = async (wanumber, next) => {
    try {
        let query = "Select accesstoken from ezb_wa_accesstoken where wanumber = ?";
        let values = ['+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};


msgsettingdetails = async (wanumber, next) => {
    try {
        let query = "Select a.userid,a.wa_msg_setting_id,a.wanumber,a.islivechat,a.whatsapp_business_account_id,a.livechatwebhook,a.custom_callback,a.isactivepinbotflow,a.phone_number_id,a.pinnacle_api_url," +
            " b.apikey as authtoken,a.text_tps,a.media_tps" +
            " from ezb_wa_msg_settings as a , ezb_wa_api_keys as b" +
            " where a.userid = b.userid and a.wanumber = ?;";
        let values = ['+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

getreplymessageforcallback = async (message, wanumber, next) => {
    try {
        let query = "SELECT auto_response, userid, hsmname, auto_response_flag, " +
            " (SELECT stopword FROM ezb_wa_msg_settings WHERE stopword IN (LOWER(?)) AND wanumber=M.wanumber) AS stopword," +
            " (SELECT unsubmsg FROM ezb_wa_msg_settings WHERE stopword IN (LOWER(?)) AND wanumber=M.wanumber) AS unsubmsg," +
            " (SELECT resubword FROM ezb_wa_msg_settings WHERE resubword IN (LOWER(?)) AND wanumber=M.wanumber) AS resubword," +
            " (SELECT resubmsg FROM ezb_wa_msg_settings WHERE resubword IN (LOWER(?)) AND wanumber=M.wanumber) AS resubmsg" +
            " FROM ezb_wa_msg_settings AS M" +
            " WHERE wanumber LIKE ?";
        let values = [message, message, message, message, '+' + wanumber];
        let rows = await dbpool.query(query, values);
        //console.log('GET REPLY MESSAGE =======================>' + JSON.stringify(rows[0]));
        next(null, rows[0]);
    }
    catch (err) {
        //console.log(err);
        next(err);
    }
};


fetchaccesstoken = async (next) => {
    try {
        let query = "SELECT VALUE FROM ezb_system_config WHERE paramname = ?";
        let values = ['ACCESS_TOKEN'];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

let checkSubscription = async (wanumber, wabanumber, next) => {
    try {
        let query = "SELECT subflag FROM ezb_subscription_master WHERE wanumber = ? AND wabanumber = ?";
        let values = [wanumber, '+' + wabanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
let templatetitleuseridFlows = async (temptitle, userid, next) => {
    try {
        let query = "Select * from ezb_wa_templates where temptitle = ? and userid = ?;";
        let values = [temptitle, userid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

const insertMessageInSentMasterAPI1 = async (id, userid, recipientnumber, objMsg, messageid, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, clientPayload, bodycontent, fbtrace_id, category, categoryId, next) => {
    try {
        let query = "insert into ezb_message_sent_master(userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,client_payload, body_content,fbtrace_id, category, sessid, category_id)" +
            " values (?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,LOWER(?),MD5(?),?)";
        let values = [userid, recipientnumber, JSON.stringify(objMsg), messageid, errorCode, errorDesc, 0, 0, msgType, 1, 0, '+' + wanumber, wa_msg_setting_id, 1, JSON.stringify(objMsg), JSON.stringify(bodycontent), fbtrace_id, category, messageid, categoryId];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};


const insertMessageInSentMasterAPI01 = async (id, userid, recipientnumber, objMsg, messageid, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, clientPayload, bodycontent, fbtrace_id, category, categoryId, templateid, next) => {
    try {
        let query = "insert into ezb_message_sent_master(userid,mobileno,wabapayload,messageid,errcode,errdesc,createdt,status,readstatus,messagetype,source,campaignid,contactno,msg_setting_id,direction,client_payload, body_content,fbtrace_id, category, sessid, category_id,templateid)" +
            " values (?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,?,LOWER(?),MD5(?),?,?)";
        let values = [userid, recipientnumber, JSON.stringify(objMsg), messageid, errorCode, errorDesc, 0, 0, msgType, 1, 0, '+' + wanumber, wa_msg_setting_id, 1, JSON.stringify(objMsg), JSON.stringify(bodycontent), fbtrace_id, category, messageid, categoryId, templateid];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

storeDIAVOTP = async (mobileno, otp) => {
    try {
        let query = "REPLACE INTO ezb_diav_otp_master(mobileno,otp)" +
            " VALUES(?,?)";
        let values = [mobileno, otp];
        let rows = await dbpool.query(query, values);
        return rows[0];
    } catch (err) {
        console.log(err);
        return err;
    }
};

checkDIAVOTP = async (mobileno, otp) => {
    try {
        query = 'SELECT COUNT(1) AS C FROM ezb_diav_otp_master WHERE mobileno = ? AND otp = ?';
        rows = await dbpool.query(query, [mobileno, otp]);
        // console.log(JSON.stringify(rows[0][0].C));
        return rows[0][0].C;
    } catch (err) {
        console.log(err);
        return err;
    }
};

module.exports = {
    selectapikey,
    selectwanumber,
    countaccesstoken,
    fetchapikeywanumber,
    insertMessageInSentMasterAPI,
    templatetitleuserid,
    fetchuserid,
    updatewebhooks,
    fetchwebhookurl,
    fetchusernameuseridcustomcallback,
    fetchpartnersclients,
    fetchapikeyappid,
    updateapikey,
    getbalanceamt,
    getbicuicrate,
    getlastrenewal,
    updateclient,
    getapikeybywanumber,
    insertinwaaccesstoken,
    selectaccesstoken,
    msgsettingdetails,
    fetchaccesstoken,
    getreplymessageforcallback,
    templatetitlewabaid,
    fetchphonenumberid,
    checkSubscription,
    templatetitleuseridFlows,
    insertMessageInSentMasterAPI1,
    storeDIAVOTP,
    checkDIAVOTP,
    insertMessageInSentMasterAPI00,
    insertMessageInSentMasterAPI01
};