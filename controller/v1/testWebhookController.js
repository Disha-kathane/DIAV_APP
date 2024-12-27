//const async = require('async');
const dbpool = require('../../db/wabot');
const PropertiesReader = require('properties-reader');
const path = require('path');
const async = require('async');
const validator = require('validator');
const moment = require('moment');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');
const callbackService = require('../../services/v1/newwacallback');
const sendService = require('../../services/v1/newsend');
const botUtils = require('../../utils/bot');

module.exports = (req, res) => {
    let publicMediaUrl = null;
    let obj = null;
    let wanumber = null;
    let phonenoid = null;
    let accesstoken = null;
    console.log(JSON.stringify(req.body));
    let body = req.body;
    let readobj = (done) => {
        if (body.object === 'whatsapp_business_account') {
            // obj = req.body.entry[0];
            // wanumber = obj.changes[0].value.metadata.display_phone_number;
            // phonenoid = obj.changes[0].value.metadata.phone_number_id;

            body.entry.forEach(function (entry) {
                // Gets the message. entry.messaging is an array, but 
                // will only ever contain one message, so we get index 0
                obj = JSON.stringify(entry);
                console.log("\n Post ==> " + obj);
                wanumber = obj.changes[0].value.metadata.display_phone_number;
                phonenoid = obj.changes[0].value.metadata.phone_number_id;                
                done(null, 'EVENT_RECEIVED');
            });

            // console.log(JSON.stringify(obj))

        } else {
            done('Error');
        }
    }


    async.waterfall([
        readobj,
    ], (err, result) => {
        if (err) {
            res.status(404);
        } else {
            res.status(200).send(result);
        }
    });
}