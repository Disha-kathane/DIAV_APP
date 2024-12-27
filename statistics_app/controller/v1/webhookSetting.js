const userService = require('../../services/v1/userStat');
const whatsappService = require('../../services/v1/whatsapp');
const async = require('async');
const {
    errorLogger,
    infoLogger
} = require('../../applogger');



module.exports = async (req, res) => {
    try {
        console.log(req.body);
        errorLogger.info(req.body);
        let callback_persist = (typeof req.body.callback_persist != undefined && req.body.callback_persist != '') ? req.body.callback_persist + '' : '';
        let media = (typeof req.body.media != undefined) ? req.body.media + '' : '';
        let max_concurrent_requests = (typeof req.body.max_concurrent_requests != undefined) ? req.body.max_concurrent_requests + '' : '';
        let sent_status = (typeof req.body.sent_status != undefined && req.body.sent_status != '') ? req.body.sent_status + '' : '';
        let wamsgsettingid = (typeof req.body.message_id != undefined) ? req.body.message_id + '' : '';
        let payload = {};

        callback_persist = callback_persist == "true" ? true : false;
        sent_status = sent_status == "true" ? true : false;

        if (!media || !max_concurrent_requests || !wamsgsettingid) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'Invalid payload',
                data: []

            }
        }


        let webhooksettings = (callback) => {
            userService.getWebhookSetting(wamsgsettingid, (err, result) => {
                if (err) {
                    return callback(err.message);
                }
                if (result != null && result.length > 0) {
                    let waurl = result[0].waurl;
                    let authtoken = result[0].authtoken;
                    let wacallbackurl = result[0].wacallbackurl;
                    callback(null, authtoken, waurl, wacallbackurl);
                }
            });
        }
        let callwebhookapi = (authtoken, waurl, wacallbackurl, callback) => {
            payload = {
                "callback_persist": callback_persist,
                "media": {
                    "auto_download": media.split(",")
                },
                "webhooks": {
                    "url": wacallbackurl,
                    "max_concurrent_requests": max_concurrent_requests
                },
                "sent_status": sent_status
            }

            whatsappService.webhookSettingApi(authtoken, waurl, '/v1/settings/application', payload, (err, result) => {
                if (err) {
                    return callback(err.message);
                } else {
                    let data = result.meta;
                    callback(null, data);
                }
            });
        }
        async.waterfall([webhooksettings, callwebhookapi], function (err, result) {
            if (err) {
                errorLogger.error(err);
                res.status(err.response.status);
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message,
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
        })
    } catch (error) {
        errorLogger.error(JSON.stringify(error));
        res.status(500);
        res.send({
            code: 'WA101',
            status: 'FAILED',
            message: error.message,
            data: []
        });
    }

}