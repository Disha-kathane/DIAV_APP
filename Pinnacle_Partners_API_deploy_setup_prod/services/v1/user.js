const dbpool = require('../../db/database');
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


fetchmediausersdetails = async (apikey, wanumber, next) => {
    try {
        let query = "Select a.userid,b.phone_number_id ,b.wanumber from ezb_wa_api_keys as a , ezb_wa_msg_settings as b, ezb_users as c" +
            " where a.userid = c.userid and b.wa_msg_setting_id = c.wanumberid and a.apikey = ? and  b.wanumber = ?;";
        let values = [apikey, '+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    }
    catch (err) {
        console.log(err);
        next(err);
    }
};

getSystemAccessToken = async (next) => {
    try {
        let query = "SELECT VALUE FROM ezb_system_config WHERE paramname =? ";
        let values = ['ACCESS_TOKEN'];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

getusersdetails = async (userid, wanumber, next) => {
    // console.log(userid);
    // console.log(wanumber);
    try {
        let query = "Select a.usrnm,a.usrpass,a.authts,a.authvalidity,a.authtoken,a.waurl,a.wanumber from ezb_wa_msg_settings as a,ezb_users as b"+
        " where a.wa_msg_setting_id = b.wanumberid and b.userid = ? and a.wanumber = ?";
        let values = [userid, '+' + wanumber];
        let rows = await dbpool.query(query, values);
        next(null, rows[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
};


insertMedia = async (mediaid, mediatype, mediaurl, medianame, userid, next) => {
    try {
        async.waterfall([
            (done) => {
                const fileContent = fs.readFileSync(mediaurl);

                const params = {
                    Bucket: BUCKET_NAME,
                    Key: path.basename(mediaurl),
                    Body: fileContent
                };

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
                let queryInsert = 'INSERT INTO ezb_wa_media (mediaid,mediatype,mediaurl,medianame,userid) VALUES (?,?,?,?,?)';
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

    } catch (err) {
        console.log(err);
        next(err);
    }
};

module.exports = {
    selectapikey,
    selectwanumber,
    fetchmediausersdetails,
    getSystemAccessToken,
    getusersdetails,
    insertMedia
}

