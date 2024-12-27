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
const callbackService = require('../../services/v1/wacallback_ready_07032022');
const sendService = require('../../services/v1/send_ready_07032022');

let axios = require('axios');
let http = require('http');
let https = require('https');
let httpUrl = require('url');
let fs = require('fs');

let FormData = require('form-data');

const AWS = require('aws-sdk');
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

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'support@pinbot.ai',
        pass: 'L0g!t3cG*E42'
    }
});

module.exports = (req, res) => {
    try {
        let publicMediaUrl = null;
        let apikey = req.params.apikey;
        let wanumber = req.params.wanumber;
        wanumber = wanumber.replace("+", "");
        let obj = req.body;
        console.log('Callback Payload ==============================>' + JSON.stringify(obj));

        errorLogger.info("APIKEY: " + apikey + "\nWABA_NUMBER: " + wanumber + "\nREQUEST_BODY: " + JSON.stringify(req.body));

        let userId;
        let wabaUrl;
        let wabaAuthToken;
        let wabaId;
        let wabaNumber;
        let isProperPayload = false;
        let isLiveChat = 0;
        let liveChatWebHook = null;
        let customCallback = null;
        let isactivepinbotflow = null;
        let userProfileName = null;
        let userMobileNumber = null;

        let validateApiKey = (done) => {
            callbackService.validateApiKey(apikey, wanumber, (err, result) => {
                if (result != undefined && result.length > 0) {
                    console.log('validateApiKey result ==============================>' + JSON.stringify(result));
                    if (result[0].userstatus == 0) {
                        done('User is Inactive');
                    }
                    else {
                        userId = result[0].userid;
                        wabaUrl = result[0].waurl;
                        wabaAuthToken = result[0].authtoken;
                        wabaId = result[0].wa_msg_setting_id;
                        wabaNumber = result[0].wanumber;
                        isLiveChat = result[0].islivechat;
                        liveChatWebHook = result[0].livechatwebhook;
                        customCallback = result[0].custom_callback;
                        isactivepinbotflow = result[0].isactivepinbotflow;

                        done(err, result);
                    }
                }
                else {
                    console.log('validateApiKey error ==============================>' + JSON.stringify(err));
                    done('User not found');
                }
            });
        }

        let processMessage = (result, done) => {

            if (customCallback != undefined && customCallback.length > 0) {
                console.log('processMessage====================>' + customCallback);
                callCustomCallback(customCallback, obj);
            }

            if (Object.keys(obj).length > 0) {
                if (obj.hasOwnProperty('contacts')
                    && obj.hasOwnProperty('messages')) {
                    if (obj.contacts != undefined && obj.messages != undefined) {
                        console.log('processMessage: ' + JSON.stringify(obj));
                        isProperPayload = true;
                        let bodyText;
                        let contactno = obj.contacts[0].wa_id;
                        let isLiveChatActive;

                        userProfileName = obj.contacts[0].profile.name;
                        userMobileNumber = obj.contacts[0].wa_id;

                        if (obj.messages[0].type == 'text' && obj.messages[0].text != undefined) {
                            bodyText = obj.messages[0].text.body.toString();
                            async.waterfall([
                                function (cb) {

                                    sendService.isFlowChatKeyword(bodyText, userId, (err, result) => {
                                        if (err) {
                                            console.log('isFlowChatKeyword error=====================>' + JSON.stringify(err) + ", bodyText=============>" + bodyText + ", contactno=================>" + contactno);
                                            cb(err);
                                        }
                                        else {
                                            console.log('isFlowChatKeyword result=====================>' + JSON.stringify(result) + ", bodyText=============>" + bodyText + ", contactno=================>" + contactno);
                                            if (result[0].c > 0) {
                                                console.log('Text is predefined keyword');
                                                cb('Text is predefined keyword');
                                            }
                                            else {
                                                console.log('Go Ahead');
                                                cb(null, 1);
                                            }
                                        }
                                    });
                                },
                                function (r, cb) {
                                    sendService.fetchLastTextMessage(contactno, userId, (err, result) => {
                                        if (err) {
                                            console.log('fetchLastTextMessage error=====================>' + JSON.stringify(err));
                                            cb(err);
                                        }
                                        else {
                                            console.log('fetchLastTextMessage result=====================>' + JSON.stringify(result));
                                            cb(null, result[0] != undefined ? result[0].session_id : '');
                                        }
                                    });
                                },
                                function (session_id, cb) {
                                    if (session_id != null && session_id.length > 0) {
                                        sendService.updateChatAttributes(session_id, obj.messages[0].text.body, (err, result) => {
                                            if (err) {
                                                console.log('logSentByUserMessage updateChatAttributes error=====================>' + JSON.stringify(err));
                                                cb(err);
                                            }
                                            else {
                                                console.log('logSentByUserMessage updateChatAttributes result=====================>' + JSON.stringify(result));
                                                cb(null, session_id);
                                            }
                                        });
                                    }
                                    else {
                                        cb(null, session_id);
                                    }
                                },
                                function (session_id, cb) {
                                    if (session_id != null && session_id.length > 0) {
                                        pushDataToWebhook(session_id, userId, (err, result) => {
                                            cb(null, session_id);
                                        });
                                    }
                                    else {
                                        cb(null, 'No Message Found');
                                    }
                                }
                            ], (err, result) => {
                                // done(null, result);
                            });
                        }
                        if (obj.messages[0].type == 'interactive' && obj.messages[0].interactive != undefined) {
                            let tempInteractiveAttrValue = null;
                            if (obj.messages[0].interactive.type == 'button_reply') {
                                bodyText = obj.messages[0].interactive.button_reply.title;
                                tempInteractiveAttrValue = obj.messages[0].interactive.button_reply.title;
                            }
                            if (obj.messages[0].interactive.type == 'list_reply') {
                                bodyText = obj.messages[0].interactive.list_reply.title;
                                tempInteractiveAttrValue = obj.messages[0].interactive.list_reply.title;
                            }

                            sendService.updateChatAttributes(obj.messages[0].context.id, tempInteractiveAttrValue, (err, result) => {
                                if (err) {
                                    console.log('logSentByUserMessage updateChatAttributes error=====================>' + JSON.stringify(err));
                                }
                                else {
                                    pushDataToWebhook(obj.messages[0].context.id, userId, (err, result) => {
                                        console.log('logSentByUserMessage updateChatAttributes result=====================>' + JSON.stringify(result));
                                    });
                                }
                            });
                        }
                        if (obj.messages[0].type == 'video' ||
                            obj.messages[0].type == 'image' ||
                            obj.messages[0].type == 'audio' ||
                            obj.messages[0].type == 'voice' ||
                            obj.messages[0].type == 'sticker' ||
                            obj.messages[0].type == 'document' ||
                            obj.messages[0].type == 'location' ||
                            obj.messages[0].type == 'contacts' ||
                            obj.messages[0].type == 'button' ||
                            obj.messages[0].type == 'unknown') {
                            bodyText = 'a2fee1ed1cecebbf0897e36661a229c4';
                        }

                        if (bodyText != '' && bodyText.length > 0) {


                            sendService.checkLiveChatStatus(contactno, userId, (checkLiveChatStatusErr, checkLiveChatStatusResult) => {
                                isLiveChatActive = checkLiveChatStatusResult[0].c;
                                console.log('checkLiveChatStatus result=========================>' + JSON.stringify(isLiveChatActive));
                                if (isLiveChatActive == 0) {
                                    async.waterfall([
                                        function (callback) {
                                            if (obj.messages[0].type == 'interactive' && obj.messages[0].interactive != undefined) {
                                                sendService.fetchPreviousButtonClick(obj.contacts[0].wa_id, obj.messages[0].context.id, bodyText, (err, result) => {
                                                    console.log('fetchPreviousButtonClick================================>' + JSON.stringify(result));
                                                    callback(null, result);
                                                });
                                            }
                                            else {
                                                callback(null, 0);
                                            }
                                        },
                                        function (fetchPreviousButtonResult, callback) {
                                            if (fetchPreviousButtonResult.length > 0 && fetchPreviousButtonResult[0].session > 0) {
                                                console.log('fetchPreviousButtonResult================================>' + JSON.stringify(fetchPreviousButtonResult));
                                                sendService.updatePreviousButtonNextMessageIdInSession(fetchPreviousButtonResult[0].id, fetchPreviousButtonResult[0].next_message_id, fetchPreviousButtonResult[0].current_message_id, 0, fetchPreviousButtonResult[0].current_message_type, fetchPreviousButtonResult[0].placeholder, (err, result1) => {
                                                    if (err) {
                                                        console.log('updatePreviousButtonNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                    }
                                                    else {
                                                        console.log('updatePreviousButtonNextMessageIdInSession 2 result==================>' + JSON.stringify(result1));
                                                        callback(null, fetchPreviousButtonResult);
                                                    }
                                                });
                                            }
                                            else {
                                                callback(null, fetchPreviousButtonResult);
                                            }
                                        },
                                        function (fetchPreviousButtonResult, callback) {
                                            if (bodyText.toLowerCase() == 'STOP'.toString().toLowerCase()) {
                                                // callbackService.getReplyMessage(bodyText, wanumber, (err, getReplyMessageResult) => {
                                                //     sendService.resetSessionByFlowUserId(userId, (err, resetSessionResult) => {
                                                //         console.log('resetSession======================>(' + userId + ')' + JSON.stringify(resetSessionResult));
                                                //         return callback({ code: 400, status: 'FAILED', message: getReplyMessageResult[0].unsubmsg != null ? getReplyMessageResult[0].unsubmsg : 'You are unsubscribed' });
                                                //     });
                                                // });

                                                sendService.resetSessionByFlowUserId(userId, contactno, (err, resetSessionResult) => {
                                                    console.log('resetSession======================>(' + userId + ')' + JSON.stringify(resetSessionResult));
                                                    return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                });
                                            } else {
                                                callbackService.updateSubscription(contactno, 1, '+' + wanumber, null, null, (err, result) => {
                                                    callback(null, fetchPreviousButtonResult);
                                                });
                                            }
                                        },
                                        function (fetchPreviousButtonResult, callback) {
                                            sendService.isFlowChatKeyword(bodyText, userId, (err, isFlowChatKeywordResult) => {
                                                console.log('isFlowChatKeyword result_1=====================>' + JSON.stringify(isFlowChatKeywordResult[0].c) + ", bodyText=============>" + bodyText + ", contactno=================>" + contactno);
                                                callback(err, isFlowChatKeywordResult[0].c, fetchPreviousButtonResult);
                                            });
                                        },
                                        function (isFlowChatKeywordResult, fetchPreviousButtonResult, callback) {
                                            if (isFlowChatKeywordResult > 0) {
                                                console.log('i am here 1');
                                                sendService.resetSessionByFlowUserId(userId, contactno, (err, resetSessionResult) => {
                                                    callback(err, fetchPreviousButtonResult);
                                                });
                                            }
                                            else {
                                                console.log('i am here 2');
                                                callback(null, fetchPreviousButtonResult);
                                            }
                                        },
                                        function (fetchPreviousButtonResult, callback) {
                                            sendService.fetchFlowSession(contactno, userId, (err, sessionResult) => {
                                                if (sessionResult != undefined) {
                                                    console.log('fetchFlowSession==========================>' + JSON.stringify(sessionResult));
                                                    callback(err, userId, sessionResult[0]);
                                                }
                                            });
                                        },
                                        function (userId, sessionResult, callback) {
                                            if (sessionResult.session > 0) {
                                                sendService.fetchCurrentSession(contactno, userId, bodyText, (err, fetchCurrentSessionResult) => {
                                                    console.log('fetchCurrentSession======================>' + JSON.stringify(fetchCurrentSessionResult));
                                                    callback(err, userId, sessionResult, fetchCurrentSessionResult != undefined ? fetchCurrentSessionResult[0].id : null);
                                                });
                                            }
                                            else {
                                                callback(null, userId, sessionResult, 0);
                                            }
                                        },
                                        function (userId, sessionResult, id, callback) {
                                            if (sessionResult.session > 0 && id != null) {
                                                id = id.toString().replace(/\'/g, '');
                                                sendService.resetSessionByFlowSessionId(id, (err, resetSessionResult) => {
                                                    console.log('resetSession======================>(' + id + ')' + JSON.stringify(resetSessionResult));
                                                    sessionResult.session = 0;
                                                    sessionResult.next_message_id = null;
                                                    callback(err, userId, sessionResult);
                                                });
                                            }
                                            else {
                                                callback(null, userId, sessionResult);
                                            }
                                        },
                                        function (userId, sessionResult, callback) {
                                            console.log('sessionResult==========================>' + JSON.stringify(sessionResult));
                                            if (sessionResult.session == 0) {
                                                sendService.fetchFlowId(userId, bodyText, (err, flowResult) => {
                                                    if (err) {
                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                    }
                                                    else {
                                                        console.log('fetchFlowId==========================>' + JSON.stringify(flowResult));
                                                        let isFlowEnabled = flowResult[0].c;
                                                        if (isFlowEnabled == 1) {
                                                            callback(err, userId, flowResult[0].flowid, sessionResult);
                                                        }
                                                        else {
                                                            return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                        }
                                                    }
                                                });
                                            }
                                            // else if (sessionResult.session > 0 && sessionResult.is_livechat == 1) {
                                            //     sendService.fetchEndLiveChatMessage(contactno, bodyText, (err, fetchEndLiveChatMessageResult) => {
                                            //         if (err) {
                                            //             console.log('fetchEndLiveChatMessage==========================>' + JSON.stringify(err));
                                            //             return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                            //         }
                                            //         else {
                                            //             console.log('fetchEndLiveChatMessage==========================>' + JSON.stringify(fetchEndLiveChatMessageResult));
                                            //             let isLiveChatActive = fetchEndLiveChatMessageResult[0].c;
                                            //             if (isLiveChatActive == 1) {
                                            //                 let endLiveChatMessage = fetchEndLiveChatMessageResult[0].end_chat_message;
                                            //                 return callback({ code: 600, status: 'FAILED', message: endLiveChatMessage });
                                            //             }
                                            //             else {
                                            //                 return callback({ code: 500, status: 'FAILED', message: 'No Flow Found' });
                                            //             }
                                            //         }
                                            //     });
                                            // }
                                            else {
                                                callback(null, userId, sessionResult.flowid, sessionResult);
                                            }
                                        },
                                        function (userId, flowid, sessionResult, callback) {
                                            if (sessionResult.next_message_id == null) {
                                                sendService.fetchInitialMessage(flowid, (err, result) => {
                                                    console.log('fetchInitialMessage=====================>' + JSON.stringify(result));
                                                    let flowTmpPayload = JSON.parse(result[0].node_body);
                                                    let flowType = result[0].typenode;
                                                    callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);
                                                });
                                            }
                                            else {
                                                if (sessionResult.is_node_option == 1) {
                                                    if (sessionResult.is_validator == 1) {
                                                        if (sessionResult.validator == 'isNumeric') {
                                                            if (validator.isNumeric(bodyText)) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isAlphaNumeric') {
                                                            if (validator.matches(bodyText, /^[a-zA-Z0-9]*$/)) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isNationalMobileNumber') {
                                                            console.log('isNationalMobileNumber======================>' + botUtils.isMobileLocal(bodyText, '91'));
                                                            // if (botUtils.isMobileLocal(bodyText, '91')) {
                                                            if (bodyText.length == 10) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isInternationalMobileNumber') {
                                                            if (botUtils.isMobileInternational(bodyText)) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isPancard') {
                                                            if (validator.matches(bodyText, /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/)) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isEmail') {
                                                            if (validator.isEmail(bodyText)) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isDate') {
                                                            if (validator.isAfter(moment(bodyText, ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY/MM/DD", "DD/MM/YYYY"]).format('YYYY-MM-DD'),
                                                                moment().format('YYYY-MM-DD'))) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isTime') {
                                                            if (moment(bodyText, ["h:mma", "h:mm", "hh:mma", "hh:mm"]).isAfter(moment(moment(), ["h:mma", "h:mm", "hh:mma", "hh:mm"]))) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isDateTime') {
                                                            if (validator.isAfter(moment(bodyText, ["YYYY-MM-DD HH:mm", "DD-MM-YYYY HH:mm", "YYYY/MM/DD HH:mm", "DD/MM/YYYY HH:mm"]).format('YYYY-MM-DD HH:mm'),
                                                                moment().format('YYYY-MM-DD HH:mm'))) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isDOB') {
                                                            if (validator.isBefore(moment(bodyText, ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY/MM/DD", "DD/MM/YYYY"]).format('YYYY-MM-DD'),
                                                                moment().format('YYYY-MM-DD'))) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isAdharcard') {
                                                            if (bodyText.length == 12 && validator.isNumeric(bodyText)) {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isExactMatch') {
                                                            sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                if (result[0] != undefined) {
                                                                    let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                    let flowType = result[0].typenode;
                                                                    callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                }
                                                                else {
                                                                    return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                                }
                                                            });
                                                        }
                                                        if (sessionResult.validator == 'isLocation') {
                                                            if (obj.messages[0].type == 'location') {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isImage') {
                                                            if (obj.messages[0].type == 'image') {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isDocument') {
                                                            if (obj.messages[0].type == 'document') {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                            console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                            if (result[0] != undefined) {
                                                                let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                let flowType = result[0].typenode;
                                                                callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                            }
                                                            else {
                                                                // return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                if (sessionResult != null) {
                                                                    if (sessionResult.error_message != null && sessionResult.error_message.length > 0) {
                                                                        return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                                    }
                                                                    else {
                                                                        return callback({ code: 400, status: 'FAILED', message: 'Please enter correct value.' });
                                                                    }
                                                                }
                                                                else {
                                                                    return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                }
                                                            }
                                                        });
                                                    }

                                                }
                                                else {
                                                    if (sessionResult.is_validator == 1) {
                                                        if (sessionResult.validator == 'isNumeric') {
                                                            if (validator.isNumeric(bodyText)) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isAlphaNumeric') {
                                                            if (validator.matches(bodyText, /^[a-zA-Z0-9]*$/)) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isNationalMobileNumber') {
                                                            console.log('isNationalMobileNumber======================>' + botUtils.isMobileLocal(bodyText, '91'));
                                                            // if (botUtils.isMobileLocal(bodyText, '91')) {
                                                            if (bodyText.length == 10) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isInternationalMobileNumber') {
                                                            if (botUtils.isMobileInternational(bodyText)) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isPancard') {
                                                            if (validator.matches(bodyText, /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/)) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isEmail') {
                                                            if (validator.isEmail(bodyText)) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isDate') {
                                                            if (validator.isAfter(moment(bodyText, ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY/MM/DD", "DD/MM/YYYY"]).format('YYYY-MM-DD'),
                                                                moment().format('YYYY-MM-DD'))) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isTime') {
                                                            if (moment(bodyText, ["h:mma", "h:mm", "hh:mma", "hh:mm"]).isAfter(moment(moment(), ["h:mma", "h:mm", "hh:mma", "hh:mm"]))) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isDateTime') {
                                                            if (validator.isAfter(moment(bodyText, ["YYYY-MM-DD hh:mm", "DD-MM-YYYY hh:mm", "YYYY/MM/DD hh:mm", "DD/MM/YYYY hh:mm"]).format('YYYY-MM-DD hh:mm'),
                                                                moment().format('YYYY-MM-DD hh:mm'))) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isDOB') {
                                                            if (validator.isBefore(moment(bodyText, ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY/MM/DD", "DD/MM/YYYY"]).format('YYYY-MM-DD'),
                                                                moment().format('YYYY-MM-DD'))) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isAdharcard') {
                                                            if (bodyText.length == 12 && validator.isNumeric(bodyText)) {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isExactMatch') {
                                                            sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                if (result[0] != undefined) {
                                                                    let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                    let flowType = result[0].typenode;
                                                                    callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                }
                                                                else {
                                                                    return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                                }
                                                            });
                                                        }
                                                        if (sessionResult.validator == 'isLocation') {
                                                            if (obj.messages[0].type == 'location') {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isImage') {
                                                            if (obj.messages[0].type == 'image') {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                        if (sessionResult.validator == 'isDocument') {
                                                            if (obj.messages[0].type == 'document') {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    }
                                                                    else {
                                                                        return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                            console.log('fetchNextMessage(No Validation block)=====================>' + JSON.stringify(result));
                                                            if (result[0] != undefined) {
                                                                let flowTmpPayload = null;
                                                                flowTmpPayload = JSON.parse(result[0].node_body);
                                                                let flowType = result[0].typenode;
                                                                callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                // if (result[0].is_webhook == 1) {
                                                                //     executeWebhook(obj.contacts[0].wa_id, result[0], (err, executeWebhookResult) => {
                                                                //         console.log('executeWebhook=====================>' + JSON.stringify(executeWebhookResult));
                                                                //         if (executeWebhookResult.code == 200) {
                                                                //             sessionResult.webhookResponseCode = executeWebhookResult.code;
                                                                //             flowTmpPayload = executeWebhookResult.data;
                                                                //             let flowType = result[0].typenode;
                                                                //             callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);
                                                                //         }
                                                                //         else {
                                                                //             return callback({ code: 400, status: 'FAILED', message: executeWebhookResult.data });
                                                                //         }
                                                                //         // sessionResult.webhookResponseCode = executeWebhookResult.code;
                                                                //         // flowTmpPayload = executeWebhookResult.data;
                                                                //         // let flowType = result[0].typenode;
                                                                //         // callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);
                                                                //     });
                                                                // }
                                                                // else {
                                                                //     flowTmpPayload = JSON.parse(result[0].node_body);
                                                                //     let flowType = result[0].typenode;
                                                                //     callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);
                                                                // }
                                                            }
                                                            else {
                                                                // return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                if (sessionResult != null) {
                                                                    if (sessionResult.error_message != null && sessionResult.error_message.length > 0) {
                                                                        return callback({ code: 400, status: 'FAILED', message: sessionResult.error_message });
                                                                    }
                                                                    else {
                                                                        return callback({ code: 400, status: 'FAILED', message: 'Please enter correct value.' });
                                                                    }
                                                                }
                                                                else {
                                                                    return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                }
                                                            }
                                                        });
                                                    }
                                                }
                                            }
                                        },
                                        function (userId, flowid, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult, callback) {
                                            if (sessionResult.session == 0) {
                                                sendService.setFlowSession(contactno, flowid, userId, next_message_id, current_message_id, flowType, flowTmpPayload, placeholder, (err, result) => {
                                                    sessionResult.id = result;
                                                    callback(err, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult);
                                                });
                                            }
                                            else {
                                                callback(null, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult);
                                            }
                                        },
                                        // function (flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult, callback) {
                                        //     sendService.fetchValidator(contactno, (err, result) => {
                                        //         console.log('fetchValidator=====================>' + JSON.stringify(result));
                                        //         if (result.length > 0) {
                                        //             let is_validator = result[0].is_validator;
                                        //             let validator_rule = result[0].validator;
                                        //             let error_message = result[0].error_message;

                                        //             if (is_validator == 1) {
                                        //                 if (validator_rule == 'isNumeric') {
                                        //                     if (validator.isNumeric(bodyText)) {
                                        //                         callback(null, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult);
                                        //                     }
                                        //                     else {
                                        //                         return callback({ code: 400, status: 'FAILED', message: error_message });
                                        //                     }
                                        //                 }
                                        //             }
                                        //             else {
                                        //                 callback(null, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult);
                                        //             }
                                        //         }
                                        //         else {
                                        //             callback(null, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult);
                                        //         }
                                        //     });
                                        // },
                                        function (flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult, callback) {
                                            let botMessagePayload = {};

                                            if (flowType == "List") {
                                                let sections = flowTmpPayload.section_count;

                                                botMessagePayload.interactive = {
                                                    "action": {}
                                                };

                                                if (flowTmpPayload.header_text != null) {
                                                    botMessagePayload.interactive = {
                                                        "header": {
                                                            "type": "text",
                                                            "text": flowTmpPayload.header_text
                                                        }
                                                    };
                                                }
                                                if (flowTmpPayload.body_text != null) {
                                                    botMessagePayload.interactive = {
                                                        "body": {
                                                            "text": flowTmpPayload.body_text
                                                        }
                                                    };
                                                }
                                                if (flowTmpPayload.footer_text != null) {
                                                    botMessagePayload.interactive = {
                                                        "footer": {
                                                            "text": flowTmpPayload.footer_text
                                                        }
                                                    };
                                                }
                                                if (flowTmpPayload.button_text != null) {
                                                    botMessagePayload.interactive.action = {
                                                        "button": flowTmpPayload.button_text,
                                                        "sections": []
                                                    }
                                                }
                                                if (parseInt(sections) > 0) {
                                                    botMessagePayload.interactive.type = "list";
                                                    for (let u = 0; u < sections; u++) {
                                                        botMessagePayload.interactive.action.sections.push({
                                                            "title": flowTmpPayload.sections[u + 1].section_text,
                                                            "rows": []
                                                        });

                                                        let index = 1;
                                                        Object.keys(flowTmpPayload.sections[u + 1].rows).forEach(function (key) {
                                                            var value = flowTmpPayload.sections[u + 1].rows[key];
                                                            botMessagePayload.interactive.action.sections[u].rows.push({
                                                                "id": "id_" + index,
                                                                "title": value.row_text,
                                                                "description": value.description_text
                                                            });
                                                            index++;
                                                        });
                                                    }
                                                }

                                                console.log('botMessagePayload==========>' + JSON.stringify(botMessagePayload));
                                                callback(null, flowTmpPayload, botMessagePayload.interactive, sessionResult, next_message_id, current_message_id, 9, flowType, placeholder, nextMessageResult);
                                            }
                                            else if (flowType == "Question") {
                                                if (flowTmpPayload.media_type == "image") {
                                                    let imgPayload = {
                                                        "link": flowTmpPayload.media_url,
                                                        "caption": flowTmpPayload.text != undefined ? flowTmpPayload.text : ''
                                                    }

                                                    callback(null, flowTmpPayload, imgPayload, sessionResult, next_message_id, current_message_id, 1, flowType, placeholder, nextMessageResult);
                                                }
                                                else if (flowTmpPayload.media_type == "video") {
                                                    let videoPayload = {
                                                        "link": flowTmpPayload.media_url,
                                                        "caption": flowTmpPayload.text != undefined ? flowTmpPayload.text : ''
                                                    }

                                                    callback(null, flowTmpPayload, videoPayload, sessionResult, next_message_id, current_message_id, 2, flowType, placeholder, nextMessageResult);
                                                }
                                                else {
                                                    callback(null, flowTmpPayload, flowTmpPayload.text, sessionResult, next_message_id, current_message_id, 4, flowType, placeholder, nextMessageResult);
                                                }
                                            }
                                            else if (flowType == "Message") {
                                                // if (nextMessageResult.is_webhook == 1) {
                                                //     callback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, 700, flowType, placeholder, nextMessageResult);
                                                // }
                                                // else{
                                                //     callback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, 777, flowType, placeholder, nextMessageResult);
                                                // }

                                                callback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, 777, flowType, placeholder, nextMessageResult);
                                            }
                                            else if (flowType == "Button") {
                                                console.log('Button===================>' + JSON.stringify(flowTmpPayload));

                                                let botMessagePayload = {
                                                    "interactive": {}
                                                };

                                                let _index1 = 1;
                                                if (flowTmpPayload.buttons.length > 0) {
                                                    if (flowTmpPayload.header_type != null && flowTmpPayload.header_type == 'text') {
                                                        if (flowTmpPayload.header_text != null) {
                                                            botMessagePayload.interactive.header = {
                                                                "type": "text",
                                                                "text": flowTmpPayload.header_text
                                                            };
                                                        }
                                                    }
                                                    else if (flowTmpPayload.header_type != null && flowTmpPayload.header_type == 'document') {
                                                        if (flowTmpPayload.header_media_url != null) {
                                                            botMessagePayload.interactive.header = {
                                                                "type": "document",
                                                                "document": {
                                                                    "link": flowTmpPayload.header_media_url,
                                                                    "provider": {
                                                                        "name": "",
                                                                    },
                                                                    "filename": flowTmpPayload.header_media_url.substring(flowTmpPayload.header_media_url.lastIndexOf('/') + 1)
                                                                }
                                                            };
                                                        }
                                                    }
                                                    else if (flowTmpPayload.header_type != null && flowTmpPayload.header_type == 'video') {
                                                        if (flowTmpPayload.header_media_url != null) {
                                                            botMessagePayload.interactive.header = {
                                                                "type": "video",
                                                                "video": {
                                                                    "link": flowTmpPayload.header_media_url,
                                                                    "provider": {
                                                                        "name": "",
                                                                    }
                                                                }
                                                            };
                                                        }
                                                    }
                                                    else if (flowTmpPayload.header_type != null && flowTmpPayload.header_type == 'image') {
                                                        if (flowTmpPayload.header_media_url != null) {
                                                            botMessagePayload.interactive.header = {
                                                                "type": "image",
                                                                "image": {
                                                                    "link": flowTmpPayload.header_media_url,
                                                                    "provider": {
                                                                        "name": "",
                                                                    }
                                                                }
                                                            };
                                                        }
                                                    }



                                                    if (flowTmpPayload.body_text != null) {
                                                        console.log('flowTmpPayload.body_text===================>' + JSON.stringify(flowTmpPayload.body_text));

                                                        botMessagePayload.interactive.body = {
                                                            "text": flowTmpPayload.body_text
                                                        };
                                                    }

                                                    if (flowTmpPayload.footer_text != null) {
                                                        botMessagePayload.interactive.footer = {
                                                            "text": flowTmpPayload.footer_text
                                                        };
                                                    }

                                                    botMessagePayload.interactive.type = "button";
                                                    botMessagePayload.interactive.action = {
                                                        "buttons": []
                                                    }

                                                    for (let f = 0; f < flowTmpPayload.buttons.length; f++) {
                                                        botMessagePayload.interactive.action.buttons.push({
                                                            "type": "reply",
                                                            "reply": {
                                                                "id": "id_" + _index1,
                                                                "title": flowTmpPayload.buttons[f]
                                                            }
                                                        });
                                                        _index1++;
                                                    }
                                                    console.log('botMessagePayload==========>' + JSON.stringify(botMessagePayload));

                                                }
                                                callback(null, flowTmpPayload, botMessagePayload.interactive, sessionResult, next_message_id, current_message_id, 9, flowType, placeholder, nextMessageResult);
                                            }
                                            else if (flowType == "Condition") {
                                                console.log('Condition==========>' + JSON.stringify(flowTmpPayload));
                                                callback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, 700, flowType, placeholder, nextMessageResult);
                                            }
                                            else if (flowType == "Webhook") {
                                                console.log('Webhook==========>' + JSON.stringify(flowTmpPayload));
                                                callback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, 1000, flowType, placeholder, nextMessageResult);
                                            }
                                            else if (flowType == "LiveChat") {
                                                console.log('LiveChat==========>' + JSON.stringify(flowTmpPayload));
                                                callback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, 2000, flowType, placeholder, nextMessageResult);
                                            }
                                        },
                                        function (flowTmpPayload, botMessagePayload, sessionResult, next_message_id, current_message_id, flowType, typeNode, placeholder, nextMessageResult, callback) {
                                            let is_node_option = 0;
                                            if (typeNode == "List") {
                                                is_node_option = 1;
                                            }
                                            else if (typeNode == "Button") {
                                                is_node_option = 1;
                                            }
                                            else if (typeNode == "Condition") {
                                                is_node_option = 1;
                                            }
                                            else if (typeNode == "Question" && flowTmpPayload.variants != undefined) {
                                                is_node_option = 1;
                                            }
                                            else if (typeNode == "Webhook" && flowTmpPayload.code != undefined) {
                                                is_node_option = 1;
                                            }

                                            let result = {
                                                flow_id: sessionResult.id,
                                                next_message_id: next_message_id,
                                                current_message_id: current_message_id,
                                                payload: botMessagePayload,
                                                contactno: contactno,
                                                type: flowType,
                                                type_node: typeNode,
                                                is_node_option: is_node_option,
                                                placeholder: placeholder,
                                                nextMessageResult: nextMessageResult,
                                                is_variant: is_node_option
                                                // ,webhook_res_code: sessionResult.webhookResponseCode
                                            }
                                            console.log('Payload result==========>' + JSON.stringify(result));
                                            callback(null, result);
                                        }
                                    ], (err, result) => {
                                        console.log('Error===============================>' + JSON.stringify(err));
                                        if (err != null && err.code == 404) {
                                            callbackService.getReplyMessage(bodyText, wanumber, (err, result) => {

                                                let autoReplyMessage = result[0].auto_response != null ? result[0].auto_response : '';
                                                let unSubscribeKeyword = result[0].stopword != null ? result[0].stopword : '';
                                                let unSubscribeMessage = result[0].unsubmsg != null ? result[0].unsubmsg : '';
                                                let reSubscribeKeyword = result[0].resubword != null ? result[0].resubword : '';
                                                let reSubscribeMessage = result[0].resubmsg != null ? result[0].resubmsg : '';

                                                if (bodyText.toLowerCase() == unSubscribeKeyword.toString().toLowerCase() && unSubscribeMessage.length > 0) {
                                                    callbackService.updateSubscription(contactno, 0, '+' + wanumber, null, bodyText, (err, result) => {
                                                        sendMessage(unSubscribeMessage, contactno, 4, (err, result) => { });
                                                        logSentByUserMessage(obj, isLiveChatActive, bodyText);
                                                        done(err, 'Success');
                                                        // return;
                                                    });
                                                }
                                                else if (bodyText.toLowerCase() == reSubscribeKeyword.toString().toLowerCase() && reSubscribeMessage.length > 0) {
                                                    callbackService.updateSubscription(contactno, 1, '+' + wanumber, bodyText, null, (err, result) => {
                                                        sendMessage(reSubscribeMessage, contactno, 4, (err, result) => { });
                                                        logSentByUserMessage(obj, isLiveChatActive, bodyText);
                                                        done(err, 'Success');
                                                        // return;
                                                    });
                                                }
                                                else {
                                                    if (autoReplyMessage.length > 0) {
                                                        sendMessage(autoReplyMessage, contactno, 4, (err, result) => { });
                                                    }
                                                    logSentByUserMessage(obj, isLiveChatActive, bodyText);
                                                    done(err, 'Success');
                                                }
                                            });
                                        }
                                        else if (err != null && err.code == 400) {
                                            sendMessage(err.message, contactno, 4, (err, result) => { });
                                            logSentByUserMessage(obj, isLiveChatActive, bodyText);
                                            done(err, 'Success');
                                        }
                                        // else if (err != null && err.code == 500) {
                                        //     sendService.fetchLiveChatSettings(contactno, (err, liveChatSettingsResult) => {
                                        //         callLiveChatWebHook(obj, liveChatSettingsResult);
                                        //         logSentByUserMessage(obj);
                                        //         done(err, 'Success');
                                        //     });
                                        // }
                                        // else if (err != null && err.code == 600) {
                                        //     sendService.fetchLiveChatSettings(contactno, (_err1, liveChatSettingsResult) => {
                                        //         sendService.endLiveChatMessage(contactno, (_err2, endLiveChatMessageResult) => {
                                        //             sendMessage(err.message, contactno, 4, (err, result) => {
                                        //                 callLiveChatWebHook(obj, liveChatSettingsResult);
                                        //                 logSentByUserMessage(obj);
                                        //                 done(err, 'Success');
                                        //             });
                                        //         });
                                        //     });
                                        // }
                                        else {
                                            sendService.updateNextMessageIdInSession(result.flow_id, result.next_message_id, result.current_message_id, result.is_node_option, result.type_node, result.placeholder, (err, result1) => {
                                                console.log(result.payload, result.contactno, result.type);

                                                if (result.type == 777) {
                                                    saveChatAttributes(obj, result, null, (err, chatAttrInsertId) => {
                                                        // sendMessage(result.payload, result.contactno, result.type, (err, _resultMessageId) => {
                                                        //     sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                        //         if (err) {
                                                        //             console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                        //         } else {
                                                        //             console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                        //         }
                                                        //     });
                                                        // });

                                                        Object.keys(result.payload).forEach(function (key) {
                                                            let value = result.payload[key];
                                                            console.log('Keys===========================>' + value.type);
                                                            if (value.type == "message") {
                                                                sendMessage(value.message_text, result.contactno, 4, (err, _resultMessageId) => {
                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                        if (err) {
                                                                            console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                        } else {
                                                                            console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                                        }
                                                                    });
                                                                });
                                                            }
                                                            if (value.type == "image") {
                                                                let imgPayload = {
                                                                    "link": value.media_url,
                                                                    "caption": value.message_text != undefined ? value.message_text : ''
                                                                }

                                                                sendMessage(imgPayload, result.contactno, 1, (err, _resultMessageId) => {
                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                        if (err) {
                                                                            console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                        } else {
                                                                            console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                                        }
                                                                    });
                                                                });
                                                            }
                                                            if (value.type == "document") {
                                                                let docPayload = {
                                                                    "link": value.media_url,
                                                                    "filename": value.media_url.toString().split('/').pop()
                                                                }

                                                                sendMessage(docPayload, result.contactno, 0, (err, _resultMessageId) => {
                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                        if (err) {
                                                                            console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                        } else {
                                                                            console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                                        }
                                                                    });
                                                                });
                                                            }
                                                        });
                                                    });

                                                    // Object.keys(result.payload).forEach(function (key) {
                                                    //     let value = result.payload[key];
                                                    //     console.log('Keys===========================>' + value.type);
                                                    //     if (value.type == "message") {
                                                    //         sendMessage(value.message_text, result.contactno, 4, (err, result) => { });
                                                    //     }
                                                    //     if (value.type == "image") {
                                                    //         let imgPayload = {
                                                    //             "link": value.media_url,
                                                    //             "caption": value.message_text != undefined ? value.message_text : ''
                                                    //         }

                                                    //         sendMessage(imgPayload, result.contactno, 1, (err, result) => { });
                                                    //     }
                                                    //     if (value.type == "document") {
                                                    //         let docPayload = {
                                                    //             "link": value.media_url,
                                                    //             "filename": value.media_url.toString().split('/').pop()
                                                    //         }

                                                    //         sendMessage(docPayload, result.contactno, 0, (err, result) => { });
                                                    //     }
                                                    // });
                                                }
                                                else if (result.type == 700) {
                                                    saveChatAttributes(obj, result, null, (err, conditionresult) => {
                                                        console.log('Condition block======================>' + JSON.stringify(result));
                                                        let isCondition = null;
                                                        let current_message_id = result.current_message_id;
                                                        let _condition = result.payload._condition;

                                                        let if_is_placeholder = result.payload.if_is_placeholder;
                                                        let ctext_is_placeholder = result.payload.ctext_is_placeholder;
                                                        let if_text = result.payload.if_text;
                                                        let compaire_text = result.payload.compaire_text;
                                                        let condition = result.payload.condition

                                                        let if1_is_placeholder = result.payload.if1_is_placeholder;
                                                        let ctext1_is_placeholder = result.payload.ctext1_is_placeholder;
                                                        let if_text1 = result.payload.if_text1;
                                                        let compaire_text1 = result.payload.compaire_text1;
                                                        let condition1 = result.payload.condition1;

                                                        async.waterfall([
                                                            function (conditionCallback) {
                                                                // sendService.fetchLastTextMessageWithPlaceholder(contactno, if_is_placeholder, (err, result) => {
                                                                if (_condition == null) {
                                                                    if (if_is_placeholder == 0 && ctext_is_placeholder == 0) {
                                                                        if (condition == "Equal") {
                                                                            // if (if_text == compaire_text) {
                                                                            if (if_text == obj.messages[0].text.body) {
                                                                                isCondition = "Yes";
                                                                            }
                                                                            else {
                                                                                isCondition = "No";
                                                                            }
                                                                        }
                                                                        else if (condition == "NotEqual") {
                                                                            if (if_text != obj.messages[0].text.body) {
                                                                                isCondition = "Yes";
                                                                            }
                                                                            else {
                                                                                isCondition = "No";
                                                                            }
                                                                        }
                                                                        else if (condition == "KeywordContains") {
                                                                            if (if_text.includes(obj.messages[0].text.body)) {
                                                                                isCondition = "Yes";
                                                                            }
                                                                            else {
                                                                                isCondition = "No";
                                                                            }
                                                                        }
                                                                        else if (condition == "DoesNotContain") {
                                                                            if (!if_text.includes(obj.messages[0].text.body)) {
                                                                                isCondition = "Yes";
                                                                            }
                                                                            else {
                                                                                isCondition = "No";
                                                                            }
                                                                        }
                                                                        else if (condition == "StartsWith") {
                                                                            if (if_text.startsWith(obj.messages[0].text.body)) {
                                                                                isCondition = "Yes";
                                                                            }
                                                                            else {
                                                                                isCondition = "No";
                                                                            }
                                                                        }
                                                                        else if (condition == "DoesNotStartWith") {
                                                                            if (!if_text.startsWith(obj.messages[0].text.body)) {
                                                                                isCondition = "Yes";
                                                                            }
                                                                            else {
                                                                                isCondition = "No";
                                                                            }
                                                                        }
                                                                        else if (condition == "GreaterThan") {
                                                                            if (parseInt(if_text) > parseInt(obj.messages[0].text.body)) {
                                                                                isCondition = "Yes";
                                                                            }
                                                                            else {
                                                                                isCondition = "No";
                                                                            }
                                                                        }
                                                                        else if (condition == "LessThan") {
                                                                            if (parseInt(if_text) < parseInt(obj.messages[0].text.body)) {
                                                                                isCondition = "Yes";
                                                                            }
                                                                            else {
                                                                                isCondition = "No";
                                                                            }
                                                                        }
                                                                        conditionCallback(null, current_message_id, isCondition);
                                                                    }
                                                                    else if (if_is_placeholder == 1 && ctext_is_placeholder == 0) {
                                                                        sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result) => {
                                                                            console.log('CheckCondition ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                                                            if (condition == "Equal") {
                                                                                // if (result[0].attrvalue = obj.messages[0].text.body) {
                                                                                //     isCondition = "Yes";
                                                                                // }
                                                                                if (result[0].attrvalue == compaire_text) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "NotEqual") {
                                                                                if (result[0].attrvalue != compaire_text) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "KeywordContains") {
                                                                                if (result[0].attrvalue.includes(compaire_text)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "DoesNotContain") {
                                                                                if (!result[0].attrvalue.includes(compaire_text)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "StartsWith") {
                                                                                if (result[0].attrvalue.startsWith(compaire_text)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "DoesNotStartWith") {
                                                                                if (!result[0].attrvalue.startsWith(compaire_text)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "GreaterThan") {
                                                                                if (parseInt(result[0].attrvalue) > parseInt(compaire_text)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "LessThan") {
                                                                                if (parseInt(result[0].attrvalue) < parseInt(compaire_text)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }

                                                                            conditionCallback(null, current_message_id, isCondition);
                                                                        });
                                                                    }
                                                                    else if (if_is_placeholder == 1 && ctext_is_placeholder == 1) {
                                                                        sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result_1) => {
                                                                            sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result_2) => {
                                                                                console.log('CheckCondition ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                                                                if (condition == "Equal") {
                                                                                    // if (result[0].attrvalue = obj.messages[0].text.body) {
                                                                                    //     isCondition = "Yes";
                                                                                    // }
                                                                                    if (result_1[0].attrvalue == result_2[0].attrvalue) {
                                                                                        isCondition = "Yes";
                                                                                    }
                                                                                    else {
                                                                                        isCondition = "No";
                                                                                    }
                                                                                }
                                                                                else if (condition == "NotEqual") {
                                                                                    if (result_1[0].attrvalue != result_2[0].attrvalue) {
                                                                                        isCondition = "Yes";
                                                                                    }
                                                                                    else {
                                                                                        isCondition = "No";
                                                                                    }
                                                                                }
                                                                                else if (condition == "KeywordContains") {
                                                                                    if (result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                                                                        isCondition = "Yes";
                                                                                    }
                                                                                    else {
                                                                                        isCondition = "No";
                                                                                    }
                                                                                }
                                                                                else if (condition == "DoesNotContain") {
                                                                                    if (!result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                                                                        isCondition = "Yes";
                                                                                    }
                                                                                    else {
                                                                                        isCondition = "No";
                                                                                    }
                                                                                }
                                                                                else if (condition == "StartsWith") {
                                                                                    if (result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                                                                        isCondition = "Yes";
                                                                                    }
                                                                                    else {
                                                                                        isCondition = "No";
                                                                                    }
                                                                                }
                                                                                else if (condition == "DoesNotStartWith") {
                                                                                    if (!result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                                                                        isCondition = "Yes";
                                                                                    }
                                                                                    else {
                                                                                        isCondition = "No";
                                                                                    }
                                                                                }
                                                                                else if (condition == "GreaterThan") {
                                                                                    if (parseInt(result_1[0].attrvalue) > parseInt(result_2[0].attrvalue)) {
                                                                                        isCondition = "Yes";
                                                                                    }
                                                                                    else {
                                                                                        isCondition = "No";
                                                                                    }
                                                                                }
                                                                                else if (condition == "LessThan") {
                                                                                    if (parseInt(result_1[0].attrvalue) < parseInt(result_2[0].attrvalue)) {
                                                                                        isCondition = "Yes";
                                                                                    }
                                                                                    else {
                                                                                        isCondition = "No";
                                                                                    }
                                                                                }

                                                                                conditionCallback(null, current_message_id, isCondition);
                                                                            });
                                                                        });
                                                                    }
                                                                    else if (if_is_placeholder == 0 && ctext_is_placeholder == 1) {
                                                                        sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result) => {
                                                                            console.log('CheckCondition ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                                                            if (condition == "Equal") {
                                                                                // if (result[0].attrvalue = obj.messages[0].text.body) {
                                                                                //     isCondition = "Yes";
                                                                                // }
                                                                                if (if_text == result[0].attrvalue) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "NotEqual") {
                                                                                if (if_text != result[0].attrvalue) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "KeywordContains") {
                                                                                if (if_text.includes(result[0].attrvalue)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "DoesNotContain") {
                                                                                if (!if_text.includes(result[0].attrvalue)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "StartsWith") {
                                                                                if (if_text.startsWith(result[0].attrvalue)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "DoesNotStartWith") {
                                                                                if (!if_text.startsWith(result[0].attrvalue)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "GreaterThan") {
                                                                                if (parseInt(if_text) > parseInt(result[0].attrvalue)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (condition == "LessThan") {
                                                                                if (parseInt(if_text) < parseInt(result[0].attrvalue)) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }

                                                                            conditionCallback(null, current_message_id, isCondition);
                                                                        });
                                                                    }
                                                                }
                                                                else {
                                                                    async.waterfall([
                                                                        function (andOrCallback) {
                                                                            let _isAndCondition_1 = null;

                                                                            if (if_is_placeholder == 0 && ctext_is_placeholder == 0) {
                                                                                if (condition == "Equal") {
                                                                                    if (if_text == compaire_text) {
                                                                                        _isAndCondition_1 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_1 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition == "NotEqual") {
                                                                                    if (if_text != compaire_text) {
                                                                                        _isAndCondition_1 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_1 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition == "KeywordContains") {
                                                                                    if (if_text.includes(compaire_text)) {
                                                                                        _isAndCondition_1 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_1 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition == "DoesNotContain") {
                                                                                    if (!if_text.includes(compaire_text)) {
                                                                                        _isAndCondition_1 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_1 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition == "StartsWith") {
                                                                                    if (if_text.startsWith(compaire_text)) {
                                                                                        _isAndCondition_1 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_1 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition == "DoesNotStartWith") {
                                                                                    if (!if_text.startsWith(compaire_text)) {
                                                                                        _isAndCondition_1 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_1 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition == "GreaterThan") {
                                                                                    if (parseInt(if_text) > parseInt(compaire_text)) {
                                                                                        _isAndCondition_1 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_1 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition == "LessThan") {
                                                                                    if (parseInt(if_text) < parseInt(compaire_text)) {
                                                                                        _isAndCondition_1 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_1 = false;
                                                                                    }
                                                                                }

                                                                                andOrCallback(null, _isAndCondition_1);
                                                                            }
                                                                            else if (if_is_placeholder == 1 && ctext_is_placeholder == 0) {
                                                                                sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result) => {
                                                                                    console.log('CheckCondition ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                                                                    if (condition == "Equal") {
                                                                                        if (result[0].attrvalue == compaire_text) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "NotEqual") {
                                                                                        if (result[0].attrvalue != compaire_text) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "KeywordContains") {
                                                                                        if (result[0].attrvalue.includes(compaire_text)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "DoesNotContain") {
                                                                                        if (!result[0].attrvalue.includes(compaire_text)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "StartsWith") {
                                                                                        if (result[0].attrvalue.startsWith(compaire_text)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "DoesNotStartWith") {
                                                                                        if (!result[0].attrvalue.startsWith(compaire_text)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "GreaterThan") {
                                                                                        if (parseInt(result[0].attrvalue) > parseInt(compaire_text)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "LessThan") {
                                                                                        if (parseInt(result[0].attrvalue) < parseInt(compaire_text)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }

                                                                                    andOrCallback(null, _isAndCondition_1);
                                                                                });
                                                                            }
                                                                            else if (if_is_placeholder == 1 && ctext_is_placeholder == 1) {
                                                                                sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result_1) => {
                                                                                    sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result_2) => {
                                                                                        console.log('CheckCondition ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                                                                        if (condition == "Equal") {
                                                                                            if (result_1[0].attrvalue == result_2[0].attrvalue) {
                                                                                                _isAndCondition_1 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_1 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition == "NotEqual") {
                                                                                            if (result_1[0].attrvalue != result_2[0].attrvalue) {
                                                                                                _isAndCondition_1 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_1 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition == "KeywordContains") {
                                                                                            if (result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_1 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_1 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition == "DoesNotContain") {
                                                                                            if (!result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_1 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_1 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition == "StartsWith") {
                                                                                            if (result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_1 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_1 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition == "DoesNotStartWith") {
                                                                                            if (!result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_1 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_1 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition == "GreaterThan") {
                                                                                            if (parseInt(result_1[0].attrvalue) > parseInt(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_1 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_1 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition == "LessThan") {
                                                                                            if (parseInt(result_1[0].attrvalue) < parseInt(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_1 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_1 = false;
                                                                                            }
                                                                                        }

                                                                                        andOrCallback(null, _isAndCondition_1);
                                                                                    });
                                                                                });
                                                                            }
                                                                            else if (if_is_placeholder == 0 && ctext_is_placeholder == 1) {
                                                                                sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result) => {
                                                                                    console.log('CheckCondition ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                                                                    if (condition == "Equal") {
                                                                                        if (if_text == result[0].attrvalue) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "NotEqual") {
                                                                                        if (if_text != result[0].attrvalue) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "KeywordContains") {
                                                                                        if (if_text.includes(result[0].attrvalue)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "DoesNotContain") {
                                                                                        if (!if_text.includes(result[0].attrvalue)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "StartsWith") {
                                                                                        if (if_text.startsWith(result[0].attrvalue)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "DoesNotStartWith") {
                                                                                        if (!if_text.startsWith(result[0].attrvalue)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "GreaterThan") {
                                                                                        if (parseInt(if_text) > parseInt(result[0].attrvalue)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition == "LessThan") {
                                                                                        if (parseInt(if_text) < parseInt(result[0].attrvalue)) {
                                                                                            _isAndCondition_1 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_1 = false;
                                                                                        }
                                                                                    }

                                                                                    andOrCallback(null, _isAndCondition_1);
                                                                                });
                                                                            }
                                                                        },
                                                                        function (_isAndCondition_1, andOrCallback) {
                                                                            let _isAndCondition_2 = null;

                                                                            if (if1_is_placeholder == 0 && ctext1_is_placeholder == 0) {
                                                                                if (condition1 == "Equal") {
                                                                                    if (if_text1 == compaire_text1) {
                                                                                        _isAndCondition_2 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_2 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition1 == "NotEqual") {
                                                                                    if (if_text1 != compaire_text1) {
                                                                                        _isAndCondition_2 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_2 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition1 == "KeywordContains") {
                                                                                    if (if_text1.includes(compaire_text1)) {
                                                                                        _isAndCondition_2 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_2 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition1 == "DoesNotContain") {
                                                                                    if (!if_text1.includes(compaire_text1)) {
                                                                                        _isAndCondition_2 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_2 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition1 == "StartsWith") {
                                                                                    if (if_text1.startsWith(compaire_text1)) {
                                                                                        _isAndCondition_2 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_2 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition1 == "DoesNotStartWith") {
                                                                                    if (!if_text1.startsWith(compaire_text1)) {
                                                                                        _isAndCondition_2 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_2 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition1 == "GreaterThan") {
                                                                                    if (parseInt(if_text1) > parseInt(compaire_text1)) {
                                                                                        _isAndCondition_2 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_2 = false;
                                                                                    }
                                                                                }
                                                                                else if (condition1 == "LessThan") {
                                                                                    if (parseInt(if_text1) < parseInt(compaire_text1)) {
                                                                                        _isAndCondition_2 = true;
                                                                                    }
                                                                                    else {
                                                                                        _isAndCondition_2 = false;
                                                                                    }
                                                                                }

                                                                                andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                                                                            }
                                                                            else if (if1_is_placeholder == 1 && ctext1_is_placeholder == 0) {
                                                                                sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text1, (err, result) => {
                                                                                    console.log('CheckCondition ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text1);
                                                                                    if (condition1 == "Equal") {
                                                                                        if (result[0].attrvalue == compaire_text1) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "NotEqual") {
                                                                                        if (result[0].attrvalue != compaire_text1) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "KeywordContains") {
                                                                                        if (result[0].attrvalue.includes(compaire_text1)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "DoesNotContain") {
                                                                                        if (!result[0].attrvalue.includes(compaire_text1)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "StartsWith") {
                                                                                        if (result[0].attrvalue.startsWith(compaire_text1)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "DoesNotStartWith") {
                                                                                        if (!result[0].attrvalue.startsWith(compaire_text1)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "GreaterThan") {
                                                                                        if (parseInt(result[0].attrvalue) > parseInt(compaire_text1)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "LessThan") {
                                                                                        if (parseInt(result[0].attrvalue) < parseInt(compaire_text1)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }

                                                                                    andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                                                                                });
                                                                            }
                                                                            else if (if1_is_placeholder == 1 && ctext1_is_placeholder == 1) {
                                                                                sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text1, (err, result_1) => {
                                                                                    sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text1, (err, result_2) => {
                                                                                        console.log('CheckCondition ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text1);
                                                                                        if (condition1 == "Equal") {
                                                                                            if (result_1[0].attrvalue == result_2[0].attrvalue) {
                                                                                                _isAndCondition_2 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_2 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition1 == "NotEqual") {
                                                                                            if (result_1[0].attrvalue != result_2[0].attrvalue) {
                                                                                                _isAndCondition_2 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_2 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition1 == "KeywordContains") {
                                                                                            if (result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_2 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_2 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition1 == "DoesNotContain") {
                                                                                            if (!result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_2 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_2 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition1 == "StartsWith") {
                                                                                            if (result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_2 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_2 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition1 == "DoesNotStartWith") {
                                                                                            if (!result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_2 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_2 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition1 == "GreaterThan") {
                                                                                            if (parseInt(result_1[0].attrvalue) > parseInt(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_2 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_2 = false;
                                                                                            }
                                                                                        }
                                                                                        else if (condition1 == "LessThan") {
                                                                                            if (parseInt(result_1[0].attrvalue) < parseInt(result_2[0].attrvalue)) {
                                                                                                _isAndCondition_2 = true;
                                                                                            }
                                                                                            else {
                                                                                                _isAndCondition_2 = false;
                                                                                            }
                                                                                        }

                                                                                        andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                                                                                    });
                                                                                });
                                                                            }
                                                                            else if (if1_is_placeholder == 0 && ctext1_is_placeholder == 1) {
                                                                                sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text1, (err, result) => {
                                                                                    console.log('CheckCondition ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text1);
                                                                                    if (condition1 == "Equal") {
                                                                                        if (if_text1 == result[0].attrvalue) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "NotEqual") {
                                                                                        if (if_text1 != result[0].attrvalue) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "KeywordContains") {
                                                                                        if (if_text1.includes(result[0].attrvalue)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "DoesNotContain") {
                                                                                        if (!if_text1.includes(result[0].attrvalue)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "StartsWith") {
                                                                                        if (if_text1.startsWith(result[0].attrvalue)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "DoesNotStartWith") {
                                                                                        if (!if_text1.startsWith(result[0].attrvalue)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "GreaterThan") {
                                                                                        if (parseInt(if_text1) > parseInt(result[0].attrvalue)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }
                                                                                    else if (condition1 == "LessThan") {
                                                                                        if (parseInt(if_text1) < parseInt(result[0].attrvalue)) {
                                                                                            _isAndCondition_2 = true;
                                                                                        }
                                                                                        else {
                                                                                            _isAndCondition_2 = false;
                                                                                        }
                                                                                    }

                                                                                    andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                                                                                });
                                                                            }
                                                                        },
                                                                        function (_isAndCondition_1, _isAndCondition_2, andOrCallback) {
                                                                            if (_condition == "AND") {
                                                                                if (_isAndCondition_1 && _isAndCondition_2) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            else if (_condition == "OR") {
                                                                                if (_isAndCondition_1 || _isAndCondition_2) {
                                                                                    isCondition = "Yes";
                                                                                }
                                                                                else {
                                                                                    isCondition = "No";
                                                                                }
                                                                            }
                                                                            andOrCallback(null, isCondition);
                                                                        }
                                                                    ], (err, result) => {
                                                                        conditionCallback(null, current_message_id, isCondition);
                                                                    });
                                                                }
                                                            },
                                                            function (current_message_id, isCondition, conditionCallback) {
                                                                console.log('In checkConditionInNodeOption ==================>current_message_id : ' + current_message_id + ', isCondition : ' + isCondition);
                                                                sendService.checkConditionInNodeOption(current_message_id, isCondition, contactno, (err, _result) => {
                                                                    console.log('checkConditionInNodeOption result==================>' + JSON.stringify(_result));
                                                                    if (_result[0] != undefined) {
                                                                        // console.log('checkConditionInNodeOption result==================>' + JSON.stringify(_result));
                                                                        let conditionFlowTmpPayload = JSON.parse(_result[0].node_body);
                                                                        let conditionFlowType = _result[0].typenode;
                                                                        if (conditionFlowType == "Message") {
                                                                            let textPayload = {
                                                                                flow_id: result.flow_id,
                                                                                next_message_id: _result[0].next_message_id,
                                                                                current_message_id: _result[0].id,
                                                                                contactno: contactno,
                                                                                type: 4,
                                                                                type_node: _result[0].typenode,
                                                                                is_node_option: 0,
                                                                                placeholder: _result[0].placeholder,
                                                                                nextMessageResult: {
                                                                                    is_placeholder: _result[0].is_placeholder,
                                                                                    is_validator: _result[0].is_validator,
                                                                                    validator: _result[0].validator,
                                                                                    is_webhook: _result[0].is_webhook,
                                                                                    webhook: _result[0].webhook,
                                                                                    error_message: _result[0].error_message
                                                                                },
                                                                                is_variant: 0
                                                                            }

                                                                            Object.keys(conditionFlowTmpPayload).forEach(function (key) {
                                                                                let value = conditionFlowTmpPayload[key];
                                                                                console.log('Keys===========================>' + value.type);
                                                                                if (value.type == "message") {
                                                                                    textPayload.payload = value.message_text;
                                                                                    saveChatAttributes(obj, textPayload, null, (err, chatAttrInsertId) => {
                                                                                        sendMessage(value.message_text, contactno, 4, (err, messageResult) => {
                                                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, messageResult, (err, updateMessageIdByAttrIdResult) => {
                                                                                                sendService.updateNextMessageIdInSession(result.flow_id, _result[0].next_message_id, _result[0].id, 0, _result[0].typenode, _result[0].placeholder, (err, result1) => {
                                                                                                    if (err) {
                                                                                                        console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                                    }
                                                                                                    else {
                                                                                                        console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(result1));
                                                                                                    }
                                                                                                });
                                                                                                conditionCallback(result[0], conditionCallback);
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                }
                                                                                if (value.type == "image") {
                                                                                    let imgPayload = {
                                                                                        "link": value.media_url,
                                                                                        "caption": value.message_text != undefined ? value.message_text : ''
                                                                                    }
                                                                                    textPayload.payload = imgPayload;
                                                                                    saveChatAttributes(obj, textPayload, null, (err, chatAttrInsertId) => {
                                                                                        sendMessage(imgPayload, contactno, 1, (err, messageResult) => {
                                                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, messageResult, (err, updateMessageIdByAttrIdResult) => {
                                                                                                sendService.updateNextMessageIdInSession(result.flow_id, _result[0].next_message_id, _result[0].id, 0, _result[0].typenode, _result[0].placeholder, (err, result1) => {
                                                                                                    if (err) {
                                                                                                        console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                                    }
                                                                                                    else {
                                                                                                        console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(result1));
                                                                                                    }
                                                                                                });
                                                                                                conditionCallback(result[0], conditionCallback);
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                }
                                                                                if (value.type == "document") {
                                                                                    let docPayload = {
                                                                                        "link": value.media_url,
                                                                                        "filename": value.media_url.toString().split('/').pop()
                                                                                    }
                                                                                    textPayload.payload = docPayload;
                                                                                    saveChatAttributes(obj, textPayload, null, (err, chatAttrInsertId) => {
                                                                                        sendMessage(docPayload, contactno, 0, (err, messageResult) => {
                                                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, messageResult, (err, updateMessageIdByAttrIdResult) => {
                                                                                                sendService.updateNextMessageIdInSession(result.flow_id, _result[0].next_message_id, _result[0].id, 0, _result[0].typenode, _result[0].placeholder, (err, result1) => {
                                                                                                    if (err) {
                                                                                                        console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                                    }
                                                                                                    else {
                                                                                                        console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(result1));
                                                                                                    }
                                                                                                });
                                                                                                conditionCallback(result[0], conditionCallback);
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                }
                                                                            });
                                                                        }
                                                                        else if (conditionFlowType == "Question") {
                                                                            let isQuestionNodeOption = 0;
                                                                            if (conditionFlowTmpPayload.variants != undefined) {
                                                                                isQuestionNodeOption = 1;
                                                                            }

                                                                            let tempQuestionPayload = null;
                                                                            let tempQuestionType = 0;

                                                                            // console.log('CONDITION ============================>'+result.flow_id, _result[0].next_message_id, _result[0].id, isQuestionNodeOption, _result[0].typenode, _result[0].placeholder);
                                                                            if (conditionFlowTmpPayload.media_type == "image") {
                                                                                let imgPayload = {
                                                                                    "link": conditionFlowTmpPayload.media_url,
                                                                                    "caption": conditionFlowTmpPayload.text != undefined ? conditionFlowTmpPayload.text : ''
                                                                                }
                                                                                tempQuestionPayload = imgPayload;
                                                                                tempQuestionType = 1;
                                                                            }
                                                                            else if (conditionFlowTmpPayload.media_type == "video") {
                                                                                let videoPayload = {
                                                                                    "link": conditionFlowTmpPayload.media_url,
                                                                                    "caption": conditionFlowTmpPayload.text != undefined ? conditionFlowTmpPayload.text : ''
                                                                                }
                                                                                tempQuestionPayload = videoPayload;
                                                                                tempQuestionType = 2;
                                                                            }
                                                                            else {
                                                                                tempQuestionPayload = conditionFlowTmpPayload.text;
                                                                                tempQuestionType = 4;
                                                                            }

                                                                            let questionPayload = {
                                                                                flow_id: result.flow_id,
                                                                                next_message_id: _result[0].next_message_id,
                                                                                current_message_id: _result[0].id,
                                                                                payload: tempQuestionPayload,
                                                                                contactno: contactno,
                                                                                type: tempQuestionType,
                                                                                type_node: _result[0].typenode,
                                                                                is_node_option: isQuestionNodeOption,
                                                                                placeholder: _result[0].placeholder,
                                                                                nextMessageResult: {
                                                                                    is_placeholder: _result[0].is_placeholder,
                                                                                    is_validator: _result[0].is_validator,
                                                                                    validator: _result[0].validator,
                                                                                    is_webhook: _result[0].is_webhook,
                                                                                    webhook: _result[0].webhook,
                                                                                    error_message: _result[0].error_message
                                                                                },
                                                                                is_variant: isQuestionNodeOption
                                                                            }

                                                                            saveChatAttributes(obj, questionPayload, null, (err, chatAttrInsertId) => {
                                                                                sendMessage(tempQuestionPayload, contactno, tempQuestionType, (err, messageResult) => {
                                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, messageResult, (err, updateMessageIdByAttrIdResult) => {
                                                                                        sendService.updateNextMessageIdInSession(result.flow_id, _result[0].next_message_id, _result[0].id, isQuestionNodeOption, _result[0].typenode, _result[0].placeholder, (err, result1) => {
                                                                                            if (err) {
                                                                                                console.log('question updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                            }
                                                                                            else {
                                                                                                console.log('question updateNextMessageIdInSession 2 result==================>' + JSON.stringify(result1));
                                                                                            }
                                                                                        });
                                                                                        conditionCallback(result[0], conditionCallback);
                                                                                    });
                                                                                });
                                                                            });

                                                                            // sendMessage(conditionFlowTmpPayload.text, contactno, 4, (err, messageResult) => {
                                                                            // sendMessage(tempQuestionPayload, contactno, tempQuestionType, (err, messageResult) => {
                                                                            //     sendService.updateNextMessageIdInSession(result.flow_id, _result[0].next_message_id, _result[0].id, isQuestionNodeOption, _result[0].typenode, _result[0].placeholder, (err, result1) => {
                                                                            //         if (err) {
                                                                            //             console.log('question updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                            //         }
                                                                            //         else {
                                                                            //             console.log('question updateNextMessageIdInSession 2 result==================>' + JSON.stringify(result1));
                                                                            //         }
                                                                            //     });
                                                                            //     conditionCallback(result[0], conditionCallback);
                                                                            // });
                                                                        }
                                                                        else if (conditionFlowType == "Button") {
                                                                            let isButtonNodeOption = 1;
                                                                            console.log('Button===================>' + JSON.stringify(conditionFlowTmpPayload));

                                                                            let conditionButtonMessagePayload = {
                                                                                "interactive": {}
                                                                            };

                                                                            let _index1 = 1;
                                                                            if (conditionFlowTmpPayload.buttons.length > 0) {
                                                                                // if (conditionFlowTmpPayload.header_text != null) {
                                                                                //     conditionButtonMessagePayload.interactive.header = {
                                                                                //         "type": "text",
                                                                                //         "text": conditionFlowTmpPayload.header_text
                                                                                //     };
                                                                                // }

                                                                                if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'text') {
                                                                                    if (conditionFlowTmpPayload.header_text != null) {
                                                                                        conditionButtonMessagePayload.interactive.header = {
                                                                                            "type": "text",
                                                                                            "text": conditionFlowTmpPayload.header_text
                                                                                        };
                                                                                    }
                                                                                }
                                                                                else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'document') {
                                                                                    if (conditionFlowTmpPayload.header_media_url != null) {
                                                                                        conditionButtonMessagePayload.interactive.header = {
                                                                                            "type": "document",
                                                                                            "document": {
                                                                                                "link": conditionFlowTmpPayload.header_media_url,
                                                                                                "provider": {
                                                                                                    "name": "",
                                                                                                },
                                                                                                "filename": conditionFlowTmpPayload.header_media_url.substring(conditionFlowTmpPayload.header_media_url.lastIndexOf('/') + 1)
                                                                                            }
                                                                                        };
                                                                                    }
                                                                                }
                                                                                else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'video') {
                                                                                    if (conditionFlowTmpPayload.header_media_url != null) {
                                                                                        conditionButtonMessagePayload.interactive.header = {
                                                                                            "type": "video",
                                                                                            "video": {
                                                                                                "link": conditionFlowTmpPayload.header_media_url,
                                                                                                "provider": {
                                                                                                    "name": "",
                                                                                                }
                                                                                            }
                                                                                        };
                                                                                    }
                                                                                }
                                                                                else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'image') {
                                                                                    if (conditionFlowTmpPayload.header_media_url != null) {
                                                                                        conditionButtonMessagePayload.interactive.header = {
                                                                                            "type": "image",
                                                                                            "image": {
                                                                                                "link": conditionFlowTmpPayload.header_media_url,
                                                                                                "provider": {
                                                                                                    "name": "",
                                                                                                }
                                                                                            }
                                                                                        };
                                                                                    }
                                                                                }

                                                                                if (conditionFlowTmpPayload.body_text != null) {
                                                                                    conditionButtonMessagePayload.interactive.body = {
                                                                                        "text": conditionFlowTmpPayload.body_text
                                                                                    };
                                                                                }
                                                                                if (conditionFlowTmpPayload.footer_text != null) {
                                                                                    conditionButtonMessagePayload.interactive.footer = {
                                                                                        "text": conditionFlowTmpPayload.footer_text
                                                                                    };
                                                                                }
                                                                                conditionButtonMessagePayload.interactive.type = "button";
                                                                                conditionButtonMessagePayload.interactive.action = {
                                                                                    "buttons": []
                                                                                }
                                                                                console.log('botMessagePayload==========>' + JSON.stringify(conditionButtonMessagePayload));
                                                                                for (let f = 0; f < conditionFlowTmpPayload.buttons.length; f++) {
                                                                                    conditionButtonMessagePayload.interactive.action.buttons.push({
                                                                                        "type": "reply",
                                                                                        "reply": {
                                                                                            "id": "id_" + _index1,
                                                                                            "title": conditionFlowTmpPayload.buttons[f]
                                                                                        }
                                                                                    });
                                                                                    _index1++;
                                                                                }
                                                                            }

                                                                            let buttonPayload = {
                                                                                flow_id: result.flow_id,
                                                                                next_message_id: _result[0].next_message_id,
                                                                                current_message_id: _result[0].id,
                                                                                payload: conditionButtonMessagePayload.interactive,
                                                                                contactno: contactno,
                                                                                type: 9,
                                                                                type_node: _result[0].typenode,
                                                                                is_node_option: isButtonNodeOption,
                                                                                placeholder: _result[0].placeholder,
                                                                                nextMessageResult: {
                                                                                    is_placeholder: _result[0].is_placeholder,
                                                                                    is_validator: _result[0].is_validator,
                                                                                    validator: _result[0].validator,
                                                                                    is_webhook: _result[0].is_webhook,
                                                                                    webhook: _result[0].webhook,
                                                                                    error_message: _result[0].error_message
                                                                                },
                                                                                is_variant: isButtonNodeOption
                                                                            }

                                                                            saveChatAttributes(obj, buttonPayload, null, (err, chatAttrInsertId) => {
                                                                                sendMessage(conditionButtonMessagePayload.interactive, contactno, 9, (err, messageResult) => {
                                                                                    console.log(result.flow_id, _result[0].next_message_id, _result[0].id, isButtonNodeOption, _result[0].typenode, _result[0].placeholder);
                                                                                    console.log('saveChatAttributesPayload 1=========================>' + JSON.stringify(result));
                                                                                    console.log('saveChatAttributesPayload 2=========================>' + JSON.stringify(_result));

                                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, messageResult, (err, updateMessageIdByAttrIdResult) => {
                                                                                        sendService.updateNextMessageIdInSession(result.flow_id, _result[0].next_message_id, _result[0].id, isButtonNodeOption, _result[0].typenode, _result[0].placeholder, (err, result1) => {
                                                                                            if (err) {
                                                                                                console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                            }
                                                                                            else {
                                                                                                console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(result1));
                                                                                            }
                                                                                        });
                                                                                        conditionCallback(result[0], conditionCallback);
                                                                                    });
                                                                                });
                                                                            });
                                                                        }
                                                                        else if (conditionFlowType == "List") {
                                                                            let isListNodeOption = 1;
                                                                            let sections = conditionFlowTmpPayload.section_count;
                                                                            let conditionListMessagePayload = {};

                                                                            conditionListMessagePayload.interactive = {
                                                                                "action": {}
                                                                            };

                                                                            if (conditionFlowTmpPayload.header_text != null) {
                                                                                conditionListMessagePayload.interactive = {
                                                                                    "header": {
                                                                                        "type": "text",
                                                                                        "text": conditionFlowTmpPayload.header_text
                                                                                    }
                                                                                };
                                                                            }
                                                                            if (conditionFlowTmpPayload.body_text != null) {
                                                                                conditionListMessagePayload.interactive = {
                                                                                    "body": {
                                                                                        "text": conditionFlowTmpPayload.body_text
                                                                                    }
                                                                                };
                                                                            }
                                                                            if (conditionFlowTmpPayload.footer_text != null) {
                                                                                conditionListMessagePayload.interactive = {
                                                                                    "footer": {
                                                                                        "text": conditionFlowTmpPayload.footer_text
                                                                                    }
                                                                                };
                                                                            }
                                                                            if (conditionFlowTmpPayload.button_text != null) {
                                                                                conditionListMessagePayload.interactive.action = {
                                                                                    "button": conditionFlowTmpPayload.button_text,
                                                                                    "sections": []
                                                                                }
                                                                            }
                                                                            if (parseInt(sections) > 0) {
                                                                                conditionListMessagePayload.interactive.type = "list";
                                                                                for (let u = 0; u < sections; u++) {
                                                                                    conditionListMessagePayload.interactive.action.sections.push({
                                                                                        "title": conditionFlowTmpPayload.sections[u + 1].section_text,
                                                                                        "rows": []
                                                                                    });

                                                                                    let index = 1;
                                                                                    Object.keys(conditionFlowTmpPayload.sections[u + 1].rows).forEach(function (key) {
                                                                                        var value = conditionFlowTmpPayload.sections[u + 1].rows[key];
                                                                                        conditionListMessagePayload.interactive.action.sections[u].rows.push({
                                                                                            "id": "id_" + index,
                                                                                            "title": value.row_text,
                                                                                            "description": value.description_text
                                                                                        });
                                                                                        index++;
                                                                                    });
                                                                                }
                                                                            }

                                                                            let listPayload = {
                                                                                flow_id: result.flow_id,
                                                                                next_message_id: _result[0].next_message_id,
                                                                                current_message_id: _result[0].id,
                                                                                payload: conditionListMessagePayload.interactive,
                                                                                contactno: contactno,
                                                                                type: 9,
                                                                                type_node: _result[0].typenode,
                                                                                is_node_option: isListNodeOption,
                                                                                placeholder: _result[0].placeholder,
                                                                                nextMessageResult: {
                                                                                    is_placeholder: _result[0].is_placeholder,
                                                                                    is_validator: _result[0].is_validator,
                                                                                    validator: _result[0].validator,
                                                                                    is_webhook: _result[0].is_webhook,
                                                                                    webhook: _result[0].webhook,
                                                                                    error_message: _result[0].error_message
                                                                                },
                                                                                is_variant: isListNodeOption
                                                                            }

                                                                            saveChatAttributes(obj, listPayload, null, (err, chatAttrInsertId) => {
                                                                                sendMessage(conditionListMessagePayload.interactive, contactno, 9, (err, messageResult) => {
                                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, messageResult, (err, updateMessageIdByAttrIdResult) => {
                                                                                        sendService.updateNextMessageIdInSession(result.flow_id, _result[0].next_message_id, _result[0].id, isListNodeOption, _result[0].typenode, _result[0].placeholder, (err, result1) => {
                                                                                            if (err) {
                                                                                                console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                            }
                                                                                            else {
                                                                                                console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(result1));
                                                                                            }
                                                                                        });
                                                                                        conditionCallback(result[0], conditionCallback);
                                                                                    });
                                                                                });
                                                                            });
                                                                        }
                                                                        else if (conditionFlowType == "LiveChat") {
                                                                            sendService.updateNextMessageIdInSession(result.flow_id, _result[0].next_message_id, _result[0].id, 0, _result[0].typenode, _result[0].placeholder, (err, result1) => {
                                                                                sendService.fetchLiveChatCustomMessage(result.contactno, (err, liveChatCustomeMessageResult) => {
                                                                                    saveChatAttributes(obj, result, null, (err, chatAttrInsertId) => {
                                                                                        sendMessage(liveChatCustomeMessageResult, result.contactno, 4, (err, _resultMessageId) => {
                                                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                                if (err) {
                                                                                                    console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                                                } else {
                                                                                                    console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                                                                }
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        }
                                                                        else if (conditionFlowType == "Webhook") {
                                                                            console.log('I AM IN WEBHOOK : ' + JSON.stringify(_result));
                                                                            console.log('I AM IN WEBHOOK : ' + JSON.stringify(JSON.parse(_result[0].node_body)));

                                                                            async.waterfall([
                                                                                function (webhookCallback) {
                                                                                    sendService.updateNextMessageIdInSession(result.flow_id, _result[0].next_message_id, _result[0].id, 0, _result[0].typenode, _result[0].placeholder, (err, result1) => {
                                                                                        webhookCallback(err, result1);
                                                                                    });
                                                                                },
                                                                                function (result1, webhookCallback) {
                                                                                    let webhookPayload = {
                                                                                        flow_id: result.flow_id,
                                                                                        next_message_id: _result[0].next_message_id,
                                                                                        current_message_id: _result[0].id,
                                                                                        payload: JSON.parse(_result[0].node_body),
                                                                                        contactno: contactno,
                                                                                        type: 1000,
                                                                                        type_node: _result[0].typenode,
                                                                                        is_node_option: 0,
                                                                                        placeholder: _result[0].placeholder,
                                                                                        nextMessageResult: {
                                                                                            is_placeholder: _result[0].is_placeholder,
                                                                                            is_validator: _result[0].is_validator,
                                                                                            validator: _result[0].validator,
                                                                                            is_webhook: _result[0].is_webhook,
                                                                                            webhook: _result[0].webhook,
                                                                                            error_message: _result[0].error_message
                                                                                        },
                                                                                        is_variant: 0
                                                                                    }

                                                                                    saveChatAttributes(obj, webhookPayload, null, (err, chatAttrInsertId) => {
                                                                                        if (err) {
                                                                                            console.log('saveChatAttributes webhook err=========================>' + JSON.stringify(err));
                                                                                        }
                                                                                        else {
                                                                                            console.log('saveChatAttributes webhook result=========================>' + JSON.stringify(chatAttrInsertId));
                                                                                        }
                                                                                        webhookCallback(err, webhookPayload, chatAttrInsertId);
                                                                                    });
                                                                                },
                                                                                function (result, chatAttrInsertId, webhookCallback) {
                                                                                    executeWebhook(obj.contacts[0].wa_id, result, (err, executeWebhookResult) => {
                                                                                        console.log('executeWebhook=====================>' + JSON.stringify(executeWebhookResult));
                                                                                        webhookCallback(err, result, chatAttrInsertId, executeWebhookResult);
                                                                                    });
                                                                                },
                                                                                function (result, chatAttrInsertId, executeWebhookResult, webhookCallback) {
                                                                                    sendService.updateWebhookAttrValueById(chatAttrInsertId, executeWebhookResult.data, (err, updateAttrValueResult) => {
                                                                                        if (err) {
                                                                                            console.log('updateWebhookAttrValueById err=========================>' + JSON.stringify(err));
                                                                                        }
                                                                                        else {
                                                                                            console.log('updateWebhookAttrValueById result=========================>' + JSON.stringify(updateAttrValueResult));
                                                                                        }
                                                                                        webhookCallback(err, result, chatAttrInsertId, executeWebhookResult);
                                                                                    });
                                                                                },
                                                                                function (result, chatAttrInsertId, executeWebhookResult, webhookCallback) {
                                                                                    console.log('result=====================>' + JSON.stringify(result));
                                                                                    let tmpWebhookResCodeArr = result.payload.code;
                                                                                    let tmpWebhookResCode = executeWebhookResult.code.toString();
                                                                                    if (tmpWebhookResCodeArr.length > 0) {
                                                                                        console.log('tmpWebhookResCodeArr=====================>' + JSON.stringify(tmpWebhookResCodeArr));
                                                                                        console.log('executeWebhookResult.code=====================>' + JSON.stringify(executeWebhookResult.code));
                                                                                        console.log('tmpWebhookResCodeArr.includes(executeWebhookResult.code) =================>' + tmpWebhookResCodeArr.includes(tmpWebhookResCode));
                                                                                        if (tmpWebhookResCodeArr.includes(tmpWebhookResCode)) {
                                                                                            sendService.fetchNextNodeOptionWebhook(tmpWebhookResCode, contactno, (err, fetchNextNodeOptionWebhookResult) => {
                                                                                                if (err) {
                                                                                                    console.log('fetchNextNodeOptionWebhook 2 error==================>' + JSON.stringify(err));
                                                                                                }
                                                                                                else {
                                                                                                    console.log('fetchNextNodeOptionWebhook 2 result==================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));
                                                                                                }
                                                                                                webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult[0]);
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                },
                                                                                function (result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult, webhookCallback) {
                                                                                    console.log('fetchNextNodeOptionWebhookResult===========================>' + fetchNextNodeOptionWebhookResult.node_body.toString());
                                                                                    let tmpNodeBody = JSON.parse(fetchNextNodeOptionWebhookResult.node_body);
                                                                                    if (fetchNextNodeOptionWebhookResult.typenode == "Message") {

                                                                                        let textResult = {
                                                                                            flow_id: fetchNextNodeOptionWebhookResult.id,
                                                                                            next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                                                                                            current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
                                                                                            contactno: obj.contacts[0].wa_id,
                                                                                            type: 4,
                                                                                            type_node: fetchNextNodeOptionWebhookResult.typenode,
                                                                                            is_node_option: 0,
                                                                                            placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                                                                                            nextMessageResult: fetchNextNodeOptionWebhookResult,
                                                                                            is_variant: 0
                                                                                            // ,webhook_res_code: sessionResult.webhookResponseCode
                                                                                        }

                                                                                        // Object.keys(tmpNodeBody).forEach(function (key) {
                                                                                        //     let value = tmpNodeBody[key];
                                                                                        //     console.log('Keys===========================>' + value.type);
                                                                                        //     if (value.type == "message") {
                                                                                        //         sendWebhookMessage(value.message_text, obj.contacts[0].wa_id, 4, (err, _resultMessageId) => {
                                                                                        //             sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                        //                 if (err) {
                                                                                        //                     console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                        //                 }
                                                                                        //                 else {
                                                                                        //                     console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                        //                 }
                                                                                        //                 webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                        //             });
                                                                                        //         });
                                                                                        //     }
                                                                                        // });

                                                                                        if (executeWebhookResult.type == "text") {
                                                                                            textResult.payload = executeWebhookResult.data;
                                                                                            saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
                                                                                                sendMessage(executeWebhookResult.data, obj.contacts[0].wa_id, 4, (err, _resultMessageId) => {
                                                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                                        sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                                            if (err) {
                                                                                                                console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                                            }
                                                                                                            else {
                                                                                                                console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                                            }
                                                                                                            webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                                        });
                                                                                                    });
                                                                                                });
                                                                                            });
                                                                                        }
                                                                                        else if (executeWebhookResult.type == "image") {
                                                                                            let imgPayload = {
                                                                                                "link": executeWebhookResult.url,
                                                                                                "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                                                                                            }
                                                                                            textResult.payload = imgPayload;
                                                                                            saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
                                                                                                sendMessage(imgPayload, obj.contacts[0].wa_id, 1, (err, _resultMessageId) => {
                                                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                                        sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                                            if (err) {
                                                                                                                console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                                            }
                                                                                                            else {
                                                                                                                console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                                            }
                                                                                                            webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                                        });
                                                                                                    });
                                                                                                });
                                                                                            });
                                                                                        }
                                                                                        else if (executeWebhookResult.type == "video") {
                                                                                            let videoPayload = {
                                                                                                "link": executeWebhookResult.url,
                                                                                                "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                                                                                            }
                                                                                            textResult.payload = videoPayload;
                                                                                            saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
                                                                                                sendMessage(videoPayload, obj.contacts[0].wa_id, 2, (err, _resultMessageId) => {
                                                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                                        sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                                            if (err) {
                                                                                                                console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                                            }
                                                                                                            else {
                                                                                                                console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                                            }
                                                                                                            webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                                        });
                                                                                                    });
                                                                                                });
                                                                                            });
                                                                                        }
                                                                                        else if (executeWebhookResult.type == "document") {
                                                                                            let docPayload = {
                                                                                                "link": executeWebhookResult.url,
                                                                                                "filename": executeWebhookResult.url.toString().split('/').pop(),
                                                                                                "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                                                                                            }
                                                                                            textResult.payload = docPayload;
                                                                                            saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
                                                                                                if (err) {
                                                                                                    console.log('questionResult err=======================>' + JSON.stringify(err));
                                                                                                }
                                                                                                else {
                                                                                                    sendMessage(docPayload, obj.contacts[0].wa_id, 0, (err, _resultMessageId) => {
                                                                                                        sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                                            if (err) {
                                                                                                                console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                                                            }
                                                                                                            else {
                                                                                                                sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                                                    if (err) {
                                                                                                                        console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                                                    }
                                                                                                                    webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                                                });
                                                                                                            }
                                                                                                        });
                                                                                                    });

                                                                                                    if (executeWebhookResult.data.length > 0) {
                                                                                                        sendMessage(executeWebhookResult.data, obj.contacts[0].wa_id, 4, (err, _resultMessageId) => {
                                                                                                        });
                                                                                                    }
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    }
                                                                                    else if (fetchNextNodeOptionWebhookResult.typenode == "Question") {
                                                                                        let tempQuestionPayload = null;
                                                                                        let tempQuestionType = 0;
                                                                                        let isQuestionNodeOption = tmpNodeBody.variants != undefined ? 1 : 0;

                                                                                        // console.log('CONDITION ============================>'+result.flow_id, _result[0].next_message_id, _result[0].id, isQuestionNodeOption, _result[0].typenode, _result[0].placeholder);
                                                                                        if (tmpNodeBody.media_type == "image") {
                                                                                            let imgPayload = {
                                                                                                "link": tmpNodeBody.media_url,
                                                                                                "caption": tmpNodeBody.text != undefined ? tmpNodeBody.text : ''
                                                                                            }
                                                                                            tempQuestionPayload = imgPayload;
                                                                                            tempQuestionType = 1;
                                                                                        }
                                                                                        else if (tmpNodeBody.media_type == "video") {
                                                                                            let videoPayload = {
                                                                                                "link": tmpNodeBody.media_url,
                                                                                                "caption": tmpNodeBody.text != undefined ? tmpNodeBody.text : ''
                                                                                            }
                                                                                            tempQuestionPayload = videoPayload;
                                                                                            tempQuestionType = 2;
                                                                                        }
                                                                                        else {
                                                                                            tempQuestionPayload = tmpNodeBody.text;
                                                                                            tempQuestionType = 4;
                                                                                        }

                                                                                        let questionResult = {
                                                                                            flow_id: fetchNextNodeOptionWebhookResult.id,
                                                                                            next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                                                                                            current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
                                                                                            payload: tempQuestionPayload,
                                                                                            contactno: obj.contacts[0].wa_id,
                                                                                            type: tempQuestionType,
                                                                                            type_node: fetchNextNodeOptionWebhookResult.typenode,
                                                                                            is_node_option: isQuestionNodeOption,
                                                                                            placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                                                                                            nextMessageResult: fetchNextNodeOptionWebhookResult,
                                                                                            is_variant: isQuestionNodeOption
                                                                                            // ,webhook_res_code: sessionResult.webhookResponseCode
                                                                                        }

                                                                                        saveChatAttributes(obj, questionResult, null, (err, chatAttrInsertId) => {
                                                                                            if (err) {
                                                                                                console.log('questionResult err=======================>' + JSON.stringify(err));
                                                                                            }
                                                                                            else {
                                                                                                sendWebhookMessage(tempQuestionPayload, obj.contacts[0].wa_id, tempQuestionType, (err, _resultMessageId) => {
                                                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                                        if (err) {
                                                                                                            console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                                                        }
                                                                                                        else {
                                                                                                            sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, isQuestionNodeOption, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                                                if (err) {
                                                                                                                    console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                                                }
                                                                                                                else {
                                                                                                                    console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                                                }
                                                                                                                webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                });
                                                                                            }
                                                                                        });

                                                                                        // sendWebhookMessage(tmpNodeBody.text, obj.contacts[0].wa_id, 4, (err, _resultMessageId) => {
                                                                                        // sendWebhookMessage(tempQuestionPayload, obj.contacts[0].wa_id, tempQuestionType, (err, _resultMessageId) => {
                                                                                        //     sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                        //         if (err) {
                                                                                        //             console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                        //         }
                                                                                        //         else {
                                                                                        //             console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                        //         }
                                                                                        //         webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                        //     });
                                                                                        // });
                                                                                    }
                                                                                    else if (fetchNextNodeOptionWebhookResult.typenode == "List") {
                                                                                        let isListNodeOption = 1;
                                                                                        console.log('List===================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));

                                                                                        let sections = tmpNodeBody.section_count;
                                                                                        let webhookListMessagePayload = {};

                                                                                        webhookListMessagePayload.interactive = {
                                                                                            "action": {}
                                                                                        };

                                                                                        if (tmpNodeBody.header_text != null) {
                                                                                            webhookListMessagePayload.interactive = {
                                                                                                "header": {
                                                                                                    "type": "text",
                                                                                                    "text": tmpNodeBody.header_text
                                                                                                }
                                                                                            };
                                                                                        }
                                                                                        if (tmpNodeBody.body_text != null) {
                                                                                            webhookListMessagePayload.interactive = {
                                                                                                "body": {
                                                                                                    "text": tmpNodeBody.body_text
                                                                                                }
                                                                                            };
                                                                                        }
                                                                                        if (tmpNodeBody.footer_text != null) {
                                                                                            webhookListMessagePayload.interactive = {
                                                                                                "footer": {
                                                                                                    "text": tmpNodeBody.footer_text
                                                                                                }
                                                                                            };
                                                                                        }
                                                                                        if (tmpNodeBody.button_text != null) {
                                                                                            webhookListMessagePayload.interactive.action = {
                                                                                                "button": tmpNodeBody.button_text,
                                                                                                "sections": []
                                                                                            }
                                                                                        }
                                                                                        if (parseInt(sections) > 0) {
                                                                                            webhookListMessagePayload.interactive.type = "list";
                                                                                            for (let u = 0; u < sections; u++) {
                                                                                                webhookListMessagePayload.interactive.action.sections.push({
                                                                                                    "title": tmpNodeBody.sections[u + 1].section_text,
                                                                                                    "rows": []
                                                                                                });

                                                                                                let index = 1;
                                                                                                Object.keys(tmpNodeBody.sections[u + 1].rows).forEach(function (key) {
                                                                                                    var value = tmpNodeBody.sections[u + 1].rows[key];
                                                                                                    webhookListMessagePayload.interactive.action.sections[u].rows.push({
                                                                                                        "id": "id_" + index,
                                                                                                        "title": value.row_text,
                                                                                                        "description": value.description_text
                                                                                                    });
                                                                                                    index++;
                                                                                                });
                                                                                            }
                                                                                        }

                                                                                        let listResult = {
                                                                                            flow_id: fetchNextNodeOptionWebhookResult.id,
                                                                                            next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                                                                                            current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
                                                                                            payload: webhookButtonMessagePayload.interactive,
                                                                                            contactno: obj.contacts[0].wa_id,
                                                                                            type: 9,
                                                                                            type_node: fetchNextNodeOptionWebhookResult.typenode,
                                                                                            is_node_option: isListNodeOption,
                                                                                            placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                                                                                            nextMessageResult: fetchNextNodeOptionWebhookResult,
                                                                                            is_variant: isListNodeOption
                                                                                            // ,webhook_res_code: sessionResult.webhookResponseCode
                                                                                        }

                                                                                        saveChatAttributes(obj, listResult, null, (err, chatAttrInsertId) => {
                                                                                            if (err) {
                                                                                                console.log('listResult err=======================>' + JSON.stringify(err));
                                                                                            }
                                                                                            else {
                                                                                                sendWebhookMessage(webhookButtonMessagePayload.interactive, obj.contacts[0].wa_id, 9, (err, _resultMessageId) => {
                                                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                                        if (err) {
                                                                                                            console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                                                        } else {
                                                                                                            console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                                                                            sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, isListNodeOption, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                                                if (err) {
                                                                                                                    console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                                                }
                                                                                                                else {
                                                                                                                    console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                                                }
                                                                                                                webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                                            });
                                                                                                        }
                                                                                                    });

                                                                                                });
                                                                                            }
                                                                                        });

                                                                                    }
                                                                                    else if (fetchNextNodeOptionWebhookResult.typenode == "Button") {
                                                                                        let isButtonNodeOption = 1;
                                                                                        console.log('Button===================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));

                                                                                        let webhookButtonMessagePayload = {
                                                                                            "interactive": {}
                                                                                        };

                                                                                        let _index1 = 1;
                                                                                        if (tmpNodeBody.buttons.length > 0) {
                                                                                            // if (tmpNodeBody.header_text != null) {
                                                                                            //     webhookButtonMessagePayload.interactive.header = {
                                                                                            //         "type": "text",
                                                                                            //         "text": tmpNodeBody.header_text
                                                                                            //     };
                                                                                            // }

                                                                                            if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'text') {
                                                                                                if (tmpNodeBody.header_text != null) {
                                                                                                    webhookButtonMessagePayload.interactive.header = {
                                                                                                        "type": "text",
                                                                                                        "text": tmpNodeBody.header_text
                                                                                                    };
                                                                                                }
                                                                                            }
                                                                                            else if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'document') {
                                                                                                if (tmpNodeBody.header_media_url != null) {
                                                                                                    webhookButtonMessagePayload.interactive.header = {
                                                                                                        "type": "document",
                                                                                                        "document": {
                                                                                                            "link": tmpNodeBody.header_media_url,
                                                                                                            "provider": {
                                                                                                                "name": "",
                                                                                                            },
                                                                                                            "filename": tmpNodeBody.header_media_url.substring(tmpNodeBody.header_media_url.lastIndexOf('/') + 1)
                                                                                                        }
                                                                                                    };
                                                                                                }
                                                                                            }
                                                                                            else if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'video') {
                                                                                                if (tmpNodeBody.header_media_url != null) {
                                                                                                    webhookButtonMessagePayload.interactive.header = {
                                                                                                        "type": "video",
                                                                                                        "video": {
                                                                                                            "link": tmpNodeBody.header_media_url,
                                                                                                            "provider": {
                                                                                                                "name": "",
                                                                                                            }
                                                                                                        }
                                                                                                    };
                                                                                                }
                                                                                            }
                                                                                            else if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'image') {
                                                                                                if (tmpNodeBody.header_media_url != null) {
                                                                                                    webhookButtonMessagePayload.interactive.header = {
                                                                                                        "type": "image",
                                                                                                        "image": {
                                                                                                            "link": tmpNodeBody.header_media_url,
                                                                                                            "provider": {
                                                                                                                "name": "",
                                                                                                            }
                                                                                                        }
                                                                                                    };
                                                                                                }
                                                                                            }

                                                                                            if (tmpNodeBody.body_text != null) {
                                                                                                webhookButtonMessagePayload.interactive.body = {
                                                                                                    "text": tmpNodeBody.body_text
                                                                                                };
                                                                                            }
                                                                                            if (tmpNodeBody.footer_text != null) {
                                                                                                webhookButtonMessagePayload.interactive.footer = {
                                                                                                    "text": tmpNodeBody.footer_text
                                                                                                };
                                                                                            }
                                                                                            webhookButtonMessagePayload.interactive.type = "button";
                                                                                            webhookButtonMessagePayload.interactive.action = {
                                                                                                "buttons": []
                                                                                            }
                                                                                            console.log('botMessagePayload==========>' + JSON.stringify(webhookButtonMessagePayload));
                                                                                            for (let f = 0; f < tmpNodeBody.buttons.length; f++) {
                                                                                                webhookButtonMessagePayload.interactive.action.buttons.push({
                                                                                                    "type": "reply",
                                                                                                    "reply": {
                                                                                                        "id": "id_" + _index1,
                                                                                                        "title": tmpNodeBody.buttons[f]
                                                                                                    }
                                                                                                });
                                                                                                _index1++;
                                                                                            }
                                                                                        }

                                                                                        let buttonResult = {
                                                                                            flow_id: fetchNextNodeOptionWebhookResult.id,
                                                                                            next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                                                                                            current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
                                                                                            payload: webhookButtonMessagePayload.interactive,
                                                                                            contactno: obj.contacts[0].wa_id,
                                                                                            type: 9,
                                                                                            type_node: fetchNextNodeOptionWebhookResult.typenode,
                                                                                            is_node_option: isButtonNodeOption,
                                                                                            placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                                                                                            nextMessageResult: fetchNextNodeOptionWebhookResult,
                                                                                            is_variant: isButtonNodeOption
                                                                                            // ,webhook_res_code: sessionResult.webhookResponseCode
                                                                                        }

                                                                                        saveChatAttributes(obj, buttonResult, null, (err, chatAttrInsertId) => {
                                                                                            if (err) {
                                                                                                console.log('buttonResult err=======================>' + JSON.stringify(err));
                                                                                            }
                                                                                            else {
                                                                                                sendWebhookMessage(webhookButtonMessagePayload.interactive, obj.contacts[0].wa_id, 9, (err, _resultMessageId) => {
                                                                                                    sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                                        if (err) {
                                                                                                            console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                                                        } else {
                                                                                                            console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                                                                            sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, isButtonNodeOption, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                                                if (err) {
                                                                                                                    console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                                                }
                                                                                                                else {
                                                                                                                    console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                                                }
                                                                                                                webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                                            });
                                                                                                        }
                                                                                                    });

                                                                                                });
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                }
                                                                            ], (err, result) => {
                                                                                conditionCallback(result[0], conditionCallback);
                                                                            });
                                                                        }
                                                                        console.log('Condition nextMessageResult================>' + JSON.stringify(_result[0]));
                                                                    }
                                                                    else {
                                                                        console.log('checkConditionInNodeOption error==================>' + JSON.stringify(err));
                                                                    }
                                                                });
                                                            }
                                                        ], (err, result) => {

                                                        });
                                                    });
                                                }
                                                else if (result.type == 1000) {
                                                    async.waterfall([
                                                        function (webhookCallback) {
                                                            saveChatAttributes(obj, result, null, (err, chatAttrInsertId) => {
                                                                if (err) {
                                                                    console.log('saveChatAttributes webhook err=========================>' + JSON.stringify(err));
                                                                }
                                                                else {
                                                                    console.log('saveChatAttributes webhook result=========================>' + JSON.stringify(result));
                                                                }
                                                                webhookCallback(err, result, chatAttrInsertId);
                                                            });
                                                        },
                                                        function (result, chatAttrInsertId, webhookCallback) {
                                                            executeWebhook(obj.contacts[0].wa_id, result, (err, executeWebhookResult) => {
                                                                console.log('executeWebhook=====================>' + JSON.stringify(executeWebhookResult));
                                                                webhookCallback(err, result, chatAttrInsertId, executeWebhookResult);
                                                            });
                                                        },
                                                        function (result, chatAttrInsertId, executeWebhookResult, webhookCallback) {
                                                            sendService.updateWebhookAttrValueById(chatAttrInsertId, executeWebhookResult.data, (err, updateAttrValueResult) => {
                                                                if (err) {
                                                                    console.log('updateWebhookAttrValueById err=========================>' + JSON.stringify(err));
                                                                }
                                                                else {
                                                                    console.log('updateWebhookAttrValueById result=========================>' + JSON.stringify(updateAttrValueResult));
                                                                }
                                                                webhookCallback(err, result, chatAttrInsertId, executeWebhookResult);
                                                            });
                                                        },
                                                        function (result, chatAttrInsertId, executeWebhookResult, webhookCallback) {
                                                            console.log('result=====================>' + JSON.stringify(result));
                                                            let tmpWebhookResCodeArr = result.payload.code;
                                                            let tmpWebhookResCode = executeWebhookResult.code.toString();
                                                            if (tmpWebhookResCodeArr.length > 0) {
                                                                console.log('tmpWebhookResCodeArr=====================>' + JSON.stringify(tmpWebhookResCodeArr));
                                                                console.log('executeWebhookResult.code=====================>' + JSON.stringify(executeWebhookResult.code));
                                                                console.log('tmpWebhookResCodeArr.includes(executeWebhookResult.code) =================>' + tmpWebhookResCodeArr.includes(tmpWebhookResCode));
                                                                if (tmpWebhookResCodeArr.includes(tmpWebhookResCode)) {
                                                                    sendService.fetchNextNodeOptionWebhook(tmpWebhookResCode, contactno, (err, fetchNextNodeOptionWebhookResult) => {
                                                                        if (err) {
                                                                            console.log('fetchNextNodeOptionWebhook 2 error==================>' + JSON.stringify(err));
                                                                        }
                                                                        else {
                                                                            console.log('fetchNextNodeOptionWebhook 2 result==================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));
                                                                        }
                                                                        webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult[0]);
                                                                    });
                                                                }
                                                            }
                                                        },
                                                        function (result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult, webhookCallback) {
                                                            console.log('fetchNextNodeOptionWebhookResult===========================>' + fetchNextNodeOptionWebhookResult.node_body.toString());
                                                            let tmpNodeBody = JSON.parse(fetchNextNodeOptionWebhookResult.node_body);
                                                            if (fetchNextNodeOptionWebhookResult.typenode == "Message") {

                                                                let textResult = {
                                                                    flow_id: fetchNextNodeOptionWebhookResult.id,
                                                                    next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                                                                    current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
                                                                    contactno: obj.contacts[0].wa_id,
                                                                    type: 4,
                                                                    type_node: fetchNextNodeOptionWebhookResult.typenode,
                                                                    is_node_option: 0,
                                                                    placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                                                                    nextMessageResult: fetchNextNodeOptionWebhookResult,
                                                                    is_variant: 0
                                                                    // ,webhook_res_code: sessionResult.webhookResponseCode
                                                                }

                                                                // Object.keys(tmpNodeBody).forEach(function (key) {
                                                                //     let value = tmpNodeBody[key];
                                                                //     console.log('Keys===========================>' + value.type);
                                                                //     if (value.type == "message") {
                                                                //         sendWebhookMessage(value.message_text, obj.contacts[0].wa_id, 4, (err, _resultMessageId) => {
                                                                //             sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                //                 if (err) {
                                                                //                     console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                //                 }
                                                                //                 else {
                                                                //                     console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                //                 }
                                                                //                 webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                //             });
                                                                //         });
                                                                //     }
                                                                // });

                                                                if (executeWebhookResult.type == "text") {
                                                                    textResult.payload = executeWebhookResult.data;
                                                                    saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
                                                                        sendMessage(executeWebhookResult.data, obj.contacts[0].wa_id, 4, (err, _resultMessageId) => {
                                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                    if (err) {
                                                                                        console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                    }
                                                                                    else {
                                                                                        console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                    }
                                                                                    webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                }
                                                                else if (executeWebhookResult.type == "image") {
                                                                    let imgPayload = {
                                                                        "link": executeWebhookResult.url,
                                                                        "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                                                                    }
                                                                    textResult.payload = imgPayload;
                                                                    saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
                                                                        sendMessage(imgPayload, obj.contacts[0].wa_id, 1, (err, _resultMessageId) => {
                                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                    if (err) {
                                                                                        console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                    }
                                                                                    else {
                                                                                        console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                    }
                                                                                    webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                }
                                                                else if (executeWebhookResult.type == "video") {
                                                                    let videoPayload = {
                                                                        "link": executeWebhookResult.url,
                                                                        "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                                                                    }
                                                                    textResult.payload = videoPayload;
                                                                    saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
                                                                        sendMessage(videoPayload, obj.contacts[0].wa_id, 2, (err, _resultMessageId) => {
                                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                    if (err) {
                                                                                        console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                    }
                                                                                    else {
                                                                                        console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                    }
                                                                                    webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                }
                                                                else if (executeWebhookResult.type == "document") {
                                                                    let docPayload = {
                                                                        "link": executeWebhookResult.url,
                                                                        "filename": executeWebhookResult.url.toString().split('/').pop(),
                                                                        "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                                                                    }
                                                                    textResult.payload = docPayload;
                                                                    saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
                                                                        if (err) {
                                                                            console.log('questionResult err=======================>' + JSON.stringify(err));
                                                                        }
                                                                        else {
                                                                            sendMessage(docPayload, obj.contacts[0].wa_id, 0, (err, _resultMessageId) => {
                                                                                sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                    if (err) {
                                                                                        console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                                    }
                                                                                    else {
                                                                                        sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                            if (err) {
                                                                                                console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                            }
                                                                                            else {
                                                                                                console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                            }
                                                                                            webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                        });
                                                                                    }
                                                                                });
                                                                            });

                                                                            if (executeWebhookResult.data.length > 0) {
                                                                                sendMessage(executeWebhookResult.data, obj.contacts[0].wa_id, 4, (err, _resultMessageId) => {
                                                                                });
                                                                            }
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                            else if (fetchNextNodeOptionWebhookResult.typenode == "Question") {
                                                                let tempQuestionPayload = null;
                                                                let tempQuestionType = 0;
                                                                let isQuestionNodeOption = tmpNodeBody.variants != undefined ? 1 : 0;

                                                                // console.log('CONDITION ============================>'+result.flow_id, _result[0].next_message_id, _result[0].id, isQuestionNodeOption, _result[0].typenode, _result[0].placeholder);
                                                                if (tmpNodeBody.media_type == "image") {
                                                                    let imgPayload = {
                                                                        "link": tmpNodeBody.media_url,
                                                                        "caption": tmpNodeBody.text != undefined ? tmpNodeBody.text : ''
                                                                    }
                                                                    tempQuestionPayload = imgPayload;
                                                                    tempQuestionType = 1;
                                                                }
                                                                else if (tmpNodeBody.media_type == "video") {
                                                                    let videoPayload = {
                                                                        "link": tmpNodeBody.media_url,
                                                                        "caption": tmpNodeBody.text != undefined ? tmpNodeBody.text : ''
                                                                    }
                                                                    tempQuestionPayload = videoPayload;
                                                                    tempQuestionType = 2;
                                                                }
                                                                else {
                                                                    tempQuestionPayload = tmpNodeBody.text;
                                                                    tempQuestionType = 4;
                                                                }

                                                                let questionResult = {
                                                                    flow_id: fetchNextNodeOptionWebhookResult.id,
                                                                    next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                                                                    current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
                                                                    payload: tempQuestionPayload,
                                                                    contactno: obj.contacts[0].wa_id,
                                                                    type: tempQuestionType,
                                                                    type_node: fetchNextNodeOptionWebhookResult.typenode,
                                                                    is_node_option: isQuestionNodeOption,
                                                                    placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                                                                    nextMessageResult: fetchNextNodeOptionWebhookResult,
                                                                    is_variant: isQuestionNodeOption
                                                                    // ,webhook_res_code: sessionResult.webhookResponseCode
                                                                }

                                                                saveChatAttributes(obj, questionResult, null, (err, chatAttrInsertId) => {
                                                                    if (err) {
                                                                        console.log('questionResult err=======================>' + JSON.stringify(err));
                                                                    }
                                                                    else {
                                                                        sendWebhookMessage(tempQuestionPayload, obj.contacts[0].wa_id, tempQuestionType, (err, _resultMessageId) => {
                                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                if (err) {
                                                                                    console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                                }
                                                                                else {
                                                                                    sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, isQuestionNodeOption, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                        if (err) {
                                                                                            console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                        }
                                                                                        else {
                                                                                            console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                        }
                                                                                        webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                    });
                                                                                }
                                                                            });
                                                                        });
                                                                    }
                                                                });

                                                                // sendWebhookMessage(tmpNodeBody.text, obj.contacts[0].wa_id, 4, (err, _resultMessageId) => {
                                                                // sendWebhookMessage(tempQuestionPayload, obj.contacts[0].wa_id, tempQuestionType, (err, _resultMessageId) => {
                                                                //     sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                //         if (err) {
                                                                //             console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                //         }
                                                                //         else {
                                                                //             console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                //         }
                                                                //         webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                //     });
                                                                // });
                                                            }
                                                            else if (fetchNextNodeOptionWebhookResult.typenode == "List") {
                                                                let isListNodeOption = 1;
                                                                console.log('List===================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));

                                                                let sections = tmpNodeBody.section_count;
                                                                let webhookListMessagePayload = {};

                                                                webhookListMessagePayload.interactive = {
                                                                    "action": {}
                                                                };

                                                                if (tmpNodeBody.header_text != null) {
                                                                    webhookListMessagePayload.interactive = {
                                                                        "header": {
                                                                            "type": "text",
                                                                            "text": tmpNodeBody.header_text
                                                                        }
                                                                    };
                                                                }
                                                                if (tmpNodeBody.body_text != null) {
                                                                    webhookListMessagePayload.interactive = {
                                                                        "body": {
                                                                            "text": tmpNodeBody.body_text
                                                                        }
                                                                    };
                                                                }
                                                                if (tmpNodeBody.footer_text != null) {
                                                                    webhookListMessagePayload.interactive = {
                                                                        "footer": {
                                                                            "text": tmpNodeBody.footer_text
                                                                        }
                                                                    };
                                                                }
                                                                if (tmpNodeBody.button_text != null) {
                                                                    webhookListMessagePayload.interactive.action = {
                                                                        "button": tmpNodeBody.button_text,
                                                                        "sections": []
                                                                    }
                                                                }
                                                                if (parseInt(sections) > 0) {
                                                                    webhookListMessagePayload.interactive.type = "list";
                                                                    for (let u = 0; u < sections; u++) {
                                                                        webhookListMessagePayload.interactive.action.sections.push({
                                                                            "title": tmpNodeBody.sections[u + 1].section_text,
                                                                            "rows": []
                                                                        });

                                                                        let index = 1;
                                                                        Object.keys(tmpNodeBody.sections[u + 1].rows).forEach(function (key) {
                                                                            var value = tmpNodeBody.sections[u + 1].rows[key];
                                                                            webhookListMessagePayload.interactive.action.sections[u].rows.push({
                                                                                "id": "id_" + index,
                                                                                "title": value.row_text,
                                                                                "description": value.description_text
                                                                            });
                                                                            index++;
                                                                        });
                                                                    }
                                                                }

                                                                let listResult = {
                                                                    flow_id: fetchNextNodeOptionWebhookResult.id,
                                                                    next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                                                                    current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
                                                                    payload: webhookButtonMessagePayload.interactive,
                                                                    contactno: obj.contacts[0].wa_id,
                                                                    type: 9,
                                                                    type_node: fetchNextNodeOptionWebhookResult.typenode,
                                                                    is_node_option: isListNodeOption,
                                                                    placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                                                                    nextMessageResult: fetchNextNodeOptionWebhookResult,
                                                                    is_variant: isListNodeOption
                                                                    // ,webhook_res_code: sessionResult.webhookResponseCode
                                                                }

                                                                saveChatAttributes(obj, listResult, null, (err, chatAttrInsertId) => {
                                                                    if (err) {
                                                                        console.log('listResult err=======================>' + JSON.stringify(err));
                                                                    }
                                                                    else {
                                                                        sendWebhookMessage(webhookButtonMessagePayload.interactive, obj.contacts[0].wa_id, 9, (err, _resultMessageId) => {
                                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                if (err) {
                                                                                    console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                                } else {
                                                                                    console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                                                    sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, isListNodeOption, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                        if (err) {
                                                                                            console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                        }
                                                                                        else {
                                                                                            console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                        }
                                                                                        webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                    });
                                                                                }
                                                                            });

                                                                        });
                                                                    }
                                                                });

                                                            }
                                                            else if (fetchNextNodeOptionWebhookResult.typenode == "Button") {
                                                                let isButtonNodeOption = 1;
                                                                console.log('Button===================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));

                                                                let webhookButtonMessagePayload = {
                                                                    "interactive": {}
                                                                };

                                                                let _index1 = 1;
                                                                if (tmpNodeBody.buttons.length > 0) {
                                                                    // if (tmpNodeBody.header_text != null) {
                                                                    //     webhookButtonMessagePayload.interactive.header = {
                                                                    //         "type": "text",
                                                                    //         "text": tmpNodeBody.header_text
                                                                    //     };
                                                                    // }

                                                                    if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'text') {
                                                                        if (tmpNodeBody.header_text != null) {
                                                                            webhookButtonMessagePayload.interactive.header = {
                                                                                "type": "text",
                                                                                "text": tmpNodeBody.header_text
                                                                            };
                                                                        }
                                                                    }
                                                                    else if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'document') {
                                                                        if (tmpNodeBody.header_media_url != null) {
                                                                            webhookButtonMessagePayload.interactive.header = {
                                                                                "type": "document",
                                                                                "document": {
                                                                                    "link": tmpNodeBody.header_media_url,
                                                                                    "provider": {
                                                                                        "name": "",
                                                                                    },
                                                                                    "filename": tmpNodeBody.header_media_url.substring(tmpNodeBody.header_media_url.lastIndexOf('/') + 1)
                                                                                }
                                                                            };
                                                                        }
                                                                    }
                                                                    else if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'video') {
                                                                        if (tmpNodeBody.header_media_url != null) {
                                                                            webhookButtonMessagePayload.interactive.header = {
                                                                                "type": "video",
                                                                                "video": {
                                                                                    "link": tmpNodeBody.header_media_url,
                                                                                    "provider": {
                                                                                        "name": "",
                                                                                    }
                                                                                }
                                                                            };
                                                                        }
                                                                    }
                                                                    else if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'image') {
                                                                        if (tmpNodeBody.header_media_url != null) {
                                                                            webhookButtonMessagePayload.interactive.header = {
                                                                                "type": "image",
                                                                                "image": {
                                                                                    "link": tmpNodeBody.header_media_url,
                                                                                    "provider": {
                                                                                        "name": "",
                                                                                    }
                                                                                }
                                                                            };
                                                                        }
                                                                    }

                                                                    if (tmpNodeBody.body_text != null) {
                                                                        webhookButtonMessagePayload.interactive.body = {
                                                                            "text": tmpNodeBody.body_text
                                                                        };
                                                                    }
                                                                    if (tmpNodeBody.footer_text != null) {
                                                                        webhookButtonMessagePayload.interactive.footer = {
                                                                            "text": tmpNodeBody.footer_text
                                                                        };
                                                                    }
                                                                    webhookButtonMessagePayload.interactive.type = "button";
                                                                    webhookButtonMessagePayload.interactive.action = {
                                                                        "buttons": []
                                                                    }
                                                                    console.log('botMessagePayload==========>' + JSON.stringify(webhookButtonMessagePayload));
                                                                    for (let f = 0; f < tmpNodeBody.buttons.length; f++) {
                                                                        webhookButtonMessagePayload.interactive.action.buttons.push({
                                                                            "type": "reply",
                                                                            "reply": {
                                                                                "id": "id_" + _index1,
                                                                                "title": tmpNodeBody.buttons[f]
                                                                            }
                                                                        });
                                                                        _index1++;
                                                                    }
                                                                }

                                                                let buttonResult = {
                                                                    flow_id: fetchNextNodeOptionWebhookResult.id,
                                                                    next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                                                                    current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
                                                                    payload: webhookButtonMessagePayload.interactive,
                                                                    contactno: obj.contacts[0].wa_id,
                                                                    type: 9,
                                                                    type_node: fetchNextNodeOptionWebhookResult.typenode,
                                                                    is_node_option: isButtonNodeOption,
                                                                    placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                                                                    nextMessageResult: fetchNextNodeOptionWebhookResult,
                                                                    is_variant: isButtonNodeOption
                                                                    // ,webhook_res_code: sessionResult.webhookResponseCode
                                                                }

                                                                saveChatAttributes(obj, buttonResult, null, (err, chatAttrInsertId) => {
                                                                    if (err) {
                                                                        console.log('buttonResult err=======================>' + JSON.stringify(err));
                                                                    }
                                                                    else {
                                                                        sendWebhookMessage(webhookButtonMessagePayload.interactive, obj.contacts[0].wa_id, 9, (err, _resultMessageId) => {
                                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                                if (err) {
                                                                                    console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                                } else {
                                                                                    console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                                                    sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, isButtonNodeOption, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
                                                                                        if (err) {
                                                                                            console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
                                                                                        }
                                                                                        else {
                                                                                            console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
                                                                                        }
                                                                                        webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
                                                                                    });
                                                                                }
                                                                            });

                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    ], (err, result) => {

                                                    });
                                                }
                                                else if (result.type == 2000) {
                                                    sendService.fetchLiveChatCustomMessage(result.contactno, (err, liveChatCustomeMessageResult) => {
                                                        saveChatAttributes(obj, result, null, (err, chatAttrInsertId) => {
                                                            sendMessage(liveChatCustomeMessageResult, result.contactno, 4, (err, _resultMessageId) => {
                                                                sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                    if (err) {
                                                                        console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                    } else {
                                                                        console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                                    }
                                                                });
                                                            });
                                                        });
                                                    });
                                                }
                                                else {
                                                    saveChatAttributes(obj, result, null, (err, chatAttrInsertId) => {
                                                        sendMessage(result.payload, result.contactno, result.type, (err, _resultMessageId) => {
                                                            sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
                                                                if (err) {
                                                                    console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
                                                                } else {
                                                                    console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                                                                }
                                                            });
                                                        });
                                                    });
                                                }
                                                logSentByUserMessage(obj, isLiveChatActive, bodyText);
                                                sendEmail(obj, result);
                                                done(err, 'Success');
                                            });
                                        }
                                    });
                                }
                                else if (isLiveChatActive == 1) {
                                    logSentByUserMessage(obj, isLiveChatActive, bodyText);
                                    done(null, 'Success');
                                    // async.waterfall([
                                    //     function (livechatcb) {
                                    //         sendService.fetchLiveChatSettings(userMobileNumber, (err, fetchLiveChatSettingsResult) => {
                                    //             if (err) {
                                    //                 console.log('fetchLiveChatSettings err=======================>' + JSON.stringify(err));
                                    //                 livechatcb(err);
                                    //             }
                                    //             else {
                                    //                 console.log('fetchLiveChatSettings result=======================>' + JSON.stringify(fetchLiveChatSettingsResult));
                                    //                 livechatcb(null, fetchLiveChatSettingsResult);
                                    //             }
                                    //         });
                                    //     },
                                    //     function (fetchLiveChatSettingsResult, livechatcb) {
                                    //         sendService.fetchEndLiveChatMessage(userMobileNumber, bodyText, (err, fetchEndLiveChatMessageResult) => {
                                    //             if (err) {
                                    //                 console.log('fetchEndLiveChatMessage err=======================>' + JSON.stringify(err));
                                    //                 livechatcb(err);
                                    //             } else {
                                    //                 console.log('fetchEndLiveChatMessage result=======================>' + JSON.stringify(fetchEndLiveChatMessageResult));
                                    //                 livechatcb(null, fetchLiveChatSettingsResult, fetchEndLiveChatMessageResult);
                                    //             }
                                    //         });
                                    //     },
                                    //     function (fetchLiveChatSettingsResult, fetchEndLiveChatMessageResult, livechatcb) {
                                    //         if (fetchLiveChatSettingsResult[0].c == 1 && fetchEndLiveChatMessageResult[0].c == 0) {
                                    //             callLiveChatWebHook(obj, fetchLiveChatSettingsResult, (liveChatWebhookError, liveChatWebhookResult) => {
                                    //                 livechatcb(liveChatWebhookError, liveChatWebhookResult);
                                    //             });
                                    //         }
                                    //         else if (fetchLiveChatSettingsResult[0].c == 1 && fetchEndLiveChatMessageResult[0].c == 1) {
                                    //             sendService.endLiveChatMessage(userMobileNumber, (_err2, endLiveChatMessageResult) => {
                                    //                 sendMessage(fetchEndLiveChatMessageResult[0].end_chat_message, userMobileNumber, 4, (err, result) => {
                                    //                     callLiveChatWebHook(obj, fetchLiveChatSettingsResult, (liveChatWebhookError, liveChatWebhookResult) => {
                                    //                         livechatcb(liveChatWebhookError, liveChatWebhookResult);
                                    //                     });
                                    //                 });
                                    //             });
                                    //         }
                                    //     }
                                    // ], (err, result) => {

                                    // });
                                }
                            });
                        }
                        else {
                            done(null, 'Success');
                        }
                    }
                }
                if (obj.hasOwnProperty('statuses')) {
                    if (obj.statuses != undefined && obj.statuses[0].status != undefined) {
                        isProperPayload = true;
                        callbackService.updateDelivery(obj, userId, (err, result) => {
                            done(err, obj);
                        });
                    }
                }

                if (!isProperPayload) {
                    done(null, obj);
                }
            }
            else {
                done(null, 'Message Body is missing');
            }
        }

        let logSentByUserMessage = (obj, isLiveChatActive, bodyText) => {
            if (obj.contacts != undefined) {
                let profileName = obj.contacts[0].profile.name;
                console.log('PROFILENAME===========================>' + profileName);
                let waRecipientNo = obj.contacts[0].wa_id;
                let messageType = obj.messages[0].type;
                let messageText = null;
                let waMessageId = obj.messages[0].id;
                let msgType;
                let direction = 0;
                let campaignid = 0;
                let tmpMediaID = null;
                let tmpFileName = null;
                let tmpMimeType = null;
                let tmpFile = null;
                let tmpName = null;
                let url = null;
                // 0=>'Document', 1=>'Image', 2=>'Video', 3=>'Audio', 4=>'Text', 5=>'Location', 6=>'Contact', 7=>'Sticker',8=>'Template', 9=>'Interactive', 10=>'Voice'
                switch (messageType) {
                    case "document":
                        if (obj.messages[0].document != undefined) {
                            tmpMediaID = obj.messages[0].document.id;
                            tmpMimeType = obj.messages[0].document.mime_type;
                            tmpFileName = obj.messages[0].document.filename;
                        }
                        if (obj.messages[0].errors != undefined) {
                            messageText = {
                                body: obj.messages[0].errors[0].title
                            }
                        }

                        msgType = 0;
                        break;
                    case "image":
                        if (obj.messages[0].image != undefined) {
                            tmpMediaID = obj.messages[0].image.id;
                            tmpMimeType = obj.messages[0].image.mime_type;
                            if (tmpMimeType == "image/png") {
                                tmpFileName = "IMG.png";
                            }
                            if (tmpMimeType == "image/jpeg") {
                                tmpFileName = "IMG.jpeg";
                            }
                        }
                        if (obj.messages[0].errors != undefined) {
                            messageText = {
                                body: obj.messages[0].errors[0].title
                            }
                        }

                        msgType = 1;
                        break;
                    case "video":
                        if (obj.messages[0].video != undefined) {
                            tmpMediaID = obj.messages[0].video.id;
                            tmpMimeType = obj.messages[0].video.mime_type;
                            if (tmpMimeType == "video/mp4") {
                                tmpFileName = "VID.mp4";
                            }
                            if (tmpMimeType == "video/3gpp") {
                                tmpFileName = "VID.3gp";
                            }
                        }
                        if (obj.messages[0].errors != undefined) {
                            messageText = {
                                body: obj.messages[0].errors[0].title
                            }
                        }

                        msgType = 2;
                        break;
                    case "audio":
                        if (obj.messages[0].audio != undefined) {
                            tmpMediaID = obj.messages[0].audio.id;
                            tmpMimeType = obj.messages[0].audio.mime_type;
                            if (tmpMimeType == "audio/mp4" || tmpMimeType == "audio/aac") {
                                tmpFileName = "AUD.m4a";
                            }
                            if (tmpMimeType == "audio/mp3" || tmpMimeType == "audio/mpeg") {
                                tmpFileName = "AUD.mp3";
                            }
                            if (tmpMimeType == "audio/wav") {
                                tmpFileName = "AUD.wav";
                            }
                            if (tmpMimeType == "audio/ogg" || tmpMimeType == "audio/ogg; codecs=opus") {
                                tmpFileName = "AUD.ogg";
                            }
                            if (tmpMimeType == "audio/amr") {
                                tmpFileName = "AUD.amr";
                            }
                        }
                        if (obj.messages[0].errors != undefined) {
                            messageText = {
                                body: obj.messages[0].errors[0].title
                            }
                        }

                        msgType = 3;
                        break;
                    case "text":
                        messageText = obj.messages[0].text;
                        msgType = 4;
                        break;
                    case "location":
                        messageText = {
                            body: obj.messages[0].location
                        };
                        msgType = 5;
                        break;
                    case "contacts":
                        messageText = {
                            body: obj.messages[0].contacts
                        };
                        msgType = 6;
                        break;
                    case "sticker":
                        if (obj.messages[0].sticker != undefined) {
                            tmpMediaID = obj.messages[0].sticker.id;
                            tmpMimeType = obj.messages[0].sticker.mime_type;
                            if (tmpMimeType == "image/webp") {
                                tmpFileName = "STICKER.webp";
                            }
                        }
                        if (obj.messages[0].errors != undefined) {
                            messageText = {
                                body: obj.messages[0].errors[0].title
                            }
                        }
                        msgType = 7;
                        break;
                    case "template":
                        msgType = 8;
                        break;
                    case "button":
                        msgType = 9;
                        messageText = {
                            body: obj.messages[0].button.text
                        };
                        break;
                    case "interactive":
                        msgType = 9;
                        if (obj.messages[0].interactive.type == 'button_reply') {
                            messageText = { body: obj.messages[0].interactive.button_reply.title };
                        }
                        if (obj.messages[0].interactive.type == 'list_reply') {
                            messageText = { body: obj.messages[0].interactive.list_reply.title };
                        }
                        break;
                    case "voice":
                        if (obj.messages[0].voice != undefined) {
                            tmpMediaID = obj.messages[0].voice.id;
                            tmpMimeType = obj.messages[0].voice.mime_type;
                            if (tmpMimeType == "audio/mp4" || tmpMimeType == "audio/aac") {
                                tmpFileName = "VOICE.m4a";
                            }
                            if (tmpMimeType == "audio/mp3" || tmpMimeType == "audio/mpeg") {
                                tmpFileName = "VOICE.mp3";
                            }
                            if (tmpMimeType == "audio/wav") {
                                tmpFileName = "VOICE.wav";
                            }
                            if (tmpMimeType == "audio/ogg; codecs=opus") {
                                tmpFileName = "VOICE.ogg";
                            }
                            if (tmpMimeType == "audio/amr") {
                                tmpFileName = "VOICE.amr";
                            }
                        }
                        if (obj.messages[0].errors != undefined) {
                            messageText = {
                                body: obj.messages[0].errors[0].title
                            }
                        }

                        msgType = 10;
                        break;
                    case "unknown":
                        msgType = 11;
                        messageText = {
                            body: obj.messages[0].errors[0].details
                        };
                        break;
                }

                async.waterfall([
                    function (done) {
                        if (msgType == 0 || msgType == 1 || msgType == 2 || msgType == 3 || msgType == 7 || msgType == 10) {
                            url = wabaUrl + '/v1/media/' + tmpMediaID;
                            console.log('Media URL ==================================>' + wabaUrl + '/v1/media/' + tmpMediaID);

                            let options = {
                                'method': 'GET',
                                'host': httpUrl.parse(wabaUrl).hostname,
                                'port': httpUrl.parse(wabaUrl).port,
                                'path': '/v1/media/' + tmpMediaID,
                                'rejectUnauthorized': false,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + wabaAuthToken
                                }
                            };

                            let protocol = httpUrl.parse(wabaUrl).protocol;
                            let callHttp = (protocol != null && protocol == "https:") ? https : http;

                            let req = callHttp.request(options, function (res) {
                                let chunks = [];

                                res.on("data", function (chunk) {
                                    chunks.push(chunk);
                                });

                                res.on("end", function (chunk) {
                                    let body = Buffer.concat(chunks);
                                    tmpName = tmpMediaID + "_" + tmpFileName;
                                    tmpFile = "/tmp/whatsapp_media_tmp/" + tmpName;
                                    fs.writeFileSync(tmpFile, body);
                                    console.log('userid=====================>' + userId + ', ==================================>' + tmpFile);

                                    done(null, tmpFile);
                                });

                                res.on("error", function (error) {
                                    console.error(error);
                                    return done(error);
                                });
                            });

                            req.end();
                        }
                        else {
                            done(null, messageText);
                        }
                    },
                    function (filedata, done) {
                        if (msgType == 0 || msgType == 1 || msgType == 2 || msgType == 3 || msgType == 7 || msgType == 10) {

                            const fileContent = fs.readFileSync(tmpFile);

                            const params = {
                                Bucket: BUCKET_NAME,
                                Key: path.basename(tmpFile),
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
                                    publicMediaUrl = data.Location;
                                    messageText = {
                                        "body": "<a href='" + data.Location + "'>Media</a>"
                                    }

                                    fs.unlink(tmpFile, function (err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                        console.log('Temp File Delete');
                                    });
                                    done(null, messageText);
                                }
                            });
                        }
                        else {
                            done(null, messageText);
                        }
                    },
                    function (r, done) {
                        callbackService.getResponseRate(waRecipientNo, userId, (err, result) => {
                            done(err, result);
                        });
                    },
                    function (objData, done) {
                        let billing = false;
                        let pricing_model = null;
                        let submissiontype = 'RESPONSE';

                        sendService.insertMessageInSentMasterAPI(0, null, userId, waRecipientNo, messageText, waMessageId, msgType, campaignid, direction, wabaNumber, wabaId, objData.countrycode, objData.rate, billing, pricing_model, submissiontype, messageText, profileName, (err, result) => {
                            done(err, result);
                        });
                    },
                    function (result, done) {
                        let statusPayload = { "status": "read" };

                        let api = '/v1/messages/' + waMessageId;
                        let httpMethod = 1;
                        let requestType = 1;
                        let contentLength = Buffer.byteLength(JSON.stringify(statusPayload));
                        let apiHeaders = [{
                            'headerName': 'Authorization',
                            'headerVal': 'Bearer ' + wabaAuthToken
                        }, {
                            'headerName': 'content-length',
                            'headerVal': contentLength
                        }];

                        botUtils.callWhatsAppApiPUT(wabaUrl, api, statusPayload, httpMethod, requestType, apiHeaders).then((response) => {
                            console.log('response1 : ' + JSON.stringify(response));
                            done(null, response);
                        }).catch((err) => {
                            console.log('response2 : ' + JSON.stringify(err));
                            done(err);
                        });
                    },
                    function (res_, done) {
                        sendService.fetchLiveChatSettings(waRecipientNo, userId, (err, fetchLiveChatSettingsResult) => {
                            if (err) {
                                console.log('fetchLiveChatSettings err=======================>' + JSON.stringify(err));
                                done(err);
                            }
                            else {
                                console.log('fetchLiveChatSettings result=======================>' + JSON.stringify(fetchLiveChatSettingsResult));
                                done(null, fetchLiveChatSettingsResult);
                            }
                        });
                    },
                    function (fetchLiveChatSettingsResult, done) {
                        sendService.fetchEndLiveChatMessage(waRecipientNo, bodyText, userId, (err, fetchEndLiveChatMessageResult) => {
                            if (err) {
                                console.log('fetchEndLiveChatMessage err=======================>' + JSON.stringify(err));
                                done(err);
                            } else {
                                console.log('fetchEndLiveChatMessage result=======================>' + JSON.stringify(fetchEndLiveChatMessageResult));
                                done(null, fetchLiveChatSettingsResult, fetchEndLiveChatMessageResult);
                            }
                        });
                    },
                    function (fetchLiveChatSettingsResult, fetchEndLiveChatMessageResult, done) {
                        if (fetchLiveChatSettingsResult[0].c == 1 && fetchEndLiveChatMessageResult[0].c == 0) {
                            callLiveChatWebHook(obj, fetchLiveChatSettingsResult, (liveChatWebhookError, liveChatWebhookResult) => {
                                if (liveChatWebhookError) {
                                    done(liveChatWebhookError);
                                }
                                else {
                                    done(null, liveChatWebhookResult);
                                }
                            });
                        }
                        else if (fetchLiveChatSettingsResult[0].c == 1 && fetchEndLiveChatMessageResult[0].c == 1) {
                            sendService.endLiveChatMessage(waRecipientNo, userId, (_err2, endLiveChatMessageResult) => {
                                sendMessage(fetchEndLiveChatMessageResult[0].end_chat_message, waRecipientNo, 4, (err, result) => {
                                    callLiveChatWebHook(obj, fetchLiveChatSettingsResult, (liveChatWebhookError, liveChatWebhookResult) => {
                                        if (liveChatWebhookError) {
                                            done(liveChatWebhookError);
                                        }
                                        else {
                                            done(null, liveChatWebhookResult);
                                        }
                                    });
                                });
                            });
                        }
                        else if (fetchLiveChatSettingsResult[0].c == 0) {
                            done(null, 'No Livechat Found');
                        }
                    }
                    // ,
                    // function (c, done) {
                    //     // if (isLiveChat == "1") {
                    //     //     callLiveChatWebHook(obj);
                    //     // }

                    //     if (messageType == "interactive") {
                    //         if (obj.messages[0].interactive.type == 'button_reply') {
                    //             attrvalue = obj.messages[0].interactive.button_reply.title;
                    //         }
                    //         if (obj.messages[0].interactive.type == 'list_reply') {
                    //             attrvalue = obj.messages[0].interactive.list_reply.title;
                    //         }
                    //         sendService.updateChatAttributes(obj.messages[0].context.id, attrvalue, (err, result) => {
                    //             if (err) {
                    //                 console.log('logSentByUserMessage updateChatAttributes error=====================>' + JSON.stringify(err));
                    //                 done(err);
                    //             }
                    //             else {
                    //                 console.log('logSentByUserMessage updateChatAttributes result=====================>' + JSON.stringify(result));
                    //                 done(null, result);
                    //             }
                    //         });
                    //     }
                    //     else {
                    //         done(null, result);
                    //     }
                    // }
                ], function (err, result) {
                    if (err) {
                        console.log('DLR Error : ' + err);
                    } else {
                        console.log('DLR Result : ' + result);
                    }
                });
            }
        }

        let sendMessage = (obj, to, type, next) => {
            let campaignid = 0;
            let msgType = type;
            let direction = 1;
            let bodyContent = null;
            let isSendMessage = false;

            async.waterfall([
                function (sendMessageCallback) {
                    // if (msgType == 0) {
                    //     let messagePayload = {
                    //         "to": to,
                    //         "type": "document",
                    //         "recipient_type": "individual",
                    //         "document": obj
                    //     };
                    //     bodyContent = {
                    //         "body": "<a href='" + messagePayload.document.link + "'>Media</a>"
                    //     };
                    //     sendMessageCallback(null, messagePayload);
                    // }
                    // else if (msgType == 1) {
                    //     let messagePayload = {
                    //         "to": to,
                    //         "type": "image",
                    //         "recipient_type": "individual",
                    //         "image": obj
                    //     };
                    //     bodyContent = {
                    //         "body": "<a href='" + messagePayload.image.link + "'>Media</a>"
                    //     };
                    //     sendMessageCallback(null, messagePayload);
                    // }
                    // else if (msgType == 2) {
                    //     let messagePayload = {
                    //         "to": to,
                    //         "type": "video",
                    //         "recipient_type": "individual",
                    //         "video": obj
                    //     };
                    //     bodyContent = {
                    //         "body": "<a href='" + messagePayload.video.link + "'>Media</a>"
                    //     };
                    //     sendMessageCallback(null, messagePayload);
                    // }

                    if (msgType == 0) {
                        // let tmpObj = obj.caption;
                        // let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                        // if (attrKeyArr != null && attrKeyArr.length > 0) {
                        //     console.log('attrKeyArr=============================>' + attrKeyArr.length);
                        //     replacePlaceholder(tmpObj, attrKeyArr, to, userProfileName, userMobileNumber, (err, result) => {
                        //         obj.caption = result;
                        //         let messagePayload = {
                        //             "to": to,
                        //             "type": "document",
                        //             "recipient_type": "individual",
                        //             "document": obj
                        //         };
                        //         bodyContent = {
                        //             "body": "<a href='" + messagePayload.document.link + "'>Media</a>"
                        //         };
                        //         sendMessageCallback(null, messagePayload);
                        //     });
                        // }
                        // else {
                        //     let messagePayload = {
                        //         "to": to,
                        //         "type": "document",
                        //         "recipient_type": "individual",
                        //         "document": obj
                        //     };
                        //     bodyContent = {
                        //         "body": "<a href='" + messagePayload.document.link + "'>Media</a>"
                        //     };
                        //     sendMessageCallback(null, messagePayload);
                        // }
                        let messagePayload = {
                            "to": to,
                            "type": "document",
                            "recipient_type": "individual",
                            "document": obj
                        };
                        bodyContent = {
                            "body": "<a href='" + messagePayload.document.link + "'>Media</a>"
                        };
                        sendMessageCallback(null, messagePayload);
                    }
                    else if (msgType == 1) {
                        let tmpObj = obj.caption;
                        let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                        if (attrKeyArr != null && attrKeyArr.length > 0) {
                            console.log('attrKeyArr=============================>' + attrKeyArr.length);
                            replacePlaceholder(tmpObj, attrKeyArr, to, userProfileName, userMobileNumber, (err, result) => {
                                obj.caption = result;
                                let messagePayload = {
                                    "to": to,
                                    "type": "image",
                                    "recipient_type": "individual",
                                    "image": obj
                                };
                                bodyContent = {
                                    "body": "<a href='" + messagePayload.image.link + "'>Media</a>"
                                };
                                sendMessageCallback(null, messagePayload);
                            });
                        }
                        else {
                            let messagePayload = {
                                "to": to,
                                "type": "image",
                                "recipient_type": "individual",
                                "image": obj
                            };
                            bodyContent = {
                                "body": "<a href='" + messagePayload.image.link + "'>Media</a>"
                            };
                            sendMessageCallback(null, messagePayload);
                        }
                    }
                    else if (msgType == 2) {
                        let tmpObj = obj.caption;
                        let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                        if (attrKeyArr != null && attrKeyArr.length > 0) {
                            console.log('attrKeyArr=============================>' + attrKeyArr.length);
                            replacePlaceholder(tmpObj, attrKeyArr, to, userProfileName, userMobileNumber, (err, result) => {
                                obj.caption = result;
                                let messagePayload = {
                                    "to": to,
                                    "type": "video",
                                    "recipient_type": "individual",
                                    "video": obj
                                };
                                bodyContent = {
                                    "body": "<a href='" + messagePayload.video.link + "'>Media</a>"
                                };
                                sendMessageCallback(null, messagePayload);
                            });
                        }
                        else {
                            let messagePayload = {
                                "to": to,
                                "type": "video",
                                "recipient_type": "individual",
                                "video": obj
                            };
                            bodyContent = {
                                "body": "<a href='" + messagePayload.video.link + "'>Media</a>"
                            };
                            sendMessageCallback(null, messagePayload);
                        }
                    }
                    else if (msgType == 4) {
                        let tmpObj = obj;
                        console.log('------------------------------------------------------------------------------------------------------------' + tmpObj);
                        // let placeholderCount = tmpObj.match(/{{\s*[\w\.]+\s*}}/g);
                        let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                        if (attrKeyArr != null && attrKeyArr.length > 0) {

                            for (let y = 0; y < attrKeyArr.length; y++) {
                                let tmpAttrKey = attrKeyArr[y].replace(/{{/g, '').replace(/}}/g, '');
                                console.log('tmpAttrKey=============================>' + attrKeyArr[y]);
                                sendService.fetchPlaceholderValue(to, tmpAttrKey, (err, result) => {

                                    if (result.length > 0) {
                                        let tmpAttrValue = result[0].attrvalue;
                                        console.log('tmpAttrValue=============================>' + tmpAttrValue);
                                        tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', tmpAttrValue);
                                        console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                    }
                                    else {
                                        if (tmpAttrKey == 'name') {
                                            tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', userProfileName);
                                            console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                        }
                                        else if (tmpAttrKey == 'wanumber') {
                                            tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', userMobileNumber);
                                            console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                        }
                                    }


                                    if (y == (attrKeyArr.length - 1)) {
                                        let messagePayload = {
                                            "to": to,
                                            "type": "text",
                                            "recipient_type": "individual",
                                            "text": {
                                                "body": tmpObj
                                            }
                                        };
                                        bodyContent = messagePayload.text;
                                        sendMessageCallback(null, messagePayload);
                                    }
                                });
                            }
                        }
                        else {
                            let messagePayload = {
                                "to": to,
                                "type": "text",
                                "recipient_type": "individual",
                                "text": {
                                    "body": tmpObj
                                }
                            };
                            bodyContent = messagePayload.text;
                            sendMessageCallback(null, messagePayload);
                        }
                    }
                    else if (msgType == 9) {
                        console.log('INTERACTIVE MESSAGE===============>' + JSON.stringify(obj));
                        let tmpObj = obj.body.text;

                        let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                        if (attrKeyArr != null && attrKeyArr.length > 0) {

                            for (let y = 0; y < attrKeyArr.length; y++) {
                                let tmpAttrKey = attrKeyArr[y].replace(/{{/g, '').replace(/}}/g, '');
                                console.log('tmpAttrKey=============================>' + attrKeyArr[y]);
                                sendService.fetchPlaceholderValue(to, tmpAttrKey, (err, result) => {

                                    if (result.length > 0) {
                                        let tmpAttrValue = result[0].attrvalue;
                                        console.log('tmpAttrValue=============================>' + tmpAttrValue);
                                        tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', tmpAttrValue);
                                        console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                    }
                                    else {
                                        if (tmpAttrKey == 'name') {
                                            tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', userProfileName);
                                            console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                        }
                                        else if (tmpAttrKey == 'wanumber') {
                                            tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', userMobileNumber);
                                            console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                        }
                                    }


                                    if (y == (attrKeyArr.length - 1)) {
                                        obj.body.text = tmpObj;

                                        let messagePayload = {
                                            "to": to,
                                            "type": "interactive",
                                            "recipient_type": "individual",
                                            "interactive": obj
                                        };
                                        bodyContent = { "body": messagePayload.interactive.body.text };
                                        sendMessageCallback(null, messagePayload);
                                    }
                                });
                            }
                        }
                        else {
                            messagePayload = {
                                "to": to,
                                "type": "interactive",
                                "recipient_type": "individual",
                                "interactive": obj
                            };
                            bodyContent = { "body": messagePayload.interactive.body.text };
                            sendMessageCallback(null, messagePayload);
                        }
                    }
                },
                function (messagePayload, sendMessageCallback) {
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

                    console.log("Message Payload=========================>" + JSON.stringify(messagePayload));
                    botUtils.callWhatsAppApi(wabaUrl, api, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
                        console.log(response);
                        if (typeof response.messages != undefined) {
                            waMessageId = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                            sendService.insertMessageInSentMaster(0, null, userId, messagePayload.to, messagePayload, waMessageId, msgType, campaignid, direction, wabaNumber, wabaId, bodyContent, (error, result) => {
                                if (error) {
                                    sendMessageCallback(error);
                                    console.log(error);
                                } else {
                                    console.log(waMessageId);
                                    sendMessageCallback(null, waMessageId);
                                }
                            });
                        } else {
                            console.log(response);
                            sendMessageCallback(response);
                        }
                    }).catch((err) => {
                        console.log(err);
                        sendMessageCallback(err);
                    });
                }
            ], (err, result) => {
                if (err) {
                    next(err);
                }
                else {
                    next(null, result);
                }
            });
        }

        let sendWebhookMessage = (obj, to, type, next) => {
            let campaignid = 0;
            let msgType = type;
            let direction = 1;
            let bodyContent = null;
            let isSendMessage = false;

            async.waterfall([
                function (sendMessageCallback) {
                    // if (msgType == 0) {
                    //     let messagePayload = {
                    //         "to": to,
                    //         "type": "document",
                    //         "recipient_type": "individual",
                    //         "document": obj
                    //     };
                    //     bodyContent = {
                    //         "body": "<a href='" + messagePayload.document.link + "'>Media</a>"
                    //     };
                    //     sendMessageCallback(null, messagePayload);
                    // }
                    // else if (msgType == 1) {
                    //     let messagePayload = {
                    //         "to": to,
                    //         "type": "image",
                    //         "recipient_type": "individual",
                    //         "image": obj
                    //     };
                    //     bodyContent = {
                    //         "body": "<a href='" + messagePayload.image.link + "'>Media</a>"
                    //     };
                    //     sendMessageCallback(null, messagePayload);
                    // }

                    if (msgType == 0) {
                        // let tmpObj = obj.caption;
                        // let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                        // if (attrKeyArr != null && attrKeyArr.length > 0) {
                        //     console.log('attrKeyArr=============================>' + attrKeyArr.length);
                        //     replacePlaceholder(tmpObj, attrKeyArr, to, userProfileName, userMobileNumber, (err, result) => {
                        //         obj.caption = result;
                        //         let messagePayload = {
                        //             "to": to,
                        //             "type": "document",
                        //             "recipient_type": "individual",
                        //             "document": obj
                        //         };
                        //         bodyContent = {
                        //             "body": "<a href='" + messagePayload.document.link + "'>Media</a>"
                        //         };
                        //         sendMessageCallback(null, messagePayload);
                        //     });
                        // }
                        // else {
                        //     let messagePayload = {
                        //         "to": to,
                        //         "type": "document",
                        //         "recipient_type": "individual",
                        //         "document": obj
                        //     };
                        //     bodyContent = {
                        //         "body": "<a href='" + messagePayload.document.link + "'>Media</a>"
                        //     };
                        //     sendMessageCallback(null, messagePayload);
                        // }
                        let messagePayload = {
                            "to": to,
                            "type": "document",
                            "recipient_type": "individual",
                            "document": obj
                        };
                        bodyContent = {
                            "body": "<a href='" + messagePayload.document.link + "'>Media</a>"
                        };
                        sendMessageCallback(null, messagePayload);
                    }
                    else if (msgType == 1) {
                        let tmpObj = obj.caption;
                        let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                        if (attrKeyArr != null && attrKeyArr.length > 0) {
                            console.log('attrKeyArr=============================>' + attrKeyArr.length);
                            replacePlaceholder(tmpObj, attrKeyArr, to, userProfileName, userMobileNumber, (err, result) => {
                                obj.caption = result;
                                let messagePayload = {
                                    "to": to,
                                    "type": "image",
                                    "recipient_type": "individual",
                                    "image": obj
                                };
                                bodyContent = {
                                    "body": "<a href='" + messagePayload.document.link + "'>Media</a>"
                                };
                                sendMessageCallback(null, messagePayload);
                            });
                        }
                        else {
                            let messagePayload = {
                                "to": to,
                                "type": "image",
                                "recipient_type": "individual",
                                "image": obj
                            };
                            bodyContent = {
                                "body": "<a href='" + messagePayload.image.link + "'>Media</a>"
                            };
                            sendMessageCallback(null, messagePayload);
                        }
                    }
                    else if (msgType == 4) {
                        let tmpObj = obj;
                        console.log('------------------------------------------------------------------------------------------------------------' + tmpObj);
                        // let placeholderCount = tmpObj.match(/{{\s*[\w\.]+\s*}}/g);
                        let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                        if (attrKeyArr != null && attrKeyArr.length > 0) {

                            for (let y = 0; y < attrKeyArr.length; y++) {
                                let tmpAttrKey = attrKeyArr[y].replace(/{{/g, '').replace(/}}/g, '');
                                console.log('tmpAttrKey=============================>' + attrKeyArr[y]);
                                sendService.fetchWebhookPlaceholderValue(to, tmpAttrKey, (err, result) => {

                                    if (result.length > 0) {
                                        let tmpAttrValue = result[0].attrvalue;
                                        console.log('tmpAttrValue=============================>' + tmpAttrValue);
                                        tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', tmpAttrValue);
                                        console.log('fetchWebhookPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                    }
                                    else {
                                        if (tmpAttrKey == 'name') {
                                            tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', userProfileName);
                                            console.log('fetchWebhookPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                        }
                                        else if (tmpAttrKey == 'wanumber') {
                                            tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', userMobileNumber);
                                            console.log('fetchWebhookPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                        }
                                    }

                                    // let tmpAttrValue = result[0].attrvalue;
                                    // console.log('tmpAttrValue=============================>' + tmpAttrValue);
                                    // tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', tmpAttrValue);
                                    // console.log('fetchWebhookPlaceholderValue==========================>' + JSON.stringify(tmpObj));

                                    if (y == (attrKeyArr.length - 1)) {
                                        let messagePayload = {
                                            "to": to,
                                            "type": "text",
                                            "recipient_type": "individual",
                                            "text": {
                                                "body": tmpObj
                                            }
                                        };
                                        bodyContent = messagePayload.text;
                                        sendMessageCallback(null, messagePayload);
                                    }
                                });
                            }
                        }
                        else {
                            let messagePayload = {
                                "to": to,
                                "type": "text",
                                "recipient_type": "individual",
                                "text": {
                                    "body": tmpObj
                                }
                            };
                            bodyContent = messagePayload.text;
                            sendMessageCallback(null, messagePayload);
                        }
                    }
                    else if (msgType == 9) {
                        console.log('INTERACTIVE MESSAGE===============>' + JSON.stringify(obj));
                        let tmpObj = obj.body.text;

                        let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                        if (attrKeyArr != null && attrKeyArr.length > 0) {

                            for (let y = 0; y < attrKeyArr.length; y++) {
                                let tmpAttrKey = attrKeyArr[y].replace(/{{/g, '').replace(/}}/g, '');
                                console.log('tmpAttrKey=============================>' + attrKeyArr[y]);
                                sendService.fetchPlaceholderValue(to, tmpAttrKey, (err, result) => {

                                    if (result.length > 0) {
                                        let tmpAttrValue = result[0].attrvalue;
                                        console.log('tmpAttrValue=============================>' + tmpAttrValue);
                                        tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', tmpAttrValue);
                                        console.log('fetchWebhookPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                    }
                                    else {
                                        if (tmpAttrKey == 'name') {
                                            tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', userProfileName);
                                            console.log('fetchWebhookPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                        }
                                        else if (tmpAttrKey == 'wanumber') {
                                            tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', userMobileNumber);
                                            console.log('fetchWebhookPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                        }
                                    }

                                    // let tmpAttrValue = result[0].attrvalue;
                                    // console.log('tmpAttrValue=============================>' + tmpAttrValue);
                                    // tmpObj = tmpObj.replace('\{\{' + tmpAttrKey + '\}\}', tmpAttrValue);
                                    // console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpObj));

                                    if (y == (attrKeyArr.length - 1)) {
                                        obj.body.text = tmpObj;

                                        let messagePayload = {
                                            "to": to,
                                            "type": "interactive",
                                            "recipient_type": "individual",
                                            "interactive": obj
                                        };
                                        bodyContent = { "body": messagePayload.interactive.body.text };
                                        sendMessageCallback(null, messagePayload);
                                    }
                                });
                            }
                        }
                        else {
                            messagePayload = {
                                "to": to,
                                "type": "interactive",
                                "recipient_type": "individual",
                                "interactive": obj
                            };
                            bodyContent = { "body": messagePayload.interactive.body.text };
                            sendMessageCallback(null, messagePayload);
                        }
                    }
                },
                function (messagePayload, sendMessageCallback) {
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

                    console.log("Message Payload=========================>" + JSON.stringify(messagePayload));
                    botUtils.callWhatsAppApi(wabaUrl, api, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
                        console.log(response);
                        if (typeof response.messages != undefined) {
                            waMessageId = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                            sendService.insertMessageInSentMaster(0, null, userId, messagePayload.to, messagePayload, waMessageId, msgType, campaignid, direction, wabaNumber, wabaId, bodyContent, (error, result) => {
                                if (error) {
                                    sendMessageCallback(error);
                                    console.log(error);
                                } else {
                                    console.log(waMessageId);
                                    sendMessageCallback(null, waMessageId);
                                }
                            });
                        } else {
                            console.log(response);
                            sendMessageCallback(response);
                        }
                    }).catch((err) => {
                        console.log(err);
                        sendMessageCallback(err);
                    });
                }
            ], (err, result) => {
                if (err) {
                    next(err);
                }
                else {
                    next(null, result);
                }
            });
        }

        let saveChatAttributes = (obj, payload, _resultMessageId, next) => {
            console.log('saveChatAttributes================>' + JSON.stringify(payload));
            let mobileno = obj.contacts[0].wa_id;
            let flowid = payload.flow_id;
            let current_message_id = payload.current_message_id;
            let attrkey = payload.placeholder;
            let session_id = _resultMessageId;
            let messageContent = null;
            let messageType = null;
            // let messageType = obj.messages[0].type;
            let typeNode = payload.type_node;
            let attrvalue = null;
            switch (typeNode) {
                case "List":
                    messageContent = payload.payload.body.text;
                    break;
                case "Question":
                    messageContent = JSON.stringify(payload.payload);
                    break;
                case "Button":
                    messageContent = payload.payload.body.text;
                    break;
                case "Condition":
                    messageContent = JSON.stringify(payload);
                    messageType = "condition";
                    break;
                case "Webhook":
                    messageContent = payload.nextMessageResult.node_body;
                    messageType = "webhook";
                    break;
                case "Message":
                    messageContent = JSON.stringify(payload.payload);
                    messageType = "text";
                    break;
                case "LiveChat":
                    messageContent = JSON.stringify(payload.payload);
                    messageType = "livechat";
                    break;
            }

            if (payload.type == 4) {
                messageType = "text";
            }
            if (payload.type == 9) {
                messageType = "interactive";
            }

            // if (payload.nextMessageResult.is_webhook == 1) {
            //     attrvalue = payload.webhook_res_code;
            //     messageType = "text";
            // }
            console.log('attrvalue====================>' + JSON.stringify(payload));
            async.waterfall([
                function (done) {
                    sendService.setChatAttributes(flowid, current_message_id, attrkey, attrvalue, session_id, mobileno, messageContent, messageType, payload, (err, result) => {
                        if (err) {
                            console.log('setChatAttributes error=====================>' + err);
                            done(err);
                        }
                        else {
                            console.log('setChatAttributes result=====================>' + result);
                            done(null, result);
                        }
                    });
                }
            ], (err, result) => {
                if (err) {
                    next(err);
                }
                else {
                    next(null, result);
                }
            });
        }

        let callLiveChatWebHook = (obj, liveChatSettings, next) => {
            console.log('*****************************************************************i am in livechat block : ' + publicMediaUrl);

            let liveChatRequestPayload = {
                "recipient_no": obj.contacts[0].wa_id,
                "waba_no": wabaNumber,
                "waba_url": wabaUrl,
                "waba_access_token": wabaAuthToken,
                "callback_payload": obj,
                "media_url": publicMediaUrl
            }

            async.waterfall([
                function (done) {
                    let data = JSON.stringify(liveChatRequestPayload);

                    let config = {
                        method: 'POST',
                        url: liveChatSettings[0].live_chat_webhook,
                        headers: {
                            'apikey': liveChatSettings[0].live_chat_token,
                            'Content-Type': 'application/json'
                        },
                        data: data
                    };

                    axios(config)
                        .then(function (response) {
                            done(null, JSON.stringify(response.data));
                        })
                        .catch(function (error) {
                            done(error);
                        });
                }
            ], (err, result) => {
                if (err) {
                    console.log('callLiveChatWebHook err==================================>' + JSON.stringify(err));
                    next(err);
                }
                else {
                    console.log('callLiveChatWebHook result==================================>' + JSON.stringify(result));
                    next(null, result);
                }
            });
        }

        let callCustomCallback = (url, obj) => {
            console.log('Custom Callback Payload====================================>' + JSON.stringify(obj));
            let data = JSON.stringify(obj);

            let config = {
                method: 'post',
                url: url,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: data
            };

            axios(config)
                .then(function (response) {
                    let customCallbackPayload = {
                        'url': url,
                        'request_data': obj,
                        'response_data': response.data
                    }
                    errorLogger.info('Custom Callback Result ====================================>' + JSON.stringify(customCallbackPayload));
                    console.log('Custom Callback====================================>' + JSON.stringify(response.data));
                })
                .catch(function (error) {
                    errorLogger.error('Custom Callback Error ===================================>' + JSON.stringify(error));
                    console.log('Custom Callback Error ===================================>' + JSON.stringify(error));
                });
        }

        function replacePlaceholder(tmpObj, attrKeyArr, contactno, userProfileName, userMobileNumber, next) {
            async.each(attrKeyArr, (mid, callback) => {
                async.waterfall([
                    (d1) => {
                        let tmpKey = mid.replace(/{{/g, '').replace(/}}/g, '');
                        console.log('tmpKey=============================>' + mid);
                        sendService.fetchPlaceholderValue(contactno, tmpKey, (err, result) => {
                            if (result.length > 0) {
                                let tmpValue = result[0].attrvalue;
                                console.log('tmpValue=============================>' + tmpValue);
                                tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', tmpValue);
                                console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpObj));
                                d1(err, 1);
                            }
                            else {
                                if (tmpKey == 'name') {
                                    tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', userProfileName);
                                } else if (tmpKey == 'wanumber') {
                                    tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', userMobileNumber);
                                }
                                d1(null, 1);
                            }
                        });
                    }
                ], (err, result) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback();
                    }
                });
            }, (err) => {
                if (err) {
                    next(err);
                }
                else {
                    next(null, tmpObj);
                }
            });
        }

        let executeWebhook = (contactno, webhookPayload, next) => {
            async.waterfall([
                function (webHookCb) {
                    let tmpWebObj = webhookPayload.payload.webhook;
                    let webHookAttrKeyArr = webhookPayload.payload.webhook.match(/{{(.+?)}}/g);
                    if (webHookAttrKeyArr != null && webHookAttrKeyArr.length > 0) {
                        replacePlaceholder(tmpWebObj, webHookAttrKeyArr, contactno, userProfileName, userMobileNumber, (err, result) => {
                            webHookCb(err, result);
                        });
                        // for (let y = 0; y < webHookAttrKeyArr.length; y++) {
                        //     let tmpWebhookKey = webHookAttrKeyArr[y].replace(/{{/g, '').replace(/}}/g, '');
                        //     console.log('tmpWebhookKey=============================>' + webHookAttrKeyArr[y]);
                        //     sendService.fetchPlaceholderValue(contactno, tmpWebhookKey, (err, result) => {
                        //         let tmpWebValue = result[0].attrvalue;
                        //         console.log('tmpWebValue=============================>' + tmpWebValue);
                        //         tmpWebObj = tmpWebObj.replace('\{\{' + tmpWebhookKey + '\}\}', tmpWebValue);
                        //         console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpWebObj));

                        //         if (y == (webHookAttrKeyArr.length - 1)) {
                        //             webHookCb(null, tmpWebObj);
                        //         }
                        //     });
                        // }
                    }
                    else {
                        webHookCb(null, tmpWebObj);
                    }
                },
                function (webHookApi, webHookCb) {
                    var data = JSON.stringify({});

                    var config = {
                        method: 'post',
                        url: webHookApi,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: data
                    };
                    axios(config)
                        .then(function (webhookresponse) {
                            console.log(JSON.stringify(webhookresponse.data));
                            webHookCb(null, webhookresponse.data);
                        })
                        .catch(function (error) {
                            console.log(error);
                            webHookCb(error);
                        });
                }
            ], (err, result) => {
                if (err) {
                    next(err);
                }
                else {
                    next(null, result);
                }
            });
        }

        let sendEmail = (obj, result) => {
            async.waterfall([
                function (sendEmailCallback) {
                    console.log('SEND_EMAIL=====================>' + JSON.stringify(result));
                    sendService.fetchEmailData(result.current_message_id, (err, fetchEmailDataResult) => {
                        console.log('fetchEmailData=======================>' + JSON.stringify(fetchEmailDataResult));
                        sendEmailCallback(err, fetchEmailDataResult);
                    });
                },
                function (fetchEmailDataResult, sendEmailCallback) {
                    if (fetchEmailDataResult.length > 0) {
                        if (fetchEmailDataResult[0].is_email_set == 0) {
                            sendEmailCallback('No Email Data Found');
                        }
                        else {
                            sendEmailCallback(null, fetchEmailDataResult);
                        }
                    }
                },
                function (fetchEmailDataResult, sendEmailCallback) {
                    let tmpEmailObj = fetchEmailDataResult[0].email_content;
                    let attrKeyArr = tmpEmailObj.match(/{{(.+?)}}/g);
                    if (attrKeyArr != null && attrKeyArr.length > 0) {

                        for (let y = 0; y < attrKeyArr.length; y++) {
                            let tmpAttrKey = attrKeyArr[y].replace(/{{/g, '').replace(/}}/g, '');
                            console.log('tmpAttrKey=============================>' + attrKeyArr[y]);
                            sendService.fetchPlaceholderValue(obj.contacts[0].wa_id, tmpAttrKey, (err, fetchPlaceholderValueResult) => {
                                console.log('fetchPlaceholderValue==========================>' + JSON.stringify(fetchPlaceholderValueResult));
                                if (fetchPlaceholderValueResult.length > 0) {
                                    let tmpAttrValue = fetchPlaceholderValueResult[0].attrvalue;
                                    console.log('tmpAttrValue=============================>' + tmpAttrValue);
                                    tmpEmailObj = tmpEmailObj.replace('\{\{' + tmpAttrKey + '\}\}', tmpAttrValue);
                                    console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpEmailObj));
                                }
                                else {
                                    if (tmpAttrKey == 'name') {
                                        tmpEmailObj = tmpEmailObj.replace('\{\{' + tmpAttrKey + '\}\}', userProfileName);
                                        console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpEmailObj));
                                    }
                                    else if (tmpAttrKey == 'wanumber') {
                                        tmpEmailObj = tmpEmailObj.replace('\{\{' + tmpAttrKey + '\}\}', userMobileNumber);
                                        console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpEmailObj));
                                    }
                                }


                                if (y == (attrKeyArr.length - 1)) {
                                    sendEmailCallback(null, tmpEmailObj, fetchEmailDataResult);
                                }
                            });
                        }
                    }
                },
                function (tmpEmailObj, fetchEmailDataResult, sendEmailCallback) {
                    let mailOptions = {
                        from: '"Pinbot" support@pinbot.ai',
                        to: fetchEmailDataResult[0].email_ids,
                        subject: 'Pinbot - Email Alert',
                        html: tmpEmailObj
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            sendEmailCallback(error);
                        } else {
                            sendEmailCallback(null, 'Email Sent Successfully');
                        }
                    });
                }
            ], (err, result) => {
                if (err) {
                    console.log('sendEmail error================================>' + JSON.stringify(err));
                }
                else {
                    console.log('sendEmail result================================>' + JSON.stringify(result));
                }
            });
        }

        let pushDataToWebhook = (sessionId, userId, next) => {
            async.waterfall([
                (pushDataToWebhookCallback) => {
                    sendService.fetchPushWebhookData(sessionId, userId, (err, result) => {
                        if (err) {
                            console.log('fetchPushWebhookData error=====================>' + JSON.stringify(err));
                            pushDataToWebhookCallback(err);
                        }
                        else {
                            console.log('fetchPushWebhookData result=====================>' + JSON.stringify(result));
                            pushDataToWebhookCallback(null, result);
                        }
                    });
                },
                (pushDataToWebhookResult, pushDataToWebhookCallback) => {
                    if (pushDataToWebhookResult.length > 0 && pushDataToWebhookResult[0].webhook.length > 0) {
                        var data = JSON.stringify({
                            mobileno: pushDataToWebhookResult[0].session_mobile,
                            message: pushDataToWebhookResult[0].message_content,
                            attribute_key: pushDataToWebhookResult[0].attrkey,
                            attribute_value: pushDataToWebhookResult[0].attrvalue
                        });

                        var config = {
                            method: 'post',
                            url: pushDataToWebhookResult[0].webhook,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: data
                        };

                        axios(config)
                            .then(function (response) {
                                pushDataToWebhookCallback(null, response.data);
                            })
                            .catch(function (error) {
                                pushDataToWebhookCallback(error);
                            });
                    }
                    else {
                        pushDataToWebhookCallback(null, 'No webhook found to push data');
                    }
                }
            ], (err, result) => {
                if (err) {
                    console.log('pushDataToWebhook err ====================>' + JSON.stringify(err));
                    next(err);
                }
                else {
                    console.log('pushDataToWebhook result ====================>' + JSON.stringify(result));
                    next(null, result);
                }
            });
        }

        async.waterfall([
            validateApiKey,
            processMessage
        ],
            function (err, result) {
                res.status(200).send({ code: 200, status: 'Success' });
            });
    }
    catch (error) {
        console.log(error);
        res.status(200).send({ code: 400, status: error });
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}
