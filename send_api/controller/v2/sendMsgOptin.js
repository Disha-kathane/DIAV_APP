// const async = require('async');
// const axios = require('axios');
// const http = require('http');
// const https = require('https');
// const httpUrl = require('url');
// const { errorLogger, infoLogger } = require('../../applogger1');
// const sendService = require('../../services/v2/send');
// const optinService = require('../../services/v2/optin');
// const validator = require('validator');
// const botUtils = require('../../utils/bot1');
// const responseHelper = require('../../utils/responseHelper');

// //send message by doing optin
// //New code made in async await

// module.exports = (req, res) => {
//     try {
//         let tempuserid;
//         const validateWanumber = async () => {
//             try {
//                 let fromNumber = req.body.from.replace("+", "");
//                 let checkWanumberResult = await sendService.checkWanumber(fromNumber);
//                 if (checkWanumberResult.length > 0) {
//                     if (checkWanumberResult[0].phone_number_id != '' && (checkWanumberResult[0].phone_number_id != null && checkWanumberResult[0].phone_number_id != undefined)) {
//                         return 1;
//                     } else {
//                         return 0;
//                     }
//                 } else {
//                     HelperResult = responseHelper("WA100", "Wabanumber Not Found")
//                     return res.send(HelperResult);

//                 }
//             } catch (error) {
//                 HelperResult = responseHelper("WA100", error.message)
//                 return res.send(HelperResult);
//             }
//         }

//         const callOptin = async (validateWanumberResult) => {
//             try {
//                 let messageObj = req.body;
//                 let from = (typeof req.body.from != undefined) ? req.body.from + '' : '';
//                 let to = (typeof req.body.to != undefined) ? req.body.to + '' : '';
//                 let userId = null;
//                 from = from.replace(/ /g, '');
//                 from = from.replace(/\+/g, '');
//                 to = to.replace(/ /g, '');
//                 to = to.replace(/\+/g, '');

//                 let validateApiKey = async () => {
//                     let result = await sendService.getApiKey(req.headers.apikey);
//                     if (result.length > 0 && result != null) {
//                         if (result[0].userstatus == 1) {
//                             if (result[0].account_type == 0) {
//                                 userId = result[0].userid;
//                                 return userId;
//                             } else if (result[0].account_type == 1) {
//                                 if (result[0].balance_amt > 0) {
//                                     userId = result[0].userid;
//                                     return userId;
//                                 } else {
//                                     HelperResult = responseHelper("WA036", "Insufficient Balance")
//                                     return res.send(HelperResult);
//                                 }
//                             }
//                         } else {
//                             HelperResult = responseHelper("WA001", "User is Inactive")
//                             return res.send(HelperResult);
//                         }

//                     } else {
//                         HelperResult = responseHelper("WA002", "Authentication Failed")
//                         return res.send(HelperResult);

//                     }
//                 }


//                 const wabaInfo = async (userid) => {
//                     let wabanumber;
//                     tempuserid = userid;
//                     if (typeof from == undefined || validator.isEmpty(from + '') || from == null) {
//                         error = true;
//                         HelperResult = responseHelper("WA003", "Mobile number(from or to) is required")
//                         return res.send(HelperResult);
//                     }
//                     else {
//                         wabanumber = from;
//                         let tmpWabaNumber = wabanumber.replace(/^91/g, '');
//                         if (!tmpWabaNumber.startsWith('9') ||
//                             !tmpWabaNumber.startsWith('8') ||
//                             !tmpWabaNumber.startsWith('7') ||
//                             !tmpWabaNumber.startsWith('6')) {
//                             wabaCountryCode = botUtils.getCountryCode(wabanumber);
//                             wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(wabanumber);
//                         }
//                         else {
//                             if (botUtils.isMobileInternational(wabanumber)) {
//                                 wabaCountryCode = botUtils.getCountryCode(wabanumber);
//                                 wabaCountryCodeNumeric = botUtils.getCountryCodeNumeric(wabanumber);
//                             }
//                             else {
//                                 HelperResult = responseHelper("WA004", "Mobile number (from or to) must contain Country Code")
//                                 return res.send(HelperResult);

//                             }
//                         }
//                     }
//                     let getSpecificWabaInfoResult = await sendService.getSpecificWabaInfo(userid, wabanumber);
//                     if (getSpecificWabaInfoResult.length > 0) {
//                         return ([getSpecificWabaInfoResult, userid]);
//                     } else {
//                         HelperResult = responseHelper("WA005", "from number is invalid or not found")
//                         return res.send(HelperResult);

//                     }
//                 }

//                 const checkOptin = async (wabaInfo, userid) => {
//                     if (validateWanumberResult == 0) {
//                         let result = await optinService.checkOptinContactStatus_Mod(from, to);
//                         if (result.length > 0) {
//                             if (result[0].wastatus != 1) {
//                                 HelperResult = responseHelper("WA102", "Non WhatsApp Number")
//                                 return res.send(HelperResult);
//                             } else {
//                                 return ([wabaInfo, 1, userid]);
//                             }

//                         } else {
//                             return ([wabaInfo, 0, userid]);
//                         }
//                     } else {
//                         return ([wabaInfo, '', userid]);
//                     }
//                 }


//                 const doOptin = async (checkOptinResult) => {
//                     let wabaInfo = checkOptinResult[0];
//                     let flag = checkOptinResult[1];
//                     let userid = checkOptinResult[2];
//                     if (flag != '') {
//                         if (flag == '0') {
//                             const api = '/v1/contacts';
//                             const objData = {
//                                 "blocking": "wait",
//                                 "contacts": ['+' + to]
//                             };
//                             const httpMethod = 1;
//                             const requestType = 1;
//                             const contentLength = Buffer.byteLength(JSON.stringify(objData));
//                             const apiHeaders = [{
//                                 'headerName': 'Authorization',
//                                 'headerVal': 'Bearer ' + wabaInfo[0].authtoken
//                             }, {
//                                 'headerName': 'content-length',
//                                 'headerVal': contentLength
//                             }];

//                             botUtils.callWhatsAppApi(wabaInfo[0].waurl, api, objData, httpMethod, requestType, apiHeaders).then((response) => {
//                                 if (typeof response.contacts != undefined) {
//                                     let status;
//                                     if (response.contacts[0].status == 'valid') {
//                                         status = 1;
//                                     }
//                                     if (response.contacts[0].status == 'invalid') {
//                                         status = 2;
//                                     }

//                                     optinService.insertOptinContacts_Mod(to, '+' + from, userId, 0, status).then((result) => {
//                                         //added by  on 7/7/2022 for non whatsapp number
//                                         if (status != 1) {
//                                             HelperResult = responseHelper("WA102", "Non WhatsApp Number")
//                                             return res.send(HelperResult);
//                                         } else {
//                                             return ([200, userid, '']);
//                                         }

//                                     }).catch((err) => {
//                                         HelperResult = responseHelper("WA100", err.message)
//                                         return res.send(HelperResult);
//                                     })
//                                 } else {
//                                     HelperResult = responseHelper("WA100", "Something went wrong(1)")
//                                     return res.send(HelperResult);
//                                 }
//                             }).catch((err) => {
//                                 HelperResult = responseHelper("WA100", "Something went wrong(2)")
//                                 return res.send(HelperResult);

//                             });
//                         } else {
//                             return ([200, userid, '']);
//                         }

//                     } else {
//                         let isCloud = 1;
//                         return ([200, userid, isCloud]);
//                     }

//                 }


//                 (async () => {
//                     try {
//                         const validateWanumberResult = await validateApiKey();
//                         const wabaInfoResult = await wabaInfo(validateWanumberResult);
//                         const infoRes = wabaInfoResult[0];
//                         const userId = wabaInfoResult[1];
//                         const checkOptinResult = await checkOptin(infoRes, userId);
//                         const doOptinResult = await doOptin(checkOptinResult);
//                         const Code = doOptinResult[0];
//                         const doOptinuserId = doOptinResult[1];
//                         const isCloud = doOptinResult[2];
//                         return await SendMsg(Code, doOptinuserId, isCloud);
//                     } catch (error) {
//                         HelperResult = responseHelper("WA100", error.message)
//                         return res.send(HelperResult);
//                     }
//                 })();

//             } catch (error) {
//                 HelperResult = responseHelper("WA100", error.message)
//                 return res.send(HelperResult);

//             }
//         }

//         const SendMsg = async (code, userid, iscloud) => {
//             try {
//                 if (code == 200) {
//                     let messageObj = req.body;
//                     let userId = userid;
//                     let wanumber = null;
//                     let countryCode = null;
//                     let wabaCountryCode = null;
//                     let wabaCountryCodeNumeric = null;
//                     let maxTextLength = 4096;
//                     let error = false;
//                     let objMessage = null;
//                     let setflag = 0;
//                     let msgType = null;
//                     let isMediaID = -1;
//                     let fileName = null;
//                     let s3MediaUrl = null;
//                     let mediaType = null;
//                     let bodyContent = null;
//                     const wabaInfo1 = async (userid) => {
//                         try {
//                             let wabanumber;
//                             if (typeof messageObj.from == undefined || validator.isEmpty(messageObj.from + '') || messageObj.from == null) {
//                                 error = true;
//                                 HelperResult = responseHelper("WA003", "Mobile number is required")
//                                 return res.send(HelperResult);
//                             } else {
//                                 wabanumber = messageObj.from.replace("+", "");
//                             }
//                             let result = await sendService.checkWanumber(wabanumber);
//                             if (result.length > 0) {
//                                 let SystemAccessToken;
//                                 let phone_number_id = result[0].phone_number_id;
//                                 if (phone_number_id != '' && phone_number_id != null && phone_number_id != undefined) {
//                                     setflag = 1;
//                                     let AuthResult = await sendService.getSystemAccessToken();
//                                     if (AuthResult.length > 0) {
//                                         SystemAccessToken = AuthResult[0].VALUE;
//                                     } else {
//                                         HelperResult = responseHelper("WA100", AuthResult.err)
//                                         return res.send(HelperResult);
//                                     }
//                                     let getSpecificWabaInfoResult = await sendService.getSpecificWabaInfo(userid, wabanumber);
//                                     if (getSpecificWabaInfoResult.length > 0) {
//                                         getSpecificWabaInfoResult[0].authtoken = SystemAccessToken;
//                                         return getSpecificWabaInfoResult;
//                                     } else {
//                                         HelperResult = responseHelper("WA100", getSpecificWabaInfoResult.err)
//                                         return res.send(HelperResult);

//                                     }
//                                 } else {
//                                     let getSpecificWabaInfoResult = await sendService.getSpecificWabaInfo(userid, wabanumber);
//                                     if (getSpecificWabaInfoResult.length > 0) {
//                                         return getSpecificWabaInfoResult;
//                                     } else {
//                                         HelperResult = responseHelper("WA100", getSpecificWabaInfoResult.err)
//                                         return res.send(HelperResult);
//                                     }
//                                 }
//                             } else {
//                                 HelperResult = responseHelper("WA100", "Wabanumber Not Found")
//                                 return res.send(HelperResult);

//                             }
//                         } catch (error) {
//                             HelperResult = responseHelper("WA100", error.message)
//                             return res.send(HelperResult);
//                         }
//                     }


//                     const validatePayload = async (wabaInfoResult) => {
//                         try {
//                             if (typeof messageObj.to == undefined || validator.isEmpty(messageObj.to + '') || messageObj.to == null) {
//                                 error = true;
//                                 HelperResult = responseHelper("WA003", "Mobile number is required")
//                                 return res.send(HelperResult);
//                             } else {
//                                 wanumber = messageObj.to;
//                                 let tmpWaNumber = wanumber.toString().replace(/^91/g, '');
//                                 if (!tmpWaNumber.startsWith('9') &&
//                                     !tmpWaNumber.startsWith('8') &&
//                                     !tmpWaNumber.startsWith('7') &&
//                                     !tmpWaNumber.startsWith('6')) {
//                                     countryCode = botUtils.getCountryCode(wanumber);
//                                     countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
//                                 } else {
//                                     if (botUtils.isMobileInternational(wanumber)) {
//                                         countryCode = botUtils.getCountryCode(wanumber);
//                                         countryCodeNumeric = botUtils.getCountryCodeNumeric(wanumber);
//                                     } else {
//                                         HelperResult = responseHelper("WA004", "Mobile number (from or to) must contain Country Code")
//                                         return res.send(HelperResult);

//                                     }
//                                 }
//                             }

//                             if (typeof messageObj.type == undefined || validator.isEmpty(messageObj.type + '') || messageObj.type == null) {
//                                 error = true;
//                                 HelperResult = responseHelper("WA005", "Message type is required")
//                                 return res.send(HelperResult);
//                             }
//                             if (typeof messageObj.message == undefined || messageObj.message == null || messageObj.message.length == 0 || Object.keys(messageObj.message).length == 0) {
//                                 error = true;
//                                 HelperResult = responseHelper("WA006", "Message is required")
//                                 return res.send(HelperResult);

//                             }
//                             if (!error) {
//                                 objMessage = messageObj.message;
//                                 msgType = messageObj.type.toLowerCase();
//                                 let regex = new RegExp('[^.]+$');
//                                 console.log("msgType==============", msgType)
//                                 //0=>'Document', 1=>'Image', 2=>'Video', 3=>'Audio', 4=>'Text', 5=>'Location', 6=>'Contact', 7=>'Sticker',8=>'Template'
//                                 switch (msgType) {
//                                     case "document":
//                                     case "image":
//                                     case "video":
//                                     case "audio":
//                                         try {
//                                             if (!objMessage.hasOwnProperty('id')) {
//                                                 if (typeof objMessage.url == undefined || validator.isEmpty(objMessage.url + '')) {
//                                                     error = true;
//                                                     HelperResult = responseHelper("WA007", "Media URL is required")
//                                                     return res.send(HelperResult);

//                                                 } else if (!validator.isURL(objMessage.url + '')) {
//                                                     error = true;
//                                                     HelperResult = responseHelper("WA008", "Media URL is invalid")
//                                                     return res.send(HelperResult);
//                                                 } else {
//                                                     isMediaID = 0;
//                                                 }
//                                             }
//                                             if (!objMessage.hasOwnProperty('url')) {
//                                                 if (typeof objMessage.id == undefined && !validator.isEmpty(objMessage.id + '')) {
//                                                     error = false;
//                                                     HelperResult = responseHelper("WA009", "Media ID is invalid")
//                                                     return res.send(HelperResult);
//                                                 } else {
//                                                     isMediaID = 1;
//                                                 }
//                                             }

//                                             if (isMediaID == 0) {
//                                                 let extension = objMessage.url.match(regex);
//                                                 if (msgType == "document") {
//                                                     mediaType = 0;
//                                                 }

//                                                 if (msgType == "image") {
//                                                     if (extension[0] == 'png' || extension[0] == 'jpg' || extension[0] == 'jpeg') {
//                                                         mediaType = 1;
//                                                     } else {
//                                                         HelperResult = responseHelper("WA011", "Invalid Image Url")
//                                                         return res.send(HelperResult);
//                                                     }
//                                                 }

//                                                 if (msgType == "video") {
//                                                     if (extension[0] == 'mp4' || extension[0] == '3gp' || extension[0] == '3gpp') {
//                                                         mediaType = 2;
//                                                     } else {
//                                                         HelperResult = responseHelper("WA012", "Invalid Video Url")
//                                                         return res.send(HelperResult);

//                                                     }
//                                                 }
//                                                 if (msgType == "audio") {
//                                                     if (extension[0] == 'mp4' || extension[0] == 'mp3' || extension[0] == 'mpeg' || extension[0] == 'wav' || extension[0] == 'amr' || extension[0] == 'aac' || extension[0] == 'opus') {
//                                                         if (messageObj.message.hasOwnProperty('caption') || messageObj.message.hasOwnProperty('filename')) {
//                                                             HelperResult = responseHelper("WA040", "Invalid Message Type");
//                                                             return res.send(HelperResult);
//                                                         }
//                                                         mediaType = 3;
//                                                     } else {
//                                                         HelperResult = responseHelper("WA013", "Invalid Audio Url")
//                                                         return res.send(HelperResult);
//                                                     }
//                                                 }
//                                                 return ([1, mediaType, wabaInfoResult]);

//                                             }
//                                             if (isMediaID == 1) {
//                                                 let result = await sendService.fetchMediaFileName(objMessage.id);
//                                                 if (result.length > 0) {
//                                                     switch (result[0].mediatype) {
//                                                         case 0:
//                                                         case 1:
//                                                         case 2:
//                                                         case 3:
//                                                             mediaType = result[0].mediatype;
//                                                             fileName = result[0].medianame;
//                                                             s3MediaUrl = result[0].mediaurl;
//                                                             return ([1, mediaType, wabaInfoResult]);

//                                                     }
//                                                 } else {
//                                                     HelperResult = responseHelper("WA014", "Media ID is invalid")
//                                                     return res.send(HelperResult);
//                                                 }
//                                             }
//                                         } catch (error) {
//                                             HelperResult = responseHelper("WA101", "Invalid Payload")
//                                             return res.send(HelperResult);
//                                         }

//                                     case "text":
//                                         try {

//                                             if (typeof objMessage.text == undefined || validator.isEmpty(objMessage.text + '') || objMessage.text == null) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA015", "Text is required")
//                                                 return res.send(HelperResult);

//                                             } else if (typeof objMessage.text != undefined && (objMessage.text + '').length > maxTextLength) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA016", "Text cannot exceed 4096 characters")
//                                                 return res.send(HelperResult);

//                                             } else {
//                                                 return ([1, 4, wabaInfoResult]);
//                                             }
//                                         } catch (error) {
//                                             HelperResult = responseHelper("WA101", "Invalid Payload")
//                                             return res.send(HelperResult);

//                                         }


//                                     case "location":
//                                         try {
//                                             if (typeof objMessage.latitude == undefined || validator.isEmpty(objMessage.latitude + '') || objMessage.latitude == null) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA017", "Latitude is required")
//                                                 return res.send(HelperResult);

//                                             } else if (typeof objMessage.longitude == undefined || validator.isEmpty(objMessage.longitude + '') || objMessage.longitude == null) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA018", "Longitude is required")
//                                                 return res.send(HelperResult);

//                                             } else if (typeof objMessage.address == undefined || validator.isEmpty(objMessage.address + '') || objMessage.address == null) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA019", "Address is required")
//                                                 return res.send(HelperResult);

//                                             } else if (typeof objMessage.name == undefined || validator.isEmpty(objMessage.name + '') || objMessage.name == null) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA020", "Name is required")
//                                                 return res.send(HelperResult);

//                                             } else {
//                                                 let regex = new RegExp('^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$');
//                                                 let latitude = objMessage.latitude.match(regex);
//                                                 let longitude = objMessage.longitude.match(regex);
//                                                 if (latitude[0] != 0 && longitude[0] != 0) {
//                                                     return ([1, 5, wabaInfoResult]);

//                                                 } else {
//                                                     error = true;
//                                                     HelperResult = responseHelper("WA021", "Latitude / Longitude is invalid")
//                                                     return res.send(HelperResult);
//                                                 }
//                                             }
//                                         } catch (error) {
//                                             HelperResult = responseHelper("WA101", "Invalid Payload")
//                                             return res.send(HelperResult);

//                                         }


//                                     case "contact":
//                                         try {
//                                             if (typeof objMessage.contacts == undefined || validator.isEmpty(objMessage.contacts + '')) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA022", "Contacts body is required")
//                                                 return res.send(HelperResult);

//                                             } else if (objMessage.contacts.name == undefined || validator.isEmpty(objMessage.contacts.name + '')) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA023", "Name body is required")
//                                                 return res.send(HelperResult);

//                                             } else if (objMessage.contacts.name.first_name == undefined || validator.isEmpty(objMessage.contacts.name.first_name + '')) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA024", "First Name is required")
//                                                 return res.send(HelperResult);

//                                             } else if (objMessage.contacts.name.last_name == undefined || validator.isEmpty(objMessage.contacts.name.last_name + '')) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA025", "Last Name is required")
//                                                 return res.send(HelperResult);

//                                             } else {
//                                                 return ([1, 6, wabaInfoResult]);

//                                             }
//                                         } catch (error) {
//                                             error = true;
//                                             HelperResult = responseHelper("WA101", "Invalid Payload")
//                                             return res.send(HelperResult);

//                                         }

//                                     case "sticker":
//                                         try {
//                                             let extension = objMessage.url.match(regex);
//                                             if (typeof objMessage.url == undefined || validator.isEmpty(objMessage.url + '')) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA026", "Sticker URL is required")
//                                                 return res.send(HelperResult);
//                                             } else {
//                                                 if (extension[0] == 'webp') {
//                                                     return ([1, 7, wabaInfoResult]);
//                                                 } else {
//                                                     HelperResult = responseHelper("WA041", "Invalid Sticker URL");
//                                                     return res.send(HelperResult);
//                                                 }
//                                             }
//                                         } catch (error) {
//                                             HelperResult = responseHelper("WA101", "Invalid Payload")
//                                             return res.send(HelperResult);
//                                         }

//                                     case "template":
//                                         try {
//                                             if (typeof objMessage.templateid == undefined || validator.isEmpty(objMessage.templateid + '')) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA027", "Template ID is required")
//                                                 return res.send(HelperResult);

//                                             } else {
//                                                 return ([0, 8, wabaInfoResult]);

//                                             }
//                                         } catch (error) {
//                                             HelperResult = responseHelper("WA101", "Invalid Payload")
//                                             return res.send(HelperResult);

//                                         }

//                                     case "interactive":
//                                         try {
//                                             if (typeof objMessage.interactive == undefined || validator.isEmpty(objMessage.interactive + '') || Object.keys(objMessage.interactive).length == 0) {
//                                                 error = true;
//                                                 HelperResult = responseHelper("WA033", "Interactive body is required")
//                                                 return res.send(HelperResult);

//                                             } else {
//                                                 return ([1, 9, wabaInfoResult]);

//                                             }
//                                         } catch (error) {
//                                             HelperResult = responseHelper("WA101", "Invalid Payload")
//                                             return res.send(HelperResult);

//                                         }
//                                 }
//                             }
//                         } catch (error) {
//                             HelperResult = responseHelper("WA100", error.message)
//                             return res.send(HelperResult);

//                         }

//                     }


//                     const validateTemplate = async (validatePayloadResult) => {
//                         try {
//                             let isTemplate = validatePayloadResult[0];
//                             let msgType = validatePayloadResult[1];
//                             let wabaInfoResult = validatePayloadResult[2];
//                             if (isTemplate == 1) {
//                                 switch (msgType) {
//                                     case 0:
//                                     case 1:
//                                     case 2:
//                                     case 3:
//                                         return ([msgType, wabaInfoResult, '']);

//                                     case 4:
//                                         return ([msgType, wabaInfoResult, '']);

//                                     case 5:
//                                         return ([msgType, wabaInfoResult, '']);

//                                     case 6:
//                                         return ([msgType, wabaInfoResult, '']);

//                                     case 7:
//                                         return ([msgType, wabaInfoResult, '']);

//                                     case 9:
//                                         return ([msgType, wabaInfoResult, '']);

//                                 }
//                             } else {
//                                 switch (msgType) {
//                                     case 8:
//                                         let result = await sendService.getTemplate(messageObj.message.templateid);
//                                         if (result.length > 0) {
//                                             return ([msgType, wabaInfoResult, result]);
//                                         } else {
//                                             HelperResult = responseHelper("WA028", "Template ID is invalid")
//                                             return res.send(HelperResult);
//                                         }
//                                 }
//                             }
//                         } catch (error) {
//                             HelperResult = responseHelper("WA100", error.message)
//                             return res.send(HelperResult);
//                         }
//                     }


//                     const createPayload = async (validateTemplateResult) => {
//                         try {

//                             let msgType = validateTemplateResult[0];
//                             let wabaInfoResult = validateTemplateResult[1];
//                             let templateResult = validateTemplateResult[2];
//                             let to = messageObj.to.replace("+", "");
//                             let messagePayload = {};
//                             switch (msgType) {
//                                 case 0:
//                                     messagePayload = {
//                                         "to": to,
//                                         "type": "document",
//                                         "recipient_type": "individual"
//                                     };
//                                     if (setflag == 1) {
//                                         messagePayload.messaging_product = "whatsapp";

//                                     }
//                                     if (setflag == 0) {
//                                         messagePayload.document = {
//                                             "provider": {
//                                                 "name": ""
//                                             }
//                                         }
//                                     }
//                                     if (isMediaID == 0) {
//                                         messagePayload.document = {
//                                             "link": messageObj.message.url,
//                                             "filename": messageObj.message.filename,
//                                             "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
//                                         };

//                                         bodyContent = {
//                                             "body": "<a href='" + messageObj.message.url + "'>Media</a>"
//                                         }
//                                     }
//                                     if (isMediaID == 1) {
//                                         messagePayload.document = {
//                                             "id": messageObj.message.id,
//                                             "filename": fileName
//                                         };

//                                         bodyContent = {
//                                             "body": "<a href='" + s3MediaUrl + "'>Media</a>"
//                                         }
//                                     }
//                                     return ([messagePayload, wabaInfoResult, msgType]);

//                                 case 1:
//                                     messagePayload = {
//                                         "to": to,
//                                         "type": "image",
//                                         "recipient_type": "individual"
//                                     };
//                                     if (setflag == 1) {
//                                         messagePayload.messaging_product = "whatsapp";
//                                     }
//                                     if (setflag == 0) {
//                                         messagePayload.image = {
//                                             "provider": {
//                                                 "name": ""
//                                             }
//                                         }
//                                     }
//                                     if (isMediaID == 0) {
//                                         messagePayload.image = {
//                                             "link": messageObj.message.url,
//                                             "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
//                                         };

//                                         bodyContent = {
//                                             "body": "<a href='" + messageObj.message.url + "'>Media</a>"
//                                         }

//                                         let tmpCaption = null;

//                                         if (messageObj.message.caption != undefined) {
//                                             tmpCaption = messageObj.message.caption;
//                                         }

//                                         if (tmpCaption != undefined && tmpCaption != null) {
//                                             bodyContent.caption = tmpCaption;
//                                         }
//                                     }
//                                     if (isMediaID == 1) {
//                                         messagePayload.image = {
//                                             "id": messageObj.message.id
//                                         };

//                                         bodyContent = {
//                                             "body": "<a href='" + s3MediaUrl + "'>Media</a>"
//                                         }
//                                     }
//                                     return ([messagePayload, wabaInfoResult, msgType]);

//                                 case 2:
//                                     messagePayload = {
//                                         "to": to,
//                                         "type": "video",
//                                         "recipient_type": "individual"
//                                     };
//                                     if (setflag == 1) {
//                                         messagePayload.messaging_product = "whatsapp";
//                                     }
//                                     if (setflag == 0) {
//                                         messagePayload.video = {
//                                             "provider": {
//                                                 "name": ""
//                                             }
//                                         }
//                                     }
//                                     if (isMediaID == 0) {
//                                         messagePayload.video = {
//                                             "link": messageObj.message.url,
//                                             "caption": messageObj.message.caption != undefined ? messageObj.message.caption : ''
//                                         };

//                                         bodyContent = {
//                                             "body": "<a href='" + messageObj.message.url + "'>Media</a>"
//                                         }

//                                         let tmpCaption = null;

//                                         if (messageObj.message.caption != undefined) {
//                                             tmpCaption = messageObj.message.caption;
//                                         }

//                                         if (tmpCaption != undefined && tmpCaption != null) {
//                                             bodyContent.caption = tmpCaption;
//                                         }
//                                     }
//                                     if (isMediaID == 1) {
//                                         messagePayload.video = {
//                                             "id": messageObj.message.id
//                                         };

//                                         bodyContent = {
//                                             "body": "<a href='" + s3MediaUrl + "'>Media</a>"
//                                         }
//                                     }
//                                     return ([messagePayload, wabaInfoResult, msgType]);

//                                 case 3:
//                                     messagePayload = {
//                                         "to": to,
//                                         "type": "audio",
//                                         "recipient_type": "individual"
//                                     };
//                                     if (setflag == 1) {
//                                         messagePayload.messaging_product = "whatsapp";
//                                     }
//                                     if (setflag == 0) {
//                                         messagePayload.audio = {
//                                             "provider": {
//                                                 "name": ""
//                                             }

//                                         };
//                                     }
//                                     if (isMediaID == 0) {
//                                         messagePayload.audio = {

//                                             "link": messageObj.message.url
//                                         };

//                                         bodyContent = {
//                                             "body": "<a href='" + messageObj.message.url + "'>Media</a>"
//                                         }
//                                     }
//                                     if (isMediaID == 1) {
//                                         messagePayload.audio = {
//                                             "id": messageObj.message.id
//                                         };

//                                         bodyContent = {
//                                             "body": "<a href='" + s3MediaUrl + "'>Media</a>"
//                                         }
//                                     }
//                                     return ([messagePayload, wabaInfoResult, msgType]);


//                                 case 4:
//                                     messagePayload = {
//                                         "to": to,
//                                         "type": "text",
//                                         "recipient_type": "individual",
//                                         "text": {
//                                             "body": messageObj.message.text
//                                         }
//                                     };
//                                     if (setflag == 1) {
//                                         messagePayload.messaging_product = "whatsapp";
//                                     }

//                                     bodyContent = {
//                                         "body": messageObj.message.text
//                                     }
//                                     return ([messagePayload, wabaInfoResult, msgType]);

//                                 case 5:
//                                     messagePayload = {
//                                         "to": to,
//                                         "type": "location",
//                                         "location": {
//                                             "longitude": messageObj.message.longitude,
//                                             "latitude": messageObj.message.latitude,
//                                             "name": messageObj.message.name,
//                                             "address": messageObj.message.address
//                                         }
//                                     };
//                                     if (setflag == 1) {
//                                         messagePayload.messaging_product = "whatsapp";
//                                     }

//                                     bodyContent = {
//                                         "body": {
//                                             "latitude": messageObj.message.latitude,
//                                             "longitude": messageObj.message.longitude
//                                         }
//                                     }
//                                     return ([messagePayload, wabaInfoResult, msgType]);


//                                 case 6:
//                                     if (messageObj.message.contacts.phones.length > 0) {

//                                         bodyContent = {
//                                             "body": [{
//                                                 "addresses": [],
//                                                 "emails": [],
//                                                 "ims": [],
//                                                 "name": {
//                                                     "first_name": messageObj.message.contacts.name.first_name,
//                                                     "formatted_name": messageObj.message.contacts.name.first_name,
//                                                     "last_name": messageObj.message.contacts.name.last_name
//                                                 },
//                                                 "org": {},
//                                                 "phones": [],
//                                                 "urls": []
//                                             }]
//                                         }

//                                         messagePayload = {
//                                             "to": to,
//                                             "type": "contacts",
//                                             "recipient_type": "individual",
//                                             "contacts": [{
//                                                 "name": {
//                                                     "first_name": messageObj.message.contacts.name.first_name,
//                                                     "formatted_name": messageObj.message.contacts.name.first_name,
//                                                     "last_name": messageObj.message.contacts.name.last_name
//                                                 },
//                                                 "phones": []
//                                             }]
//                                         };
//                                         if (setflag == 1) {
//                                             messagePayload.messaging_product = "whatsapp";
//                                         }
//                                         for (let i = 0; i < messageObj.message.contacts.phones.length; ++i) {
//                                             if (typeof messageObj.message.contacts.phones[i].phone == undefined ||
//                                                 validator.isEmpty(messageObj.message.contacts.phones[i].phone + '') ||
//                                                 messageObj.message.contacts.phones[i].phone == null) {
//                                                 error = true;
//                                                 return res.send({
//                                                     code: "WA029",
//                                                     status: "FAILED",
//                                                     message: "Mobile number is required",
//                                                     data: {}
//                                                 });
//                                             } else {
//                                                 let phoneObj = {
//                                                     "phone": messageObj.message.contacts.phones[i].phone,
//                                                     "type": messageObj.message.contacts.phones[i].type
//                                                 };
//                                                 messagePayload.contacts[0].phones.push(phoneObj);
//                                                 bodyContent.body[0].phones.push(phoneObj);
//                                             }
//                                         }
//                                         // console.log(JSON.stringify(messagePayload));
//                                     } else {
//                                         return res.send({
//                                             code: "WA030",
//                                             status: 'FAILED',
//                                             message: "Phone is required",
//                                             data: {}
//                                         });
//                                     }
//                                     return ([messagePayload, wabaInfoResult, msgType]);


//                                 case 7:

//                                     messagePayload = {
//                                         "to": to,
//                                         "type": "sticker",
//                                         "recipient_type": "individual",
//                                         "sticker": {
//                                             "link": messageObj.message.url
//                                         }
//                                     };
//                                     if (setflag == 1) {
//                                         messagePayload.messaging_product = "whatsapp";
//                                     }
//                                     if (setflag == 0) {
//                                         messagePayload.sticker.assign = {
//                                             "provider": {
//                                                 "name": ""
//                                             }
//                                         }
//                                     }


//                                     bodyContent = {
//                                         "body": "<a href='" + messageObj.message.url + "'>Media</a>"
//                                     }


//                                     return ([messagePayload, wabaInfoResult, msgType]);


//                                 case 8:
//                                     messagePayload = {
//                                         "to": messageObj.to,
//                                         "type": "template",
//                                         "template": {
//                                             "language": {
//                                                 "code": templateResult[0].langcode
//                                             },
//                                             "name": templateResult[0].temptitle,
//                                             "components": []
//                                         }
//                                     };
//                                     if (setflag == 1) {
//                                         messagePayload.messaging_product = "whatsapp";

//                                     }
//                                     if (setflag == 0) {
//                                         messagePayload.template.namespace = wabaInfoResult[0].hsmnamespace;
//                                         messagePayload.template.language.policy = "deterministic";
//                                     }


//                                     if (templateResult[0].head_temptype != '' && templateResult[0].head_temptype == 1) {
//                                         // console.log('HEAD TEMPTYPE RESULT 1 :' + messageObj.to + ' ' + JSON.stringify(templateResult[0].body_message));
//                                         // console.log('HEAD TEMPTYPE RESULT 1 :' + messageObj.to + ' ' + JSON.stringify(messageObj.message.placeholders));
//                                         if (messageObj.message.placeholders != undefined) {
//                                             if (messageObj.message.placeholders.length > 0) {
//                                                 let placeholderLength;
//                                                 if (templateResult[0].placeholders != null) {
//                                                     placeholderLength = templateResult[0].placeholders.split(",");
//                                                     if (placeholderLength.length == messageObj.message.placeholders.length) {
//                                                         let tempArr = botUtils.fetchPlaceholders(JSON.stringify(messageObj.message.placeholders));
//                                                         let component_body = {
//                                                             "type": "body",
//                                                             "parameters": tempArr
//                                                         }
//                                                         messagePayload.template.components.push(component_body);

//                                                         let i = 1;
//                                                         let tempContent = templateResult[0].body_message.toString();
//                                                         for (let j = 0; j < tempArr.length; j++) {
//                                                             let x = tempArr[j].text;
//                                                             //console.log(x, '{{' + i + '}}');
//                                                             tempContent = tempContent.replace('{{' + i + '}}', x);
//                                                             i++;
//                                                         }
//                                                         bodyContent = {
//                                                             "body": tempContent
//                                                         }
//                                                         // console.log('BODYCONTENT RESULT 1_1 :'+messageObj.to+' '+JSON.stringify(bodyContent));
//                                                     } else {
//                                                         HelperResult = responseHelper("WA031", "Placeholder count mismatch")
//                                                         return res.send(HelperResult);

//                                                     }
//                                                 } else {
//                                                     HelperResult = responseHelper("WA031", "Placeholder count mismatch")
//                                                     return res.send(HelperResult);
//                                                 }
//                                             } else {
//                                                 bodyContent = {
//                                                     "body": templateResult[0].body_message.toString()
//                                                 }

//                                             }
//                                         } else {
//                                             bodyContent = {
//                                                 "body": templateResult[0].body_message.toString()
//                                             }
//                                         }

//                                         if (templateResult[0].head_mediatype != '') {
//                                             let regex = new RegExp('[^.]+$');
//                                             let extension = objMessage.url.match(regex);
//                                             let component_header = {
//                                                 "type": "header",
//                                                 "parameters": []
//                                             }
//                                             if (templateResult[0].head_mediatype == 0) {
//                                                 component_header.parameters.push({
//                                                     "type": "document",
//                                                     "document": {
//                                                         "link": messageObj.message.url,
//                                                         "filename": messageObj.message.filename != undefined ? messageObj.message.filename : ""
//                                                     }
//                                                 });

//                                             }
//                                             if (templateResult[0].head_mediatype == 1) {
//                                                 if (extension[0] == 'png' || extension[0] == 'jpg' || extension[0] == 'jpeg') {
//                                                     component_header.parameters.push({
//                                                         "type": "image",
//                                                         "image": {
//                                                             "link": messageObj.message.url
//                                                         }
//                                                     });
//                                                 } else {
//                                                     HelperResult = responseHelper("WA011", "Invalid Image Url")
//                                                     return res.send(HelperResult);
//                                                 }

//                                             }
//                                             if (templateResult[0].head_mediatype == 2) {
//                                                 if (extension[0] == 'mp4' || extension[0] == '3gp' || extension[0] == '3gpp') {
//                                                     component_header.parameters.push({
//                                                         "type": "video",
//                                                         "video": {
//                                                             "link": messageObj.message.url
//                                                         }
//                                                     });
//                                                 } else {
//                                                     HelperResult = responseHelper("WA012", "Invalid Video Url")
//                                                     return res.send(HelperResult);
//                                                 }

//                                             }
//                                             messagePayload.template.components.push(component_header);
//                                         }

//                                         if (setflag == 0) {
//                                             if (templateResult[0].footer_text != null && templateResult[0].footer_text.length > 0 && templateResult[0].footer_text != '') {
//                                                 let component_header = {
//                                                     "type": "footer",
//                                                     "parameters": [{
//                                                         "type": "text",
//                                                         "text": templateResult[0].footer_text
//                                                     }]
//                                                 }
//                                                 messagePayload.template.components.push(component_header);
//                                             }
//                                         }


//                                         if (templateResult[0].button_option != '' && templateResult[0].button_option == 0) {
//                                             let callToActionArr = JSON.parse(templateResult[0].button_option_string);
//                                             for (let i = 0; i < callToActionArr.length; i++) {
//                                                 if (callToActionArr[i].call_phone != null && callToActionArr[i].call_phone != undefined) {
//                                                     let tempArr = [];
//                                                     let component_button = {
//                                                         "type": "button",
//                                                         "sub_type": "url",
//                                                         "index": i,
//                                                         "parameters": tempArr
//                                                     }
//                                                     tempArr.push({
//                                                         "type": "text",
//                                                         "text": callToActionArr[i].call_phone.phone_button_text
//                                                     });
//                                                 }

//                                                 if (callToActionArr[i].visit_website != null && callToActionArr[i].visit_website != undefined) {
//                                                     let tempArr = [];
//                                                     let component_button = {
//                                                         "type": "button",
//                                                         "sub_type": "url",
//                                                         //"index": i + 1,
//                                                         "index": i,
//                                                         "parameters": tempArr
//                                                     }

//                                                     if (callToActionArr[i].visit_website.web_url_option == 1 && messageObj.message.buttons != undefined) {

//                                                         for (let k = 0; k < messageObj.message.buttons.length; k++) {
//                                                             if (messageObj.message.buttons[k].placeholder != undefined &&
//                                                                 messageObj.message.buttons[k].placeholder.length > 0) {
//                                                                 tempArr.push({
//                                                                     "type": "text",
//                                                                     "text": messageObj.message.buttons[k].placeholder
//                                                                 });
//                                                                 break;
//                                                             } else {
//                                                                 HelperResult = responseHelper("WA035", "Dynamic URL Placeholder is missing")
//                                                                 return res.send(HelperResult);

//                                                             }
//                                                         }

//                                                         component_button.parameters = tempArr;
//                                                         messagePayload.template.components.push(component_button);
//                                                     }
//                                                     if (callToActionArr[i].visit_website.web_url_option == 0) {

//                                                     }
//                                                 }
//                                             }
//                                         }
//                                         if (templateResult[0].button_option != '' && templateResult[0].button_option == 1) {
//                                             let quickReplyArr = messageObj.message.buttons;
//                                             if (quickReplyArr != undefined) {
//                                                 for (let i = 0; i < quickReplyArr.length; ++i) {
//                                                     let tempArr = [];
//                                                     let component_button = {
//                                                         "type": "button",
//                                                         "sub_type": "quick_reply",
//                                                         "index": i,
//                                                         "parameters": tempArr
//                                                     }

//                                                     if (quickReplyArr[i].parameters != undefined) {
//                                                         tempArr.push({
//                                                             "type": "payload",
//                                                             "payload": quickReplyArr[i].parameters[0].payload
//                                                         });
//                                                         component_button.parameters = tempArr;
//                                                     }

//                                                     messagePayload.template.components.push(component_button);
//                                                 }
//                                             } else {
//                                                 HelperResult = responseHelper("WA031", "Quick reply count mismatch")
//                                                 return res.send(HelperResult);

//                                             }

//                                         }
//                                     } else {
//                                         if (messageObj.message.placeholders != undefined) {
//                                             if (messageObj.message.placeholders.length > 0) {
//                                                 let placeholderLength;
//                                                 if (templateResult[0].placeholders != null) {
//                                                     placeholderLength = templateResult[0].placeholders.split(",");
//                                                     // console.log('Length ======================>' + placeholderLength.length, messageObj.message.placeholders.length);

//                                                     if (placeholderLength.length == messageObj.message.placeholders.length) {
//                                                         let tempArr = botUtils.fetchPlaceholders(JSON.stringify(messageObj.message.placeholders));
//                                                         let component_body = {
//                                                             "type": "body",
//                                                             "parameters": tempArr
//                                                         }
//                                                         messagePayload.template.components.push(component_body);

//                                                         let i = 1;
//                                                         let tempContent = templateResult[0].body_message.toString();
//                                                         for (let j = 0; j < tempArr.length; j++) {
//                                                             let x = tempArr[j].text;
//                                                             //console.log(x, '{{' + i + '}}');
//                                                             tempContent = tempContent.replace('{{' + i + '}}', x);
//                                                             i++;
//                                                         }
//                                                         bodyContent = {
//                                                             "body": tempContent
//                                                         }
//                                                     } else {
//                                                         HelperResult = responseHelper("WA031", "Placeholder count mismatch")
//                                                         return res.send(HelperResult);

//                                                     }
//                                                 } else {
//                                                     HelperResult = responseHelper("WA031", "Placeholder count mismatch")
//                                                     return res.send(HelperResult);
//                                                 }
//                                             } else {
//                                                 bodyContent = {
//                                                     "body": templateResult[0].body_message.toString()
//                                                 }
//                                             }

//                                         } else {
//                                             bodyContent = {
//                                                 "body": templateResult[0].body_message.toString()
//                                             }
//                                         }

//                                         // console.log('placeholder_template_type=========================>' + templateResult[0].placeholder_template_type);
//                                         if (templateResult[0].placeholder_template_type != '' &&
//                                             (templateResult[0].placeholder_template_type == 1 || templateResult[0].placeholder_template_type == 2) &&
//                                             templateResult[0].head_text_title != '' &&
//                                             templateResult[0].head_text_title.length > 0) {
//                                             if (messageObj.message.header != undefined && messageObj.message.header.length > 0) {
//                                                 let component_header = {
//                                                     "type": "header",
//                                                     "parameters": [{
//                                                         "type": "text",
//                                                         "text": messageObj.message.header
//                                                     }]
//                                                 }
//                                                 messagePayload.template.components.push(component_header);
//                                             } else {
//                                                 HelperResult = responseHelper("WA034", "Header is missing")
//                                                 return res.send(HelperResult);

//                                             }
//                                         }

//                                         if (setflag == 0) {
//                                             if (templateResult[0].footer_text != null && templateResult[0].footer_text.length > 0 && templateResult[0].footer_text != '') {
//                                                 let component_header = {
//                                                     "type": "footer",
//                                                     "parameters": [{
//                                                         "type": "text",
//                                                         "text": templateResult[0].footer_text
//                                                     }]
//                                                 }
//                                                 messagePayload.template.components.push(component_header);
//                                             }

//                                         }

//                                         if (templateResult[0].button_option != '' && templateResult[0].button_option == 0) {
//                                             let callToActionArr = JSON.parse(templateResult[0].button_option_string);

//                                             for (let i = 0; i < callToActionArr.length; ++i) {
//                                                 if (callToActionArr[i].call_phone != null && callToActionArr[i].call_phone != undefined) {
//                                                     let tempArr = [];
//                                                     let component_button = {
//                                                         "type": "button",
//                                                         "sub_type": "url",
//                                                         "index": i,
//                                                         "parameters": tempArr
//                                                     }
//                                                     tempArr.push({
//                                                         "type": "text",
//                                                         "text": callToActionArr[i].call_phone.phone_button_text
//                                                     });
//                                                 }
//                                                 if (callToActionArr[i].visit_website != null && callToActionArr[i].visit_website != undefined) {
//                                                     let tempArr = [];
//                                                     let component_button = {
//                                                         "type": "button",
//                                                         "sub_type": "url",
//                                                         "index": i,
//                                                         "parameters": tempArr
//                                                     }

//                                                     if (callToActionArr[i].visit_website.web_url_option == 1 && messageObj.message.buttons != undefined) {

//                                                         for (let k = 0; k < messageObj.message.buttons.length; k++) {
//                                                             if (messageObj.message.buttons[k].placeholder != undefined &&
//                                                                 messageObj.message.buttons[k].placeholder.length > 0) {
//                                                                 tempArr.push({
//                                                                     "type": "text",
//                                                                     "text": messageObj.message.buttons[k].placeholder
//                                                                 });
//                                                                 break;
//                                                             } else {
//                                                                 HelperResult = responseHelper("WA035", "Dynamic URL Placeholder is missing")
//                                                                 return res.send(HelperResult);

//                                                             }
//                                                         }

//                                                         component_button.parameters = tempArr;
//                                                         messagePayload.template.components.push(component_button);
//                                                     }
//                                                     if (callToActionArr[i].visit_website.web_url_option == 0) {

//                                                     }
//                                                 }
//                                             }
//                                         }
//                                         if (templateResult[0].button_option != '' && templateResult[0].button_option == 1) {
//                                             let quickReplyArr = messageObj.message.buttons;
//                                             if (quickReplyArr != undefined) {
//                                                 for (let i = 0; i < quickReplyArr.length; ++i) {
//                                                     let tempArr = [];
//                                                     let component_button = {
//                                                         "type": "button",
//                                                         "sub_type": "quick_reply",
//                                                         "index": i,
//                                                         "parameters": tempArr
//                                                     }

//                                                     if (quickReplyArr[i].parameters != undefined) {
//                                                         tempArr.push({
//                                                             "type": "payload",
//                                                             "payload": quickReplyArr[i].parameters[0].payload
//                                                         });
//                                                         component_button.parameters = tempArr;
//                                                     }

//                                                     messagePayload.template.components.push(component_button);
//                                                 }
//                                             } else {
//                                                 HelperResult = responseHelper("WA031", "Quick reply count mismatch")
//                                                 return res.send(HelperResult);

//                                             }
//                                         }
//                                     }
//                                     return ([messagePayload, wabaInfoResult, msgType]);

//                                 case 9:

//                                     messagePayload = {
//                                         "to": to,
//                                         "type": "interactive",
//                                         "recipient_type": "individual",
//                                         "interactive": messageObj.message.interactive
//                                     };
//                                     if (setflag == 1) {
//                                         messagePayload.messaging_product = "whatsapp";
//                                     }
//                                     bodyContent = {
//                                         "body": messageObj.message.interactive.body.text
//                                     }
//                                     return ([messagePayload, wabaInfoResult, msgType]);

//                             }

//                         } catch (error) {
//                             HelperResult = responseHelper("WA100", error.message)
//                             return res.send(HelperResult);

//                         }
//                     }

//                     const checkSubscription = async (createPayloadResult) => {
//                         try {
//                             let messagePayload = createPayloadResult[0];
//                             let wabaInfoResult = createPayloadResult[1];
//                             let msgType = createPayloadResult[2];
//                             if (wabaInfoResult.length > 0) {
//                                 try {
//                                     let result = await sendService.checkSubscription(messagePayload.to, wabaInfoResult[0].wanumber);
//                                     if (result == 0) {
//                                         let direction = 1;
//                                         let waMessageId = null;
//                                         let errorCode = 100;
//                                         let errorDesc = 'No subscription found for the mobile number';
//                                         try {
//                                             let Insertresult = await sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, JSON.stringify(messageObj), bodyContent, countryCodeNumeric);
//                                             let id = Insertresult.insertId;
//                                             try {
//                                                 let UpdateResult = await sendService.updateUnsubscribedMessageAPI(id, countryCodeNumeric);
//                                                 return UpdateResult;
//                                             } catch (error) {
//                                                 HelperResult = responseHelper("WA100", error.message)
//                                                 return res.send(HelperResult);
//                                             }
//                                         } catch (error) {
//                                             HelperResult = responseHelper("WA100", error.message)
//                                             return res.send(HelperResult);
//                                         }
//                                     } else {
//                                         return ([messagePayload, wabaInfoResult, msgType]);
//                                     }
//                                 } catch (error) {
//                                     console.log('Record shifted to sent master');
//                                     HelperResult = responseHelper("WA032", 'No subscription found for the mobile number ' + messagePayload.to)
//                                     return res.send(HelperResult);

//                                 }
//                             } else {
//                                 HelperResult = responseHelper("WA100", "Invalid WABA APIKey")
//                                 return res.send(HelperResult);

//                             }
//                         } catch (error) {
//                             HelperResult = responseHelper("WA100", error.message)
//                             return res.send(HelperResult);
//                         }

//                     }

//                     const sendMessage = async (checkSubscriptionResult) => {
//                         try {

//                             let messagePayload = checkSubscriptionResult[0];
//                             let wabaInfoResult = checkSubscriptionResult[1];
//                             let msgType = checkSubscriptionResult[2];
//                             // console.log("messagePayload==================", messagePayload)
//                             if (setflag == 0) {
//                                 let direction = 1;
//                                 let api = '/v1/messages';
//                                 let httpMethod = 1;
//                                 let requestType = 1;
//                                 let contentLength = Buffer.byteLength(JSON.stringify(messagePayload));
//                                 let apiHeaders = [{
//                                     'headerName': 'Authorization',
//                                     'headerVal': 'Bearer ' + wabaInfoResult[0].authtoken
//                                 }, {
//                                     'headerName': 'content-length',
//                                     'headerVal': contentLength
//                                 }];

//                                 botUtils.callWhatsAppApi(wabaInfoResult[0].waurl, api, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
//                                     if (typeof response.messages != undefined) {
//                                         let errorCode = null;
//                                         let errorDesc = null;
//                                         let waMessageId1 = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
//                                         console.log("waMessageId1==============", waMessageId1)
//                                         sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId1, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, messageObj, bodyContent, countryCodeNumeric).then((result) => {
//                                             console.log({ result })
//                                             errorLogger.info("**********************************************************");
//                                             errorLogger.info("REQUEST_BODY: " + JSON.stringify(req.body));
//                                             errorLogger.info("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
//                                             errorLogger.info("MESSAGE_ID: " + waMessageId1);
//                                             errorLogger.info("**********************************************************");
//                                             return res.send({
//                                                 code: 200,
//                                                 status: 'SUCCESS',
//                                                 message: 'Message Processed Successfully',
//                                                 data: {
//                                                     messageid: waMessageId1
//                                                 }
//                                             });
//                                         }).catch((err) => {
//                                             errorLogger.error("**********************************************************");
//                                             errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
//                                             errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
//                                             errorLogger.error("MESSAGE_ID: " + waMessageId1);
//                                             errorLogger.error("ERROR: " + err);
//                                             errorLogger.error("**********************************************************");
//                                             HelperResult = responseHelper("WA100", err.message)
//                                             return res.send(HelperResult);
//                                         })
//                                     } else {
//                                         HelperResult = responseHelper("WA100", JSON.stringify(response))
//                                         return res.send(HelperResult);

//                                     }
//                                 }).catch((err) => {
//                                     // console.log(err)
//                                     //added for non whatsapp number on 7/8/2022
//                                     if (err.response.data.errors[0].code == '1006') {
//                                         HelperResult = responseHelper("WA102", "Non WhatsApp Number");
//                                         return res.send(HelperResult);

//                                     }

//                                     if (err.response.data.errors[0].code == '1013') {
//                                         HelperResult = responseHelper("WA102", "Non WhatsApp Number");
//                                         return res.send(HelperResult);

//                                     }
//                                     errorLogger.error("**********************************************************");
//                                     errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
//                                     errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
//                                     errorLogger.error("MESSAGE_ID: " + null);
//                                     errorLogger.error("ERROR: " + err);
//                                     errorLogger.error("**********************************************************");
//                                     HelperResult = responseHelper("WA100", err.response.data.errors[0].details);
//                                     return res.send(HelperResult);


//                                 });
//                             } else {

//                                 let direction = 1;
//                                 let httpMethod = 1;
//                                 let requestType = 1;
//                                 let contentLength = Buffer.byteLength(JSON.stringify(messagePayload));
//                                 let apiHeaders = [{
//                                     'headerName': 'Authorization',
//                                     'headerVal': 'Bearer ' + wabaInfoResult[0].authtoken
//                                 }, {
//                                     'headerName': 'content-length',
//                                     'headerVal': contentLength
//                                 }];

//                                 botUtils.callWhatsAppApi1(wabaInfoResult[0].waurl, messagePayload, httpMethod, requestType, apiHeaders).then((response) => {
//                                     if (typeof response.messages != undefined) {
//                                         let errorCode = null;
//                                         let errorDesc = null;
//                                         let waMessageId2 = (typeof response.messages[0].id != undefined) ? response.messages[0].id : '';
//                                         console.log("waMessageId2==============", waMessageId2)
//                                         sendService.insertMessageInSentMasterAPI(0, 0, userId, messagePayload.to, messagePayload, waMessageId2, msgType, 0, wabaInfoResult[0].wanumber, wabaInfoResult[0].wa_msg_setting_id, direction, errorCode, errorDesc, messageObj, bodyContent, countryCodeNumeric).then((result) => {
//                                             // console.log({ result })
//                                             errorLogger.info("**********************************************************");
//                                             errorLogger.info("REQUEST_BODY: " + JSON.stringify(req.body));
//                                             errorLogger.info("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
//                                             errorLogger.info("MESSAGE_ID: " + waMessageId2);
//                                             errorLogger.info("**********************************************************");
//                                             return res.send({
//                                                 code: 200,
//                                                 status: 'SUCCESS',
//                                                 message: 'Message Processed Successfully',
//                                                 data: {
//                                                     messageid: waMessageId2
//                                                 }
//                                             });
//                                         }).catch((err) => {
//                                             errorLogger.error("**********************************************************");
//                                             errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
//                                             errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
//                                             errorLogger.error("MESSAGE_ID: " + waMessageId2);
//                                             errorLogger.error("ERROR: " + err);
//                                             errorLogger.error("**********************************************************");
//                                             HelperResult = responseHelper("WA100", err.message);
//                                             return res.send(HelperResult);

//                                         })
//                                     } else {
//                                         HelperResult = responseHelper("WA100", JSON.stringify(response));
//                                         return res.send(HelperResult);
//                                     }
//                                 }).catch((err) => {

//                                     //added for cloud non whatsapp number on 27/6/2022
//                                     if (err.response.data.error.code == 131009) {
//                                         let tempError = null;
//                                         if (err.response.data.error != undefined && err.response.data.error.error_data != undefined) {
//                                             tempError = err.response.data.error.error_data.details;
//                                         } else if (err.response.data.error != undefined && err.response.data.error.message != undefined) {
//                                             tempError = err.response.data.error.message;
//                                         }
//                                         HelperResult = responseHelper("WA102", tempError);
//                                         return res.send(HelperResult);

//                                     }
//                                     //End...........................//
//                                     console.log('SEND_API_RESPONSE ERROR : ', err.response.data.error.message);
//                                     errorLogger.error("**********************************************************");
//                                     errorLogger.error("REQUEST_BODY: " + JSON.stringify(req.body));
//                                     errorLogger.error("WHATSAPP_PAYLOAD: " + JSON.stringify(messagePayload));
//                                     errorLogger.error("MESSAGE_ID: " + null);
//                                     errorLogger.error("ERROR: " + err);
//                                     errorLogger.error("**********************************************************");
//                                     HelperResult = responseHelper("WA100", err.response.data.error.message);
//                                     return res.send(HelperResult);

//                                 });

//                             }
//                         } catch (error) {
//                             errorLogger.error(JSON.stringify(error));
//                             HelperResult = responseHelper("WA100", error.message);
//                             return res.send(HelperResult);

//                         }

//                     }


//                     (async () => {
//                         try {
//                             const wabaInfoResult1 = await wabaInfo1(userid);
//                             const validatePayloadResult = await validatePayload(wabaInfoResult1);
//                             const validateTemplateResult = await validateTemplate(validatePayloadResult);
//                             const createPayloadResult = await createPayload(validateTemplateResult);
//                             const checkSubscriptionResult = await checkSubscription(createPayloadResult);
//                             const sendMessageResult = await sendMessage(checkSubscriptionResult);
//                         } catch (error) {
//                             HelperResult = responseHelper("WA100", error.message);
//                             return res.send(HelperResult);

//                         }
//                     })();
//                 }

//             } catch (error) {
//                 errorLogger.error(JSON.stringify(error));
//                 HelperResult = responseHelper("WA100", error.message != undefined ? error.message : 'Request Failed');
//                 return res.send(HelperResult);

//             }

//         }


//         (async () => {
//             try {
//                 let validateWanumberResult = await validateWanumber();
//                 let callOptinResult = await callOptin(validateWanumberResult);

//             } catch (error) {
//                 HelperResult = responseHelper("WA100", error.message);
//                 return res.send(HelperResult);
//             }
//         })();
//     } catch (error) {

//         errorLogger.error(JSON.stringify(error));
//         HelperResult = responseHelper("WA100", error.message != undefined ? error.message : 'Request Failed');
//         return res.send(HelperResult);
//     }

// }



