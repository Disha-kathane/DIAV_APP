const async = require('async');
const sendService = require('../../services/v1/send');
let axios = require('axios');
let fs = require('fs');

module.exports = (req, res) => {
    console.log(JSON.stringify(req.body));
    let wanumber = req.headers.wanumber;
    let apikey = req.headers.apikey;
    let product = null;
    let recipientnumber = null;
    let url = null;
    let recipienttype = null;
    let msgtype = null;
    let text = null;
    let bodycontent = null;
    let clientPayload = null;
    let msgType;
    let id;
    let campaignid;
    let direction = 1;
    let userid;
    let wa_msg_setting_id;
    let whatsapp_business_account_id = null;
    let messageid;
    let errorCode;
    let fbtrace_id;
    let errorDesc;
    let temptitle;



    async.waterfall([
        (done) => {
            if (req.body != null) {
                console.log("i am wanumber----->   ", wanumber);
                sendService.fetchphonenumberid(wanumber, (err, fetchphonenumberidResult) => {
                    if (err) {
                        console.log('fetchphonenumberid err=======================>' + JSON.stringify(err));
                        done(err);
                    } else {
                        // console.log('fetchphonenumberid result=======================>' + JSON.stringify(fetchphonenumberidResult));
                        if (fetchphonenumberidResult[0].c > 0) {
                            done(null, fetchphonenumberidResult);
                        } else {
                            res.send({
                                code: 100,
                                status: 'failed',
                                data: 'Invalid Credentials (This API only works on Cloud Platform)'
                            });
                        }
                    }
                });
            } else {
                done('Invalid Request');
            }
        },
        (fetchphonenumberidResult, done) => {
            if (req.body != null) {
                sendService.selectapikey(apikey, (err, selectapikeyResult) => {
                    if (err) {
                        console.log('selectapikey err=======================>' + JSON.stringify(err));
                        done(err);
                    } else {
                        console.log('selectapikey result=======================>' + JSON.stringify(selectapikeyResult));
                        if (selectapikeyResult[0].c > 0) {
                            done(null, selectapikeyResult);
                        } else {
                            done('Authentication failed');
                        }
                    }
                });
            } else {
                done('Invalid Request');
            }
        },
        (selectapikeyResult, done) => {
            sendService.selectwanumber(wanumber, (err, selectwanumberResult) => {
                if (err) {
                    console.log('selectwanumber err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('selectwanumber result=======================>' + JSON.stringify(selectwanumberResult));
                    if (selectwanumberResult[0].c > 0) {
                        done(null, selectwanumberResult);
                    } else {
                        done('Invalid Wanumber');
                    }
                }
            });
        },
        (selectwanumberResult, done) => {
            sendService.fetchapikeywanumber(wanumber, apikey, (err, fetchapikeywanumberResult) => {
                if (err) {
                    console.log('fetchapikeywanumber err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('fetchapikeywanumber result=======================>' + JSON.stringify(fetchapikeywanumberResult));
                    done(null, fetchapikeywanumberResult);
                }
            });
        },
        (fetchapikeywanumberResult, done) => {
            product = req.body.messaging_product;
            recipientnumber = req.body.to;
            url = req.body.preview_url;
            recipienttype = req.body.recipient_type;
            msgtype = req.body.type;
            text = req.body.text;
            userid = fetchapikeywanumberResult[0].userid;
            wa_msg_setting_id = fetchapikeywanumberResult[0].wa_msg_setting_id;
            whatsapp_business_account_id = fetchapikeywanumberResult[0].whatsapp_business_account_id;

            switch (msgtype) {
                case "text":
                    if (bodycontent = req.body.text != null) {
                        msgType = 4;
                        done(null, fetchapikeywanumberResult, bodycontent);
                    } else if (bodycontent = req.body.context.message_id != null) {
                        msgType = 11;
                        done(null, fetchapikeywanumberResult, bodycontent);
                    }
                    // done(null, fetchapikeywanumberResult, bodycontent);
                    break;
                case "document":
                    bodycontent = {
                        "body": "<a href='" + req.body.document.link + "'>Media</a>"
                    };
                    msgType = 0;
                    done(null, fetchapikeywanumberResult, bodycontent);
                    break;
                case "image":
                    bodycontent = {
                        "body": "<a href='" + req.body.image.link + "'>Media</a>"
                    };
                    msgType = 1;
                    done(null, fetchapikeywanumberResult, bodycontent);
                    break;
                case "video":
                    bodycontent = {
                        "body": "<a href='" + req.body.video.link + "'>Media</a>"
                    };
                    msgType = 2;
                    done(null, fetchapikeywanumberResult, bodycontent);
                    break;
                case "audio":
                    bodycontent = {
                        "body": "<a href='" + req.body.audio.link + "'>Media</a>"
                    };
                    msgType = 3;
                    done(null, fetchapikeywanumberResult, bodycontent);
                    break;
                case "location":
                    bodycontent = {
                        "body": {
                            "latitude": req.body.location.latitude, "longitude": req.body.location.longitude,
                        }
                    };
                    msgType = 5;
                    done(null, fetchapikeywanumberResult, bodycontent);
                    break;
                case "contacts":
                    bodycontent = {
                        "body": [{
                            "addresses": [],
                            "emails": [],
                            "ims": [],
                            "name": {
                                "first_name": req.body.contacts[0].name.first_name,
                                "formatted_name": req.body.contacts[0].name.formatted_name,
                                "last_name": req.body.contacts[0].name.last_name,
                            },
                            "org": {},
                            "phones": [],
                            "urls": []
                        }]
                    };
                    msgType = 6;
                    done(null, fetchapikeywanumberResult, bodycontent);
                    break;
                case 'sticker':
                    bodycontent = {
                        "body": "<a href='" + req.body.sticker.url + "'>Media</a>"
                    };
                    msgType = 7;
                    done(null, fetchapikeywanumberResult, bodycontent);
                    break;
                case 'interactive':
                    bodycontent = {
                        "body": req.body.interactive.body.text
                    };
                    msgType = 9;
                    done(null, fetchapikeywanumberResult, bodycontent);
                    break;
                case 'reaction':
                    bodycontent = {
                        "body": req.body.reaction.emoji
                    };
                    console.log({ bodycontent });
                    msgType = 10;
                    done(null, fetchapikeywanumberResult, bodycontent);
                    break;
                // case 'reply':
                //     bodycontent = {
                //         "body": req.body.context.message_id
                //     };
                //     console.log({ bodycontent });
                //     msgType = 11;
                //     done(null, fetchapikeywanumberResult, bodycontent);
                //     break;

                case 'template':

                    temptitle = req.body.template.name;

                    console.log('temptitle==========>' + temptitle);
                    console.log('userid=============>' + userid);
                    msgType = 8;
                    sendService.templatetitleuserid(temptitle, userid, (err, templatetitleuseridResult) => {
                        if (err) {
                            console.log('templatetitleuserid err=======================>' + JSON.stringify(err));
                            done(err);
                        } else {
                            // console.log('templatetitleuserid result=======================>' + JSON.stringify(templatetitleuseridResult));
                            if (templatetitleuseridResult.length > 0) {
                                bodycontent = {
                                    "body": templatetitleuseridResult[0].body_message.toString()
                                };
                                done(null, fetchapikeywanumberResult, bodycontent);
                            } else {
                                sendService.templatetitlewabaid(temptitle, whatsapp_business_account_id, (err, templatetitlewabaidResult) => {
                                    if (templatetitlewabaidResult.length > 0) {
                                        bodycontent = {
                                            "body": templatetitlewabaidResult[0].body_message.toString()
                                        };
                                    }
                                    done(null, fetchapikeywanumberResult, bodycontent);
                                });
                            }
                            // done(null, fetchapikeywanumberResult, bodycontent);
                        }
                    });
                    break;
                // case 'order_details':
                //     bodycontent = {
                //         "body": req.body.interactive.type
                //     }
                //     done(null, fetchapikeywanumberResult, bodycontent);
                //     break;
                // case 'order_status':
                //     bodycontent = {
                //         "body": req.body.interactive.type
                //     }
                //     done(null, fetchapikeywanumberResult, bodycontent);
                //     break;
            }
        },
        (fetchapikeywanumberResult, bodycontent, done) => {
            sendService.checkSubscription(recipientnumber, wanumber, (err, checkSubscriptionResult) => {
                if (err) {
                    console.log(err);
                    done(err);
                }
                else {
                    let is_subscribed = 0;
                    if (checkSubscriptionResult.length > 0) {
                        if (checkSubscriptionResult[0].subflag == 1) {
                            is_subscribed = 1;
                        } else if (checkSubscriptionResult[0].subflag == 0) {
                            is_subscribed = 0;
                        }
                    } else {
                        is_subscribed = 2;
                    }

                    if (is_subscribed == 1 || is_subscribed == 2) {
                        console.log('checkSubscription is called');
                        console.log({ checkSubscriptionResult });
                        console.log("data ----------------> ", req.body, 'Bearer ' + fetchapikeywanumberResult[0].authtoken, fetchapikeywanumberResult[0].waurl);
                        var config = {
                            method: 'post',
                            url: fetchapikeywanumberResult[0].waurl,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + fetchapikeywanumberResult[0].authtoken
                            },
                            data: req.body
                        };
                        console.log(req.body);
                        axios(config)
                            .then(function (response) {
                                console.log(JSON.stringify(response.data));
                                done(null, response.data);
                            })
                            .catch(function (error) {
                                console.log(error);
                                if (error.response.data.error) {
                                    done(error.response.data.error);
                                }
                            });
                    }
                    else {
                        done('No subscription found for the mobile number ' + recipientnumber);
                    }
                }
            });
        },
        (response, done) => {
            messageid = response.messages[0].id;
            errorCode = response.code;
            fbtrace_id = response.fbtrace_id;
            errorDesc = response.message;
            // console.log('userid==========================>' + userid);
            sendService.insertMessageInSentMasterAPI(id, userid, recipientnumber, req.body, messageid, msgType, campaignid, wanumber, wa_msg_setting_id, direction, errorCode, errorDesc, clientPayload, bodycontent, fbtrace_id, (err, insertMessageInSentMasterAPIResult) => {
                if (err) {
                    console.log('insertMessageInSentMasterAPI err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('insertMessageInSentMasterAPI result=======================>' + JSON.stringify(insertMessageInSentMasterAPIResult));
                    done(null, response);
                }
            });
        }
    ], (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
};
