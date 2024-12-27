const {
    dbpool
} = require('../../db/wabot');
const PropertiesReader = require('properties-reader');
const path = require('path');
const async = require('async');
const validator = require('validator');
const moment = require('moment');

const {
    errorLogger,
    infoLogger
} = require('../../applogger');
const botUtils = require('../../utils/bot');
const properties = PropertiesReader(path.join(__dirname, '../../settings/application.properties'));

const {
    API_KEYS_MASTER,
    USERS_MASTER
} = require('../../constants/tables');

module.exports = async (req, res) => {
    try {
        let apikey = req.params.apikey;
        let obj = req.body;

        async.waterfall([
            function (done) {
                let query = "SELECT a.apikey, a.userid, b.userstatus FROM " + API_KEYS_MASTER + " AS a" +
                    " LEFT JOIN " + USERS_MASTER + " AS b" +
                    " ON a.userid = b.userid" +
                    " WHERE a.apikey = ?";
                let s = dbpool.query(query, [apikey], function (err, result) {
                    if (result.length > 0) {
                        if (result[0].userstatus == 0) {
                            done('User is Inactive');
                        }
                        else {
                            done(err, result);
                        }
                    }
                    else {
                        done('User not found');
                    }
                });
            },
            function (result, done) {
                console.log(obj);
                if (Object.keys(obj).length > 0) {
                    let status = obj.statuses[0].status;
                    let msgID = obj.statuses[0].id;
                    let d = new Date(parseInt(obj.statuses[0].timestamp) * 1000);
                    let timestamp = moment(d).format('YYYY-MM-DD HH:mm:ss');

                    if (status == 'sent') {
                        let sessid = obj.statuses[0].conversation.id;
                        let query = "UPDATE ezb_message_sent_master SET readstatus = ?, sessid = ?, sentdt = ? WHERE messageid = ?";
                        let s = dbpool.query(query, [0, sessid, timestamp, msgID], function (err, result) {
                            done(err, obj);
                        });
                        console.log(s.sql);
                    }
                    if (status == 'delivered') {
                        let query = "UPDATE ezb_message_sent_master SET readstatus = ?, dlvrddt = ? WHERE messageid = ?";
                        let s = dbpool.query(query, [1, timestamp, msgID], function (err, result) {
                            done(err, obj);
                        });
                        console.log(s.sql);
                    }
                    if (status == 'read') {
                        let query = "UPDATE ezb_message_sent_master SET readstatus = ?, readdt = ? WHERE messageid = ?";
                        let s = dbpool.query(query, [2, timestamp, msgID], function (err, result) {
                            done(err, obj);
                        });
                        console.log(s.sql);
                    }
                }
                else {
                    done(null, 'Message Body is missing');
                }
            }
        ],
            function (err, result) {
                res.status(200).send(result);
            });
    }
    catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}