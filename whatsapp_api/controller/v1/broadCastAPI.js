const botUtils = require('../../utils/bot');
const timeUtils = require('../../utils/time');
const whatsappService = require('../../services/v1/whatsapp');
const responseHelper = require('../../utils/responseHelper');
const contactService = require('../../services/v1/contacts');
const userService = require('../../services/v1/users');
const templateService = require('../../services/v1/template')
const config = require('../../config');
const csvtojson = require('csvtojson');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
const fs = require('fs/promises');
const mimeTypes = require('mime-types');
const _ = require('lodash');
const xlsx = require('xlsx');
const { template } = require('lodash');
const axios = require('axios');
const { connectLogger } = require('log4js');
const { default: async } = require('async');

const batchSize = 50;

const broadCastAPI = async (req, res) => {
    try {
        let result;
        //API Validation
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
        req.body.retry = req.body.retry || 1;
        const apiKey = req.headers.apikey;
        const campaignId = req.body.campaignId;
        
        const { userId, wabaId } = await userService.getUserId(apiKey);
        const userPriority = await userService.getUserIdPriority(userId);

      
        // User Validation
        if (!userId) {
            return responseHelper(400, 'Correct API Key is required');
        }
        // getting users details
       // const { waurl, authtoken, hsmnamespace } = await userService.getUserSettings(userId);
        const { waurl, authtoken, hsmnamespace } = await userService.getWaUserSettings(campaignId);
        // Campaignid Validation
        if (!(campaignId)) {
            return responseHelper(400, 'campaign Id is needed');
        }

        //Getting campaign Details 
        const campainDetails = await templateService.getCampaignDetails(userId, campaignId);

        
        let tempPath, fileType, msgDateTime;
        
        if(!(campainDetails && campainDetails.csv_filename)){
            return responseHelper(404, 'File not found'); 
        }

         // Checking place holders with template   
        let templateDetails  = await templateService.getTemplateDetails(campainDetails.templateid, userId);

        if (!templateDetails) {
            return responseHelper(404, 'Template details not found')
        }

        

        // 1 -> All Placeholders, 2 -> Header + Body, 3 -> Body, 4 - Dynamic url + Body
        templateDetails.placeholders = (templateDetails && templateDetails.placeholders) ? templateDetails.placeholders.split(',') : [];

        let mediaToken, mediaFileName;
        let mediaFlag = 0;
        if (templateDetails.head_temptype == '1') { // media
            if(campainDetails.mediaurltype == 0){ //commonURL
                let waMediafile, mediaFileType, mediaFileLength, mediaFileBuffer;
                if(campainDetails.mediaurl != null && campainDetails.mediaurl.length > 0){
                    try {
                        waMediafile = await axios.get(campainDetails.mediaurl, {
                            responseType: 'arraybuffer'
                        });
                    } catch (error) {
                        return responseHelper(400, 'File not found');
                    }
                    mediaFileType = waMediafile.headers['content-type'];
                    mediaFileLength = waMediafile.headers['content-length'];
                    mediaFileBuffer = waMediafile.data;
                    [mediaFileName] = campainDetails.mediaurl.match(/[^\/]+$/g);

                    //const urlData = campainDetails.mediaurl.split('/');
                    //const mediaFileName = urlData[urlData.length - 1];   
                    mediaFlag = 1;
                }
    
                mediaToken = await whatsappService.getWhatsappMediaId(waurl, authtoken, mediaFileBuffer, mediaFileType);
                await templateService.insertMediaDetails(mediaToken, templateDetails.head_mediatype, campainDetails.mediaurl, templateDetails.head_media_filename, userId);
            
            }
        }

        result = await contactService.selectTempContacts(userId, campaignId);
        //console.log(result);

        if(!(result.length)){
            return responseHelper(200, 'The Campaign is already processed');
        }

        //console.log(result);
        //Sorting Unique Mobile Number
        result = _.uniqBy(result, 'mobileNumber');
        const botId = '0';
        const invalidContacts = [];
        result = result.filter(waNumber => {
            if (waNumber.mobileNumber.length >= 12) {
                return true;
            }
            
            invalidContacts.push(waNumber.mobileNumber);
            return false;
        })




        //Removing Special Character and checking the mobile number against the user
        const contacts = await Promise.all(result.map(async waNumber => {
            waNumber.mobileNumber = waNumber.mobileNumber.replace(/[^0-9]/g, "");
            return contactService.getOneContact(waNumber.mobileNumber, userId);
        }));

        let contactsToInsert = result.filter((_, index) => !contacts[index].length);

        contactsToInsert = contactsToInsert.map(waNumber => {
            const countryCode = botUtils.getCountryCode(waNumber.mobileNumber);
            waNumber.mobileNumber = botUtils.formatMobileLocal(waNumber.mobileNumber, countryCode);
            return {
                mobileNumber: waNumber.mobileNumber,
                placeholders: waNumber.placeholders,
                h1: waNumber.h1,
                d1: waNumber.d1
            };
        })

        if (contactsToInsert && contactsToInsert.length) {
            await contactService.insertContacts(contactsToInsert, userId, campaignId);
        }

        
        if (invalidContacts.length) {
            setImmediate(() => {
                contactService.insertInvalidContacts(invalidContacts, userId, campaignId).catch(err => {
                    console.log(err);
                    errorLogger.error(JSON.stringify(err));
                });
            })
        }

        // Group result array by mobileNumbers
        // IMPORTANT: mobileNumbers in result array must be unique
        const resultInObj = _.groupBy(result, 'mobileNumber');


        const expiredContacts = await contactService.getExpiredContacts(result, userId);  
        let waNumberResult = await contactService.getWaNumberFromContacts(result, userId);
        waNumberResult = waNumberResult.concat(expiredContacts);

        // map all the mobile numbers as per whatsapp formate
        let waIdList = [];
        waIdList = waIdList.concat(waNumberResult.map(item => {
            // const index = result.findIndex(oneResult => oneResult.mobileNumber == item.wanumber);
            // if (index + 1) {
                item.placeholders = resultInObj[item.wanumber][0].placeholders;
                item.h1 = resultInObj[item.wanumber][0].h1;
                item.d1 = resultInObj[item.wanumber][0].d1;
            // }
            const countryCode = botUtils.getCountryCode(item.wanumber);
            item.wanumber = botUtils.formatMobileLocal(item.wanumber, countryCode);


            // Extract the placeholder from the above file 
            return {
                fromFile: false,
                mobileNumber: botUtils.formatMobileWhatsapp(item.wanumber, countryCode),
                placeholders: item.placeholders,
                h1: item.h1,
                d1: item.d1
            };
        }))
      
        let appIdFlagoptin = 0;

       if (result && result.length) {

            const optinContacts = await contactService.selectAlreadyOptin(result, userId);
        
            optinContactList = optinContacts.map(item => {
                ++appIdFlagoptin; 
                return {
                    userid: userId,
                    mobileno: item.wanumber, 
                    wabaurl: waurl,
                    templateid: templateDetails.tempid, 
                    botid: 0,
                    accesstoken: authtoken,
                    namespace: hsmnamespace,
                    templatetitle: templateDetails.temptitle,
                    messagetype: campainDetails.template_type,
                    media: mediaToken || null,
                    mediaflag: mediaFlag,
                    placeholders: resultInObj[item.wanumber][0].placeholders || null,
                    filename: mediaFileName || null,
                    language: templateDetails.langcode,
                    priority: userPriority,
                    header_placeholder: resultInObj[item.wanumber][0].h1 || null,                                    
                    dynamic_url_placeholder: resultInObj[item.wanumber][0].d1 || null, 
                    createdt: msgDateTime || null,
                    appid: appIdFlagoptin % 5,
                    campaignid: campainDetails.campaignid,
                    contactno: campainDetails.contactno,
                    msg_setting_id: campainDetails.msg_setting_id,
                    isoptin: item.wastatus
                   
                }
            })

            if (optinContactList && optinContactList.length) {
                await templateService.insertIntoRequestMaster(optinContactList);
                await contactService.updateTempContacts(optinContactList, userId, campaignId);
                //await contactService.deleteTempContacts(optinContactList, userId, campaignId);
                console.log('\x1b[36m%s\x1b[0m', `Optin Batch Completed\n`);
               
            }
        }
        
        const iteratorLength = (waIdList.length % batchSize) == 0 ? (waIdList.length / batchSize): (waIdList.length / batchSize) + 1;
        const executeWhatsappBatch = async (callback) => {
            if (!iteratorLength) {
                console.log('iteratorLength ', iteratorLength);
                await callback();
            }
            for (let index = 0; index < parseInt(iteratorLength); index++) {
                setTimeout(async () => {
                    try {
                        const tempWaIdList = JSON.parse(JSON.stringify(waIdList));
                        let waIdBatch = waIdList.splice(0, batchSize);
                        waIdBatch = waIdBatch.map(item => item.mobileNumber);
                        
                        const campaignStatusCode = await templateService.getcampaignStatus(campaignId);
                        if (campaignStatusCode != 0 && campaignStatusCode != 1) {
                            console.log("Either the campaign is Paused or Cancelled");
                            return;
                        }
                        //console.time('ExecutionTime');
                        let waContactList;
                        waContactList = await Promise.all(waIdBatch.map(async oneRecord => {
                            try {
                                let result = await whatsappService.getContactList(authtoken, waurl, [ oneRecord ]);
                                return result[0];
                            } catch (error) {
                                console.log('\x1b[31m%s\x1b[0m', `Number ${oneRecord} Failed\n`);
                                return {};
                            }
                        }))
        
                        const validWaContactList = [];
                        let appIdFlag = 0;
                        if (waContactList && waContactList.length) {
                            const contactList = waContactList.map((item, i) => {
                                // if (item.status == 'valid') {
                                    ++appIdFlag;                                
                                    validWaContactList.push({
                                        userid: userId,
                                        mobileno: item.wa_id, 
                                        wabaurl: waurl,
                                        templateid: templateDetails.tempid, 
                                        botid: 0,
                                        accesstoken: authtoken,
                                        namespace: hsmnamespace,
                                        templatetitle: templateDetails.temptitle,
                                        messagetype: campainDetails.template_type,
                                        media: mediaToken || null,
                                        mediaflag: mediaFlag,
                                        placeholders: tempWaIdList[i].placeholders || null,
                                        filename: mediaFileName || null,
                                        language: templateDetails.langcode,
                                        priority: userPriority,
                                        header_placeholder: tempWaIdList[i].h1 || null,                                    
                                        dynamic_url_placeholder: tempWaIdList[i].d1 || null, 
                                        createdt: msgDateTime || null,
                                        appid: appIdFlag % 5,
                                        campaignid: campainDetails.campaignid,
                                        contactno: campainDetails.contactno,
                                        msg_setting_id: campainDetails.msg_setting_id,
                                        isoptin: item.status == 'valid' ? 1 : 2
                                    })
                                // }
                                return {
                                    wanumber: item.input,
                                    status: item.status == 'valid' ? 1 : 2,
                                    wa_id: item.wa_id || null
                                }
                            }).filter(item => item.wanumber);

                            if (validWaContactList && validWaContactList.length) {
                                await templateService.insertIntoRequestMaster(validWaContactList);
                            }

                            await contactService.updateContactList(contactList);
                            await contactService.updateTempContacts(contactList, userId, campaignId);
                            //await contactService.deletefailedTempContacts(contactList, userId, campaignId);
                        }
                        //console.timeEnd('ExecutionTime');
                        console.log('\x1b[36m%s\x1b[0m', `Batch ${index + 1} Completed | Time: ${new Date().toLocaleString()}\n`);
        
                        if (parseInt(iteratorLength) == index + 1) {
                           // console.log('iteratorLength == index + 1 ', iteratorLength, index);
                            await callback();
                        }
                    } catch (error) {
                        errorLogger.error(JSON.stringify(error.toString()));
                    }
                }, 1000 * index);        
            }
        }
        
        const executeNonWhatsappBatch = async () => {
            try {
                // retry 1
                if (req.body.retry < 10) {
                    const retryOne = await contactService.selectTempContacts(userId, campaignId);
                    if(retryOne && retryOne.length){
                        // await whatsappService.callBroadCastAPI(apiKey, campaignId, ++req.body.retry);
                        await broadCastAPI({
                            headers: { apikey: apiKey },
                            body: {
                                retry: ++req.body.retry,
                                campaignId
                            }
                        }).catch(err => {
                            console.log(err);
                        })
                        console.log('\x1b[36m%s\x1b[0m', `Retrying ${retryOne.length} records | Round ${req.body.retry}\n`);
                    }    
                } else {
                    // save in send master
                    const failedNumbers = await contactService.selectFailedNumber(result, userId);
                    if(failedNumbers && failedNumbers.length){
                        const errorcode = 400;
                        const errormessage = 'TimeOut' ;
                        const createDate = new Date();
                        await contactService.insertIntoSendMaster(failedNumbers, errorcode, errormessage, createDate, userId, campaignId); 
                    }

                    const invalidWhatsAppNumber = await contactService.getInvalidWhatsAppNumber(result, userId);
                    if(invalidWhatsAppNumber && invalidWhatsAppNumber.length){
                        await templateService.insertIntoNonWhatsMaster(invalidWhatsAppNumber, campaignId, userId);
                        await contactService.deletefailedTempContacts(invalidWhatsAppNumber, userId, campaignId);
                        //await contactService.deletefailedTempContacts(invalidWhatsAppNumber, userId, campaignId);  
                    }
                    console.log('\x1b[36m%s\x1b[0m', `Non whatsApp Batch Completed\n`); 
                }

               
            } catch (error) {
                errorLogger.error(JSON.stringify(error));
            }
        }

        await executeWhatsappBatch(executeNonWhatsappBatch);
        
        //await templateService.updateCampaignDetails(campaignId);
        return responseHelper(200, 'The Campaign is completed');
    } catch (error) {
        //console.log(error);
        errorLogger.error(JSON.stringify(error));
        //return;
        return responseHelper(500, error.messagetype, null, error);
    }
}

module.exports = broadCastAPI;