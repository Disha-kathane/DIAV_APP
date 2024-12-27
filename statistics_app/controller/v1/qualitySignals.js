const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const appLoggers = require('../../applogger.js');
const async = require('async');
let errorLogger = appLoggers.errorLogger;

module.exports = async (req, res) => {
    try {
        console.log(req.body);
        errorLogger.info(req.body);
        let resultdata = [];
        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }

        let apikeys = (typeof req.headers.apikey != undefined) ? req.headers.apikey + '' : '';
        let getusers = (callback) => {
            userService.getUserId(apikeys, (err, result) => {
                if (err) {
                    return callback(err.message);
                }

                if (result.length > 0) {
                    let userid = result[0].userid;
                    callback(null, userid);

                } else {
                    res.send({
                        code: 'WA002',
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: {}
                    });
                }
            });
        };
        let getwabaid = (userid, callback) => {
            userService.getWabaId(userid, (err, [result]) => {
                if (err) {
                    return callback(err.message);
                } else {
                    let wabaId = result.whatsapp_business_account_id;
                    callback(null, wabaId);
                }
            });
        };

        let getaccesstoken = (wabaId, callback) => {
            userService.getAccessToken((err, [result]) => {
                if (err) {
                    return callback(err.message);
                } else {
                    let SystemToken = result.value;
                    callback(null, SystemToken, wabaId);

                }
            });
        };

        let tempdata = [];
        let getqualitysignal = (SystemToken, wabaId, callback) => {
            whatsappService.getQualitySignal(SystemToken, wabaId, (err, result) => {
                if (err) {
                    return callback(err.message);
                } else {
                    result.data.forEach((entry, index) => {
                        tempdata.push({
                            'id': entry.id,
                            'number': entry.display_phone_number.replace(/\s/g, '')
                        });

                        if (index == result.data.length - 1) {
                            callback(null, tempdata, SystemToken);
                        }
                    });
                }
            });
        };

        let data = [];
        let getqualitysignalstatus = (tempdata, SystemToken, callback) => {
            // console.log('getqualitysignalstatus: '+JSON.stringify(tempdata));
            fields = 'status,id,account_mode,certificate,code_verification_status,display_phone_number,name_status,new_certificate,new_name_status,quality_score';
            let counter = 0;
            tempdata.forEach((entry, index) => {
                let id = entry.id;
                whatsappService.getQualitySignalStatus(id, SystemToken, fields, (err, result) => {
                    // console.log({SystemToken})
                    counter++;

                    if (err) {
                        console.log(err);
                        return callback(err.message);
                    } else {
                        result.index = index;
                        data.push(result);
                    }

                    if (counter == tempdata.length) {
                        callback(null, data);

                    }
                });

            });
        };

        async.waterfall([getusers, getwabaid, getaccesstoken, getqualitysignal, getqualitysignalstatus], function (err, result) {

            if (err) {
                errorLogger.error(err);
                res.status(err.response != undefined && err.response.status != undefined ? err.response : 200);
                res.send({
                    code: 200,
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : 'The specified WABA might be offline or out of service',
                    data: []
                });
            } else {
                console.log(JSON.stringify(result));
                for (i = 0; i < result.length; i++) {

                    let status = result[i].status;
                    let id = result[i].id;
                    let account_mode = result[i].account_mode;
                    let display_phone_number = result[i].display_phone_number;
                    let name_status = result[i].name_status;
                    let new_name_status = result[i].new_name_status;
                    let index = result[i].index;
                    // modified by khushal dated 26/08/2022
                    let quality_score = { 'score': result[i].quality_score != undefined ? result[i].quality_score.score : '' };
                    console.log({ status, id, account_mode, display_phone_number, name_status, new_name_status, index, quality_score });
                    resultdata.push({ status, id, account_mode, display_phone_number, name_status, new_name_status, index, quality_score });
                }
                res.send({
                    code: 200,
                    status: 'success',
                    message: 'Successfully Done',
                    data: resultdata
                });
            }
        });

    } catch (error) {
        errorLogger.error(JSON.stringify(error));
        res.status(500);
        res.send({
            code: 'WA101',
            status: 'FAILED',
            message: error.message != undefined ? error.message : 'Request Failed',
            data: []
        });
    }
};