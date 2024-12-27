const userService = require('../../services/v1/userStat');
const whatsappService = require('../../services/v1/whatsapp');
const async = require('async');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');

module.exports = async (req, res) => {
    try {
        errorLogger.info(req.body);
        let wamsgsettingid = (typeof req.body.id != undefined) ? req.body.id + '' : '';
        let webhookUrl = (typeof req.body.webhookurl != undefined) ? req.body.webhookurl + '' : '';
        // console.log(wamsgsettingid,webhookUrl);
        if (!req.body.id) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'Setting Id is required',
                data: []
            };
        }

        if (!req.body.webhookurl) {
            return {
                code: 'WA002',
                status: 'FAILED',
                message: 'Webhookurl is required',
                data: []
            };

        }

        let getwebhooksetting = (callback) => {
            userService.getWebhookSetting(wamsgsettingid, (err, result) => {
                if (err) {
                    return callback(err.message);
                }
                if (result != null && result.length > 0) {
                    let waurl = result[0].waurl;
                    let authtoken = result[0].authtoken;
                    callback(null, authtoken, waurl)
                }
            });
        }



        let updatesettingapi = (authtoken, waurl, callback) => {
            let payload = {
                "callback_persist": true,
                "db_garbagecollector_enable": true,
                "media": {
                    "auto_download": [
                        "image",
                        "video",
                        "voice",
                        "sticker",
                        "audio",
                        "document"
                    ]
                },
                "webhooks": {
                    "max_concurrent_requests": 24,
                    "url": webhookUrl
                },
                "sent_status": true,
            }
            whatsappService.updateSettingApi(authtoken, waurl, '/v1/settings/application', payload, (err, result) => {
                if (err) {
                    return callback(err.message);
                } else {
                    callback(null, result);
                }
            })
        }
        async.waterfall([getwebhooksetting, updatesettingapi], function (err, result) {
            if (err) {
                errorLogger.error(err);
                res.status(err.response != undefined && err.response.status != undefined ? err.response.status : 200);
                res.send({
                    code: 200,
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : 'The specified WABA might be offline or out of service',
                    data: []
                });
                return;

            } else {
                errorLogger.info(result);
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: "Successfully Done",
                    data: result
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
}