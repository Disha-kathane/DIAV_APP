sendService.fetchFlowId(userId, (err, result) => {
    let isFlowEnabled = result[0].c;
    console.log('isFlowEnabled==========================>' + JSON.stringify(result));
    if (isFlowEnabled > 0) {
        let flowID = result[0].flowid;
        let flowTmpPayload = null;
        let flowType = null;

        async.waterfall([
            function (cb) {
                sendService.fetchFlowSession(contactno, userId, (err, result) => {
                    if (result != undefined) {
                        console.log('fetchFlowSession==========================>' + JSON.stringify(result));
                        cb(err, result[0]);
                    }
                });
            },
            function (sessionResult, cb) {
                if (sessionResult.c == 0) {
                    sendService.setFlowSession(contactno, flowID, userId, sessionResult.next_message_id, (err, result) => {
                        let keywordsArray = result[0].keywords.split(',');
                        let searchIndex = keywordsArray.indexOf(bodyText);
                        console.log('searchIndex===================================>' + searchIndex);
                        if (searchIndex == 1) {
                            cb(err, sessionResult);
                        }
                    });
                }
                else {
                    cb(null, sessionResult);
                }
            },
            function (sessionResult, cb) {

                if (sessionResult.next_message_id == null) {
                    sendService.fetchInitialMessage(flowID, (err, result) => {
                        console.log('fetchInitialMessage=====================>' + JSON.stringify(result));
                        flowTmpPayload = JSON.parse(result[0].node_body);
                        flowType = result[0].typenode;
                        cb(err, flowType, flowTmpPayload, result[0].next_message_id, sessionResult);
                    });
                }
                else {
                    sendService.fetchNextMessage(flowID, sessionResult.next_message_id, (err, result) => {
                        console.log('fetchNextMessage=====================>' + JSON.stringify(result));
                        flowTmpPayload = JSON.parse(result[0].node_body);
                        flowType = result[0].typenode;
                        cb(err, flowType, flowTmpPayload, result[0].next_message_id, sessionResult);
                    });
                }
            },
            function (flowType, flowTmpPayload, next_message_id, sessionResult, cb) {
                console.log('flowType==========================>' + flowType);
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
                            //console.log(botMessagePayload.interactive.action.sections);
                            let index = 1;
                            Object.keys(flowTmpPayload.sections[u + 1].rows).forEach(function (key) {
                                var value = flowTmpPayload.sections[u + 1].rows[key];
                                //console.log(value.row_text);
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
                    cb(null, botMessagePayload.interactive, sessionResult, next_message_id, 9);
                }
                else if (flowType == "Question") {
                    cb(null, flowTmpPayload.text, sessionResult, next_message_id, 4);
                }
                else if (flowType == "Message") {

                }
                else if (flowType == "Button") {
                    console.log('Button===================>' + JSON.stringify(flowTmpPayload));
                    let botMessagePayload = {
                        "interactive": {}
                    };

                    let _index1 = 1;
                    if (flowTmpPayload.buttons.length > 0) {
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
                        botMessagePayload.interactive.type = "button";
                        botMessagePayload.interactive.action = {
                            "buttons": []
                        }
                        console.log('botMessagePayload==========>' + JSON.stringify(botMessagePayload));
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
                    }
                    cb(null, botMessagePayload.interactive, sessionResult, next_message_id, 9);
                }
                else if (flowType == "Condition") {

                }
            },
            function (botMessagePayload, sessionResult, next_message_id, flowType, cb) {
                let result = {
                    flow_id: sessionResult.id,
                    next_message_id: next_message_id,
                    payload: botMessagePayload,
                    contactno: contactno,
                    type: flowType
                }
                console.log('result==========>' + JSON.stringify(result));
                cb(null, result);
            }
        ], (err, result) => {
            if (result) {
                sendService.updateNextMessageIdInSession(result.flow_id, result.next_message_id, (err, result1) => {
                    console.log(result.payload, result.contactno, result.type);
                    sendMessage(result.payload, result.contactno, result.type);
                    logSentByUserMessage(obj);
                    done(err, 'Success');
                });
            }
        });
    }
    else {

    }
});