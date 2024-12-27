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
const axios = require('axios');
let http = require('http');
let https = require('https');
let httpUrl = require('url');
let fs = require('fs');
const generateUniqueId = require('generate-unique-id');

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
const { send } = require('process');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'support@pinbot.ai',
        pass: 'L0g!t3cG*E42'
    }
});

const { statusesPayloadQueue } = require('../../queue/statusesPayloadQueue');
const { businessesPayloadQueue } = require('../../queue/businessesPayloadQueue');

module.exports = (req, res) => {
    let userId = null;
    let wabaUrl = null;
    let wabaAuthToken = null;
    let wabaId = null;
    let wabaNumber = null;
    let isProperPayload = false;
    let isLiveChat = 0;
    let liveChatWebHook = null;
    let customCallback = null;
    let isactivepinbotflow = null;
    let custom_parameters = null;
    let userProfileName = null;
    let userMobileNumber = null;
    let eventstatus = null;
    let msgtempid = null;
    let numbername = null;
    let decisionnumber = null;
    let requestname = null;
    let numberquality = null;
    let publicMediaUrl = null;
    let eventquality = null;
    let currentlimit = null;
    let numberaccount = null;
    let eventaccount = null;
    let decisionaccount = null;
    let obj = null;
    let wanumber = null;
    let phonenoid = null;
    let accesstoken = null;
    console.log('REQUEST_PAYLOAD=====================>' + JSON.stringify(req.body));
    errorLogger.info("REQUEST_BODY: " + JSON.stringify(req.body));
    let body = req.body;
    let readobj = (done) => {
        if (body.object === 'whatsapp_business_account' && (req.body.entry[0].changes[0].value.hasOwnProperty('contacts') &&
            req.body.entry[0].changes[0].value.hasOwnProperty('messages'))) {
            obj = req.body.entry[0];
            wanumber = obj.changes[0].value.metadata.display_phone_number;
            phonenoid = obj.changes[0].value.metadata.phone_number_id;
            done(null, obj);
            // body.entry.forEach(function (entry) {
            //     // Gets the message. entry.messaging is an array, but 
            //     // will only ever contain one message, so we get index 0
            //     obj = JSON.stringify(entry);
            //     console.log("\n Post ==> " + obj);
            //     wanumber = obj.changes[0].value.metadata.display_phone_number;
            //     phonenoid = obj.changes[0].value.metadata.phone_number_id;                
            //     done(null, obj);
            // });
            //console.log(JSON.stringify(obj))

        } else if (body.object === 'whatsapp_business_account' && req.body.entry[0].changes[0].value.hasOwnProperty('statuses')) {
            obj = req.body.entry[0];
            wanumber = obj.changes[0].value.metadata.display_phone_number;
            phonenoid = obj.changes[0].value.metadata.phone_number_id;
            done(null, obj);
        } else if (body.object === 'whatsapp_business_account' && req.body.entry[0].changes[0].field == 'message_template_status_update') {
            console.log('message template status');
            obj = req.body.entry[0];
            eventstatus = obj.changes[0].value.event;
            msgtempid = obj.changes[0].value.message_template_id;
            // console.log(eventstatus);
            // console.log(msgtempid);
            done(null, obj);
        } else if (body.object === 'whatsapp_business_account' && req.body.entry[0].changes[0].field == 'phone_number_name_update') {
            console.log('number name update');
            obj = req.body.entry[0];
            numbername = obj.changes[0].value.display_phone_number;
            //wanumber = obj.changes[0].value.metadata.display_phone_number;
            decisionnumber = obj.changes[0].value.decision;
            requestname = obj.changes[0].value.requested_verified_name;
            console.log(numbername);
            console.log(decisionnumber);
            console.log(requestname);
            done(null, obj);
        } else if (body.object === 'whatsapp_business_account' && req.body.entry[0].changes[0].field == 'phone_number_quality_update') {
            console.log('number quality update');
            obj = req.body.entry[0];
            wanumber = obj.changes[0].value.display_phone_number;
            numberquality = obj.changes[0].value.display_phone_number;
            eventquality = obj.changes[0].value.event;
            currentlimit = obj.changes[0].value.current_limit;
            console.log(currentlimit);
            console.log(numberquality);
            console.log(eventquality);
            done(null, obj);
        } else if (body.object === 'whatsapp_business_account' && req.body.entry[0].changes[0].field == 'account_update') {
            console.log('account update');
            obj = req.body.entry[0];
            numberaccount = obj.changes[0].value.phone_number;
            eventaccount = obj.changes[0].value.event;
            console.log(numberaccount);
            console.log(eventaccount);
            done(null, obj);
        } else if (body.object === 'whatsapp_business_account' && req.body.entry[0].changes[0].field == 'account_review_update') {
            console.log('account_review_update');
            obj = req.body.entry[0];
            decisionaccount = obj.changes[0].value.decision;
            console.log(decisionaccount);
            done(null, obj);

        }
        else {
            done('Error');
        }
    };

    let validatewanumber = (obj, done) => {
        console.log('WANUMBER=====================================>' + wanumber);
        if (wanumber != null) {
            callbackService.validatewanumber(wanumber, (err, result) => {
                if (result != undefined && result.length > 0) {
                    //console.log('validatewanumber result ==============================>' + JSON.stringify(result));
                    if (result[0].userstatus == 0) {
                        done('User is Inactive');
                    } else {
                        console.log(JSON.stringify(obj));

                        done(err, result, obj);
                    }
                } else {
                    //console.log('validatephonenumber error ==============================>' + err);
                    done('User not found');
                }
            });
        }
        else if (obj.changes[0].field == 'message_template_status_update') {
            sendService.getWaSettingsForTemplateStatus(msgtempid, (err, result) => {
                console.log('getWaSettingsForTemplateStatus================>' + JSON.stringify(result));
                if (result.length > 0) {
                    done(null, result, obj);
                } else {
                    done('Template not found');
                }
            });
        }
        else {
            done(null, null, obj);
        }

    };

    let fetchtoken = (result, obj, done) => {

        sendService.fetchAccessToken((err, fetchtokenresult) => {
            if (fetchtokenresult != undefined) {
                accesstoken = fetchtokenresult[0].VALUE;
                console.log('fetchaccesstoken=======================>' + JSON.stringify(fetchtokenresult));
                done(null, result, obj);
            } else {
                console.log("FETCH_ACCESS_TOKEN_ERROR: " + JSON.stringify(req.body));
                done('Unable to fetch access token');
            }
        });
    };


    let processMessage = (result, obj, done) => {

        let processMessageFlowId = null;

        if (wanumber != null) {
            userId = result[0].userid;
            wabaUrl = result[0].waurl;
            wabaAuthToken = result[0].authtoken;
            wabaId = result[0].wa_msg_setting_id;
            wanumber = result[0].wanumber;
            isLiveChat = result[0].islivechat;
            liveChatWebHook = result[0].livechatwebhook;
            customCallback = result[0].custom_callback;
            isactivepinbotflow = result[0].isactivepinbotflow;
            custom_parameters = result[0].custom_parameters;
        } else {
            if (result != null) {
                customCallback = result[0].custom_callback;
                wanumber = result[0].wanumber.replace('+', '');
            }
        }



        if (customCallback != undefined && customCallback.length > 0) {
            console.log('processMessage====================>' + customCallback);
            callCustomCallback(customCallback, custom_parameters, body);
        }


        let REJECTED = null;
        let APPROVED = null;
        //let status = 0;

        console.log(obj);
        if (Object.keys(obj).length > 0) {
            if (wanumber != null && obj.changes[0].value.hasOwnProperty('contacts') &&
                obj.changes[0].value.hasOwnProperty('messages')) {

                callbackService.storeContactPayloadLogs(req.body, obj.changes[0].value.messages[0].id, 1, (err, result) => {

                });

                console.log("I am here");
                obj = obj.changes[0].value;
                if (obj.contacts != undefined && obj.messages != undefined) {
                    sendService.checkResponseMessageID(obj.messages[0].id, (err, result) => {
                        console.log('checkResponseMessageID====================>' + JSON.stringify(result));
                        if (result[0].C > 0) {
                            done(null, 'Simply Go Ahead');
                        } else {
                            // console.log('processMessage: ' + JSON.stringify(obj));
                            isProperPayload = true;
                            let bodyText = null;
                            let contactno = obj.contacts[0].wa_id;
                            let isLiveChatActive = 0;

                            userProfileName = obj.contacts[0].profile.name;
                            userMobileNumber = obj.contacts[0].wa_id;

                            if (obj.messages[0].type == 'text' && obj.messages[0].text != undefined) {
                                bodyText = obj.messages[0].text.body.toString();
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
                            }
                            if (obj.messages[0].type == 'button') {
                                bodyText = obj.messages[0].button != undefined ? obj.messages[0].button.text : obj.errors[0].title;
                            }
                            if (obj.messages[0].type == 'location') {
                                // bodyText = 'http://maps.google.com/maps?q=loc:' + obj.messages[0].location.latitude + '+' + obj.messages[0].location.longitude;
                                // bodyText = 'loc:' + obj.messages[0].location.latitude + ',' + obj.messages[0].location.longitude;
                                bodyText = 'www.google.com/maps/place/' + obj.messages[0].location.latitude + ',' + obj.messages[0].location.longitude;
                            }
                            if (obj.messages[0].type == 'image') {
                                bodyText = obj.messages[0].image.id;
                            }
                            if (obj.messages[0].type == 'video' ||
                                obj.messages[0].type == 'audio' ||
                                obj.messages[0].type == 'voice' ||
                                obj.messages[0].type == 'sticker' ||
                                obj.messages[0].type == 'document' ||
                                obj.messages[0].type == 'contacts' ||
                                obj.messages[0].type == 'unknown') {
                                bodyText = 'a2fee1ed1cecebbf0897e36661a229c4';
                            }

                            if (obj.messages[0].type == 'reaction') {
                                bodyText = obj.messages[0].reaction.message_id;
                                console.log('=============================================> ' + bodyText + obj.messages[0].type);
                            }

                            if (obj.messages[0].type == 'unsupported') {
                                bodyText = obj.messages[0].errors[0].title;
                                console.log('=============================================> ' + bodyText + obj.messages[0].type);
                            }

                            if (obj.messages[0].type != 'unsupported' && bodyText != undefined && bodyText != '' && bodyText.length > 0) {
                                //from here
                                sendService.checkLiveChatStatus(contactno, userId, (checkLiveChatStatusErr, checkLiveChatStatusResult) => {
                                    if (checkLiveChatStatusResult != undefined) {
                                        isLiveChatActive = checkLiveChatStatusResult[0].c;
                                        console.log('checkLiveChatStatus result=========================>' + JSON.stringify(isLiveChatActive));
                                        if (isLiveChatActive == 0) {
                                            async.waterfall([
                                                function (callback) {
                                                    if (obj.messages[0].type == 'interactive' && obj.messages[0].interactive != undefined) {
                                                        callback(null, 1);
                                                    } else {
                                                        callback(null, 0);
                                                    }
                                                },
                                                function (msg_Type, callback) {
                                                    if (msg_Type == 1) {
                                                        sendService.updateInteractiveChatAttributes(obj.messages[0].context.id, bodyText, (err, result) => {
                                                            if (err) {
                                                                console.log('updateInteractiveChatAttributes_1 err(' + contactno + ')================================>' + err);
                                                            } else {
                                                                console.log('updateInteractiveChatAttributes_1 result(' + contactno + ')================================>' + JSON.stringify(result));
                                                            }

                                                            pushDataToWebhook(obj.messages[0].context.id, userId, (err, result) => {
                                                                callback(null, msg_Type);
                                                            });
                                                        });
                                                    } else {
                                                        sendService.fetchLastTextMessage(contactno, userId, (err, fetchLastTextMessageResult) => {
                                                            if (fetchLastTextMessageResult[0] != undefined && fetchLastTextMessageResult[0].session_id != null && fetchLastTextMessageResult[0].session_id.length > 0) {
                                                                sendService.updateChatAttributes(fetchLastTextMessageResult[0].session_id, bodyText, (err, result) => {

                                                                    if (err) {
                                                                        console.log('updateChatAttributes_2 err(' + contactno + ')================================>' + err);
                                                                    } else {
                                                                        console.log('updateChatAttributes_2 result(' + contactno + ')================================>' + JSON.stringify(result));
                                                                    }

                                                                    pushDataToWebhook(fetchLastTextMessageResult[0].session_id, userId, (err, result) => {
                                                                        callback(null, msg_Type);
                                                                    });
                                                                });
                                                            } else {
                                                                callback(null, msg_Type);
                                                            }
                                                        });
                                                    }
                                                },
                                                function (msg_Type, callback) {
                                                    if (msg_Type == 1) {
                                                        sendService.fetchPreviousButtonClick(obj.contacts[0].wa_id, obj.messages[0].context.id, bodyText, (err, result) => {
                                                            console.log('fetchPreviousButtonClick================================>' + JSON.stringify(result));
                                                            callback(null, result);
                                                        });
                                                    } else {
                                                        callback(null, 0);
                                                    }
                                                },

                                                function (fetchPreviousButtonResult, callback) {
                                                    if (fetchPreviousButtonResult.length > 0 && fetchPreviousButtonResult[0].session > 0) {
                                                        console.log('fetchPreviousButtonResult================================>' + JSON.stringify(fetchPreviousButtonResult));
                                                        sendService.updatePreviousButtonNextMessageIdInSession(fetchPreviousButtonResult[0].id, fetchPreviousButtonResult[0].next_message_id, fetchPreviousButtonResult[0].current_message_id, 0, fetchPreviousButtonResult[0].current_message_type, fetchPreviousButtonResult[0].placeholder, (err, result1) => {
                                                            if (err) {
                                                                console.log('updatePreviousButtonNextMessageIdInSession 2 error==================>' + err);
                                                            } else {
                                                                console.log('updatePreviousButtonNextMessageIdInSession 2 result==================>' + JSON.stringify(result1));
                                                                callback(null, fetchPreviousButtonResult);
                                                            }
                                                        });
                                                    } else {
                                                        callback(null, fetchPreviousButtonResult);
                                                    }
                                                },
                                                function (fetchPreviousButtonResult, callback) {
                                                    sendService.unsubkeyword(wanumber, (err, unsubkeywordResult) => {
                                                        if (err) {
                                                            console.log('unsubkeywordResult error==================>' + err);
                                                            //callback(err);
                                                        } else {
                                                            console.log('unsubkeywordResult result==================>' + JSON.stringify(unsubkeywordResult));
                                                            callback(null, unsubkeywordResult.length > 0 ? unsubkeywordResult[0].stopword : null, fetchPreviousButtonResult);
                                                        }
                                                    });
                                                },
                                                function (unsubkeywordResult, fetchPreviousButtonResult, callback) {
                                                    if (bodyText.toLowerCase() == unsubkeywordResult.toLowerCase()) {
                                                        sendService.resetSessionByFlowUserId(userId, contactno, (err, resetSessionResult) => {
                                                            console.log('resetSession======================>(' + userId + ')' + JSON.stringify(resetSessionResult));
                                                            return callback({
                                                                code: 404,
                                                                status: 'FAILED',
                                                                message: 'No Flow Found'
                                                            });
                                                        });
                                                    } else {
                                                        callbackService.updateSubscription(contactno, 1, wanumber, null, null, (err, result) => {
                                                            callback(null, unsubkeywordResult, fetchPreviousButtonResult);
                                                        });
                                                    }
                                                },
                                                function (unsubkeywordResult, fetchPreviousButtonResult, callback) {
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
                                                    } else {
                                                        console.log('i am here 2');
                                                        callback(null, fetchPreviousButtonResult);
                                                    }
                                                },
                                                function (fetchPreviousButtonResult, callback) {
                                                    sendService.fetchFlowSession(contactno, userId, (err, sessionResult) => {
                                                        console.log(contactno);
                                                        console.log(userId);
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
                                                    } else {
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
                                                    } else {
                                                        callback(null, userId, sessionResult);
                                                    }
                                                },
                                                function (userId, sessionResult, callback) {
                                                    console.log('sessionResult==========================>' + JSON.stringify(sessionResult));
                                                    if (sessionResult.session == 0) {
                                                        sendService.fetchFlowId(userId, bodyText, (err, flowResult) => {
                                                            if (err) {
                                                                return callback({
                                                                    code: 404,
                                                                    status: 'FAILED',
                                                                    message: 'No Flow Found'
                                                                });
                                                            } else {
                                                                console.log('fetchFlowId==========================>' + JSON.stringify(flowResult));
                                                                let isFlowEnabled = flowResult[0].c;
                                                                if (isFlowEnabled == 1) {
                                                                    callback(err, userId, flowResult[0].flowid, sessionResult);
                                                                } else {
                                                                    return callback({
                                                                        code: 404,
                                                                        status: 'FAILED',
                                                                        message: 'No Flow Found'
                                                                    });
                                                                }
                                                            }
                                                        });
                                                    } else {
                                                        callback(null, userId, sessionResult.flowid, sessionResult);
                                                    }
                                                },
                                                function (userId, flowid, sessionResult, callback) {
                                                    if (sessionResult.next_message_id == null) {
                                                        sendService.fetchInitialMessage(flowid, (err, result) => {
                                                            console.log('fetchInitialMessage=====================>' + JSON.stringify(result));
                                                            if (result.length > 0) {
                                                                let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                let flowType = result[0].typenode;
                                                                callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);
                                                            } else {
                                                                return callback({
                                                                    code: 400,
                                                                    status: 'FAILED',
                                                                    message: 'There is no starting node for this bot'
                                                                });
                                                            }
                                                        });
                                                    } else {
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
                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
                                                                    }
                                                                }
                                                                if (sessionResult.validator == 'isNationalMobileNumber') {
                                                                    console.log('isNationalMobileNumber======================>' + botUtils.isMobileLocal(bodyText, '91'));
                                                                    console.log('BODY_LENGTH : ' + bodyText.length);
                                                                    // if (botUtils.isMobileLocal(bodyText, '91')) {
                                                                    if (!isNaN(bodyText) && bodyText.length == 10) {
                                                                        sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                            console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                            if (result[0] != undefined) {
                                                                                let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                                let flowType = result[0].typenode;
                                                                                callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
                                                                    }
                                                                }
                                                                if (sessionResult.validator == 'isExactMatch') {
                                                                    sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                        console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                        if (result[0] != undefined) {
                                                                            let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                            let flowType = result[0].typenode;
                                                                            callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                        } else {
                                                                            return callback({
                                                                                code: 400,
                                                                                status: 'FAILED',
                                                                                message: sessionResult.error_message
                                                                            });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
                                                                    }
                                                                }
                                                                if (sessionResult.validator == 'isOtp') {
                                                                    sendService.fetchOtp(userId, contactno, (err, result) => {
                                                                        if (bodyText == result[0].otp) {
                                                                            sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                                console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                                if (result[0] != undefined) {
                                                                                    let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                                    let flowType = result[0].typenode;
                                                                                    callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                                } else {
                                                                                    return callback({
                                                                                        code: 404,
                                                                                        status: 'FAILED',
                                                                                        message: 'No Flow Found'
                                                                                    });
                                                                                }
                                                                            });
                                                                        } else {
                                                                            return callback({
                                                                                code: 400,
                                                                                status: 'FAILED',
                                                                                message: 'Invalid OTP'
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                            } else {
                                                                sendService.fetchNextNodeOption(flowid, bodyText, contactno, (err, result) => {
                                                                    processMessageFlowId = flowid;
                                                                    console.log('fetchNextNodeOption=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                    } else {
                                                                        // return callback({ code: 404, status: 'FAILED', message: 'No Flow Found' });
                                                                        if (sessionResult != null) {
                                                                            if (sessionResult.error_message != null && sessionResult.error_message.length > 0) {
                                                                                return callback({
                                                                                    code: 400,
                                                                                    status: 'FAILED',
                                                                                    message: sessionResult.error_message
                                                                                });
                                                                            } else {
                                                                                return callback({
                                                                                    code: 402,
                                                                                    status: 'FAILED',
                                                                                    message: 'Please enter correct value.'
                                                                                });
                                                                            }
                                                                        } else {
                                                                            return callback({
                                                                                code: 404,
                                                                                status: 'FAILED',
                                                                                message: 'No Flow Found'
                                                                            });
                                                                        }
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            if (sessionResult.is_validator == 1) {
                                                                if (sessionResult.validator == 'isNumeric') {
                                                                    if (validator.isNumeric(bodyText)) {
                                                                        sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                            console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                            if (result[0] != undefined) {
                                                                                let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                                let flowType = result[0].typenode;
                                                                                callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
                                                                    }
                                                                }
                                                                if (sessionResult.validator == 'isNationalMobileNumber') {
                                                                    console.log('isNationalMobileNumber======================>' + botUtils.isMobileLocal(bodyText, '91'));
                                                                    // if (botUtils.isMobileLocal(bodyText, '91')) {
                                                                    if (!isNaN(bodyText) && bodyText.length == 10) {
                                                                        sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                            console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                            if (result[0] != undefined) {
                                                                                let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                                let flowType = result[0].typenode;
                                                                                callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
                                                                    }
                                                                }
                                                                if (sessionResult.validator == 'isDateTime') {
                                                                    if (validator.isAfter(moment(bodyText, ["YYYY-MM-DD HH:mm", "DD-MM-YYYY HH:mm", "YYYY/MM/DD HH:mm", "DD/MM/YYYY HH:mm"]).format('YYYY-MM-DD HH:mm'),
                                                                        moment().format('YYYY-MM-DD HH:mm'))) {
                                                                        sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                            console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                            if (result[0] != undefined) {
                                                                                let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                                let flowType = result[0].typenode;
                                                                                callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
                                                                    }
                                                                }
                                                                if (sessionResult.validator == 'isExactMatch') {
                                                                    sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                        console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                        if (result[0] != undefined) {
                                                                            let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                            let flowType = result[0].typenode;
                                                                            callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                        } else {
                                                                            return callback({
                                                                                code: 400,
                                                                                status: 'FAILED',
                                                                                message: sessionResult.error_message
                                                                            });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
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

                                                                            } else {
                                                                                return callback({
                                                                                    code: 404,
                                                                                    status: 'FAILED',
                                                                                    message: 'No Flow Found'
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        return callback({
                                                                            code: 400,
                                                                            status: 'FAILED',
                                                                            message: sessionResult.error_message
                                                                        });
                                                                    }
                                                                }
                                                                if (sessionResult.validator == 'isOtp') {
                                                                    sendService.fetchOtp(userId, contactno, (err, result) => {
                                                                        if (bodyText == result[0].otp) {
                                                                            sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                                console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                                                                                if (result[0] != undefined) {
                                                                                    let flowTmpPayload = JSON.parse(result[0].node_body);
                                                                                    let flowType = result[0].typenode;
                                                                                    callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);

                                                                                } else {
                                                                                    return callback({
                                                                                        code: 404,
                                                                                        status: 'FAILED',
                                                                                        message: 'No Flow Found'
                                                                                    });
                                                                                }
                                                                            });
                                                                        } else {
                                                                            return callback({
                                                                                code: 400,
                                                                                status: 'FAILED',
                                                                                message: 'Invalid OTP'
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                            } else {
                                                                sendService.fetchNextMessage(flowid, sessionResult.next_message_id, (err, result) => {
                                                                    processMessageFlowId = flowid;
                                                                    console.log('fetchNextMessage(No Validation block)=====================>' + JSON.stringify(result));
                                                                    if (result[0] != undefined) {
                                                                        let flowTmpPayload = null;
                                                                        flowTmpPayload = JSON.parse(result[0].node_body);
                                                                        let flowType = result[0].typenode;
                                                                        callback(err, userId, flowid, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);
                                                                    } else {
                                                                        if (sessionResult != null) {
                                                                            if (sessionResult.error_message != null && sessionResult.error_message.length > 0) {
                                                                                return callback({
                                                                                    code: 400,
                                                                                    status: 'FAILED',
                                                                                    message: sessionResult.error_message
                                                                                });
                                                                            } else {
                                                                                return callback({
                                                                                    code: 402,
                                                                                    status: 'FAILED',
                                                                                    message: 'Please enter correct value.'
                                                                                });
                                                                            }
                                                                        } else {
                                                                            return callback({
                                                                                code: 404,
                                                                                status: 'FAILED',
                                                                                message: 'No Flow Found'
                                                                            });
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
                                                    } else {
                                                        callback(null, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult);
                                                    }
                                                },
                                                function (flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult, callback) {

                                                    console.log('FLOW TEMP PAYLOAD===============================>' + JSON.stringify(flowTmpPayload));

                                                    createPayload(userId, contactno, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult, obj, isLiveChatActive, bodyText, -1, 0, (err, createPayloadResult) => {
                                                        if (flowType !== "Webhook" && flowType != "Condition" && flowType !== "MultiCondition") {
                                                            sendEmail(userId, obj.contacts[0].wa_id, sessionResult, obj);
                                                        }
                                                        callback(err, createPayloadResult);
                                                    });
                                                }
                                            ], (err, result) => {
                                                if (err) {
                                                    console.log('Main Error');
                                                    if (err != null && err.code == 404) {
                                                        callbackService.getReplyMessage(bodyText, wanumber, (err, result) => {

                                                            let autoReplyMessage = result != undefined && result[0].auto_response != null ? result[0].auto_response : '';
                                                            let unSubscribeKeyword = result != undefined && result[0].stopword != null ? result[0].stopword : '';
                                                            let unSubscribeMessage = result != undefined && result[0].unsubmsg != null ? result[0].unsubmsg : '';
                                                            let reSubscribeKeyword = result != undefined && result[0].resubword != null ? result[0].resubword : '';
                                                            let reSubscribeMessage = result != undefined && result[0].resubmsg != null ? result[0].resubmsg : '';
                                                            let autoResponseTemplateName = result != undefined && result[0].hsmname != null ? result[0].hsmname : '';
                                                            let autoResponseFlag = result != undefined && result[0].auto_response_flag != null ? result[0].auto_response_flag : '';
                                                            let autoResponseFlowId = result != undefined && result[0].flowid != null ? result[0].flowid : '';

                                                            if (bodyText.toLowerCase() == unSubscribeKeyword.toString().toLowerCase() && unSubscribeMessage.length > 0) {
                                                                callbackService.updateSubscription(contactno, 0, wanumber, null, bodyText, (err, result) => {
                                                                    if (err) {
                                                                        console.log('updateSubscription 1 error==================>' + err);
                                                                    } else {
                                                                        console.log('updateSubscription 1  result================>' + JSON.stringify(result));
                                                                    }

                                                                    sendMessage(userId, unSubscribeMessage, contactno, 4, (err, result) => { });
                                                                    logSentByUserMessage(userId, obj, isLiveChatActive, bodyText, (err, logSentByUserMessageResult1) => {
                                                                        if (err) {
                                                                            console.log('logSentByUserMessage1 error==================>' + err);
                                                                        } else {
                                                                            console.log('logSentByUserMessage1 result================>' + JSON.stringify(logSentByUserMessageResult1));
                                                                        }
                                                                        done(null, 'Success1 ' + contactno);
                                                                    });
                                                                });
                                                            } else if (bodyText.toLowerCase() == reSubscribeKeyword.toString().toLowerCase() && reSubscribeMessage.length > 0) {
                                                                callbackService.updateSubscription(contactno, 1, wanumber, bodyText, null, (err, result) => {
                                                                    if (err) {
                                                                        console.log('updateSubscription(start) error==================>' + err);
                                                                    } else {
                                                                        console.log('updateSubscription(start) result================>' + JSON.stringify(result));
                                                                    }

                                                                    sendMessage(userId, reSubscribeMessage, contactno, 4, (err, result) => { });
                                                                    logSentByUserMessage(userId, obj, isLiveChatActive, bodyText, (err, logSentByUserMessageResult2) => {
                                                                        if (err) {
                                                                            console.log('logSentByUserMessage2 error==================>' + err);
                                                                        } else {
                                                                            console.log('logSentByUserMessage2 result================>' + JSON.stringify(logSentByUserMessageResult2));
                                                                        }
                                                                        done(null, 'Success2 ' + contactno);
                                                                    });
                                                                });
                                                            } else {
                                                                if (autoResponseFlag == 0) {
                                                                    sendTemplateMessage(autoResponseTemplateName, userId, contactno, wanumber, (err, result) => {
                                                                        if (err) {
                                                                            if (autoReplyMessage.length > 0) {
                                                                                sendMessage(userId, autoReplyMessage, contactno, 4, (err_1, result_1) => { });
                                                                            }
                                                                        }
                                                                    });
                                                                } else if (autoResponseFlag == 1) {
                                                                    if (autoReplyMessage.length > 0) {
                                                                        sendMessage(userId, autoReplyMessage, contactno, 4, (err, result) => { });
                                                                    }
                                                                } else if (autoResponseFlag == 2) {
                                                                    startBot(autoResponseFlowId, userId, contactno, wanumber, isLiveChatActive, bodyText, obj, (err, result) => {
                                                                        if (err) {
                                                                            console.log('startBot error==================>' + err);
                                                                        } else {
                                                                            console.log('startBot result================>' + JSON.stringify(result));
                                                                        }
                                                                        done(null, 'Success7 ' + contactno);
                                                                    });
                                                                }

                                                                if (autoResponseFlag != 2) {
                                                                    logSentByUserMessage(userId, obj, isLiveChatActive, bodyText, (err, logSentByUserMessageResult3) => {
                                                                        if (err) {

                                                                            console.log('logSentByUserMessage3 error==================>' + err);
                                                                        } else {
                                                                            console.log('logSentByUserMessage3 result================>' + JSON.stringify(logSentByUserMessageResult3));
                                                                        }
                                                                        done(null, 'Success3 ' + contactno);
                                                                    });
                                                                }
                                                            }
                                                        });
                                                    } else if (err != null && err.code == 400) {
                                                        sendMessage(userId, err.message, contactno, 4, (err, result) => { });
                                                        logSentByUserMessage(userId, obj, isLiveChatActive, bodyText, (err, logSentByUserMessageResult4) => {
                                                            if (err) {
                                                                console.log('logSentByUserMessage4 error==================>' + err);
                                                            } else {
                                                                console.log('logSentByUserMessage4 result================>' + JSON.stringify(logSentByUserMessageResult4));
                                                            }

                                                            sendService.fetchLastTextMessage(contactno, userId, (err, fetchLastTextMessageResult) => {
                                                                if (fetchLastTextMessageResult[0] != undefined && fetchLastTextMessageResult[0].session_id != null && fetchLastTextMessageResult[0].session_id.length > 0) {
                                                                    sendService.resetChatAttributes(fetchLastTextMessageResult[0].session_id, null, (err, result) => {

                                                                        if (err) {
                                                                            console.log('resetChatAttributes err(' + contactno + ')================================>' + err);
                                                                        } else {
                                                                            console.log('resetChatAttributes result(' + contactno + ')================================>' + JSON.stringify(result));
                                                                        }
                                                                    });
                                                                } else {

                                                                }
                                                            });

                                                            done(null, 'Success4 ' + contactno);
                                                        });
                                                    } else if (err != null && err.code == 402) {
                                                        // bodyText = '';
                                                        // processMessage(processMessageResult, processMessageObj,(err, result)=>{

                                                        // });
                                                        console.log('FLOW_ID_1===================================>' + processMessageFlowId);
                                                        callNextNode(processMessageFlowId, userId, contactno, 2, (err, callNextNodeResult) => {
                                                            if (err) {
                                                                done(null, 'Success');
                                                            } else {
                                                                createPayload(userId, contactno,
                                                                    callNextNodeResult.flowType,
                                                                    callNextNodeResult.flowTmpPayload,
                                                                    callNextNodeResult.next_message_id,
                                                                    callNextNodeResult.current_message_id,
                                                                    callNextNodeResult.sessionResult,
                                                                    callNextNodeResult.placeholder,
                                                                    callNextNodeResult.nextMessageResult,
                                                                    obj,
                                                                    isLiveChatActive,
                                                                    bodyText,
                                                                    callNextNodeResult.type, 0, (err, createPayloadResult) => {
                                                                        done(null, 'Success');
                                                                    });
                                                            }

                                                        });
                                                    }
                                                } else {
                                                    done(null, result);
                                                }
                                            });
                                        } else {
                                            logSentByUserMessage(userId, obj, isLiveChatActive, bodyText, (err, logSentByUserMessageResult5) => {
                                                if (err) {
                                                    console.log('logSentByUserMessage5 error==================>' + err);
                                                } else {
                                                    console.log('logSentByUserMessage5 result================>' + JSON.stringify(logSentByUserMessageResult5));
                                                }
                                                sendEmail(userId, obj.contacts[0].wa_id, result, obj);
                                                done(null, 'Success5 ' + contactno);
                                            });
                                        }
                                    } else {
                                        done(null, 'Success');
                                    }
                                });
                            }
                            else if (obj.messages[0].type == 'unsupported') {
                                logSentByUserMessage(userId, obj, 0, bodyText, (err, logSentByUserMessageResult5) => {
                                    if (err) {
                                        console.log('logSentByUserMessage6 error==================>' + JSON.stringify(err));
                                    } else {
                                        console.log('logSentByUserMessage6 result================>' + JSON.stringify(logSentByUserMessageResult5));
                                    }
                                    // sendEmail(userId, obj.contacts[0].wa_id, result, obj);
                                    done(null, 'Success6 ' + contactno);
                                });
                            }
                            else {
                                done(null, 'Unsupported Message');
                            }
                        }
                    });
                }
            }
            else if (wanumber != null && obj.changes != undefined && obj.changes[0].value.hasOwnProperty('statuses')) {
                if (obj.changes[0].value.statuses != undefined && obj.changes[0].value.statuses[0].status != undefined) {
                    callbackService.storeContactPayloadLogs(req.body, obj.changes[0].value.statuses[0].id, 2, (err, result) => {

                    });

                    isProperPayload = true;
                    // callbackService.updateDelivery(obj.changes[0].value, userId, (err, result) => {
                    //     if (err) {
                    //         done(err);
                    //     } else {
                    //         done(null, 'Success');
                    //     }
                    // });

                    statusesPayloadQueue.add(req.body)
                        .then(() => console.log('pushed task'))
                        .catch((e) => console.log('failed to push task'));
                    done(null, 'Success');
                }
            }
            // else if (obj.changes != undefined && obj.changes[0].field == 'message_template_status_update') {
            //     console.log('I am here in template blog');
            //     let status = 0;
            //     obj = req.body.entry[0];
            //     if (eventstatus === "REJECTED") {
            //         console.log(eventstatus);
            //         status = 2;
            //     } else if (eventstatus === "APPROVED") {
            //         status = 1;
            //     } else if (eventstatus === "FLAGGED") {
            //         status = 5;
            //     }
            //     sendService.updatewabaapprovalresponseid(status, msgtempid, (err, updatewabaapprovalresponseidResult) => {
            //         //console.log(" I am here at updatewabaapprovalresponseid ");
            //         if (err) {
            //             console.log('updatewabaapprovalresponseid err=======================>' + err);
            //             done(err);
            //         } else {
            //             console.log('updatewabaapprovalresponseid result=======================>' + JSON.stringify(updatewabaapprovalresponseidResult));
            //             done(null, updatewabaapprovalresponseidResult);
            //         }
            //     })

            // } 
            // else if (obj.changes != undefined && obj.changes[0].field == 'phone_number_name_update') {
            //     console.log(numbername);
            //     console.log('I am here in number name');

            //     sendService.updatephonenumbernameupdate(requestname, numbername, (err, updatephonenumbernameupdateResult) => {
            //         console.log(requestname);

            //         if (err) {
            //             console.log('updatephonenumbernameupdate err=======================>' + err);
            //             done(err);
            //         } else {
            //             console.log('updatephonenumbernameupdate result=======================>' + JSON.stringify(updatephonenumbernameupdateResult));
            //             done(null, updatephonenumbernameupdateResult);
            //         }
            //     })
            // } 
            // else if (obj.changes != undefined && obj.changes[0].field == 'phone_number_quality_update') {
            //     sendService.updatephonenumberqualityupdate(currentlimit, eventquality, numberquality, (err, updatephonenumberqualityupdateResult) => {
            //         console.log(currentlimit);
            //         console.log(eventquality);
            //         console.log(numberquality);
            //         if (err) {
            //             console.log('updatephonenumberqualityupdate err=======================>' + err);
            //             done(err);
            //         } else {
            //             console.log('updatephonenumberqualityupdate result=======================>' + JSON.stringify(updatephonenumberqualityupdateResult));
            //             done(null, updatephonenumberqualityupdateResult);
            //         }
            //     })
            // }
            else if (obj.changes != undefined && obj.changes[0].field == 'message_template_status_update') {
                businessesPayloadQueue.add(req.body)
                    .then(() => console.log('pushed task'))
                    .catch((e) => console.log('failed to push task'));
                done(null, 'Success');
            }
            else if (obj.changes != undefined && obj.changes[0].field == 'phone_number_name_update') {
                businessesPayloadQueue.add(req.body)
                    .then(() => console.log('pushed task'))
                    .catch((e) => console.log('failed to push task'));
                done(null, 'Success');
            }
            else if (obj.changes != undefined && obj.changes[0].field == 'phone_number_quality_update') {
                businessesPayloadQueue.add(req.body)
                    .then(() => console.log('pushed task'))
                    .catch((e) => console.log('failed to push task'));
                done(null, 'Success');
            } else if (obj.changes != undefined && obj.changes[0].field == 'account_update') {
                done(null, 'Success');
            } else if (obj.changes != undefined && obj.changes[0].field == 'account_review_update') {
                done(null, 'Success');
            }

        } else {
            done(null, 'Message obj is missing');
        }
    };

    let startBot = (autoResponseFlowId, userId, contactno, wanumber, isLiveChatActive, bodyText, obj, next) => {
        async.waterfall([
            (done) => {
                sendService.fetchInitialMessage(autoResponseFlowId, (err, result) => {
                    console.log('startbot fetchInitialMessage=====================>' + JSON.stringify(result));
                    if (result.length > 0) {
                        let flowTmpPayload = JSON.parse(result[0].node_body);
                        let flowType = result[0].typenode;
                        let sessionResult = {};
                        sessionResult.session = 0;
                        sessionResult.next_message_id = null;
                        done(err, userId, autoResponseFlowId, flowType, flowTmpPayload, result[0].next_message_id, result[0].id, sessionResult, result[0].placeholder, result[0]);
                    } else {
                        return done({
                            code: 400,
                            status: 'FAILED',
                            message: 'There is no starting node for this bot'
                        });
                    }
                });
            },
            (userId, flowid, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult, done) => {
                if (sessionResult.session == 0) {
                    sendService.setFlowSession(contactno, flowid, userId, next_message_id, current_message_id, flowType, flowTmpPayload, placeholder, (err, result) => {
                        sessionResult.id = result;
                        done(err, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult);
                    });
                } else {
                    done(null, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult);
                }
            },
            (flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult, done) => {

                console.log('startbot FLOW TEMP PAYLOAD===============================>' + JSON.stringify(flowTmpPayload));

                createPayload(userId, contactno, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult, obj, isLiveChatActive, bodyText, -1, 0, (err, createPayloadResult) => {
                    if (flowType !== "Webhook" && flowType != "Condition" && flowType !== "MultiCondition") {
                        sendEmail(userId, obj.contacts[0].wa_id, sessionResult, obj);
                    }

                    if (err) {
                        console.log('startbot createPayload err(' + contactno + ')===============================>' + err);
                    } else {
                        console.log('startbot createPayload result(' + contactno + ')===============================>' + JSON.stringify(createPayloadResult));
                    }
                    done(err, createPayloadResult);
                });
            }
        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
            }
        });
    };

    let sendTemplateMessage = (autoResponseTemplateName, userId, to, wabaNumber, next) => {
        console.log('sendTemplateMessage===================>' + autoResponseTemplateName, userId, to, wabaNumber);
        let campaignid = 0;
        let msgType = 4;
        let direction = 1;
        let bodyContent = null;
        let isSendMessage = false;

        async.waterfall([
            (templateMessageCallback) => {
                sendService.fetchTemplate(autoResponseTemplateName, userId, wabaNumber, (err, templateMessageResult) => {
                    if (err) {
                        console.log('fetchTemplate error========================>' + err);
                    } else {
                        console.log('fetchTemplate result========================>' + JSON.stringify(templateMessageResult));
                    }
                    let t_1 = {
                        "autoResponseTemplateName": autoResponseTemplateName,
                        "userId": userId,
                        "to": to,
                        "wabaNumber": wabaNumber,
                        "err": err,
                        "templateMessageResult": JSON.stringify(templateMessageResult)
                    };
                    errorLogger.info('FETCH_TEMPLATE=====================>' + JSON.stringify(t_1));

                    if (templateMessageResult.length > 0) {
                        templateMessageCallback(null, templateMessageResult);
                    } else {
                        templateMessageCallback('No Template Found');
                    }
                });
            },
            (templateMessageResult, templateMessageCallback) => {
                let messagePayload = {
                    "messaging_product": "whatsapp",
                    "to": to,
                    "type": "template",
                    "template": {
                        // "namespace": templateMessageResult[0].hsmnamespace,
                        "language": {
                            // "policy": "deterministic",
                            "code": templateMessageResult[0].langcode
                        },
                        "name": templateMessageResult[0].temptitle,
                        "components": []
                    }
                };
                bodyContent = {
                    body: templateMessageResult[0].body_message
                };
                templateMessageCallback(null, messagePayload, bodyContent);
            },
            (messagePayload, bodyContent, templateMessageCallback) => {
                let api = '';
                let httpMethod = 1;
                let requestType = 1;
                let contentLength = Buffer.byteLength(JSON.stringify(messagePayload));
                let apiHeaders = [{
                    'headerName': 'Authorization',
                    'headerVal': 'Bearer ' + accesstoken
                }, {
                    'headerName': 'content-length',
                    'headerVal': contentLength
                }];

                //console.log("Message Payload=========================>" + JSON.stringify(messagePayload));
                botUtils.callWhatsAppApi(wabaUrl, api, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
                    console.log('SEND TEMPLATE MESSAGE RESPONSE=========================================>' + JSON.stringify(response));
                    if (typeof response.messages != undefined) {
                        waMessageId = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                        sendService.insertMessageInSentMaster(0, null, userId, messagePayload.to, messagePayload, waMessageId, msgType, campaignid, direction, wabaNumber, wabaId, bodyContent, (error, result) => {
                            if (error) {
                                templateMessageCallback(error);
                                //console.log(error);
                            } else {
                                //console.log(waMessageId);
                                templateMessageCallback(null, waMessageId);
                            }
                        });
                    } else {
                        //console.log(response);
                        templateMessageCallback(response);
                    }
                }).catch((err) => {
                    console.log('SEND TEMPLATE MESSAGE ERROR=========================================>' + err);

                    templateMessageCallback(err);
                });
            }
        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
                errorLogger.info('SEND TEMPLATE MESSAGE=========================================>' + autoResponseTemplateName + ', TO : ' + to + ', TYPE : ' + msgType + ', MESSAGEID : ' + result);
            }
        });
    };

    let pushDataToWebhook = (sessionId, userId, next) => {
        async.waterfall([
            (pushDataToWebhookCallback) => {
                sendService.fetchPushWebhookData(sessionId, userId, (err, result) => {
                    if (err) {
                        console.log('fetchPushWebhookData error=====================>' + err);
                        pushDataToWebhookCallback(err);
                    } else {
                        console.log('fetchPushWebhookData result=====================>' + JSON.stringify(result));
                        pushDataToWebhookCallback(null, result);
                    }
                });
            },
            (pushDataToWebhookResult, pushDataToWebhookCallback) => {
                if (pushDataToWebhookResult[0] != undefined && pushDataToWebhookResult[0].webhook != null && pushDataToWebhookResult.length > 0 && pushDataToWebhookResult[0].webhook.length > 0) {
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
                } else {
                    pushDataToWebhookCallback(null, 'No webhook found to push data');
                }
            }
        ], (err, result) => {
            if (err) {
                console.log('pushDataToWebhook err ====================>' + err);
                next(err);
            } else {
                console.log('pushDataToWebhook result ====================>' + JSON.stringify(result));
                next(null, result);
            }
        });
    };

    let logSentByUserMessage = (userId, obj, isLiveChatActive, bodyText, next) => {
        if (obj.contacts != undefined) {
            console.log('LOG_SENT_BY_USER_MESSAGE===============================>' + JSON.stringify(obj));
            let profileName = obj.contacts[0].profile.name;
            //console.log('PROFILENAME===========================>' + profileName);
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
            let tmpCaption = null;
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
                        };
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

                        if (obj.messages[0].image.caption != undefined) {
                            tmpCaption = obj.messages[0].image.caption;
                        }
                    }
                    if (obj.messages[0].errors != undefined) {
                        messageText = {
                            body: obj.messages[0].errors[0].title
                        };
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

                        if (obj.messages[0].video.caption != undefined) {
                            tmpCaption = obj.messages[0].video.caption;
                        }
                    }
                    if (obj.messages[0].errors != undefined) {
                        messageText = {
                            body: obj.messages[0].errors[0].title
                        };
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
                        };
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
                        };
                    }
                    msgType = 7;
                    break;
                case "template":
                    msgType = 8;
                    break;
                case "button":
                    msgType = 9;
                    messageText = {
                        body: obj.messages[0].button != undefined ? obj.messages[0].button.text : obj.errors[0].title
                    };
                    break;
                case "interactive":
                    msgType = 9;
                    if (obj.messages[0].interactive.type == 'button_reply') {
                        messageText = {
                            body: obj.messages[0].interactive.button_reply.title
                        };
                    }
                    if (obj.messages[0].interactive.type == 'list_reply') {
                        messageText = {
                            body: obj.messages[0].interactive.list_reply.title
                        };
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
                        };
                    }

                    msgType = 10;
                    break;
                case "unknown":
                    msgType = 11;
                    messageText = {
                        body: obj.messages[0].errors[0].details
                    };
                    break;
                case "reaction":
                    msgType = 12;
                    if (obj.messages[0].reaction != undefined) {
                        messageText = {
                            body: obj.messages[0].reaction.emoji
                        };
                    }
                    if (obj.messages[0].errors != undefined) {
                        messageText = {
                            body: obj.messages[0].errors[0].title
                        };
                    }
                    break;
                case "unsupported":
                    msgType = 13;

                    if (obj.messages[0].errors != undefined) {
                        messageText = {
                            body: obj.messages[0].errors[0].title
                        };
                    }
                    break;
            }

            async.waterfall([
                function (done) {
                    let statusPayload = {
                        "messaging_product": "whatsapp",
                        "status": "read",
                        "message_id": waMessageId
                    };

                    let api = '';
                    let httpMethod = 1;
                    let requestType = 1;
                    let contentLength = Buffer.byteLength(JSON.stringify(statusPayload));
                    let apiHeaders = [{
                        'headerName': 'Authorization',
                        'headerVal': 'Bearer ' + accesstoken
                    }, {
                        'headerName': 'content-length',
                        'headerVal': contentLength
                    }];

                    botUtils.callWhatsAppApiPUT(wabaUrl, api, statusPayload, httpMethod, requestType, apiHeaders).then((response) => {
                        console.log('MARK_MESSAGE_AS_READ RESPONSE : (' + waRecipientNo, waMessageId + ')' + JSON.stringify(response));
                        done(null, response);
                    }).catch((err) => {
                        console.log('MARK_MESSAGE_AS_READ ERROR : (' + waRecipientNo, waMessageId + ')' + err);
                        // console.log(err);
                        done(null, err);
                    });
                },
                function (r, done) {
                    if (msgType == 0 || msgType == 1 || msgType == 2 || msgType == 3 || msgType == 7 || msgType == 10) {
                        url = wabaUrl.replace('/messages', tmpMediaID);
                        //console.log('Media URL ==================================>' + wabaUrl + '/v1/media/' + tmpMediaID);

                        let options = {
                            'method': 'GET',
                            'host': httpUrl.parse(wabaUrl).hostname,
                            // 'port': httpUrl.parse(wabaUrl).port,
                            'path': '/v13.0/' + tmpMediaID,
                            'rejectUnauthorized': false,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + accesstoken
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
                                console.log('MEDIA_URL(' + waRecipientNo + ')====================================>' + JSON.parse(body).url.toString());
                                done(null, JSON.parse(body).url.toString());

                            });

                            res.on("error", function (error) {
                                console.error(error);
                                return done(error);
                            });
                        });

                        req.end();

                        req.on('error', function (err) {
                            console.log('err occurred : ' + err);
                            return done(err);
                        });
                    } else {
                        done(null, messageText);
                    }
                },
                function (filedata, done) {
                    if (msgType == 0 || msgType == 1 || msgType == 2 || msgType == 3 || msgType == 7 || msgType == 10) {

                        console.log('FILE_DATA_URL (' + waRecipientNo + ')================================>' + httpUrl.parse(filedata).hostname);
                        console.log('FILE_DATA_PATH (' + waRecipientNo + ')================================>' + httpUrl.parse(filedata).path);
                        callbackService.downloadCloudMedia(filedata, accesstoken, (err, result) => {
                            if (err) {
                                console.log('downloadCloudMedia error(' + waRecipientNo + ')========================================>' + err);
                                return done(err);
                            } else {
                                tmpName = tmpMediaID + "_" + tmpFileName;
                                tmpFile = "/tmp/whatsapp_media_tmp/" + tmpName;
                                fs.writeFileSync(tmpFile, result.data);
                                //console.log('userid=====================>' + userId + ', ==================================>' + tmpFile);
                                // console.log('downloadCloudMedia result========================================>'+result.data);
                                done(null, tmpFile);
                            }
                        });
                    } else {
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
                                console.log('UploadMediaError (' + waRecipientNo + ')===============================>' + err);
                                console.log('S3_ERROR_PAYLOAD 1: ' + JSON.stringify(req.body));
                                messageText = {
                                    "body": "<a href='Media Upload Error'>Media</a>"
                                };
                                return done(err);
                            } else {
                                console.log('Upload Media (' + waRecipientNo + ')===============================>' + data.Location);
                                publicMediaUrl = data.Location;
                                messageText = {
                                    "body": "<a href='" + data.Location + "'>Media</a>"
                                };

                                if (tmpCaption != undefined && tmpCaption != null) {
                                    messageText.caption = tmpCaption;
                                }

                                fs.unlink(tmpFile, function (err) {
                                    if (err) {
                                        // console.error(err);
                                    }
                                    //console.log('Temp File Delete');
                                });
                                console.log('S3_ERROR_PAYLOAD 2: ' + JSON.stringify(req.body));
                                done(null, messageText);
                            }
                        });
                    } else {
                        done(null, messageText);
                    }
                },
                function (r, done) {
                    callbackService.getResponseRate(waRecipientNo, userId, (err, getResponseRateResult) => {
                        if (err) {
                            console.log('getResponseRate err (' + waRecipientNo + ')==============================>' + err);
                        } else {
                            console.log('getResponseRate result (' + waRecipientNo + ')==============================>' + JSON.stringify(getResponseRateResult));
                        }
                        done(err, getResponseRateResult);
                    });
                },
                // function (result, done) {
                //     let statusPayload = {
                //         "messaging_product": "whatsapp",
                //         "status": "read",
                //         "message_id": waMessageId
                //     };

                //     let api = '';
                //     let httpMethod = 1;
                //     let requestType = 1;
                //     let contentLength = Buffer.byteLength(JSON.stringify(statusPayload));
                //     let apiHeaders = [{
                //         'headerName': 'Authorization',
                //         'headerVal': 'Bearer ' + accesstoken
                //     }, {
                //         'headerName': 'content-length',
                //         'headerVal': contentLength
                //     }];

                //     botUtils.callWhatsAppApiPUT(wabaUrl, api, statusPayload, httpMethod, requestType, apiHeaders).then((response) => {
                //         console.log('MARK_MESSAGE_AS_READ RESPONSE : (' + waRecipientNo, waMessageId + ')' + JSON.stringify(response));
                //         done(null, response);
                //     }).catch((err) => {
                //         console.log('MARK_MESSAGE_AS_READ ERROR : (' + waRecipientNo, waMessageId + ')' + err);
                //         // console.log(err);
                //         done(null, err);
                //     });
                // },
                function (objData, done) {
                    let billing = false;
                    let pricing_model = null;
                    let submissiontype = 'RESPONSE';

                    sendService.insertMessageInSentMasterAPI(0, null, userId, waRecipientNo, messageText, waMessageId, msgType, campaignid, direction, wanumber, wabaId, objData.countrycode, objData.rate, billing, pricing_model, submissiontype, messageText, profileName, (err, insertMessageInSentMasterAPIResult) => {
                        if (err) {
                            console.log('insertMessageInSentMasterAPI err (' + waRecipientNo + ')==============================>' + err);
                        } else {
                            console.log('insertMessageInSentMasterAPI result (' + waRecipientNo + ')==============================>' + JSON.stringify(insertMessageInSentMasterAPIResult));
                        }
                        done(err, insertMessageInSentMasterAPIResult);
                    });
                },
                // function (result, done) {
                //     let statusPayload = {
                //         "messaging_product": "whatsapp",
                //         "status": "read",
                //         "message_id": waMessageId
                //     };

                //     let api = '';
                //     let httpMethod = 1;
                //     let requestType = 1;
                //     let contentLength = Buffer.byteLength(JSON.stringify(statusPayload));
                //     let apiHeaders = [{
                //         'headerName': 'Authorization',
                //         'headerVal': 'Bearer ' + accesstoken
                //     }, {
                //         'headerName': 'content-length',
                //         'headerVal': contentLength
                //     }];

                //     botUtils.callWhatsAppApiPUT(wabaUrl, api, statusPayload, httpMethod, requestType, apiHeaders).then((response) => {
                //         console.log('MARK_MESSAGE_AS_READ RESPONSE : (' + waRecipientNo, waMessageId + ')' + JSON.stringify(response));
                //         done(null, response);
                //     }).catch((err) => {
                //         console.log('MARK_MESSAGE_AS_READ ERROR : (' + waRecipientNo, waMessageId + ')' + err);
                //         // console.log(err);
                //         done(null, err);
                //     });
                // },
                function (res_, done) {
                    sendService.fetchLastTextMessage(waRecipientNo, userId, (err, fetchLastTextMessageResult) => {
                        if (err) {
                            console.log('fetchLastTextMessage err (' + waRecipientNo + ')==============================>' + err);
                        } else {
                            console.log('fetchLastTextMessage result(' + waRecipientNo + ')==============================>' + JSON.stringify(fetchLastTextMessageResult));
                        }

                        if (fetchLastTextMessageResult[0] != undefined && fetchLastTextMessageResult[0].session_id != null && fetchLastTextMessageResult[0].session_id.length > 0) {
                            let tmpLastMessage = {
                                waRecipientNo: waRecipientNo,
                                session_id: fetchLastTextMessageResult[0].session_id,
                                bodyText: bodyText,
                                messageType: messageType,
                                tmpMediaID: tmpMediaID,
                                publicMediaUrl: publicMediaUrl
                            };
                            console.log(JSON.stringify(tmpLastMessage));
                            sendService.updateMediaChatAttributes(fetchLastTextMessageResult[0].session_id, bodyText, messageType, tmpMediaID, publicMediaUrl, (err, updateMediaChatAttributesResult) => {
                                if (err) {
                                    console.log('updateMediaChatAttributes err(' + waRecipientNo + ')==============================>' + err);
                                } else {
                                    console.log('updateMediaChatAttributes result(' + waRecipientNo + ')==============================>' + JSON.stringify(updateMediaChatAttributesResult));
                                }
                                done(null, res_);
                            });
                        } else {
                            done(null, res_);
                        }
                    });

                },
                function (res_, done) {
                    sendService.fetchLiveChatSettings(waRecipientNo, userId, (err, fetchLiveChatSettingsResult) => {
                        if (err) {
                            console.log('fetchLiveChatSettings err (' + waRecipientNo + ')=======================>' + err);
                            done(err);
                        } else {
                            console.log('fetchLiveChatSettings result (' + waRecipientNo + ')=======================>' + JSON.stringify(fetchLiveChatSettingsResult));
                            done(null, fetchLiveChatSettingsResult);
                        }
                    });
                },
                function (fetchLiveChatSettingsResult, done) {
                    console.log(waRecipientNo);
                    console.log(bodyText);
                    console.log(userId);
                    sendService.fetchEndLiveChatMessage(waRecipientNo, bodyText, userId, (err, fetchEndLiveChatMessageResult) => {
                        if (err) {
                            console.log('fetchEndLiveChatMessage err (' + waRecipientNo + ')=======================>' + err);
                            done(null, 0, 0);

                        } else {
                            console.log('fetchEndLiveChatMessage result (' + waRecipientNo + ')=======================>' + JSON.stringify(fetchEndLiveChatMessageResult));
                            done(null, fetchLiveChatSettingsResult, fetchEndLiveChatMessageResult);
                        }
                        let t_2 = {
                            "bodyText": bodyText,
                            "userId": userId,
                            "waRecipientNo": waRecipientNo,
                            "err": err,
                            "fetchEndLiveChatMessageResult": JSON.stringify(fetchEndLiveChatMessageResult)
                        };
                        errorLogger.info('FETCH_END_LIVE_CHAT_MESSAGE=====================>' + JSON.stringify(t_2));
                    });
                },
                function (fetchLiveChatSettingsResult, fetchEndLiveChatMessageResult, done) {
                    if (fetchLiveChatSettingsResult[0].c == 1 && fetchEndLiveChatMessageResult[0].c == 0) {
                        callLiveChatWebHook(obj, fetchLiveChatSettingsResult, (liveChatWebhookError, liveChatWebhookResult) => {
                            if (liveChatWebhookError) {
                                console.log('callLiveChatWebHook err 1 (' + waRecipientNo + ')=======================>' + liveChatWebhookError);
                                done(liveChatWebhookError);
                            } else {
                                console.log('callLiveChatWebHook result 1 (' + waRecipientNo + ')=======================>' + JSON.stringify(liveChatWebhookResult));
                                done(null, liveChatWebhookResult);
                            }
                        });
                    } else if (fetchLiveChatSettingsResult[0].c == 1 && fetchEndLiveChatMessageResult[0].c == 1) {
                        sendService.endLiveChatMessage(waRecipientNo, userId, (_err2, endLiveChatMessageResult) => {
                            sendMessage(userId, fetchEndLiveChatMessageResult[0].end_chat_message, waRecipientNo, 4, (err, result) => {
                                callLiveChatWebHook(obj, fetchLiveChatSettingsResult, (liveChatWebhookError, liveChatWebhookResult) => {
                                    if (liveChatWebhookError) {
                                        console.log('callLiveChatWebHook err 2 (' + waRecipientNo + ')=======================>' + liveChatWebhookError);
                                        done(liveChatWebhookError);
                                    } else {
                                        console.log('callLiveChatWebHook result 2 (' + waRecipientNo + ')=======================>' + JSON.stringify(liveChatWebhookResult));
                                        done(null, liveChatWebhookResult);
                                    }
                                });
                            });
                        });
                    } else if (fetchLiveChatSettingsResult[0].c == 0) {
                        done(null, 'No Livechat Found ' + waRecipientNo);
                    }
                }

            ], function (err, result) {
                if (err) {
                    next(err);
                    console.log('DLR Error : ' + err);
                    errorLogger.error("DLR Error : " + err + ', ' + waRecipientNo);
                    errorLogger.error(err);
                } else {
                    console.log('DLR Result : ' + result + ', ' + waRecipientNo);
                    next(null, result);
                }
            });
        }
    };

    let sendMessage = (userId, obj, to, type, next) => {
        console.log('SEND MESSAGE=========================================>' + JSON.stringify(obj) + ', TO : ' + to + ', TYPE : ' + type);
        let campaignid = 0;
        let msgType = type;
        let direction = 1;
        let bodyContent = null;
        let isSendMessage = false;

        async.waterfall([
            function (sendMessageCallback) {
                if (msgType == 0) {

                    let messagePayload = {
                        "messaging_product": "whatsapp",
                        "to": to,
                        "type": "document",
                        "recipient_type": "individual",
                        "document": obj
                    };
                    bodyContent = {
                        "body": "<a href='" + messagePayload.document.link + "'>Media</a>"
                    };
                    sendMessageCallback(null, messagePayload);
                } else if (msgType == 1) {
                    let tmpObj = obj.caption;
                    let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                    if (attrKeyArr != null && attrKeyArr.length > 0) {
                        //console.log('attrKeyArr=============================>' + attrKeyArr.length);
                        replacePlaceholder(userId, tmpObj, attrKeyArr, to, userProfileName, userMobileNumber, (err, result) => {
                            obj.caption = result;
                            let messagePayload = {
                                "messaging_product": "whatsapp",
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
                    } else {
                        let messagePayload = {
                            "messaging_product": "whatsapp",
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
                } else if (msgType == 2) {
                    let tmpObj = obj.caption;
                    let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                    if (attrKeyArr != null && attrKeyArr.length > 0) {
                        //console.log('attrKeyArr=============================>' + attrKeyArr.length);
                        replacePlaceholder(userId, tmpObj, attrKeyArr, to, userProfileName, userMobileNumber, (err, result) => {
                            obj.caption = result;
                            let messagePayload = {
                                "messaging_product": "whatsapp",
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
                    } else {
                        let messagePayload = {
                            "messaging_product": "whatsapp",
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
                } else if (msgType == 4) {
                    let tmpObj = obj;
                    console.log('------------------------------------------------------------------------------------------------------------' + tmpObj);
                    // let placeholderCount = tmpObj.match(/{{\s*[\w\.]+\s*}}/g);
                    let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                    if (attrKeyArr != null && attrKeyArr.length > 0) {
                        //console.log('attrKeyArr(' + to + ') : =============================>' + attrKeyArr.length);
                        replacePlaceholder(userId, tmpObj, attrKeyArr, to, userProfileName, userMobileNumber, (err, result) => {
                            //console.log('REPLACE_PLACEHOLDER(' + to + ') : ' + result);
                            let messagePayload = {
                                "messaging_product": "whatsapp",
                                "to": to,
                                "type": "text",
                                "recipient_type": "individual",
                                "text": {
                                    "body": result
                                }
                            };
                            bodyContent = messagePayload.text;
                            sendMessageCallback(null, messagePayload);
                        });


                    } else {
                        let messagePayload = {
                            "messaging_product": "whatsapp",
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
                } else if (msgType == 9) {
                    //console.log('INTERACTIVE MESSAGE===============>' + JSON.stringify(obj));
                    let tmpObj = obj.body.text;

                    let attrKeyArr = tmpObj.match(/{{(.+?)}}/g);
                    if (attrKeyArr != null && attrKeyArr.length > 0) {

                        replacePlaceholder(userId, tmpObj, attrKeyArr, to, userProfileName, userMobileNumber, (err, result) => {
                            obj.body.text = result;

                            let messagePayload = {
                                "messaging_product": "whatsapp",
                                "to": to,
                                "type": "interactive",
                                "recipient_type": "individual",
                                "interactive": obj
                            };
                            bodyContent = {
                                "body": messagePayload.interactive.body.text
                            };
                            sendMessageCallback(null, messagePayload);
                        });


                    } else {
                        messagePayload = {
                            "messaging_product": "whatsapp",
                            "to": to,
                            "type": "interactive",
                            "recipient_type": "individual",
                            "interactive": obj
                        };
                        bodyContent = {
                            "body": messagePayload.interactive.body.text
                        };
                        sendMessageCallback(null, messagePayload);
                    }
                }
            },
            function (messagePayload, sendMessageCallback) {
                let api = '';
                let httpMethod = 1;
                let requestType = 1;
                let contentLength = Buffer.byteLength(JSON.stringify(messagePayload));
                let apiHeaders = [{
                    'headerName': 'Authorization',
                    'headerVal': 'Bearer ' + accesstoken
                }, {
                    'headerName': 'content-length',
                    'headerVal': contentLength
                }];

                //console.log("Message Payload=========================>" + JSON.stringify(messagePayload));
                botUtils.callWhatsAppApi(wabaUrl, api, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
                    console.log('SEND MESSAGE RESPONSE=========================================>' + JSON.stringify(response));
                    if (typeof response.messages != undefined) {
                        waMessageId = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
                        sendService.insertMessageInSentMaster(0, null, userId, messagePayload.to, messagePayload, waMessageId, msgType, campaignid, direction, wanumber, wabaId, bodyContent, (error, result) => {
                            if (error) {
                                sendMessageCallback(error);
                                //console.log(error);
                            } else {
                                //console.log(waMessageId);
                                sendMessageCallback(null, waMessageId);
                            }
                        });
                    } else {
                        //console.log(response);
                        sendMessageCallback(response);
                    }
                }).catch((err) => {
                    console.log('SEND MESSAGE ERROR=========================================>' + err);
                    sendMessageCallback(err);
                });
            }
        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
                errorLogger.info('SEND MESSAGE=========================================>' + JSON.stringify(obj) + ', TO : ' + to + ', TYPE : ' + type + ', MESSAGEID : ' + result);
            }
        });
    };

    let createPayload = async (userId, contactno, flowType, flowTmpPayload, next_message_id, current_message_id, sessionResult, placeholder, nextMessageResult, obj, isLiveChatActive, bodyText, mType, _logflag, next) => {

        let paymentNameResult = await sendService.getPaymentName(userId);
        let paymentName = null;
        if (paymentNameResult != undefined && paymentNameResult[0] != undefined) {
            console.log('paymentNameResult[0].payment_name=================> ' + contactno + '==============> ' + paymentNameResult[0].payment_name);
            paymentName = paymentNameResult[0].payment_name;
        }

        let orderId = generateUniqueId({
            length: 10,
            useLetters: false,
            excludeSymbols: ['@', '#', '|']
        });

        async.waterfall([
            (createPayloadCallback) => {
                if (_logflag == 0) {
                    logSentByUserMessage(userId, obj, isLiveChatActive, bodyText, (err, result) => {
                        console.log(isLiveChatActive);
                        if (err) {
                            console.log('logSentByUserMessage error (' + contactno + ')==================>' + err);
                        } else {
                            console.log('logSentByUserMessage result (' + contactno + ')================>' + result);
                        }
                        createPayloadCallback(err, result);
                    });
                } else {
                    createPayloadCallback(null, 'Simply go ahead');
                }

            },
            (r, createPayloadCallback) => {
                if (flowType == "Question") {
                    if (flowTmpPayload.media_type == "image") {
                        let imgPayload = {
                            "link": flowTmpPayload.media_url,
                            "caption": flowTmpPayload.text != undefined ? flowTmpPayload.text : ''
                        };

                        createPayloadCallback(null, flowTmpPayload, imgPayload, sessionResult, next_message_id, current_message_id, 1, flowType, placeholder, nextMessageResult);
                    } else if (flowTmpPayload.media_type == "video") {
                        let videoPayload = {
                            "link": flowTmpPayload.media_url,
                            "caption": flowTmpPayload.text != undefined ? flowTmpPayload.text : ''
                        };

                        createPayloadCallback(null, flowTmpPayload, videoPayload, sessionResult, next_message_id, current_message_id, 2, flowType, placeholder, nextMessageResult);
                    } else {
                        createPayloadCallback(null, flowTmpPayload, flowTmpPayload.text, sessionResult, next_message_id, current_message_id, 4, flowType, placeholder, nextMessageResult);
                    }
                } else if (flowType == "List") {
                    let sections = flowTmpPayload.section_count;
                    let botMessagePayload = {};

                    botMessagePayload.interactive = {
                        "action": {}
                    };

                    if (flowTmpPayload.header_text != null && flowTmpPayload.header_text.length > 0) {
                        botMessagePayload.interactive = {
                            "header": {
                                "type": "text",
                                "text": flowTmpPayload.header_text
                            }
                        };
                    }

                    if (flowTmpPayload.footer_text != null && flowTmpPayload.footer_text.length > 0) {
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
                        };
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

                    if (flowTmpPayload.body_text != null) {
                        botMessagePayload.interactive.body = {
                            "text": flowTmpPayload.body_text
                        };
                    }

                    //console.log('botMessagePayload==========>' + JSON.stringify(botMessagePayload));
                    createPayloadCallback(null, flowTmpPayload, botMessagePayload.interactive, sessionResult, next_message_id, current_message_id, 9, flowType, placeholder, nextMessageResult);
                } else if (flowType == "Button") {
                    //console.log('Button===================>' + JSON.stringify(flowTmpPayload));

                    let botMessagePayload = {
                        "interactive": {}
                    };

                    let _index1 = 1;
                    if (flowTmpPayload.buttons.length > 0) {
                        if (flowTmpPayload.header_type != null && flowTmpPayload.header_type == 'text') {
                            if (flowTmpPayload.header_text != null && flowTmpPayload.header_text.length > 0) {
                                botMessagePayload.interactive.header = {
                                    "type": "text",
                                    "text": flowTmpPayload.header_text
                                };
                            }
                        } else if (flowTmpPayload.header_type != null && flowTmpPayload.header_type == 'document') {
                            if (flowTmpPayload.header_media_url != null) {
                                botMessagePayload.interactive.header = {
                                    "type": "document",
                                    "document": {
                                        "link": flowTmpPayload.header_media_url,
                                        // "provider": {
                                        //     "name": "",
                                        // },
                                        "filename": flowTmpPayload.header_media_url.substring(flowTmpPayload.header_media_url.lastIndexOf('/') + 1)
                                    }
                                };
                            }
                        } else if (flowTmpPayload.header_type != null && flowTmpPayload.header_type == 'video') {
                            if (flowTmpPayload.header_media_url != null) {
                                botMessagePayload.interactive.header = {
                                    "type": "video",
                                    "video": {
                                        "link": flowTmpPayload.header_media_url,
                                        // "provider": {
                                        //     "name": "",
                                        // }
                                    }
                                };
                            }
                        } else if (flowTmpPayload.header_type != null && flowTmpPayload.header_type == 'image') {
                            if (flowTmpPayload.header_media_url != null) {
                                botMessagePayload.interactive.header = {
                                    "type": "image",
                                    "image": {
                                        "link": flowTmpPayload.header_media_url,
                                        // "provider": {
                                        //     "name": "",
                                        // }
                                    }
                                };
                            }
                        }

                        if (flowTmpPayload.body_text != null) {
                            //console.log('flowTmpPayload.body_text===================>' + JSON.stringify(flowTmpPayload.body_text));

                            botMessagePayload.interactive.body = {
                                "text": flowTmpPayload.body_text
                            };
                        }

                        console.log('footer text' + flowTmpPayload.footer_text);

                        if (flowTmpPayload.footer_text != null && flowTmpPayload.footer_text.length > 0) {

                            botMessagePayload.interactive.footer = {
                                "text": flowTmpPayload.footer_text
                            };
                        }

                        botMessagePayload.interactive.type = "button";
                        botMessagePayload.interactive.action = {
                            "buttons": []
                        };

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
                        //console.log('botMessagePayload==========>' + JSON.stringify(botMessagePayload));

                    }
                    createPayloadCallback(null, flowTmpPayload, botMessagePayload.interactive, sessionResult, next_message_id, current_message_id, 9, flowType, placeholder, nextMessageResult);
                } else if (flowType == "Condition") {
                    console.log('Condition==========>' + JSON.stringify(flowTmpPayload));
                    createPayloadCallback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, 700, flowType, placeholder, nextMessageResult);

                } else if (flowType == "MultiCondition") {
                    //console.log('MultiCondition==========>' + JSON.stringify(flowTmpPayload));
                    createPayloadCallback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, 800, flowType, placeholder, nextMessageResult);
                } else if (flowType == "Webhook") {
                    console.log('Webhook==========>' + JSON.stringify(flowTmpPayload));
                    createPayloadCallback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, 1000, flowType, placeholder, nextMessageResult);
                } else if (flowType == "LiveChat") {
                    //console.log('LiveChat==========>' + JSON.stringify(flowTmpPayload));
                    createPayloadCallback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, 2000, flowType, placeholder, nextMessageResult);
                } else if (flowType == "Message") {
                    if (mType == -1) {
                        let temp_p_1 = flowTmpPayload;
                        let tempMessagePayload = [];
                        Object.keys(flowTmpPayload).forEach(function (key, keyindex) {
                            let value = temp_p_1[key];
                            console.log('Key_1===========================>' + key);
                            console.log('Type_1===========================>' + value.type);
                            console.log('Key_Index_1===========================>' + keyindex);
                            if (value.type == "message") {
                                // flowTmpPayload = value.message_text;
                                // mType = 4;
                                tempMessagePayload.push({
                                    content: value.message_text,
                                    type: 4
                                });
                            }
                            if (value.type == "image") {
                                let imgPayload = {
                                    "link": value.media_url,
                                    "caption": value.message_text != undefined ? value.message_text : ''
                                };
                                // flowTmpPayload = imgPayload;
                                // mType = 1;
                                tempMessagePayload.push({
                                    content: imgPayload,
                                    type: 1
                                });
                            }
                            if (value.type == "document") {
                                let docPayload = {
                                    "link": value.media_url,
                                    "filename": value.media_url.toString().split('/').pop()
                                };
                                // flowTmpPayload = docPayload;
                                // mType = 0;
                                tempMessagePayload.push({
                                    content: docPayload,
                                    type: 0
                                });
                            }
                            if (value.type == "video") {
                                let videoPayload = {
                                    "link": value.media_url,
                                    // "filename": value.media_url.toString().split('/').pop()
                                };
                                // flowTmpPayload = videoPayload;
                                // mType = 2;
                                tempMessagePayload.push({
                                    content: videoPayload,
                                    type: 2
                                });
                            }
                        });
                        flowTmpPayload = tempMessagePayload;
                    }
                    console.log('flowTmpPayload===========================>' + JSON.stringify(flowTmpPayload) + ', ' + contactno);
                    createPayloadCallback(null, flowTmpPayload, flowTmpPayload, sessionResult, next_message_id, current_message_id, mType, flowType, placeholder, nextMessageResult);
                } else if (flowType == "CataloguePayment") {
                    let botMessagePayload = {};

                    let parameters = {
                        "reference_id": orderId,
                        "type": "digital-goods",
                        "currency": "INR",
                        "total_amount": {
                            "value": flowTmpPayload.total_amount * 100 * flowTmpPayload.product_quantity,
                            "offset": 100
                        },
                        "payment_type": "upi",
                        "payment_configuration": paymentName,
                        "order": {
                            "status": "pending",
                            "items": [
                                {
                                    "retailer_id": flowTmpPayload.product_retailer_id,
                                    "product_id": "product-id",
                                    "name": flowTmpPayload.product_name,
                                    "amount": {
                                        "value": flowTmpPayload.total_amount * 100,
                                        "offset": 100
                                    },
                                    "quantity": parseInt(flowTmpPayload.product_quantity)

                                }
                            ],
                            "subtotal": {
                                "value": flowTmpPayload.total_amount * 100 * flowTmpPayload.product_quantity,
                                "offset": 100
                            },
                            "tax": {
                                "value": 0,
                                "offset": 100
                            }

                        }
                    };

                    botMessagePayload.interactive = {
                        "type": "order_details",
                        "body": {
                            "text": flowTmpPayload.body_text
                        },
                        "header": {
                            "type": "image",
                            "image": {
                                "link": flowTmpPayload.header_media_url
                            }
                        },
                        "action": {
                            "name": "review_and_pay",
                            "parameters": JSON.stringify(parameters)
                        }
                    };


                    if (flowTmpPayload.footer_text !== null && flowTmpPayload.footer_text !== '') {
                        botMessagePayload.interactive.footer = {
                            "text": flowTmpPayload.footer_text
                        };
                    }

                    createPayloadCallback(null, flowTmpPayload, botMessagePayload.interactive, sessionResult, next_message_id, current_message_id, 9, flowType, placeholder, nextMessageResult);
                }
            },
            (flowTmpPayload, botMessagePayload, sessionResult, next_message_id, current_message_id, flowType, typeNode, placeholder, nextMessageResult, createPayloadCallback) => {
                let is_node_option = 0;
                if (typeNode == "Condition") {
                    is_node_option = 1;
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
                    };

                    createPayloadCallback(null, null, result, typeNode);

                } else if (typeNode == "Webhook" && flowTmpPayload.code != undefined) {
                    is_node_option = 1;

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
                    };
                    console.log('WEBHOOK_REQUEST_RESULT=============================>' + JSON.stringify(result));
                    createPayloadCallback(null, null, result, typeNode);
                } else if (typeNode == "MultiCondition") {
                    is_node_option = 1;

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
                    };
                    createPayloadCallback(null, null, result, typeNode);
                } else if (typeNode == "LiveChat") {
                    is_node_option = 0;

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
                    };
                    createPayloadCallback(null, null, result, typeNode);
                } else {
                    if (typeNode == "List") {
                        is_node_option = 1;
                    } else if (typeNode == "Button") {
                        is_node_option = 1;
                    } else if (typeNode == "Question" && flowTmpPayload.variants != undefined) {
                        is_node_option = 1;
                    } else if (typeNode == "Message") {
                        is_node_option = 0;
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
                    };

                    if (typeNode != "Message") {
                        sendMessage(userId, result.payload, contactno, flowType, async (err, sendMessageResult) => {
                            if (err) {
                                console.log('Send message error====================>' + err);
                                console.log(err);
                            } else {
                                console.log('Send message result=====================>' + JSON.stringify(sendMessageResult));

                                if (typeNode === 'CataloguePayment') {
                                    console.log("Product Retailer Id : " + flowTmpPayload.product_retailer_id);

                                    let getDataFromNonCatalogueMasterResult = await sendService.getDataFromNonCatalogueMaster(userId, flowTmpPayload.product_retailer_id);
                                    console.log({ getDataFromNonCatalogueMasterResult });

                                    let nonCatalogueId = getDataFromNonCatalogueMasterResult[0].noncatalogid;
                                    let productRetailerId = flowTmpPayload.product_retailer_id;
                                    let paymentReferenceId = 0;
                                    let transactionId = 0;
                                    let transactionType = 0;
                                    let totalAmount = flowTmpPayload.total_amount * 100 * flowTmpPayload.product_quantity;
                                    let currency = "INR";
                                    let orderStatus = "pending";
                                    let orderFlag = 0;
                                    let product_image = flowTmpPayload.header_media_url;

                                    let insertDataIntoPurchaseMasterResult = await sendService.insertDataIntoPurchaseMaster(userId, contactno, nonCatalogueId,
                                        productRetailerId, orderId, sendMessageResult, paymentReferenceId, transactionId, transactionType, totalAmount,
                                        currency, orderStatus, orderFlag, 0, product_image);
                                }
                            }
                            createPayloadCallback(err, sendMessageResult, result, typeNode);
                        });
                    } else {
                        let tempSendMessageResult = null;
                        async.each(botMessagePayload, (m, eachCallback) => {
                            sendMessage(userId, m.content, contactno, m.type, (err, sendMessageResult) => {
                                if (err) {
                                    console.log('Send message error====================>' + err);
                                    console.log(err);
                                    eachCallback(err);
                                } else {
                                    console.log('Send message result=====================>' + JSON.stringify(sendMessageResult));
                                    tempSendMessageResult = sendMessageResult;
                                    eachCallback();
                                }
                            });
                        }, (err) => {
                            if (err) {
                                createPayloadCallback(err, tempSendMessageResult, result, typeNode);
                            } else {
                                console.log({ tempSendMessageResult });
                                createPayloadCallback(null, tempSendMessageResult, result, typeNode);
                            }
                        });
                    }
                }

            },
            (sendMessageResult, result, typeNode, createPayloadCallback) => {
                sendService.updateNextMessageIdInSession(result.flow_id, result.next_message_id, result.current_message_id, result.is_node_option, result.type_node, result.placeholder, (err, result1) => {
                    //console.log(result.payload, result.contactno, result.type);
                    if (err) {
                        console.log('updateNextMessageIdInSession error====================>' + err);
                    } else {
                        console.log('updateNextMessageIdInSession result=====================>' + JSON.stringify(result1));
                    }
                    createPayloadCallback(err, sendMessageResult, result, typeNode);
                });
            },
            (sendMessageResult, result, typeNode, createPayloadCallback) => {
                saveChatAttributes(obj, result, null, (err, saveChatAttributesresult) => {
                    if (err) {
                        console.log('saveChatAttributes error====================>' + err);
                    } else {
                        console.log('saveChatAttributes result=====================>' + JSON.stringify(saveChatAttributesresult));
                    }
                    createPayloadCallback(err, sendMessageResult, saveChatAttributesresult, result, typeNode);
                });
            },
            (sendMessageResult, saveChatAttributesresult, _result, typeNode, createPayloadCallback) => {
                console.log('sendMessageResult (' + contactno + ')================>' + sendMessageResult + ', typeNode = ' + typeNode);
                if (sendMessageResult != null) {

                    sendService.updateMessageIdByAttrId(saveChatAttributesresult, sendMessageResult, (err, result) => {
                        if (err) {
                            console.log('updateMessageIdByAttrId error==================>' + err);
                        } else {
                            console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
                        }
                        // createPayloadCallback(err, obj, isLiveChatActive, bodyText);
                        createPayloadCallback(err, result);
                    });
                } else if (sendMessageResult == null && typeNode == "Webhook") {
                    webhook(userId, _result, saveChatAttributesresult, obj, (err, webhookResult) => {
                        if (err) {
                            console.log('webhook error==================>' + err);
                            sendMessage(userId, 'Something went wrong', contactno, 4, (err, sendMessageResult) => {
                                if (err) {
                                    console.log('Send message error====================>' + err);
                                    console.log(err);
                                } else {
                                    console.log('Send message result=====================>' + JSON.stringify(sendMessageResult));
                                }
                                createPayloadCallback(null, 'Simply Go Ahead');
                            });
                        } else {
                            console.log('webhook result================>' + JSON.stringify(webhookResult), webhookResult.type);
                            sendEmail(userId, contactno, webhookResult, obj);
                            if (webhookResult != undefined && webhookResult != null) {
                                createPayload(userId, contactno,
                                    webhookResult.type_node,
                                    webhookResult.webhookPayload,
                                    webhookResult.next_message_id,
                                    webhookResult.current_message_id,
                                    sessionResult,
                                    webhookResult.placeholder,
                                    webhookResult.nextMessageResult,
                                    webhookResult.obj,
                                    isLiveChatActive,
                                    bodyText,
                                    webhookResult.type, 1, (err, createPayloadResult) => {
                                        createPayloadCallback(err, createPayloadResult);
                                    });
                            } else {
                                createPayloadCallback(null, 'Simply Go Ahead');
                            }
                        }
                    });
                } else if (sendMessageResult == null && typeNode == "MultiCondition") {
                    let multiConditionIndex = 0;
                    let multiConditionLength = Object.values(_result.payload).length;
                    //console.log('MULTI_CONDITION_LENGTH : ' + multiConditionLength);
                    // let noMultiMatchFound = 0;
                    Object.keys(_result.payload).forEach(function (key) {
                        let value = _result.payload[key];
                        //console.log('Keys===========================>' + JSON.stringify(value));
                        //console.log('VALUE.IF_TEXT===========================>' + value.if_text);
                        //console.log('BODY_TEXT===========================>' + bodyText);

                        //console.log('MultiCondition block_2======================>' + JSON.stringify(result));

                        if (value.if_text.toLowerCase() == bodyText.toLowerCase()) {
                            multiCondition(_result, value, contactno, bodyText, obj, (err, multiConditionResult) => {
                                sendEmail(userId, contactno, multiConditionResult, obj);
                                createPayload(userId, contactno,
                                    multiConditionResult.type_node,
                                    multiConditionResult.conditionFlowTmpPayload,
                                    multiConditionResult.next_message_id,
                                    multiConditionResult.current_message_id,
                                    sessionResult,
                                    multiConditionResult.placeholder,
                                    multiConditionResult.nextMessageResult,
                                    multiConditionResult.obj,
                                    isLiveChatActive,
                                    bodyText,
                                    multiConditionResult.type, 0, (err, createPayloadResult) => {
                                        createPayloadCallback(err, createPayloadResult);
                                    });
                            });
                        } else {
                            //console.log('THERE IS NO MATCH FOUND');
                            multiConditionIndex++;
                        }
                    });
                    //console.log('MULTI_CONDITION_INDEX : ' + multiConditionIndex);
                    if (multiConditionIndex == multiConditionLength) {
                        multiCondition(_result, '', contactno, bodyText, obj, (err, multiConditionResult) => {
                            sendEmail(userId, contactno, multiConditionResult, obj);
                            createPayload(userId, contactno,
                                multiConditionResult.type_node,
                                multiConditionResult.conditionFlowTmpPayload,
                                multiConditionResult.next_message_id,
                                multiConditionResult.current_message_id,
                                sessionResult,
                                multiConditionResult.placeholder,
                                multiConditionResult.nextMessageResult,
                                multiConditionResult.obj,
                                isLiveChatActive,
                                bodyText,
                                multiConditionResult.type, 0, (err, createPayloadResult) => {
                                    createPayloadCallback(err, createPayloadResult);
                                });
                        });
                    }
                } else if (sendMessageResult == null && typeNode == "Condition") {
                    checkCondition(_result, bodyText, contactno, obj, (err, checkConditionResult) => {
                        if (err) {
                            console.log('checkCondition error==================>' + err);
                        } else {
                            console.log('checkCondition result================>' + JSON.stringify(checkConditionResult));
                        }
                        console.log('checkCondition result================>' + contactno, checkConditionResult.type_node, checkConditionResult.conditionFlowTmpPayload, checkConditionResult.next_message_id, checkConditionResult.current_message_id, sessionResult, checkConditionResult.placeholder, checkConditionResult.nextMessageResult, checkConditionResult.obj, isLiveChatActive, bodyText);
                        sendEmail(userId, contactno, checkConditionResult, obj);
                        createPayload(userId, contactno,
                            checkConditionResult.type_node,
                            checkConditionResult.conditionFlowTmpPayload,
                            checkConditionResult.next_message_id,
                            checkConditionResult.current_message_id,
                            sessionResult,
                            checkConditionResult.placeholder,
                            checkConditionResult.nextMessageResult,
                            checkConditionResult.obj,
                            isLiveChatActive,
                            bodyText,
                            checkConditionResult.type, 0, (err, createPayloadResult) => {
                                createPayloadCallback(err, createPayloadResult);
                            });
                    });
                } else {
                    createPayloadCallback(null, 'Simply Go Ahead');
                }
            },
            // (obj, isLiveChatActive, bodyText, createPayloadCallback) => {
            //     logSentByUserMessage(userId, obj, isLiveChatActive, bodyText, (err, result) => {
            //         if (err) {
            //             console.log('logSentByUserMessage error==================>' + err);
            //         } else {
            //             console.log('logSentByUserMessage result================>' + JSON.stringify(result));
            //         }
            //         createPayloadCallback(err, result)
            //     })
            // }
        ], (err, result) => {
            if (err) {
                console.log('createPayload error==================================> ' + err + ',' + contactno);
                console.log(err);
                next(err);
            } else {
                console.log('createPayload result==================================> ' + JSON.stringify(result) + ',' + contactno);
                next(null, result);
            }
        });

    };


    let saveChatAttributes = (obj, payload, _resultMessageId, next) => {
        //console.log('saveChatAttributes================>' + JSON.stringify(payload));
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

        if (payload.type == 1) {
            messageType = "text";
        }
        if (payload.type == 2) {
            messageType = "text";
        }
        if (payload.type == 4) {
            messageType = "text";
        }
        if (payload.type == 9) {
            messageType = "interactive";
        }


        async.waterfall([
            function (done) {
                sendService.setChatAttributes(flowid, current_message_id, attrkey, attrvalue, session_id, mobileno, messageContent, messageType, payload, (err, result) => {
                    if (err) {
                        console.log('setChatAttributes error=====================>' + err);
                        done(err);
                    } else {
                        console.log('setChatAttributes result=====================>' + result);
                        done(null, result);
                    }
                });
            }
        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
            }
        });
    };

    let callLiveChatWebHook = (obj, liveChatSettings, next) => {
        console.log('*****************************************************************i am in livechat block : ' + publicMediaUrl);

        let liveChatRequestPayload = {
            "recipient_no": obj.contacts[0].wa_id,
            "waba_no": wanumber,
            "waba_url": wabaUrl,
            "waba_access_token": wabaAuthToken,
            "callback_payload": obj,
            "media_url": publicMediaUrl
        };

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
                        console.log('liveChatRequestPayload===================================>' + error);
                        done(error);
                    });
            }
        ], (err, result) => {
            if (err) {
                console.log('callLiveChatWebHook err==================================>' + err);
                next(err);
            } else {
                console.log('callLiveChatWebHook result==================================>' + JSON.stringify(result));
                next(null, result);
            }
        });
    };

    function replacePlaceholder(userId, tmpObj, attrKeyArr, contactno, userProfileName, userMobileNumber, next) {
        //console.log('userProfileName(' + contactno + ')=============================>' + userProfileName);
        //console.log('userMobileNumber(' + contactno + ')=============================>' + userMobileNumber);
        async.each(attrKeyArr, (mid, callback) => {
            async.waterfall([
                (d1) => {
                    let tmpKey = mid.replace(/{{/g, '').replace(/}}/g, '');
                    //console.log('tmpKey(' + contactno + ')=============================>' + mid);
                    sendService.fetchPlaceholderValue(contactno, tmpKey, userId, (err, result) => {
                        if (result != undefined && result.length > 0 && result[0].attrvalue != null) {
                            let tmpValue = result[0].attrvalue.toString().replace(/"/g, '').replace(/\\n/g, '\n');
                            // let tmpValue = result[0].attrvalue;
                            //console.log('tmpValue(' + contactno + ')=============================>' + tmpValue);
                            tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', tmpValue);
                            //console.log('fetchPlaceholderValue(' + contactno + ')==========================>' + JSON.stringify(tmpObj));
                            d1(err, 1);
                        } else {
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
                } else {
                    callback();
                }
            });
        }, (err) => {
            if (err) {
                next(err);
            } else {
                next(null, tmpObj);
            }
        });
    }

    function replaceWebhookPlaceholder(userId, tmpObj, attrKeyArr, contactno, userProfileName, userMobileNumber, obj, next) {
        //console.log('userProfileName(' + contactno + ')=============================>' + userProfileName);
        //console.log('userMobileNumber(' + contactno + ')=============================>' + userMobileNumber);
        async.each(attrKeyArr, (mid, callback) => {
            async.waterfall([
                (d1) => {
                    let tmpKey = mid.replace(/{{/g, '').replace(/}}/g, '');
                    //console.log('tmpKey(' + contactno + ')=============================>' + mid);
                    sendService.fetchPlaceholderValue(contactno, tmpKey, userId, (err, result) => {
                        if (result != undefined && result.length > 0 && result[0].attrvalue != null) {
                            // let tmpValue = result[0].attrvalue;
                            let tmpValue = result[0].attrvalue.toString().replace(/"/g, '').replace(/\\n/g, '\n');
                            //console.log('tmpValue(' + contactno + ')=============================>' + tmpValue);
                            tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', tmpValue);
                            //console.log('fetchPlaceholderValue(' + contactno + ')==========================>' + JSON.stringify(tmpObj));
                            d1(err, 1);
                        } else {
                            if (tmpKey == 'name') {
                                tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', userProfileName);
                            } else if (tmpKey == 'wanumber') {
                                tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', userMobileNumber);
                            } else if (tmpKey == 'displayphonenumber') {
                                tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', obj.metadata.display_phone_number);
                            } else if (tmpKey == 'contextid') {
                                console.log('CONTEXT_ID : ' + JSON.stringify(obj));
                                tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', obj.messages[0].context != undefined ? obj.messages[0].context.id : null);
                            }
                            d1(null, 1);
                        }
                    });
                }
            ], (err, result) => {
                if (err) {
                    callback(err);
                } else {
                    callback();
                }
            });
        }, (err) => {
            if (err) {
                next(err);
            } else {
                next(null, tmpObj);
            }
        });
    }

    function replaceEmailPlaceholder(userId, tmpObj, attrKeyArr, contactno, userProfileName, userMobileNumber, obj, next) {
        console.log('replaceEmailPlaceholder : ' + JSON.stringify(obj));
        //console.log('userProfileName(' + contactno + ')=============================>' + userProfileName);
        //console.log('userMobileNumber(' + contactno + ')=============================>' + userMobileNumber);
        async.each(attrKeyArr, (mid, callback) => {
            async.waterfall([
                (d1) => {
                    let tmpKey = mid.replace(/{{/g, '').replace(/}}/g, '');
                    //console.log('tmpKey(' + contactno + ')=============================>' + mid);
                    sendService.fetchPlaceholderValue(contactno, tmpKey, userId, (err, result) => {
                        if (result != undefined && result.length > 0 && result[0].attrvalue != null) {
                            let tmpValue = result[0].attrvalue.toString().replace(/"/g, '').replace(/\\n/g, '\n');
                            //console.log('tmpValue(' + contactno + ')=============================>' + tmpValue);
                            tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', tmpValue);
                            //console.log('fetchPlaceholderValue(' + contactno + ')==========================>' + JSON.stringify(tmpObj));
                            d1(err, 1);
                        } else {
                            if (tmpKey == 'name') {
                                tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', userProfileName);
                            } else if (tmpKey == 'wanumber') {
                                tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', userMobileNumber);
                            } else if (tmpKey == 'displayphonenumber') {
                                tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', obj.metadata.display_phone_number);
                            } else if (tmpKey == 'contextid') {
                                tmpObj = tmpObj.replace('\{\{' + tmpKey + '\}\}', obj.messages[0].context != undefined ? obj.messages[0].context.id : null);
                            }
                            d1(null, 1);
                        }
                    });
                }
            ], (err, result) => {
                if (err) {
                    callback(err);
                } else {
                    callback();
                }
            });
        }, (err) => {
            if (err) {
                next(err);
            } else {
                next(null, tmpObj);
            }
        });
    }

    let executeWebhook = (userId, obj, webhookPayload, next) => {
        contactno = obj.contacts[0].wa_id;
        async.waterfall([
            function (webHookCb) {
                let tmpWebObj = webhookPayload.payload.webhook;
                let webHookAttrKeyArr = webhookPayload.payload.webhook.match(/{{(.+?)}}/g);
                if (webHookAttrKeyArr != null && webHookAttrKeyArr.length > 0) {
                    // replacePlaceholder(userId, tmpWebObj, webHookAttrKeyArr, contactno, userProfileName, userMobileNumber, (err, result) => {
                    //     console.log('executeWebhookUrl ' + contactno + '==========================>' + result);
                    //     webHookCb(err, result.toString('UTF-8'));
                    // });

                    replaceWebhookPlaceholder(userId, tmpWebObj, webHookAttrKeyArr, contactno, userProfileName, userMobileNumber, obj, (err, result) => {
                        console.log('executeWebhookUrl ' + contactno + '==========================>' + result);
                        webHookCb(err, result.toString('UTF-8'));
                    });
                } else {
                    webHookCb(null, tmpWebObj);
                }
            },
            function (webHookApi, webHookCb) {
                var data = JSON.stringify({});
                console.log({ webHookApi });

                var config = {
                    method: 'post',
                    url: encodeURI(webHookApi),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: data
                };

                if (webHookApi.includes('https://callback.pinbot.ai/v1/wamessage/sendOtp')) {
                    header = {
                        'Content-Type': 'application/json'
                    };

                    config.headers = header;
                }

                let protocol = httpUrl.parse(webHookApi).protocol;
                if (protocol != null && protocol == "https:") {
                    config.httpsAgent = new https.Agent({
                        keepAlive: false,
                        rejectUnauthorized: false
                    }); //secureProtocol: 'TLSv1_method'
                } else {
                    config.httpAgent = new http.Agent({
                        keepAlive: false,
                        rejectUnauthorized: false
                    }); //secureProtocol: 'TLSv1_method'
                }

                config.httpAgent = new http.Agent({
                    keepAlive: false,
                    rejectUnauthorized: false
                });

                axios(config)
                    .then(function (webhookresponse) {
                        console.log('EXECUTE_WEBHOOK_RESULT' + contactno + '==============================>' + JSON.stringify(webhookresponse.data));
                        webHookCb(null, webhookresponse.data);
                    })
                    .catch(function (error) {
                        console.log('EXECUTE_WEBHOOK_ERROR ' + contactno + '==============================>' + error);
                        webHookCb(error);
                    });
            }
        ], (err, result) => {
            if (err) {
                // next('WEBHOOK_ERROR_2 : ' + err);
                next(null, { code: 100, status: 'FAILED', data: 'No record found' });
            } else {
                next(null, result);
            }
        });
    };

    let checkCondition = (result, bodyText, contactno, obj, next) => {
        let isCondition = null;
        let current_message_id = result.current_message_id;
        let _condition = result.payload._condition;

        let if_is_placeholder = result.payload.if_is_placeholder;
        let ctext_is_placeholder = result.payload.ctext_is_placeholder;
        let if_text = result.payload.if_text != null ? result.payload.if_text.toLowerCase() : null;
        let compaire_text = result.payload.compaire_text != null ? result.payload.compaire_text.toLowerCase() : null;
        let condition = result.payload.condition;

        let if1_is_placeholder = result.payload.if1_is_placeholder;
        let ctext1_is_placeholder = result.payload.ctext1_is_placeholder;
        let if_text1 = result.payload.if_text1 != null ? result.payload.if_text1.toLowerCase() : null;
        let compaire_text1 = result.payload.compaire_text1 != null ? result.payload.compaire_text1.toLowerCase() : null;
        let condition1 = result.payload.condition1;

        async.waterfall([
            (conditionCallback) => {
                if (_condition == null || _condition == '') {
                    if (if_is_placeholder == 0 && ctext_is_placeholder == 0) {
                        if (condition == "Equal") {
                            // if (if_text == compaire_text) {
                            if (if_text == bodyText.toLowerCase()) {
                                isCondition = "Yes";
                            } else {
                                isCondition = "No";
                            }
                        } else if (condition == "NotEqual") {
                            if (if_text != bodyText.toLowerCase()) {
                                isCondition = "Yes";
                            } else {
                                isCondition = "No";
                            }
                        } else if (condition == "KeywordContains") {
                            if (if_text.includes(bodyText.toLowerCase())) {
                                isCondition = "Yes";
                            } else {
                                isCondition = "No";
                            }
                        } else if (condition == "DoesNotContain") {
                            if (!if_text.includes(bodyText.toLowerCase())) {
                                isCondition = "Yes";
                            } else {
                                isCondition = "No";
                            }
                        } else if (condition == "StartsWith") {
                            if (if_text.startsWith(bodyText.toLowerCase())) {
                                isCondition = "Yes";
                            } else {
                                isCondition = "No";
                            }
                        } else if (condition == "DoesNotStartWith") {
                            if (!if_text.startsWith(bodyText.toLowerCase())) {
                                isCondition = "Yes";
                            } else {
                                isCondition = "No";
                            }
                        } else if (condition == "GreaterThan") {
                            if (parseInt(if_text) > parseInt(bodyText.toLowerCase())) {
                                isCondition = "Yes";
                            } else {
                                isCondition = "No";
                            }
                        } else if (condition == "LessThan") {
                            if (parseInt(if_text) < parseInt(bodyText.toLowerCase())) {
                                isCondition = "Yes";
                            } else {
                                isCondition = "No";
                            }
                        }
                        conditionCallback(null, current_message_id, isCondition);
                    } else if (if_is_placeholder == 1 && ctext_is_placeholder == 0) {
                        sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result) => {
                            //console.log('CheckCondition 1 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                            if (condition == "Equal") {
                                // if (result[0].attrvalue = bodyText) {
                                //     isCondition = "Yes";
                                // }
                                if (result[0].attrvalue == compaire_text) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "NotEqual") {
                                if (result[0].attrvalue != compaire_text) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "KeywordContains") {
                                if (result[0].attrvalue.includes(compaire_text)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "DoesNotContain") {
                                if (!result[0].attrvalue.includes(compaire_text)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "StartsWith") {
                                if (result[0].attrvalue.startsWith(compaire_text)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "DoesNotStartWith") {
                                if (!result[0].attrvalue.startsWith(compaire_text)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "GreaterThan") {
                                if (parseInt(result[0].attrvalue) > parseInt(compaire_text)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "LessThan") {
                                if (parseInt(result[0].attrvalue) < parseInt(compaire_text)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            }

                            conditionCallback(null, current_message_id, isCondition);
                        });
                    } else if (if_is_placeholder == 1 && ctext_is_placeholder == 1) {
                        sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result_1) => {
                            sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result_2) => {
                                //console.log('CheckCondition 2 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                if (condition == "Equal") {
                                    // if (result[0].attrvalue = bodyText) {
                                    //     isCondition = "Yes";
                                    // }
                                    if (result_1[0].attrvalue == result_2[0].attrvalue) {
                                        isCondition = "Yes";
                                    } else {
                                        isCondition = "No";
                                    }
                                } else if (condition == "NotEqual") {
                                    if (result_1[0].attrvalue != result_2[0].attrvalue) {
                                        isCondition = "Yes";
                                    } else {
                                        isCondition = "No";
                                    }
                                } else if (condition == "KeywordContains") {
                                    if (result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                        isCondition = "Yes";
                                    } else {
                                        isCondition = "No";
                                    }
                                } else if (condition == "DoesNotContain") {
                                    if (!result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                        isCondition = "Yes";
                                    } else {
                                        isCondition = "No";
                                    }
                                } else if (condition == "StartsWith") {
                                    if (result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                        isCondition = "Yes";
                                    } else {
                                        isCondition = "No";
                                    }
                                } else if (condition == "DoesNotStartWith") {
                                    if (!result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                        isCondition = "Yes";
                                    } else {
                                        isCondition = "No";
                                    }
                                } else if (condition == "GreaterThan") {
                                    if (parseInt(result_1[0].attrvalue) > parseInt(result_2[0].attrvalue)) {
                                        isCondition = "Yes";
                                    } else {
                                        isCondition = "No";
                                    }
                                } else if (condition == "LessThan") {
                                    if (parseInt(result_1[0].attrvalue) < parseInt(result_2[0].attrvalue)) {
                                        isCondition = "Yes";
                                    } else {
                                        isCondition = "No";
                                    }
                                }

                                conditionCallback(null, current_message_id, isCondition);
                            });
                        });
                    } else if (if_is_placeholder == 0 && ctext_is_placeholder == 1) {
                        sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result) => {
                            //console.log('CheckCondition 3 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                            if (condition == "Equal") {
                                // if (result[0].attrvalue = bodyText) {
                                //     isCondition = "Yes";
                                // }
                                if (if_text == result[0].attrvalue) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "NotEqual") {
                                if (if_text != result[0].attrvalue) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "KeywordContains") {
                                if (if_text.includes(result[0].attrvalue)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "DoesNotContain") {
                                if (!if_text.includes(result[0].attrvalue)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "StartsWith") {
                                if (if_text.startsWith(result[0].attrvalue)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "DoesNotStartWith") {
                                if (!if_text.startsWith(result[0].attrvalue)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "GreaterThan") {
                                if (parseInt(if_text) > parseInt(result[0].attrvalue)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            } else if (condition == "LessThan") {
                                if (parseInt(if_text) < parseInt(result[0].attrvalue)) {
                                    isCondition = "Yes";
                                } else {
                                    isCondition = "No";
                                }
                            }

                            conditionCallback(null, current_message_id, isCondition);
                        });
                    }
                } else {
                    async.waterfall([
                        function (andOrCallback) {
                            let _isAndCondition_1 = null;

                            if (if_is_placeholder == 0 && ctext_is_placeholder == 0) {
                                if (condition == "Equal") {
                                    if (if_text == compaire_text) {
                                        _isAndCondition_1 = true;
                                    } else {
                                        _isAndCondition_1 = false;
                                    }
                                } else if (condition == "NotEqual") {
                                    if (if_text != compaire_text) {
                                        _isAndCondition_1 = true;
                                    } else {
                                        _isAndCondition_1 = false;
                                    }
                                } else if (condition == "KeywordContains") {
                                    if (if_text.includes(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    } else {
                                        _isAndCondition_1 = false;
                                    }
                                } else if (condition == "DoesNotContain") {
                                    if (!if_text.includes(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    } else {
                                        _isAndCondition_1 = false;
                                    }
                                } else if (condition == "StartsWith") {
                                    if (if_text.startsWith(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    } else {
                                        _isAndCondition_1 = false;
                                    }
                                } else if (condition == "DoesNotStartWith") {
                                    if (!if_text.startsWith(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    } else {
                                        _isAndCondition_1 = false;
                                    }
                                } else if (condition == "GreaterThan") {
                                    if (parseInt(if_text) > parseInt(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    } else {
                                        _isAndCondition_1 = false;
                                    }
                                } else if (condition == "LessThan") {
                                    if (parseInt(if_text) < parseInt(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    } else {
                                        _isAndCondition_1 = false;
                                    }
                                }

                                andOrCallback(null, _isAndCondition_1);
                            } else if (if_is_placeholder == 1 && ctext_is_placeholder == 0) {
                                sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result) => {
                                    //console.log('CheckCondition 4 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                    if (condition == "Equal") {
                                        if (result[0].attrvalue == compaire_text) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "NotEqual") {
                                        if (result[0].attrvalue != compaire_text) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "KeywordContains") {
                                        if (result[0].attrvalue.includes(compaire_text)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "DoesNotContain") {
                                        if (!result[0].attrvalue.includes(compaire_text)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "StartsWith") {
                                        if (result[0].attrvalue.startsWith(compaire_text)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "DoesNotStartWith") {
                                        if (!result[0].attrvalue.startsWith(compaire_text)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "GreaterThan") {
                                        if (parseInt(result[0].attrvalue) > parseInt(compaire_text)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "LessThan") {
                                        if (parseInt(result[0].attrvalue) < parseInt(compaire_text)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    }

                                    andOrCallback(null, _isAndCondition_1);
                                });
                            } else if (if_is_placeholder == 1 && ctext_is_placeholder == 1) {
                                sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result_1) => {
                                    sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result_2) => {
                                        //console.log('CheckCondition 5 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                        if (condition == "Equal") {
                                            if (result_1[0].attrvalue == result_2[0].attrvalue) {
                                                _isAndCondition_1 = true;
                                            } else {
                                                _isAndCondition_1 = false;
                                            }
                                        } else if (condition == "NotEqual") {
                                            if (result_1[0].attrvalue != result_2[0].attrvalue) {
                                                _isAndCondition_1 = true;
                                            } else {
                                                _isAndCondition_1 = false;
                                            }
                                        } else if (condition == "KeywordContains") {
                                            if (result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                                _isAndCondition_1 = true;
                                            } else {
                                                _isAndCondition_1 = false;
                                            }
                                        } else if (condition == "DoesNotContain") {
                                            if (!result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                                _isAndCondition_1 = true;
                                            } else {
                                                _isAndCondition_1 = false;
                                            }
                                        } else if (condition == "StartsWith") {
                                            if (result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                                _isAndCondition_1 = true;
                                            } else {
                                                _isAndCondition_1 = false;
                                            }
                                        } else if (condition == "DoesNotStartWith") {
                                            if (!result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                                _isAndCondition_1 = true;
                                            } else {
                                                _isAndCondition_1 = false;
                                            }
                                        } else if (condition == "GreaterThan") {
                                            if (parseInt(result_1[0].attrvalue) > parseInt(result_2[0].attrvalue)) {
                                                _isAndCondition_1 = true;
                                            } else {
                                                _isAndCondition_1 = false;
                                            }
                                        } else if (condition == "LessThan") {
                                            if (parseInt(result_1[0].attrvalue) < parseInt(result_2[0].attrvalue)) {
                                                _isAndCondition_1 = true;
                                            } else {
                                                _isAndCondition_1 = false;
                                            }
                                        }

                                        andOrCallback(null, _isAndCondition_1);
                                    });
                                });
                            } else if (if_is_placeholder == 0 && ctext_is_placeholder == 1) {
                                sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result) => {
                                    //console.log('CheckCondition 6 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                    if (condition == "Equal") {
                                        if (if_text == result[0].attrvalue) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "NotEqual") {
                                        if (if_text != result[0].attrvalue) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "KeywordContains") {
                                        if (if_text.includes(result[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "DoesNotContain") {
                                        if (!if_text.includes(result[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "StartsWith") {
                                        if (if_text.startsWith(result[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "DoesNotStartWith") {
                                        if (!if_text.startsWith(result[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "GreaterThan") {
                                        if (parseInt(if_text) > parseInt(result[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        } else {
                                            _isAndCondition_1 = false;
                                        }
                                    } else if (condition == "LessThan") {
                                        if (parseInt(if_text) < parseInt(result[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        } else {
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
                                    } else {
                                        _isAndCondition_2 = false;
                                    }
                                } else if (condition1 == "NotEqual") {
                                    if (if_text1 != compaire_text1) {
                                        _isAndCondition_2 = true;
                                    } else {
                                        _isAndCondition_2 = false;
                                    }
                                } else if (condition1 == "KeywordContains") {
                                    if (if_text1.includes(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    } else {
                                        _isAndCondition_2 = false;
                                    }
                                } else if (condition1 == "DoesNotContain") {
                                    if (!if_text1.includes(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    } else {
                                        _isAndCondition_2 = false;
                                    }
                                } else if (condition1 == "StartsWith") {
                                    if (if_text1.startsWith(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    } else {
                                        _isAndCondition_2 = false;
                                    }
                                } else if (condition1 == "DoesNotStartWith") {
                                    if (!if_text1.startsWith(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    } else {
                                        _isAndCondition_2 = false;
                                    }
                                } else if (condition1 == "GreaterThan") {
                                    if (parseInt(if_text1) > parseInt(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    } else {
                                        _isAndCondition_2 = false;
                                    }
                                } else if (condition1 == "LessThan") {
                                    if (parseInt(if_text1) < parseInt(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    } else {
                                        _isAndCondition_2 = false;
                                    }
                                }

                                andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                            } else if (if1_is_placeholder == 1 && ctext1_is_placeholder == 0) {
                                sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text1, (err, result) => {
                                    //console.log('CheckCondition 7 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text1);
                                    if (condition1 == "Equal") {
                                        if (result[0].attrvalue == compaire_text1) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "NotEqual") {
                                        if (result[0].attrvalue != compaire_text1) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "KeywordContains") {
                                        if (result[0].attrvalue.includes(compaire_text1)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "DoesNotContain") {
                                        if (!result[0].attrvalue.includes(compaire_text1)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "StartsWith") {
                                        if (result[0].attrvalue.startsWith(compaire_text1)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "DoesNotStartWith") {
                                        if (!result[0].attrvalue.startsWith(compaire_text1)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "GreaterThan") {
                                        if (parseInt(result[0].attrvalue) > parseInt(compaire_text1)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "LessThan") {
                                        if (parseInt(result[0].attrvalue) < parseInt(compaire_text1)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    }

                                    andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                                });
                            } else if (if1_is_placeholder == 1 && ctext1_is_placeholder == 1) {
                                sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text1, (err, result_1) => {
                                    sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text1, (err, result_2) => {
                                        //console.log('CheckCondition 8 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text1);
                                        if (condition1 == "Equal") {
                                            if (result_1[0].attrvalue == result_2[0].attrvalue) {
                                                _isAndCondition_2 = true;
                                            } else {
                                                _isAndCondition_2 = false;
                                            }
                                        } else if (condition1 == "NotEqual") {
                                            if (result_1[0].attrvalue != result_2[0].attrvalue) {
                                                _isAndCondition_2 = true;
                                            } else {
                                                _isAndCondition_2 = false;
                                            }
                                        } else if (condition1 == "KeywordContains") {
                                            if (result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                                _isAndCondition_2 = true;
                                            } else {
                                                _isAndCondition_2 = false;
                                            }
                                        } else if (condition1 == "DoesNotContain") {
                                            if (!result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                                _isAndCondition_2 = true;
                                            } else {
                                                _isAndCondition_2 = false;
                                            }
                                        } else if (condition1 == "StartsWith") {
                                            if (result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                                _isAndCondition_2 = true;
                                            } else {
                                                _isAndCondition_2 = false;
                                            }
                                        } else if (condition1 == "DoesNotStartWith") {
                                            if (!result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                                _isAndCondition_2 = true;
                                            } else {
                                                _isAndCondition_2 = false;
                                            }
                                        } else if (condition1 == "GreaterThan") {
                                            if (parseInt(result_1[0].attrvalue) > parseInt(result_2[0].attrvalue)) {
                                                _isAndCondition_2 = true;
                                            } else {
                                                _isAndCondition_2 = false;
                                            }
                                        } else if (condition1 == "LessThan") {
                                            if (parseInt(result_1[0].attrvalue) < parseInt(result_2[0].attrvalue)) {
                                                _isAndCondition_2 = true;
                                            } else {
                                                _isAndCondition_2 = false;
                                            }
                                        }

                                        andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                                    });
                                });
                            } else if (if1_is_placeholder == 0 && ctext1_is_placeholder == 1) {
                                sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text1, (err, result) => {
                                    //console.log('CheckCondition 9 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text1);
                                    if (condition1 == "Equal") {
                                        if (if_text1 == result[0].attrvalue) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "NotEqual") {
                                        if (if_text1 != result[0].attrvalue) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "KeywordContains") {
                                        if (if_text1.includes(result[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "DoesNotContain") {
                                        if (!if_text1.includes(result[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "StartsWith") {
                                        if (if_text1.startsWith(result[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "DoesNotStartWith") {
                                        if (!if_text1.startsWith(result[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "GreaterThan") {
                                        if (parseInt(if_text1) > parseInt(result[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        } else {
                                            _isAndCondition_2 = false;
                                        }
                                    } else if (condition1 == "LessThan") {
                                        if (parseInt(if_text1) < parseInt(result[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        } else {
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
                                } else {
                                    isCondition = "No";
                                }
                            } else if (_condition == "OR") {
                                if (_isAndCondition_1 || _isAndCondition_2) {
                                    isCondition = "Yes";
                                } else {
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
            (current_message_id, isCondition, conditionCallback) => {
                sendService.checkConditionInNodeOption(current_message_id, isCondition, contactno, (err, _result) => {
                    if (_result[0] != undefined) {
                        let conditionFlowTmpPayload = JSON.parse(_result[0].node_body);
                        let conditionFlowType = _result[0].typenode;
                        let tempPayload = null;
                        if (conditionFlowType == "Message") {
                            console.log("type_node: _result[0].typenode==============================>" + _result[0].typenode,);
                            tempPayload = {
                                flow_id: result.flow_id,
                                next_message_id: _result[0].next_message_id,
                                current_message_id: _result[0].id,
                                contactno: contactno,
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
                                is_variant: 0,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };

                            let tempConditionMessagePayload = [];
                            Object.keys(conditionFlowTmpPayload).forEach(function (key) {
                                let value = conditionFlowTmpPayload[key];
                                //console.log('Keys===========================>' + value.type);
                                if (value.type == "message") {
                                    // tempPayload.conditionFlowTmpPayload = value.message_text;
                                    tempPayload.type = 4;
                                    tempConditionMessagePayload.push({
                                        content: value.message_text,
                                        type: 4
                                    });
                                }
                                if (value.type == "image") {
                                    let imgPayload = {
                                        "link": value.media_url,
                                        "caption": value.message_text != undefined ? value.message_text : ''
                                    };
                                    // tempPayload.conditionFlowTmpPayload = imgPayload;
                                    tempPayload.type = 1;
                                    tempConditionMessagePayload.push({
                                        content: imgPayload,
                                        type: 1
                                    });
                                }
                                if (value.type == "document") {
                                    let docPayload = {
                                        "link": value.media_url,
                                        "filename": value.media_url.toString().split('/').pop()
                                    };
                                    // tempPayload.conditionFlowTmpPayload = docPayload;
                                    tempPayload.type = 0;
                                    tempConditionMessagePayload.push({
                                        content: docPayload,
                                        type: 0
                                    });
                                }
                                if (value.type == "video") {
                                    let videoPayload = {
                                        "link": value.media_url,
                                        // "filename": value.media_url.toString().split('/').pop()
                                    };
                                    // tempPayload.conditionFlowTmpPayload = videoPayload;
                                    tempPayload.type = 2;
                                    tempConditionMessagePayload.push({
                                        content: videoPayload,
                                        type: 2
                                    });
                                }
                            });
                            tempPayload.conditionFlowTmpPayload = tempConditionMessagePayload;

                        } else if (conditionFlowType == "Question") {
                            let isQuestionNodeOption = 0;
                            if (conditionFlowTmpPayload.variants != undefined) {
                                isQuestionNodeOption = 1;
                            }

                            let tempQuestionPayload = null;
                            let tempQuestionType = 0;

                            // //console.log('CONDITION ============================>'+result.flow_id, _result[0].next_message_id, _result[0].id, isQuestionNodeOption, _result[0].typenode, _result[0].placeholder);
                            if (conditionFlowTmpPayload.media_type == "image") {
                                let imgPayload = {
                                    "link": conditionFlowTmpPayload.media_url,
                                    "caption": conditionFlowTmpPayload.text != undefined ? conditionFlowTmpPayload.text : ''
                                };
                                tempQuestionPayload = imgPayload;
                                tempQuestionType = 1;
                            } else if (conditionFlowTmpPayload.media_type == "video") {
                                let videoPayload = {
                                    "link": conditionFlowTmpPayload.media_url,
                                    "caption": conditionFlowTmpPayload.text != undefined ? conditionFlowTmpPayload.text : ''
                                };
                                tempQuestionPayload = videoPayload;
                                tempQuestionType = 2;
                            } else {
                                tempQuestionPayload = conditionFlowTmpPayload.text;
                                tempQuestionType = 4;
                            }

                            tempPayload = {
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
                                is_variant: isQuestionNodeOption,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "Button") {
                            let isButtonNodeOption = 1;
                            //console.log('Button===================>' + JSON.stringify(conditionFlowTmpPayload));

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
                                    if (conditionFlowTmpPayload.header_text != null && conditionFlowTmpPayload.header_text.length > 0) {
                                        conditionButtonMessagePayload.interactive.header = {
                                            "type": "text",
                                            "text": conditionFlowTmpPayload.header_text
                                        };
                                    }
                                } else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'document') {
                                    if (conditionFlowTmpPayload.header_media_url != null) {
                                        conditionButtonMessagePayload.interactive.header = {
                                            "type": "document",
                                            "document": {
                                                "link": conditionFlowTmpPayload.header_media_url,
                                                // "provider": {
                                                //     "name": "",
                                                // },
                                                "filename": conditionFlowTmpPayload.header_media_url.substring(conditionFlowTmpPayload.header_media_url.lastIndexOf('/') + 1)
                                            }
                                        };
                                    }
                                } else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'video') {
                                    if (conditionFlowTmpPayload.header_media_url != null) {
                                        conditionButtonMessagePayload.interactive.header = {
                                            "type": "video",
                                            "video": {
                                                "link": conditionFlowTmpPayload.header_media_url,
                                                // "provider": {
                                                //     "name": "",
                                                // }
                                            }
                                        };
                                    }
                                } else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'image') {
                                    if (conditionFlowTmpPayload.header_media_url != null) {
                                        conditionButtonMessagePayload.interactive.header = {
                                            "type": "image",
                                            "image": {
                                                "link": conditionFlowTmpPayload.header_media_url,
                                                // "provider": {
                                                //     "name": "",
                                                // }
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
                                };
                                //console.log('botMessagePayload==========>' + JSON.stringify(conditionButtonMessagePayload));
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

                            tempPayload = {
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
                                is_variant: isButtonNodeOption,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "List") {
                            let isListNodeOption = 1;
                            let sections = conditionFlowTmpPayload.section_count;
                            let conditionListMessagePayload = {};

                            conditionListMessagePayload.interactive = {
                                "action": {}
                            };

                            if (conditionFlowTmpPayload.header_text != null && conditionFlowTmpPayload.header_text.length > 0) {
                                conditionListMessagePayload.interactive = {
                                    "header": {
                                        "type": "text",
                                        "text": conditionFlowTmpPayload.header_text
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
                                };
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

                            if (conditionFlowTmpPayload.body_text != null) {
                                conditionListMessagePayload.interactive.body = {
                                    "text": conditionFlowTmpPayload.body_text
                                };
                            }

                            //console.log('conditionListMessagePayload.interactive=====================>' + JSON.stringify(conditionListMessagePayload.interactive));

                            tempPayload = {
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
                                is_variant: isListNodeOption,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "Condition") {
                            tempPayload = {
                                flow_id: result.flow_id,
                                next_message_id: _result[0].next_message_id,
                                current_message_id: _result[0].id,
                                payload: JSON.parse(_result[0].node_body),
                                contactno: contactno,
                                type: 700,
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
                                is_variant: 0,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "Webhook") {
                            tempPayload = {
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
                                is_variant: 0,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "LiveChat") {
                            tempPayload = {
                                flow_id: result.flow_id,
                                next_message_id: _result[0].next_message_id,
                                current_message_id: _result[0].id,
                                payload: JSON.parse(_result[0].node_body),
                                contactno: contactno,
                                type: 2000,
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
                                is_variant: 0,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "MultiCondition") {
                            tempPayload = {
                                flow_id: result.flow_id,
                                next_message_id: _result[0].next_message_id,
                                current_message_id: _result[0].id,
                                payload: JSON.parse(_result[0].node_body),
                                contactno: contactno,
                                type: 800,
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
                                is_variant: 0,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        }

                        conditionCallback(err, tempPayload);
                    }
                });
            }

        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
            }
        });

    };

    // let callCustomCallback = (url, obj) => {
    //     console.log('Custom Callback Payload====================================>' + JSON.stringify(obj));
    //     let data = JSON.stringify(obj);

    //     let config = {
    //         method: 'post',
    //         url: url,
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         data: data
    //     };

    //     let startTime = new Date().getMilliseconds();

    //     axios(config)
    //         .then(function (response) {
    //             let endTime = new Date().getMilliseconds();
    //             let diffTime = Math.abs(endTime - startTime);
    //             let customCallbackPayload = {
    //                 'url': url,
    //                 'request_data': obj,
    //                 'response_data': response.data,
    //                 'responseTime': diffTime + ' ms'
    //             }
    //             errorLogger.info('Custom Callback Result ====================================>' + JSON.stringify(customCallbackPayload));
    //             console.log('Custom Callback Result ====================================>' + JSON.stringify(customCallbackPayload));
    //         })
    //         .catch(function (error) {
    //             let endTime = new Date().getMilliseconds();
    //             let diffTime = endTime - startTime;
    //             let customCallbackPayload = {
    //                 'url': url,
    //                 'error': error,
    //                 'responseTime': diffTime + ' ms'
    //             }

    //             errorLogger.error('Custom Callback Error ===================================>' + JSON.stringify(customCallbackPayload));
    //             console.log('Custom Callback Error ===================================>' + JSON.stringify(customCallbackPayload));
    //         });
    // }


    let callCustomCallback = (url, custom_parameters, obj) => {
        //console.log('Custom Callback Payload====================================>' + JSON.stringify(obj));
        let data = null;
        let callback_wanumber = obj.entry[0].changes[0].value.metadata != undefined ?
            obj.entry[0].changes[0].value.metadata.display_phone_number : wanumber;
        console.log('customecallbackwanumberflag===============================>' + JSON.stringify(callback_wanumber));


        async.waterfall([
            function (done) {
                sendService.customecallbackpayloadflag(callback_wanumber, (err, customecallbackpayloadflagResult) => {
                    if (err) {
                        console.log('customecallbackpayloadflag err=======================>' + err);
                        done(err);
                    } else {
                        console.log('customecallbackpayloadflag result=======================>' + JSON.stringify(customecallbackpayloadflagResult));
                        done(null, customecallbackpayloadflagResult[0].custom_callback_payload_flag);
                    }
                });
            },
            function (customecallbackpayloadflagResult, done) {
                console.log('MY RESULT==============================>' + (customecallbackpayloadflagResult));
                if (customecallbackpayloadflagResult == 1 && obj.object === 'whatsapp_business_account' && (obj.entry[0].changes[0].value.hasOwnProperty('contacts') &&
                    obj.entry[0].changes[0].value.hasOwnProperty('messages'))) {

                    // data = JSON.stringify(obj);
                    data = obj;
                    console.log("I am HERE 1");
                    done(null, data);

                } else if (customecallbackpayloadflagResult == 2 && obj.object === 'whatsapp_business_account' && obj.entry[0].changes[0].value.hasOwnProperty('statuses')) {
                    // data = JSON.stringify(obj);
                    data = obj;
                    console.log("I am HERE 2");
                    done(null, data);

                } else if (customecallbackpayloadflagResult == 0) {
                    // data = JSON.stringify(obj);
                    data = obj;
                    console.log("I am HERE 3");
                    done(null, data);
                } else {
                    data = obj;
                    console.log("I am HERE 4");
                    done(null, data);
                }

            },
            function (data, done) {
                let headers = {};
                if (custom_parameters != undefined && custom_parameters != null && custom_parameters.length > 0) {
                    console.log('custom callback 1');
                    let tmpParams = JSON.parse(custom_parameters);
                    Object.keys(tmpParams).forEach(function (key) {
                        let value = tmpParams[key];
                        headers[key] = value;
                    });
                    headers['Content-Type'] = 'application/json';
                } else {
                    console.log('custom callback 2');
                    headers['Content-Type'] = 'application/json';
                }
                console.log('HEADER : ' + JSON.stringify(headers));
                done(null, data, headers);
            },
            function (data, headers, done) {
                let config = {
                    method: 'post',
                    url: url,
                    headers: headers,
                    data: data
                };
                let startTime = new Date().getMilliseconds();

                var protocol = httpUrl.parse(url).protocol;
                if (protocol != null && protocol == "https:") {
                    config.httpsAgent = new https.Agent({
                        keepAlive: false,
                        rejectUnauthorized: false
                    }); //secureProtocol: 'TLSv1_method'
                } else {
                    config.httpAgent = new http.Agent({
                        keepAlive: false,
                        rejectUnauthorized: false
                    }); //secureProtocol: 'TLSv1_method'
                }

                axios(config)
                    .then(function (response) {
                        let endTime = new Date().getMilliseconds();
                        let diffTime = Math.abs(endTime - startTime);
                        let customCallbackPayload = {
                            'url': url,
                            'request_data': obj,
                            'headers': headers,
                            'response_data': response.data,
                            'responseTime': diffTime + ' ms'
                        };
                        errorLogger.info('Custom Callback Result ====================================>' + JSON.stringify(customCallbackPayload));
                        console.log('Custom Callback Result ====================================>' + JSON.stringify(customCallbackPayload));
                    })
                    .catch(function (error) {
                        let endTime = new Date().getMilliseconds();
                        let diffTime = endTime - startTime;
                        let customCallbackPayload = {
                            'url': url,
                            'headers': headers,
                            'responseTime': diffTime + ' ms'
                        };

                        errorLogger.error('Custom Callback Error ===================================>' + JSON.stringify(customCallbackPayload) + ", Error : " + error);
                        console.log('Custom Callback Error ===================================>' + JSON.stringify(customCallbackPayload));
                    });
            }
        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
            }
        });
    };


    let sendEmail = (userId, wa_id, result, obj) => {
        async.waterfall([
            function (sendEmailCallback) {
                console.log('SEND_EMAIL=====================>' + JSON.stringify(result));
                // sendService.fetchEmailData(result.current_message_id, (err, fetchEmailDataResult) => {
                //     console.log('fetchEmailData=======================>' + JSON.stringify(fetchEmailDataResult) + ", wa_id : " + wa_id + ", result.current_message_id : " + result.current_message_id);
                //     sendEmailCallback(err, fetchEmailDataResult);
                // });
                sendService.fetchEmailData(userId, wa_id, (err, fetchEmailDataResult) => {
                    console.log('fetchEmailData=======================>' + JSON.stringify(fetchEmailDataResult) + ", wa_id : " + wa_id + ", result.current_message_id : " + result.current_message_id);
                    if (err) {
                        sendEmailCallback('No Email Data Found');
                    } else {
                        sendEmailCallback(null, fetchEmailDataResult);
                    }
                });
            },
            function (fetchEmailDataResult, sendEmailCallback) {
                if (fetchEmailDataResult.length > 0) {
                    if (fetchEmailDataResult[0].is_email_set == 0) {
                        sendEmailCallback('No Email Data Found');
                    } else {
                        sendEmailCallback(null, fetchEmailDataResult);
                    }
                }
            },
            function (fetchEmailDataResult, sendEmailCallback) {
                let tmpEmailObj = fetchEmailDataResult[0].email_content;
                let attrKeyArr = tmpEmailObj.match(/{{(.+?)}}/g);
                if (attrKeyArr != null && attrKeyArr.length > 0) {

                    replaceEmailPlaceholder(userId, tmpEmailObj, attrKeyArr, wa_id, userProfileName, userMobileNumber, obj, (err, result) => {
                        sendEmailCallback(null, result, fetchEmailDataResult);
                    });

                    // for (let y = 0; y < attrKeyArr.length; y++) {
                    //     let tmpAttrKey = attrKeyArr[y].replace(/{{/g, '').replace(/}}/g, '');
                    //     //console.log('tmpAttrKey=============================>' + attrKeyArr[y]);
                    //     sendService.fetchPlaceholderValue(obj.contacts[0].wa_id, tmpAttrKey, (err, fetchPlaceholderValueResult) => {
                    //         //console.log('fetchPlaceholderValue==========================>' + JSON.stringify(fetchPlaceholderValueResult));
                    //         if (fetchPlaceholderValueResult.length > 0) {
                    //             let tmpAttrValue = fetchPlaceholderValueResult[0].attrvalue;
                    //             //console.log('tmpAttrValue=============================>' + tmpAttrValue);
                    //             tmpEmailObj = tmpEmailObj.replace('\{\{' + tmpAttrKey + '\}\}', tmpAttrValue);
                    //             //console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpEmailObj));
                    //         }
                    //         else {
                    //             if (tmpAttrKey == 'name') {
                    //                 tmpEmailObj = tmpEmailObj.replace('\{\{' + tmpAttrKey + '\}\}', userProfileName);
                    //                 //console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpEmailObj));
                    //             }
                    //             else if (tmpAttrKey == 'wanumber') {
                    //                 tmpEmailObj = tmpEmailObj.replace('\{\{' + tmpAttrKey + '\}\}', userMobileNumber);
                    //                 //console.log('fetchPlaceholderValue==========================>' + JSON.stringify(tmpEmailObj));
                    //             }
                    //         }


                    //         if (y == (attrKeyArr.length - 1)) {
                    //             sendEmailCallback(null, tmpEmailObj, fetchEmailDataResult);
                    //         }
                    //     });
                    // }
                } else {
                    sendEmailCallback(null, tmpEmailObj, fetchEmailDataResult);
                }
            },
            function (tmpEmailObj, fetchEmailDataResult, sendEmailCallback) {
                let tmpEmailSubject = fetchEmailDataResult[0].email_subject != null ? fetchEmailDataResult[0].email_subject : 'Pinbot - Email Alert';
                let emailSubjectArr = tmpEmailSubject.match(/{{(.+?)}}/g);
                console.log({ emailSubjectArr });
                if (emailSubjectArr != null && emailSubjectArr.length > 0) {
                    replaceEmailPlaceholder(userId, tmpEmailSubject, emailSubjectArr, wa_id, userProfileName, userMobileNumber, obj, (err, subjectResult) => {
                        let mailOptions = {
                            from: '"Pinbot" support@pinbot.ai',
                            to: fetchEmailDataResult[0].email_ids,
                            subject: subjectResult,
                            html: tmpEmailObj.replace(/\n/g, '<br/>')
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                sendEmailCallback(error);
                            } else {
                                sendEmailCallback(null, 'Email Sent Successfully');
                            }
                        });
                    });
                } else {
                    let mailOptions = {
                        from: '"Pinbot" support@pinbot.ai',
                        to: fetchEmailDataResult[0].email_ids,
                        subject: tmpEmailSubject,
                        html: tmpEmailObj.replace(/\n/g, '<br/>')
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            sendEmailCallback(error);
                        } else {
                            sendEmailCallback(null, 'Email Sent Successfully');
                        }
                    });
                }
            }
        ], (err, result) => {
            if (err) {
                console.log('sendEmail error================================>' + err);
            } else {
                console.log('sendEmail result================================>' + JSON.stringify(result));
            }
        });
    };


    let multiCondition = (result, value, contactno, bodyText, obj, next) => {
        let isCondition = null;
        let current_message_id = result.current_message_id;
        let _condition = result.payload._condition;

        let if_text = value.if_text != null ? value.if_text.toLowerCase() : null;
        let compaire_text = value.compaire_text != null ? value.compaire_text.toLowerCase() : null;
        let condition = value.condition;

        async.waterfall([
            function (conditionCallback) {
                if (if_text == bodyText.toLowerCase()) {
                    isCondition = value.if_text;
                } else {
                    isCondition = 'No';
                }
                conditionCallback(null, current_message_id, isCondition);
            },
            function (current_message_id, isCondition, conditionCallback) {
                sendService.checkConditionInNodeOption(current_message_id, isCondition, contactno, (err, _result) => {
                    console.log('In checkMultiConditionInNodeOption ==================>current_message_id : ' + current_message_id + ', isCondition : ' + isCondition + ', _result : ' + JSON.stringify(_result));
                    if (_result[0] != undefined) {
                        let conditionFlowTmpPayload = JSON.parse(_result[0].node_body);
                        let conditionFlowType = _result[0].typenode;
                        let tempPayload = null;
                        if (conditionFlowType == "Message") {
                            console.log("type_node: _result[0].typenode==============================>" + _result[0].typenode,);
                            tempPayload = {
                                flow_id: result.flow_id,
                                next_message_id: _result[0].next_message_id,
                                current_message_id: _result[0].id,
                                contactno: contactno,
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
                                is_variant: 0,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };

                            let tempMultiConditionMessagePayload = [];
                            Object.keys(conditionFlowTmpPayload).forEach(function (key) {
                                let value = conditionFlowTmpPayload[key];
                                //console.log('Keys===========================>' + value.type);
                                if (value.type == "message") {
                                    // tempPayload.conditionFlowTmpPayload = value.message_text;
                                    tempPayload.type = 4;
                                    tempMultiConditionMessagePayload.push({
                                        content: value.message_text,
                                        type: 4
                                    });
                                }
                                if (value.type == "image") {
                                    let imgPayload = {
                                        "link": value.media_url,
                                        "caption": value.message_text != undefined ? value.message_text : ''
                                    };
                                    // tempPayload.conditionFlowTmpPayload = imgPayload;
                                    tempPayload.type = 1;
                                    tempMultiConditionMessagePayload.push({
                                        content: imgPayload,
                                        type: 1
                                    });
                                }
                                if (value.type == "document") {
                                    let docPayload = {
                                        "link": value.media_url,
                                        "filename": value.media_url.toString().split('/').pop()
                                    };
                                    // tempPayload.conditionFlowTmpPayload = docPayload;
                                    tempPayload.type = 0;
                                    tempMultiConditionMessagePayload.push({
                                        content: docPayload,
                                        type: 0
                                    });
                                }
                                if (value.type == "video") {
                                    let videoPayload = {
                                        "link": value.media_url,
                                        // "filename": value.media_url.toString().split('/').pop()
                                    };
                                    // tempPayload.conditionFlowTmpPayload = videoPayload;
                                    tempPayload.type = 2;
                                    tempMultiConditionMessagePayload.push({
                                        content: videoPayload,
                                        type: 2
                                    });
                                }
                            });
                            tempPayload.conditionFlowTmpPayload = tempMultiConditionMessagePayload;

                        } else if (conditionFlowType == "Question") {
                            let isQuestionNodeOption = 0;
                            if (conditionFlowTmpPayload.variants != undefined) {
                                isQuestionNodeOption = 1;
                            }

                            let tempQuestionPayload = null;
                            let tempQuestionType = 0;

                            // //console.log('CONDITION ============================>'+result.flow_id, _result[0].next_message_id, _result[0].id, isQuestionNodeOption, _result[0].typenode, _result[0].placeholder);
                            if (conditionFlowTmpPayload.media_type == "image") {
                                let imgPayload = {
                                    "link": conditionFlowTmpPayload.media_url,
                                    "caption": conditionFlowTmpPayload.text != undefined ? conditionFlowTmpPayload.text : ''
                                };
                                tempQuestionPayload = imgPayload;
                                tempQuestionType = 1;
                            } else if (conditionFlowTmpPayload.media_type == "video") {
                                let videoPayload = {
                                    "link": conditionFlowTmpPayload.media_url,
                                    "caption": conditionFlowTmpPayload.text != undefined ? conditionFlowTmpPayload.text : ''
                                };
                                tempQuestionPayload = videoPayload;
                                tempQuestionType = 2;
                            } else {
                                tempQuestionPayload = conditionFlowTmpPayload.text;
                                tempQuestionType = 4;
                            }

                            tempPayload = {
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
                                is_variant: isQuestionNodeOption,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "Button") {
                            let isButtonNodeOption = 1;
                            //console.log('Button===================>' + JSON.stringify(conditionFlowTmpPayload));

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
                                    if (conditionFlowTmpPayload.header_text != null && conditionFlowTmpPayload.header_text.length > 0) {
                                        conditionButtonMessagePayload.interactive.header = {
                                            "type": "text",
                                            "text": conditionFlowTmpPayload.header_text
                                        };
                                    }
                                } else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'document') {
                                    if (conditionFlowTmpPayload.header_media_url != null) {
                                        conditionButtonMessagePayload.interactive.header = {
                                            "type": "document",
                                            "document": {
                                                "link": conditionFlowTmpPayload.header_media_url,
                                                // "provider": {
                                                //     "name": "",
                                                // },
                                                "filename": conditionFlowTmpPayload.header_media_url.substring(conditionFlowTmpPayload.header_media_url.lastIndexOf('/') + 1)
                                            }
                                        };
                                    }
                                } else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'video') {
                                    if (conditionFlowTmpPayload.header_media_url != null) {
                                        conditionButtonMessagePayload.interactive.header = {
                                            "type": "video",
                                            "video": {
                                                "link": conditionFlowTmpPayload.header_media_url,
                                                // "provider": {
                                                //     "name": "",
                                                // }
                                            }
                                        };
                                    }
                                } else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'image') {
                                    if (conditionFlowTmpPayload.header_media_url != null) {
                                        conditionButtonMessagePayload.interactive.header = {
                                            "type": "image",
                                            "image": {
                                                "link": conditionFlowTmpPayload.header_media_url,
                                                // "provider": {
                                                //     "name": "",
                                                // }
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
                                };
                                //console.log('botMessagePayload==========>' + JSON.stringify(conditionButtonMessagePayload));
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

                            tempPayload = {
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
                                is_variant: isButtonNodeOption,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "List") {
                            let isListNodeOption = 1;
                            let sections = conditionFlowTmpPayload.section_count;
                            let conditionListMessagePayload = {};

                            conditionListMessagePayload.interactive = {
                                "action": {}
                            };

                            if (conditionFlowTmpPayload.header_text != null && conditionFlowTmpPayload.header_text.length > 0) {
                                conditionListMessagePayload.interactive = {
                                    "header": {
                                        "type": "text",
                                        "text": conditionFlowTmpPayload.header_text
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
                                };
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

                            if (conditionFlowTmpPayload.body_text != null) {
                                conditionListMessagePayload.interactive.body = {
                                    "text": conditionFlowTmpPayload.body_text
                                };
                            }

                            //console.log('conditionListMessagePayload.interactive=====================>' + JSON.stringify(conditionListMessagePayload.interactive));

                            tempPayload = {
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
                                is_variant: isListNodeOption,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "Condition") {
                            tempPayload = {
                                flow_id: result.flow_id,
                                next_message_id: _result[0].next_message_id,
                                current_message_id: _result[0].id,
                                payload: JSON.parse(_result[0].node_body),
                                contactno: contactno,
                                type: 700,
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
                                is_variant: 0,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "Webhook") {
                            tempPayload = {
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
                                is_variant: 0,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "LiveChat") {
                            tempPayload = {
                                flow_id: result.flow_id,
                                next_message_id: _result[0].next_message_id,
                                current_message_id: _result[0].id,
                                payload: JSON.parse(_result[0].node_body),
                                contactno: contactno,
                                type: 2000,
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
                                is_variant: 0,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        } else if (conditionFlowType == "MultiCondition") {
                            tempPayload = {
                                flow_id: result.flow_id,
                                next_message_id: _result[0].next_message_id,
                                current_message_id: _result[0].id,
                                payload: JSON.parse(_result[0].node_body),
                                contactno: contactno,
                                type: 800,
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
                                is_variant: 0,
                                obj: obj,
                                conditionFlowTmpPayload: conditionFlowTmpPayload
                            };
                        }

                        conditionCallback(err, tempPayload);
                    }
                });
            }
        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
            }
        });
    };

    let webhook = (userId, result, chatAttrInsertId, obj, next) => {
        async.waterfall([
            function (webhookCallback) {
                executeWebhook(userId, obj, result, (err, executeWebhookResult) => {
                    console.log('executeWebhook ' + obj.contacts[0].wa_id + '=====================>' + JSON.stringify(executeWebhookResult));
                    webhookCallback(err, result, chatAttrInsertId, executeWebhookResult);
                });
            },
            function (result, chatAttrInsertId, executeWebhookResult, webhookCallback) {
                sendService.updateWebhookAttrValueById(chatAttrInsertId, JSON.stringify(executeWebhookResult.data), (err, updateAttrValueResult) => {
                    if (err) {
                        console.log('updateWebhookAttrValueById err ' + obj.contacts[0].wa_id + '=========================>' + err);
                    } else {
                        console.log('updateWebhookAttrValueById result ' + obj.contacts[0].wa_id + '=========================>' + JSON.stringify(updateAttrValueResult));
                    }
                    webhookCallback(err, result, chatAttrInsertId, executeWebhookResult);
                });
            },
            function (result, chatAttrInsertId, executeWebhookResult, webhookCallback) {
                console.log('result ' + obj.contacts[0].wa_id + '=====================>' + JSON.stringify(result));
                let tmpWebhookResCodeArr = result.payload.code;
                let tmpWebhookResCode = executeWebhookResult.code.toString();
                if (tmpWebhookResCodeArr.length > 0) {
                    console.log('tmpWebhookResCodeArr ' + obj.contacts[0].wa_id + '=====================>' + JSON.stringify(tmpWebhookResCodeArr));
                    console.log('executeWebhookResult.code ' + obj.contacts[0].wa_id + '=====================>' + JSON.stringify(executeWebhookResult.code));
                    console.log('tmpWebhookResCodeArr.includes(executeWebhookResult.code) ' + obj.contacts[0].wa_id + '=================>' + tmpWebhookResCodeArr.includes(tmpWebhookResCode));
                    if (tmpWebhookResCodeArr.includes(tmpWebhookResCode)) {
                        sendService.fetchNextNodeOptionWebhook(tmpWebhookResCode, obj.contacts[0].wa_id, userId, (err, fetchNextNodeOptionWebhookResult) => {
                            if (err) {
                                console.log('fetchNextNodeOptionWebhook 2 error ' + obj.contacts[0].wa_id + '==================>' + err);
                            } else {
                                console.log('fetchNextNodeOptionWebhook 2 result ' + obj.contacts[0].wa_id + '==================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));
                            }
                            webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult[0]);
                        });
                    }
                }
            },
            function (result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult, webhookCallback) {
                if (fetchNextNodeOptionWebhookResult != undefined) {
                    let tmpNodeBody = JSON.parse(fetchNextNodeOptionWebhookResult.node_body);
                    let tempPayload = null;
                    if (fetchNextNodeOptionWebhookResult.typenode == "Message") {

                        tempPayload = {
                            flow_id: fetchNextNodeOptionWebhookResult.id,
                            next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                            current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
                            contactno: obj.contacts[0].wa_id,
                            type_node: fetchNextNodeOptionWebhookResult.typenode,
                            is_node_option: 0,
                            placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                            nextMessageResult: fetchNextNodeOptionWebhookResult,
                            is_variant: 0,
                            obj: obj,
                            webhookPayload: tmpNodeBody
                        };

                        let webhookFlowTmpPayload = JSON.parse(fetchNextNodeOptionWebhookResult.node_body);
                        let tempWebhookMessagePayload = [];
                        if (executeWebhookResult.type == "text") {
                            // tempPayload.webhookPayload = executeWebhookResult.data;
                            tempPayload.type = 4;
                            tempWebhookMessagePayload.push({
                                content: executeWebhookResult.data,
                                type: 4
                            });
                        } else if (executeWebhookResult.type == "image") {
                            let imgPayload = {
                                "link": executeWebhookResult.url,
                                "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                            };
                            // tempPayload.webhookPayload = imgPayload;
                            tempPayload.type = 1;
                            tempWebhookMessagePayload.push({
                                content: imgPayload,
                                type: 1
                            });
                        } else if (executeWebhookResult.type == "video") {
                            let videoPayload = {
                                "link": executeWebhookResult.url,
                                "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                            };
                            // tempPayload.webhookPayload = videoPayload;
                            tempPayload.type = 2;
                            tempWebhookMessagePayload.push({
                                content: videoPayload,
                                type: 2
                            });
                        } else if (executeWebhookResult.type == "document") {
                            let docPayload = {
                                "link": executeWebhookResult.url,
                                "filename": executeWebhookResult.url.toString().split('/').pop(),
                                "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                            };
                            // tempPayload.webhookPayload = docPayload;
                            tempPayload.type = 0;
                            tempWebhookMessagePayload.push({
                                content: docPayload,
                                type: 0
                            });
                        } else if (executeWebhookResult.type == "multi") {
                            Object.keys(webhookFlowTmpPayload).forEach(function (key) {
                                let value = webhookFlowTmpPayload[key];
                                //console.log('Keys===========================>' + value.type);
                                if (value.type == "message") {
                                    // tempPayload.conditionFlowTmpPayload = value.message_text;
                                    tempPayload.type = 4;
                                    tempWebhookMessagePayload.push({
                                        content: value.message_text,
                                        type: 4
                                    });
                                }
                                if (value.type == "image") {
                                    let imgPayload = {
                                        "link": value.media_url,
                                        "caption": value.message_text != undefined ? value.message_text : ''
                                    };
                                    // tempPayload.conditionFlowTmpPayload = imgPayload;
                                    tempPayload.type = 1;
                                    tempWebhookMessagePayload.push({
                                        content: imgPayload,
                                        type: 1
                                    });
                                }
                                if (value.type == "document") {
                                    let docPayload = {
                                        "link": value.media_url,
                                        "filename": value.media_url.toString().split('/').pop()
                                    };
                                    // tempPayload.conditionFlowTmpPayload = docPayload;
                                    tempPayload.type = 0;
                                    tempWebhookMessagePayload.push({
                                        content: docPayload,
                                        type: 0
                                    });
                                }
                                if (value.type == "video") {
                                    let videoPayload = {
                                        "link": value.media_url,
                                        // "filename": value.media_url.toString().split('/').pop()
                                    };
                                    // tempPayload.conditionFlowTmpPayload = videoPayload;
                                    tempPayload.type = 2;
                                    tempWebhookMessagePayload.push({
                                        content: videoPayload,
                                        type: 2
                                    });
                                }
                            });
                        }
                        tempPayload.webhookPayload = tempWebhookMessagePayload;
                    } else if (fetchNextNodeOptionWebhookResult.typenode == "Question") {
                        let tempQuestionPayload = null;
                        let tempQuestionType = 0;
                        let isQuestionNodeOption = tmpNodeBody.variants != undefined ? 1 : 0;

                        // //console.log('CONDITION ============================>'+result.flow_id, _result[0].next_message_id, _result[0].id, isQuestionNodeOption, _result[0].typenode, _result[0].placeholder);
                        if (tmpNodeBody.media_type == "image") {
                            let imgPayload = {
                                "link": tmpNodeBody.media_url,
                                "caption": tmpNodeBody.text != undefined ? tmpNodeBody.text : ''
                            };
                            tempQuestionPayload = imgPayload;
                            tempQuestionType = 1;
                        } else if (tmpNodeBody.media_type == "video") {
                            let videoPayload = {
                                "link": tmpNodeBody.media_url,
                                "caption": tmpNodeBody.text != undefined ? tmpNodeBody.text : ''
                            };
                            tempQuestionPayload = videoPayload;
                            tempQuestionType = 2;
                        } else {
                            tempQuestionPayload = tmpNodeBody.text;
                            tempQuestionType = 4;
                        }

                        tempPayload = {
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
                            is_variant: isQuestionNodeOption,
                            obj: obj,
                            webhookPayload: tmpNodeBody
                        };
                    } else if (fetchNextNodeOptionWebhookResult.typenode == "List") {
                        let isListNodeOption = 1;
                        //console.log('List===================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));

                        let sections = tmpNodeBody.section_count;
                        let webhookListMessagePayload = {};

                        webhookListMessagePayload.interactive = {
                            "action": {}
                        };

                        if (tmpNodeBody.header_text != null && tmpNodeBody.header_text.length > 0) {
                            webhookListMessagePayload.interactive = {
                                "header": {
                                    "type": "text",
                                    "text": tmpNodeBody.header_text
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
                            };
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

                        if (tmpNodeBody.body_text != null) {
                            webhookListMessagePayload.interactive = {
                                "body": {
                                    "text": tmpNodeBody.body_text
                                }
                            };
                        }

                        tempPayload = {
                            flow_id: fetchNextNodeOptionWebhookResult.id,
                            next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                            current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
                            payload: webhookListMessagePayload.interactive,
                            contactno: obj.contacts[0].wa_id,
                            type: 9,
                            type_node: fetchNextNodeOptionWebhookResult.typenode,
                            is_node_option: isListNodeOption,
                            placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                            nextMessageResult: fetchNextNodeOptionWebhookResult,
                            is_variant: isListNodeOption,
                            obj: obj,
                            webhookPayload: tmpNodeBody
                            // ,webhook_res_code: sessionResult.webhookResponseCode
                        };
                    } else if (fetchNextNodeOptionWebhookResult.typenode == "Button") {
                        let isButtonNodeOption = 1;
                        //console.log('Button===================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));

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
                                if (tmpNodeBody.header_text != null && tmpNodeBody.header_text.length > 0) {
                                    webhookButtonMessagePayload.interactive.header = {
                                        "type": "text",
                                        "text": tmpNodeBody.header_text
                                    };
                                }
                            } else if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'document') {
                                if (tmpNodeBody.header_media_url != null) {
                                    webhookButtonMessagePayload.interactive.header = {
                                        "type": "document",
                                        "document": {
                                            "link": tmpNodeBody.header_media_url,
                                            // "provider": {
                                            //     "name": "",
                                            // },
                                            "filename": tmpNodeBody.header_media_url.substring(tmpNodeBody.header_media_url.lastIndexOf('/') + 1)
                                        }
                                    };
                                }
                            } else if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'video') {
                                if (tmpNodeBody.header_media_url != null) {
                                    webhookButtonMessagePayload.interactive.header = {
                                        "type": "video",
                                        "video": {
                                            "link": tmpNodeBody.header_media_url,
                                            // "provider": {
                                            //     "name": "",
                                            // }
                                        }
                                    };
                                }
                            } else if (tmpNodeBody.header_type != null && tmpNodeBody.header_type == 'image') {
                                if (tmpNodeBody.header_media_url != null) {
                                    webhookButtonMessagePayload.interactive.header = {
                                        "type": "image",
                                        "image": {
                                            "link": tmpNodeBody.header_media_url,
                                            // "provider": {
                                            //     "name": "",
                                            // }
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
                            };
                            //console.log('botMessagePayload==========>' + JSON.stringify(webhookButtonMessagePayload));
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

                        tempPayload = {
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
                            is_variant: isButtonNodeOption,
                            obj: obj,
                            webhookPayload: tmpNodeBody
                            // ,webhook_res_code: sessionResult.webhookResponseCode
                        };
                    } else if (fetchNextNodeOptionWebhookResult.typenode == "Webhook") {
                        //console.log('WEBHOOK TO WEBHOOK');
                        tempPayload = {
                            flow_id: fetchNextNodeOptionWebhookResult.id,
                            next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                            current_message_id: fetchNextNodeOptionWebhookResult.id,
                            payload: JSON.parse(fetchNextNodeOptionWebhookResult.node_body),
                            contactno: obj.contacts[0].wa_id,
                            type: 1000,
                            type_node: fetchNextNodeOptionWebhookResult.typenode,
                            is_node_option: 0,
                            placeholder: fetchNextNodeOptionWebhookResult.placeholder,
                            nextMessageResult: {
                                is_placeholder: fetchNextNodeOptionWebhookResult.is_placeholder,
                                is_validator: fetchNextNodeOptionWebhookResult.is_validator,
                                validator: fetchNextNodeOptionWebhookResult.validator,
                                is_webhook: fetchNextNodeOptionWebhookResult.is_webhook,
                                webhook: fetchNextNodeOptionWebhookResult.webhook,
                                error_message: fetchNextNodeOptionWebhookResult.error_message
                            },
                            is_variant: 0,
                            obj: obj,
                            webhookPayload: tmpNodeBody
                        };
                    }
                    webhookCallback(null, tempPayload);
                }
                else if (fetchNextNodeOptionWebhookResult === undefined) {
                    if (executeWebhookResult.type == "non-catalog") {

                        sendService.getPaymentNameForWebhook(userId, (err, getPaymentNameResult) => {
                            if (err) {
                                console.log('getPaymentName err(' + obj.contacts[0].wa_id + ')================================>' + err);
                            } else {
                                console.log('getPaymentName result(' + obj.contacts[0].wa_id + ')================================>' + JSON.stringify(getPaymentNameResult));
                                let parameters = {
                                    "reference_id": executeWebhookResult.data.productorderid,
                                    "type": "digital-goods",
                                    "currency": "INR",
                                    "total_amount": {
                                        "value": executeWebhookResult.data.productamount * 100 * executeWebhookResult.data.productquantity,
                                        "offset": 100
                                    },
                                    "payment_type": "upi",
                                    "payment_configuration": getPaymentNameResult[0].payment_name,
                                    "order": {
                                        "status": "pending",
                                        "items": [
                                            {
                                                "retailer_id": executeWebhookResult.data.productretailerid,
                                                "product_id": "product-id",
                                                "name": executeWebhookResult.data.productname ? executeWebhookResult.data.productname : 'Product 1',
                                                "amount": {
                                                    "value": executeWebhookResult.data.productamount * 100,
                                                    "offset": 100
                                                },
                                                "quantity": parseInt(executeWebhookResult.data.productquantity),
                                                "country_of_origin": getPaymentNameResult[0].country_origin,
                                                "importer_name": getPaymentNameResult[0].importer_name,
                                                "importer_address": {
                                                    "address_line1": getPaymentNameResult[0].address_line1,
                                                    "address_line2": getPaymentNameResult[0].address_line2,
                                                    "city": getPaymentNameResult[0].city,
                                                    "zone_code": getPaymentNameResult[0].zone_code,
                                                    "postal_code": getPaymentNameResult[0].postal_code,
                                                    "country_code": getPaymentNameResult[0].country_code
                                                }
                                            }
                                        ],
                                        "subtotal": {
                                            "value": executeWebhookResult.data.productamount * 100 * executeWebhookResult.data.productquantity,
                                            "offset": 100
                                        },
                                        "tax": {
                                            "value": 0,
                                            "offset": 100
                                        }

                                    }
                                };

                                let orderDetailsPayload = {
                                    "type": "order_details",
                                    "body": {
                                        "text": executeWebhookResult.data.productname
                                    },
                                    "header": {
                                        "type": "image",
                                        "image": {
                                            "link": executeWebhookResult.data.productimageurl
                                        }
                                    },
                                    "action": {
                                        "name": "review_and_pay",
                                        "parameters": JSON.stringify(parameters)
                                    }
                                };

                                console.log('orderDetailsPayload  ' + obj.contacts[0].wa_id + '===============================================================>' + obj.contacts[0].wa_id + JSON.stringify(orderDetailsPayload));


                                sendMessage(userId, orderDetailsPayload, obj.contacts[0].wa_id, 9, async (err, sendMessageResult) => {
                                    if (err) {
                                        console.log(err);
                                        console.log('sendMessage error ' + obj.contacts[0].wa_id + '==================>' + err);
                                    } else {
                                        console.log('sendMessage result ' + obj.contacts[0].wa_id + '==================>' + JSON.stringify(sendMessageResult));

                                        console.log("Product Retailer Id : " + executeWebhookResult.data.productretailerid);

                                        // let getDataFromNonCatalogueMasterResult = await sendService.getDataFromNonCatalogueMaster(userId, executeWebhookResult.data.productretailerid);
                                        // console.log({ getDataFromNonCatalogueMasterResult });

                                        // let nonCatalogueId = getDataFromNonCatalogueMasterResult[0].noncatalogid
                                        let nonCatalogueId = 0;
                                        let productRetailerId = executeWebhookResult.data.productretailerid;
                                        let orderId = executeWebhookResult.data.productorderid;
                                        let totalAmount = executeWebhookResult.data.productamount * 100 * executeWebhookResult.data.productquantity;
                                        let paymentReferenceId = 0;
                                        let transactionId = 0;
                                        let transactionType = 0;
                                        let currency = 0;
                                        let orderStatus = 0;
                                        let orderFlag = 0;

                                        let insertDataIntoPurchaseMasterResult = await sendService.insertDataIntoPurchaseMaster(userId, obj.contacts[0].wa_id, nonCatalogueId,
                                            productRetailerId, orderId, sendMessageResult, paymentReferenceId, transactionId, transactionType, totalAmount,
                                            currency, orderStatus, orderFlag, 0);

                                    }
                                });
                            }
                        });


                    };
                }
                else {
                    webhookCallback('No connection found for webhook failure');
                }
            }
        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
            }
        });
    };

    let callNextNode = (flowid, userId, contactno, flag, next) => {
        console.log('callNextNode=====================>' + flowid, userId, contactno, flag);
        async.waterfall([
            (callNextNodeCallback) => {
                sendService.fetchFlowSession(contactno, userId, (err, sessionResult) => {
                    console.log(contactno);
                    console.log(userId);
                    if (sessionResult != undefined) {
                        console.log('fetchFlowSession==========================>' + JSON.stringify(sessionResult));
                        callNextNodeCallback(err, userId, sessionResult[0]);
                    }
                });
            },
            (userId, sessionResult, callNextNodeCallback) => {
                let tmp_message_id = flag == 1 ? sessionResult.next_message_id : sessionResult.current_message_id;
                sendService.fetchNextMessage(sessionResult.flowid, tmp_message_id, (err, fetchNextMessageResult) => {
                    console.log('fetchNextMessage=====================>' + JSON.stringify(fetchNextMessageResult));
                    let flowTmpPayload = null;
                    if (fetchNextMessageResult != undefined) {
                        flowTmpPayload = JSON.parse(fetchNextMessageResult[0].node_body);
                        let flowType = fetchNextMessageResult[0].typenode;

                        let r_1 = {
                            userId: userId,
                            flowid: flowid,
                            flowType: flowType,
                            flowTmpPayload: flowTmpPayload,
                            next_message_id: fetchNextMessageResult[0].next_message_id,
                            current_message_id: fetchNextMessageResult[0].id,
                            sessionResult: sessionResult,
                            placeholder: fetchNextMessageResult[0].placeholder,
                            nextMessageResult: fetchNextMessageResult[0],
                            type: -2
                        };

                        console.log('r_1=====================>' + JSON.stringify(r_1));
                        callNextNodeCallback(null, r_1);
                    } else {
                        callNextNodeCallback('Error Occurred');
                    }
                });
            }
        ], (err, result) => {
            if (err) {
                next(err);
            } else {
                next(null, result);
            }
        });
    };

    async.waterfall([
        readobj,
        validatewanumber,
        fetchtoken,
        processMessage

    ], (err, result) => {
        if (err) {
            console.log('EXCEPTION=====================>' + err);
            console.log(err);
            console.log(err.message);
            errorLogger.error(err);
            res.send(404);
        } else {
            console.log('CLOUD_CALLBACK=====================>' + JSON.stringify(result));
            res.status(200).send('EVENT_RECEIVED');
        }
    });
};