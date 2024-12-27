// function (webhookCallback) {
//     saveChatAttributes(obj, result, null, (err, chatAttrInsertId) => {
//         if (err) {
//             //console.log('saveChatAttributes webhook err=========================>' + JSON.stringify(err));
//         }
//         else {
//             //console.log('saveChatAttributes webhook result=========================>' + JSON.stringify(result));
//         }
//         webhookCallback(err, result, chatAttrInsertId);
//     });
// },
// function (result, chatAttrInsertId, webhookCallback) {
//     executeWebhook(obj.contacts[0].wa_id, result, (err, executeWebhookResult) => {
//         //console.log('executeWebhook=====================>' + JSON.stringify(executeWebhookResult));
//         webhookCallback(err, result, chatAttrInsertId, executeWebhookResult);
//     });
// },
// function (result, chatAttrInsertId, executeWebhookResult, webhookCallback) {
//     sendService.updateWebhookAttrValueById(chatAttrInsertId, executeWebhookResult.data, (err, updateAttrValueResult) => {
//         if (err) {
//             //console.log('updateWebhookAttrValueById err=========================>' + JSON.stringify(err));
//         }
//         else {
//             //console.log('updateWebhookAttrValueById result=========================>' + JSON.stringify(updateAttrValueResult));
//         }
//         webhookCallback(err, result, chatAttrInsertId, executeWebhookResult);
//     });
// },
// function (result, chatAttrInsertId, executeWebhookResult, webhookCallback) {
//     //console.log('result=====================>' + JSON.stringify(result));
//     let tmpWebhookResCodeArr = result.payload.code;
//     let tmpWebhookResCode = executeWebhookResult.code.toString();
//     if (tmpWebhookResCodeArr.length > 0) {
//         //console.log('tmpWebhookResCodeArr=====================>' + JSON.stringify(tmpWebhookResCodeArr));
//         //console.log('executeWebhookResult.code=====================>' + JSON.stringify(executeWebhookResult.code));
//         //console.log('tmpWebhookResCodeArr.includes(executeWebhookResult.code) =================>' + tmpWebhookResCodeArr.includes(tmpWebhookResCode));
//         if (tmpWebhookResCodeArr.includes(tmpWebhookResCode)) {
//             sendService.fetchNextNodeOptionWebhook(tmpWebhookResCode, contactno, (err, fetchNextNodeOptionWebhookResult) => {
//                 if (err) {
//                     //console.log('fetchNextNodeOptionWebhook 2 error==================>' + JSON.stringify(err));
//                 }
//                 else {
//                     //console.log('fetchNextNodeOptionWebhook 2 result==================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));
//                 }
//                 webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult[0]);
//             });
//         }
//     }
// },
// function (result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult, webhookCallback) {
//     let tmpNodeBody = JSON.parse(fetchNextNodeOptionWebhookResult.node_body);
//     if (fetchNextNodeOptionWebhookResult.typenode == "Message") {

//         let textResult = {
//             flow_id: fetchNextNodeOptionWebhookResult.id,
//             next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
//             current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
//             contactno: obj.contacts[0].wa_id,
//             type: 4,
//             type_node: fetchNextNodeOptionWebhookResult.typenode,
//             is_node_option: 0,
//             placeholder: fetchNextNodeOptionWebhookResult.placeholder,
//             nextMessageResult: fetchNextNodeOptionWebhookResult,
//             is_variant: 0
//             // ,webhook_res_code: sessionResult.webhookResponseCode
//         }

//         if (executeWebhookResult.type == "text") {
//             textResult.payload = executeWebhookResult.data;
//             saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
//                 sendMessage(executeWebhookResult.data, obj.contacts[0].wa_id, 4, (err, _resultMessageId) => {
//                     sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
//                         sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
//                             if (err) {
//                                 //console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
//                             }
//                             else {
//                                 //console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
//                             }
//                             webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
//                         });
//                     });
//                 });
//             });
//         }
//         else if (executeWebhookResult.type == "image") {
//             let imgPayload = {
//                 "link": executeWebhookResult.url,
//                 "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
//             }
//             textResult.payload = imgPayload;
//             saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
//                 sendMessage(imgPayload, obj.contacts[0].wa_id, 1, (err, _resultMessageId) => {
//                     sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
//                         sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
//                             if (err) {
//                                 //console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
//                             }
//                             else {
//                                 //console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
//                             }
//                             webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
//                         });
//                     });
//                 });
//             });
//         }
//         else if (executeWebhookResult.type == "video") {
//             let videoPayload = {
//                 "link": executeWebhookResult.url,
//                 "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
//             }
//             textResult.payload = videoPayload;
//             saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
//                 sendMessage(videoPayload, obj.contacts[0].wa_id, 2, (err, _resultMessageId) => {
//                     sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
//                         sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
//                             if (err) {
//                                 //console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
//                             }
//                             else {
//                                 //console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
//                             }
//                             webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
//                         });
//                     });
//                 });
//             });
//         }
//         else if (executeWebhookResult.type == "document") {
//             let docPayload = {
//                 "link": executeWebhookResult.url,
//                 "filename": executeWebhookResult.url.toString().split('/').pop(),
//                 "caption": executeWebhookResult.data != undefined ? executeWebhookResult.data : ''
//             }
//             textResult.payload = docPayload;
//             saveChatAttributes(obj, textResult, null, (err, chatAttrInsertId) => {
//                 if (err) {
//                     //console.log('questionResult err=======================>' + JSON.stringify(err));
//                 }
//                 else {
//                     sendMessage(docPayload, obj.contacts[0].wa_id, 0, (err, _resultMessageId) => {
//                         sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
//                             if (err) {
//                                 //console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
//                             }
//                             else {
//                                 sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, 0, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
//                                     if (err) {
//                                         //console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
//                                     }
//                                     else {
//                                         //console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
//                                     }
//                                     webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
//                                 });
//                             }
//                         });
//                     });

//                     if (executeWebhookResult.data.length > 0) {
//                         sendMessage(executeWebhookResult.data, obj.contacts[0].wa_id, 4, (err, _resultMessageId) => {
//                         });
//                     }
//                 }
//             });
//         }
//     }
//     else if (fetchNextNodeOptionWebhookResult.typenode == "Question") {
//         let tempQuestionPayload = null;
//         let tempQuestionType = 0;
//         let isQuestionNodeOption = tmpNodeBody.variants != undefined ? 1 : 0;

//         if (tmpNodeBody.media_type == "image") {
//             let imgPayload = {
//                 "link": tmpNodeBody.media_url,
//                 "caption": tmpNodeBody.text != undefined ? tmpNodeBody.text : ''
//             }
//             tempQuestionPayload = imgPayload;
//             tempQuestionType = 1;
//         }
//         else if (tmpNodeBody.media_type == "video") {
//             let videoPayload = {
//                 "link": tmpNodeBody.media_url,
//                 "caption": tmpNodeBody.text != undefined ? tmpNodeBody.text : ''
//             }
//             tempQuestionPayload = videoPayload;
//             tempQuestionType = 2;
//         }
//         else {
//             tempQuestionPayload = tmpNodeBody.text;
//             tempQuestionType = 4;
//         }

//         let questionResult = {
//             flow_id: fetchNextNodeOptionWebhookResult.id,
//             next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
//             current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
//             payload: tempQuestionPayload,
//             contactno: obj.contacts[0].wa_id,
//             type: tempQuestionType,
//             type_node: fetchNextNodeOptionWebhookResult.typenode,
//             is_node_option: isQuestionNodeOption,
//             placeholder: fetchNextNodeOptionWebhookResult.placeholder,
//             nextMessageResult: fetchNextNodeOptionWebhookResult,
//             is_variant: isQuestionNodeOption
//             // ,webhook_res_code: sessionResult.webhookResponseCode
//         }

//         saveChatAttributes(obj, questionResult, null, (err, chatAttrInsertId) => {
//             if (err) {
//                 //console.log('questionResult err=======================>' + JSON.stringify(err));
//             }
//             else {
//                 sendWebhookMessage(tempQuestionPayload, obj.contacts[0].wa_id, tempQuestionType, (err, _resultMessageId) => {
//                     sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
//                         if (err) {
//                             //console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
//                         }
//                         else {
//                             sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, isQuestionNodeOption, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
//                                 if (err) {
//                                     //console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
//                                 }
//                                 else {
//                                     //console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
//                                 }
//                                 webhookCallback(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
//                             });
//                         }
//                     });
//                 });
//             }
//         });
//     }
//     else if (fetchNextNodeOptionWebhookResult.typenode == "List") {
//         let isListNodeOption = 1;
//         //console.log('List===================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));

//         let sections = tmpNodeBody.section_count;
//         let webhookListMessagePayload = {};

//         webhookListMessagePayload.interactive = {
//             "action": {}
//         };

//         if (tmpNodeBody.header_text != null && tmpNodeBody.header_text.length > 0) {
//             webhookListMessagePayload.interactive = {
//                 "header": {
//                     "type": "text",
//                     "text": tmpNodeBody.header_text
//                 }
//             };
//         }

//         if (tmpNodeBody.footer_text != null) {
//             webhookListMessagePayload.interactive = {
//                 "footer": {
//                     "text": tmpNodeBody.footer_text
//                 }
//             };
//         }

//         if (tmpNodeBody.button_text != null) {
//             webhookListMessagePayload.interactive.action = {
//                 "button": tmpNodeBody.button_text,
//                 "sections": []
//             }
//         }

//         if (parseInt(sections) > 0) {
//             webhookListMessagePayload.interactive.type = "list";
//             for (let u = 0; u < sections; u++) {
//                 webhookListMessagePayload.interactive.action.sections.push({
//                     "title": tmpNodeBody.sections[u + 1].section_text,
//                     "rows": []
//                 });

//                 let index = 1;
//                 Object.keys(tmpNodeBody.sections[u + 1].rows).forEach(function (key) {
//                     var value = tmpNodeBody.sections[u + 1].rows[key];
//                     webhookListMessagePayload.interactive.action.sections[u].rows.push({
//                         "id": "id_" + index,
//                         "title": value.row_text,
//                         "description": value.description_text
//                     });
//                     index++;
//                 });
//             }
//         }

//         if (tmpNodeBody.body_text != null) {
//             webhookListMessagePayload.interactive = {
//                 "body": {
//                     "text": tmpNodeBody.body_text
//                 }
//             };
//         }

//         let listResult = {
//             flow_id: fetchNextNodeOptionWebhookResult.id,
//             next_message_id: fetchNextNodeOptionWebhookResult.next_message_id,
//             current_message_id: fetchNextNodeOptionWebhookResult.current_message_id,
//             payload: webhookButtonMessagePayload.interactive,
//             contactno: obj.contacts[0].wa_id,
//             type: 9,
//             type_node: fetchNextNodeOptionWebhookResult.typenode,
//             is_node_option: isListNodeOption,
//             placeholder: fetchNextNodeOptionWebhookResult.placeholder,
//             nextMessageResult: fetchNextNodeOptionWebhookResult,
//             is_variant: isListNodeOption
//             // ,webhook_res_code: sessionResult.webhookResponseCode
//         }

//         saveChatAttributes(obj, listResult, null, (err, chatAttrInsertId) => {
//             if (err) {
//                 //console.log('listResult err=======================>' + JSON.stringify(err));
//             }
//             else {
//                 sendWebhookMessage(webhookButtonMessagePayload.interactive, obj.contacts[0].wa_id, 9, (err, _resultMessageId) => {
//                     sendService.updateMessageIdByAttrId(chatAttrInsertId, _resultMessageId, (err, result) => {
//                         if (err) {
//                             //console.log('updateMessageIdByAttrId error==================>' + JSON.stringify(err));
//                         } else {
//                             //console.log('updateMessageIdByAttrId result================>' + JSON.stringify(result));
//                             sendService.updateNextMessageIdInSession(fetchNextNodeOptionWebhookResult.id, fetchNextNodeOptionWebhookResult.next_message_id, fetchNextNodeOptionWebhookResult.current_message_id, isListNodeOption, fetchNextNodeOptionWebhookResult.typenode, fetchNextNodeOptionWebhookResult.placeholder, (err, updateNextMessageIdInSessionResult1) => {
//                                 if (err) {
//                                     //console.log('updateNextMessageIdInSession 2 error==================>' + JSON.stringify(err));
//                                 }
//                                 else {
//                                     //console.log('updateNextMessageIdInSession 2 result==================>' + JSON.stringify(updateNextMessageIdInSessionResult1));
//                                 }
//                                 webhookCallback_1(err, result, chatAttrInsertId, executeWebhookResult, fetchNextNodeOptionWebhookResult);
//                             });
//                         }
//                     });

//                 });
//             }
//         });

//     }
//     else if (fetchNextNodeOptionWebhookResult.typenode == "Button") {
//         let isButtonNodeOption = 1;
//         //console.log('Button===================>' + JSON.stringify(fetchNextNodeOptionWebhookResult));

//         let webhookButtonMessagePayload = {
//             "interactive": {}
//         };

//         let _index1 = 1;

//     }
// }