const dbpool = require('../../db/wabot');
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
    errorLogger,
    infoLogger
} = require('../../applogger1.js');
const {
    TBL_MESSAGE_REQUEST_MASTER,
    TBL_MESSAGE_SENT_MASTER,
    TBL_USERS_MASTER,
    TBL_TEMPLATE_MASTER,
    TBL_API_KEYS_MASTER,
    TBL_WA_MSG_SETTINGS_MASTER,
    TBL_WA_MEDIA_MASTER,
    TBL_SUBSCRIPTION_MASTER,
    TBL_CONTACTS_MASTER,
    TBL_SYSTEM_CONFIG_MASTER
} = require('../../constants/tables');

const MSG_LIMIT = 50;



const getOptoutUserId = async (apikeys, next) => {
    try {
        const query = 'SELECT userid FROM ezb_wa_api_keys WHERE apikey=?';
        const value = [apikeys];
        const rows = await dbpool.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};


const getMediaUserSettings = async (userid, wanumber, next) => {
    try {
        let query;
        if (wanumber != '') {
            // console.log('wanumber: ' + wanumber);
            query = 'SELECT `usrnm`, `usrpass`, `authts`, `authvalidity`, `authtoken`, `waurl`, `wanumber` FROM `ezb_wa_msg_settings` WHERE userid = ? AND wanumber = ?';
        } else {
            query = 'SELECT `usrnm`, `usrpass`, `authts`, `authvalidity`, `authtoken`, `waurl`, `wanumber` FROM `ezb_wa_msg_settings` WHERE userid = ?';
        }
        // console.log(query);
        const value = [userid, '+' + wanumber];
        const rows = await dbpool.query(query, value);
        next(null, rows[0]);
    } catch (err) {
        next(err);
    }
};



const checkWanumber = async (wabanumber, next) => {
    try {
        let query = "SELECT phone_number_id ,wanumber FROM ezb_wa_msg_settings WHERE wanumber = ?;";
        let values = [+wabanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }
};

const getSystemAccessToken = async (next) => {
    try {

        let query = "SELECT VALUE FROM " + TBL_SYSTEM_CONFIG_MASTER + " WHERE paramname =? ";
        let values = ['ACCESS_TOKEN'];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);

    } catch (err) {
        console.log(err);
        next(err);
    }

};



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
                let rows = dbpool.query(queryInsert, values);

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
};

module.exports = {
    getOptoutUserId,
    getMediaUserSettings,
    checkWanumber,
    getSystemAccessToken,
    insertMedia
}

