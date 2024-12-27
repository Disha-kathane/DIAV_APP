let db = require('../../db/database');
let mydb = require('../../db/yamahadb');
let async = require('async');
const { log } = require('console');
const { Blob } = require('buffer');
let axios = require('axios');
let http = require('http');
let https = require('https');
let httpUrl = require('url');
let moment = require('moment');

module.exports = async (req, res) => {

    let wanumber = req.body.wanumber;
    let apikey = req.headers.apikey;
    let date = req.body.date;
    let type = req.body.type;
    let status;

    let key = "Select count(1) as c from ezb_wa_api_keys where apikey = ?";
    let resultkey = await db.query(key, [apikey]);
    let apikey_1 = resultkey[0][0].c;

 
    // let dateComponents = date.split("-");
    // let formattedDate = dateComponents[0].slice(-2) + dateComponents[1] + dateComponents[2];
    let formattedDate = moment(date, ["DD-MM-YYYY"]).format('YYMMDD');
    console.log({ formattedDate });

    let query_1 = "Select count(1) as c from ezb_wa_msg_settings where wanumber = ?";
    let result_1 = await db.query(query_1, ['+' + wanumber]);
    let wacount = JSON.stringify(result_1[0][0].c);


    let query_4 = "Select custom_callback from ezb_wa_msg_settings where wanumber = ?";
    let result_4 = await db.query(query_4, ['+' + wanumber]);
    // console.log(JSON.stringify(result_4[0][0].custom_callback));
    let url = result_4[0][0].custom_callback;
    console.log({ url })

    const tableName = 'ezb_old_callbacks_logs_' + formattedDate;
    console.log({ tableName });

    let query_find = "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = ?";
    let result_find = await mydb.query(query_find, [tableName]);
    // console.log(JSON.stringify(result_find[0][0]));
    let queryfind = result_find[0][0].count;
    console.log({ queryfind });

    if (apikey_1 <= 0) {
        res.send({
            code: 1006,
            status: "FAILED",
            data: 'Authentication failed (INVALID APIKEY)'
        });
    }
    else if (url.length == 0) {
        res.send({
            code: 1001,
            status: "FAILED",
            data: 'There is no callback url'
        });
    }
    else if (queryfind == 0) {
        res.send({
            code: 1002,
            status: "FAILED",
            data: 'We dont have any record for this date'
        });
    } else if (wacount == 0) {
        res.send({
            code: 1003,
            status: "FAILED",
            data: 'The Wanumber is not register'
        });
    } else if (type != 1 && type != 2) {
        res.send({
            code: 1004,
            status: "FAILED",
            data: 'Please insert the proper value for type(1 for Contacts Payload, 2 for Statuses Payload)'
        });
    } else {
        let query_2 = "Select count(1) as c from ezb_push_callback_master where wanumber = ? and log_date = ? and status IN(0,1) and type = ?";
        let result_2 = await db.query(query_2, [wanumber, formattedDate, type]);
        let wabacount = JSON.stringify(result_2[0][0].c);
        if (wabacount >= 1) {
            res.send({
                code: 1005,
                status: "FAILED",
                data: 'Already an entry found for today'
            });
        } else {
            let query_3 = "Insert into ezb_push_callback_master(log_date,wanumber,date,type) values(?,?,NOW(),?)";
            let result_3 = await db.query(query_3, [formattedDate, wanumber, type]);
            console.log({ result_3 });
            res.send({
                code: 200,
                status: "SUCCESS",
                data: 'EVENT RECEIVED'
            });
        }
    }
};