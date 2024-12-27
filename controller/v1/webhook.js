let webhook = (result, chatAttrInsertId, next) => {
    async.waterfall([
        function (webhookCallback) {
            executeWebhook(obj.contacts[0].wa_id, result, (err, executeWebhookResult) => {
                //console.log('executeWebhook=====================>' + JSON.stringify(executeWebhookResult));
                webhookCallback(err, result, chatAttrInsertId, executeWebhookResult);
            });
        },
        function (result, chatAttrInsertId, executeWebhookResult, webhookCallback) {
            sendService.updateWebhookAttrValueById(chatAttrInsertId, executeWebhookResult.data, (err, updateAttrValueResult) => {
                if (err) {
                    //console.log('updateWebhookAttrValueById err=========================>' + JSON.stringify(err));
                }
                else {
                    //console.log('updateWebhookAttrValueById result=========================>' + JSON.stringify(updateAttrValueResult));
                }
                webhookCallback(err, result, chatAttrInsertId, executeWebhookResult);
            });
        },
        function (result, chatAttrInsertId, executeWebhookResult, webhookCallback) {
            //console.log('result=====================>' + JSON.stringify(result));
            let tmpWebhookResCodeArr = result.payload.code;
            let tmpWebhookResCode = executeWebhookResult.code.toString();
            if (tmpWebhookResCodeArr.length > 0) {
                //console.log('tmpWebhookResCodeArr=====================>' + JSON.stringify(tmpWebhookResCodeArr));
                //console.log('executeWebhookResult.code=====================>' + JSON.stringify(executeWebhookResult.code));
                //console.log('tmpWebhookResCodeArr.includes(executeWebhookResult.code) =================>' + tmpWebhookResCodeArr.includes(tmpWebhookResCode));
                if (tmpWebhookResCodeArr.includes(tmpWebhookResCode)) {
                    sendService.fetchNextNodeOptionWebhook(tmpWebhookResCode, contactno, (err, fetchNextNodeOptionWebhookResult) => {
                        if (err) {
                            //console.log('fetchNextNodeOptionWebhook 2 error==================>' + JSON.stringify(err));
                        }
                        else {
                            //console.log('fetchNextNodeOptionWebhook 2 result==================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));
                        }
                        webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult[0]);
                    });
                }
            }
        },
        function (result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult, webhookCallback) {
            //console.log('fetchNextNodeOptionWebhookResult===========================>' + fetchNextNodeOptionWebhookResult.node_body.toString());
            let tmpNodeBody = JSON.parse(fetchNextNodeOptionWebhookResult.node_body);
            let tempPayload = null;
            if (fetchNextNodeOptionWebhookResult.typenode == "Message") {

                tempPayload = {
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

                if (executeWebhookResult.type == "text") {
                    tempPayload.payload = executeWebhookResult.data;
                }
                else if (executeWebhookResult.type == "image") {
                    let imgPayload = {
                        "link": executeWebhookResult.url,
                        "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                    }
                    tempPayload.payload = imgPayload;
                }
                else if (executeWebhookResult.type == "video") {
                    let videoPayload = {
                        "link": executeWebhookResult.url,
                        "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                    }
                    tempPayload.payload = videoPayload;
                }
                else if (executeWebhookResult.type == "document") {
                    let docPayload = {
                        "link": executeWebhookResult.url,
                        "filename": executeWebhookResult.url.toString().split('/').pop(),
                        "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
                    }
                    tempPayload.payload = docPayload;
                }
            }
            else if (fetchNextNodeOptionWebhookResult.typenode == "Question") {
                let tempQuestionPayload = null;
                let tempQuestionType = 0;
                let isQuestionNodeOption = tmpNodeBody.variants != undefined ? 1 : 0;

                // //console.log('CONDITION ============================>'+result.flow_id, _result[0].next_message_id, _result[0].id, isQuestionNodeOption, _result[0].typenode, _result[0].placeholder);
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
                    is_variant: isQuestionNodeOption
                    // ,webhook_res_code: sessionResult.webhookResponseCode
                }
            }
            else if (fetchNextNodeOptionWebhookResult.typenode == "List") {
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
            }
            else if (fetchNextNodeOptionWebhookResult.typenode == "Button") {
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
                    is_variant: isButtonNodeOption
                    // ,webhook_res_code: sessionResult.webhookResponseCode
                }
            }
            if (fetchNextNodeOptionWebhookResult.typenode == "Webhook") {
                //console.log('WEBHOOK TO WEBHOOK');
                tempPayload = {
                    flow_id: fetchNextNodeOptionWebhookResult.id,
                    next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
                    current_message_id: fetchNextNodeOptionWebhookResult.id,
                    payload: JSON.parse(fetchNextNodeOptionWebhookResult.node_body),
                    contactno: contactno,
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
                    is_variant: 0
                }
            }

            webhookCallback(null, tempPayload);
        }
    ], (err, result) => {
        if (err) {
            next(err);
        } else {
            next(null, result);
        }
    });
}