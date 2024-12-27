const wabot_db = require('../../db/wabot');
var appLoggers = require('../../applogger.js');
const fs = require('fs');
const async = require('async');
const AWS = require('aws-sdk');
const path = require('path');
const s3 = new AWS.S3({
    accessKeyId: 'AKIAS2AEXDPLMUXEV5QS',
    secretAccessKey: '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'
});
const BUCKET_NAME = "whatsappdata";
const params = {
    Bucket: BUCKET_NAME,
    CreateBucketConfiguration: {
        LocationConstraint: "ap-south-1"
    }
};

const {

    TBL_CONTACTS_MASTER,
    TBL_TEMP_CONTACTS_MASTER,
    TBL_MESSAGE_SENT_MASTER,
    TBL_REQUEST_MASTER,
    TBL_NONWHATSAPP_MASTER,
    TBL_INVALID_CONTACTS_MASTER,

} = require('../../constants/tables');

const addUser = (user) => {
    return wabot_db.query(`insert into users(name, age) values(${user.name}, ${user.age}) `);
}

const getUserSettings = async (userId) => {
    const query = 'select `usrnm`, `usrpass`, `authts`, `authvalidity`, `authtoken`, `waurl`, `wanumber`, `hsmnamespace` from `ezb_wa_msg_settings` where userid = ?; ';
    const value = userId;
    const [result] = await wabot_db.query(query, value);
    return result[0];
}

const updateUserSettings = async (authToken, expiryDate, userId) => {
    const query = 'update `ezb_wa_msg_settings` set `authtoken` = ?, `authvalidity` = ? where userid = ?; ';
    const value = [authToken, expiryDate, userId];
    const [result] = await wabot_db.query(query, value);
    return result;
}

const getUserId = async (apiKey) => {
    const query = 'select `a`.`userid` AS userId, `b`.`whatsapp_business_account_id` AS wabaId from `ezb_wa_api_keys`  AS a' +
        ' left join `ezb_wa_msg_settings` AS b ON `a`.`userid` = `b`.`userid`' +
        ' where `a`.`apikey` = ?';
    const value = apiKey;
    const [result] = await wabot_db.query(query, value);
    if (result[0]) {
        return result[0];
    }
    return {};
}

const getExpiredUsers = async () => {
    // or DATEDIFF(NOW(),`authvalidity`) < 6
    const query = 'SELECT `userid` FROM `ezb_wa_msg_settings` where authvalidity is null or DATEDIFF(NOW(),`authvalidity`) < 6;';
    const [result] = await wabot_db.query(query);
    return result;
}

const getoptinusers = async () => {
    const query = 'select `userid`, `authtoken`, `waurl` from `ezb_wa_msg_settings`; ';
    const [result] = await wabot_db.query(query);
    return result;
}

const getWaHealthStatus = async (userId, waGetHealth) => {
    const query = 'update `ezb_users` set `waba_health_status` = ? where userid = ?; ';
    const value = [waGetHealth, userId];
    return result = await wabot_db.query(query, value);
}

const checkgetOneContact = async (userId, mobileNo) => {
    const querySel = 'select `wanumber` from `' + TBL_CONTACTS_MASTER + '` where userid = ? AND wanumber = ?;'
    const selValues = [userId, mobileNo];
    const [result] = await wabot_db.query(querySel, selValues);

    if (result[0]) {
        return result[0].wanumber;
    }
    return {};
}

const insertOptinContacts = async (mobileNo, userId, campaignId) => {
    const queryInsert = 'INSERT INTO `' + TBL_CONTACTS_MASTER + '` (`wanumber`, `userid`, `source`, `campaignid`) VALUES (?,?,?,?);';
    const values = [mobileNo, userId, 0, campaignId];
    const result = await wabot_db.query(queryInsert, values);
    return result;
}

const updateContactListOptin = async (mobileNumber, userId, status, waId) => {
    const query = 'UPDATE ' + TBL_CONTACTS_MASTER + ' SET waid = ?, wastatus = ?, ' +
        'authvalidity = DATE_ADD(curdate(), INTERVAL 7 DAY) WHERE `wanumber`= ? AND `userid` = ?;';
    if (/^\+/.test(mobileNumber) == true) {
        mobileNumber = mobileNumber.toString().replace('+', '');
    }
    const values = [waId, status, mobileNumber, userId];
    return wabot_db.query(query, values);
}

const getOptoutUserId = async (apikeys, next) => {
    try {
        const query = 'SELECT userid FROM ezb_wa_api_keys WHERE apikey=?';
        const value = [apikeys];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

const deleteContact = async (userid, contactno, wanumber, next) => {
    try {

        const query = 'DELETE from `ezb_wa_contacts` WHERE userid=? AND contactno =? AND wanumber=?'
        const value = [userid, contactno, wanumber];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}

const getMediaUserSettings = async (userid, wanumber, next) => {
    try {
        let query = null;
        if (wanumber != '') {
            // console.log('wanumber: ' + wanumber);
            query = 'SELECT `usrnm`, `usrpass`, `authts`, `authvalidity`, `authtoken`, `waurl`, `wanumber` FROM `ezb_wa_msg_settings` WHERE userid = ? AND wanumber = ?';
        } else {
            query = 'SELECT `usrnm`, `usrpass`, `authts`, `authvalidity`, `authtoken`, `waurl`, `wanumber` FROM `ezb_wa_msg_settings` WHERE userid = ?';
        }
        // console.log(query);
        const value = [userid, '+' + wanumber];
        const rows = await wabot_db.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
}


// For cloud as well as for premises 06/06/2022 added by sneha

const checkWanumber = async (wabanumber, next) => {
    try {
        let query = "SELECT phone_number_id ,wanumber FROM ezb_wa_msg_settings WHERE wanumber = ?;"
        let values = [+wabanumber];
        let rows = await wabot_db.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }
}

const getSystemAccessToken = async (next) => {
    try {

        let query = "SELECT VALUE FROM ezeebot.ezb_system_config WHERE paramname =? "
        let values = ['ACCESS_TOKEN'];
        let rows = await wabot_db.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }

}

const insertMedia = async (mediaid, mediatype, mediaurl, medianame, userid, next) => {
    try {
        async.waterfall([
            (done) => {
                const fileContent = fs.readFileSync(mediaurl);

                const params = {
                    Bucket: BUCKET_NAME,
                    Key: path.basename(mediaurl),
                    Body: fileContent
                };

                // Uploading files to the bucket
                s3.upload(params, function (err, data) {
                    if (err) {
                        console.log('Upload Media Error ===============================>' + error);
                        return done(error);
                    }
                    else {
                        console.log('Upload Media ===============================>' + data.Location);
                        fs.unlink(mediaurl, function (err) {
                            if (err) {
                                console.error(err);
                            }
                            console.log('Temp File Delete');
                            done(null, data.Location);
                        });
                    }
                });
            },
            (s3Url, done) => {
                let queryInsert = 'INSERT INTO `ezb_wa_media` (mediaid,mediatype,mediaurl,medianame,userid) VALUES (?,?,?,?,?)';
                let values = [mediaid, mediatype, s3Url, medianame, userid];
                let rows = wabot_db.query(queryInsert, values);
                done(null, rows[0]);
            }
        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
            }
        });

    }
    catch (err) {
        next(err);
    }
}


//db queries for IDBC bank 
const fetchUser = async (email, systemtoken, next) => {
    try {
        let query = null;
        let values = null;
        if (email != '') {
            query = "SELECT * FROM users WHERE email= ? ";
            values = [email];

        } else {
            query = "SELECT * FROM users WHERE systemtoken=?"
            values = [systemtoken];
        }

        let rows = await wabot_db.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }

}

const insertUser = async (email, systoken, next) => {
    try {

        let query = "INSERT INTO users (email, systemtoken) VALUES(?,?) "
        let values = [email, systoken];
        let rows = await wabot_db.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }

}

const fetchAccessToken = async (userid, accessToken, next) => {
    try {
        let query = null;
        let values = null;
        if (userid != '') {
            query = "SELECT * FROM access_tokens WHERE user_id = ?"
            values = [userid];
        } else {
            query = "SELECT * FROM access_tokens WHERE access_token=?"
            values = [accessToken];
        }

        let rows = await wabot_db.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }

}

const insertAccessToken = async (token, userid, next) => {
    try {

        let query = "INSERT INTO access_tokens (access_token, user_id , expires,create_time) VALUES (?,?,?,NOW())"
        let values = [token, userid, 60];
        let rows = await wabot_db.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }

}

const updateAccessToken = async (token, userid, next) => {
    try {

        let query = "UPDATE access_tokens SET access_token =?, token_status=?,create_time=NOW() WHERE user_id = ?"
        let values = [token, 1, userid];
        let rows = await wabot_db.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }

}

const updateLastLogin = async (userid, updatesystoken, next) => {
    try {
        let query = null;
        let values = null;
        if (userid != '') {
            query = "UPDATE users SET last_login = NOW() WHERE id = ?"
            values = [userid];
        }
        if (updatesystoken != '') {
            query = "UPDATE users SET systemtoken =?,last_update=NOW() WHERE id = ?";
            values = [updatesystoken, userid]
        }

        let rows = await wabot_db.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }

}


const updateTokenStatus = async (userid, next) => {
    try {

        let query = "UPDATE access_tokens SET token_status = 0  WHERE user_id = ?"
        let values = [userid];
        let rows = await wabot_db.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }

}






module.exports = {
    addUser,
    getUserSettings,
    updateUserSettings,
    getExpiredUsers,
    getUserId,
    getoptinusers,
    getWaHealthStatus,
    checkgetOneContact,
    insertOptinContacts,
    updateContactListOptin,
    getOptoutUserId,
    deleteContact,
    getMediaUserSettings,
    checkWanumber,
    insertMedia,
    getSystemAccessToken,
    fetchUser,
    insertUser,
    fetchAccessToken,
    insertAccessToken,
    updateAccessToken,
    updateLastLogin,
    updateTokenStatus

}