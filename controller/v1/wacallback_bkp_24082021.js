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
const botUtils = require('../../utils/bot');
const properties = PropertiesReader(path.join(__dirname, '../../settings/application.properties'));
const callbackService = require('../../services/v1/wacallback');
const sendService = require('../../services/v1/send');


module.exports = (req, res) => {
    try {
        let apikey = req.params.apikey;
        let wanumber = req.params.wanumber;
        wanumber = wanumber.replace("+", "");
        let obj = req.body;
        console.log(JSON.stringify(obj));

        let userId;
        let wabaUrl;
        let wabaAuthToken;

        let validateApiKey = (done) => {
            callbackService.validateApiKey(apikey, wanumber, (err, result) => {
                if (result.length > 0) {
                    if (result[0].userstatus == 0) {
                        done('User is Inactive');
                    }
                    else {
                        userId = result[0].userid;
                        wabaUrl = result[0].waurl;
                        wabaAuthToken = result[0].authtoken;
                        done(err, result);
                    }
                }
                else {
                    done('User not found');
                }
            });
        }

        let processMessage = (result, done) => {
            if (Object.keys(obj).length > 0) {
                if (obj.hasOwnProperty('contacts')
                    && obj.hasOwnProperty('messages')) {
                    if (obj.contacts != undefined && obj.messages != undefined && obj.messages[0].text != undefined) {
                        let isSubscribe = false;
                        let bodyText = obj.messages[0].text.body.toString();
                        callbackService.getReplyMessage(bodyText, wanumber, (err, result) => {

                            let autoReplyMessage = result[0].auto_response != null ? result[0].auto_response : '';
                            let unSubscribeMessage = result[0].unsubmsg != null ? result[0].unsubmsg : '';
                            let reSubscribeMessage = result[0].resubmsg != null ? result[0].resubmsg : '';
                            let contactno = obj.contacts[0].wa_id;

                            if (unSubscribeMessage.length > 0) {
                                callbackService.updateSubscription(contactno, 0, '+' + wanumber, null, bodyText, (err, result) => {
                                    sendMessage(unSubscribeMessage, contactno);
                                    done(err, 'Unsubscribed');
                                    return;
                                });
                            }
                            else if (reSubscribeMessage.length > 0) {
                                callbackService.updateSubscription(contactno, 1, '+' + wanumber, bodyText, null, (err, result) => {
                                    sendMessage(reSubscribeMessage, contactno);
                                    done(err, 'Subscribed');
                                    return;
                                });
                            }
                            else {
                                callbackService.updateSubscription(contactno, 1, '+' + wanumber, bodyText, null, (err, result) => {
                                    sendMessage(autoReplyMessage, contactno);
                                    done(err, 'Auto Reply Sent');
                                    return;
                                });
                            }
                        });
                    }
                }
                if (obj.hasOwnProperty('statuses')) {
                    if (obj.statuses != undefined && obj.statuses[0].status != undefined) {
                        callbackService.updateDelivery(obj, (err, result) => {
                            done(err, result);
                        });
                    }
                }
            }
            else {
                done(null, 'Message Body is missing');
            }
        }

        let sendMessage = (text, to, wanumber) => {
            console.log(sendMessage, wabaUrl, wabaAuthToken);

            let msgType = 4;
            let direction = 1;
            let messagePayload = {
                "to": to,
                "type": "text",
                "recipient_type": "individual",
                "text": {
                    "body": text
                }
            };

            let api = '/v1/messages';
            let httpMethod = 1;
            let requestType = 1;
            let contentLength = Buffer.byteLength(JSON.stringify(messagePayload));
            let apiHeaders = [{
                'headerName': 'Authorization',
                'headerVal': 'Bearer ' + wabaAuthToken
            }, {
                'headerName': 'content-length',
                'headerVal': contentLength
            }];

            botUtils.callWhatsAppApi(wabaUrl, api, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
                console.log(response);
                if (typeof response.messages != undefined) {
                    waMessageId = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                    console.log(waMessageId);
                    sendService.insertMessageInSentMaster(0, null, userId, messagePayload.to, messagePayload, waMessageId, msgType, direction, (error, result) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(waMessageId);
                        }
                    });
                } else {
                    console.log(response);
                }
            }).catch((err) => {
                console.log(err);
            });
        }

        async.waterfall([
            validateApiKey,
            processMessage
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