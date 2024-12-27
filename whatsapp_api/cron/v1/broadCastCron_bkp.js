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
const cron = require('node-cron');

const batchSize = 25;

const broadCastAPI = async (retry) => {
    try {
       
        const [ oneCampaign ] = await templateService.selectCampaignId(1);
        if(!oneCampaign){
            console.log('No campaign files to process');
            return;
        }
        let result;
        if (typeof retry != 'number') {
            retry = 0;
        };
        const { userId, campaignId } = oneCampaign;

        const userPriority = await userService.getUserIdPriority(userId);   
        const campainDetails = await templateService.getCampaignDetails(userId, campaignId);
        let templateDetails  = await templateService.getTemplateDetails(campainDetails.templateid, userId);
        await templateService.updateCampaignDetails(1, campaignId);

        // User Validation
        if (!userId) {
            return responseHelper(400, 'Correct API Key is required');
        }
        // getting users details
        // const { waurl, authtoken, hsmnamespace } = await userService.getUserSettings(userId);
        const { waurl, authtoken, hsmnamespace } = await userService.getWaUserSettings(campaignId);
        // Campaignid Validation
        if (!(campaignId)) {
            return console.log(400, 'campaign Id is needed');
        }
        
        let tempPath, fileType;
        
        if(!(campainDetails && campainDetails.csv_filename)){
            return console.log(404, 'File not found'); 
        }

        if (!templateDetails) {
            return console.log(404, 'Template details not found')
        }

        let mediaToken, mediaFileName;
        let mediaFlag = 0;

        if (templateDetails.head_temptype == '1') { // media
            if(campainDetails.mediaurltype == 0){
                mediaFlag = 1;
            }else{
                mediaFlag = 2;
            }
        }

        result = await contactService.selectTempContacts(userId, campaignId);
        console.log('Campaign Started', campaignId, result.length);
        //console.log(result);

        if(!(result.length)){
            console.log('The Campaign is already processed');
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
                d1: waNumber.d1,
                media: waNumber.media,
                filename: waNumber.filename
            };
        })

        if (contactsToInsert && contactsToInsert.length) {
            await contactService.insertContacts(contactsToInsert, userId, campaignId);
        }

       
        if (invalidContacts.length) {
            setImmediate(() => {
                contactService.insertInvalidContacts(invalidContacts, userId, campaignId).then(async () => {
                    await contactService.deleteTempContacts(invalidContacts, userId, campaignId);
                }).catch(err => {
                    console.log(err);
                    errorLogger.error(JSON.stringify(err));
                });
            })
        }

        if (!(result && result.length)) {
            return console.log(200, 'No records to process');
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
                item.media = resultInObj[item.wanumber][0].media;
                item.filename = resultInObj[item.wanumber][0].filename; 
            // }
            const countryCode = botUtils.getCountryCode(item.wanumber);
            item.wanumber = botUtils.formatMobileLocal(item.wanumber, countryCode);


            // Extract the placeholder from the above file 
            return {
                fromFile: false,
                mobileNumber: botUtils.formatMobileWhatsapp(item.wanumber, countryCode),
                placeholders: item.placeholders,
                h1: item.h1,
                d1: item.d1,
                media: item.media,
                filename: item.filename
                
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
                    media: resultInObj[item.wanumber][0].media || null,
                    mediaflag: mediaFlag,
                    placeholders: resultInObj[item.wanumber][0].placeholders || null,
                    filename: resultInObj[item.wanumber][0].filename || null,
                    language: templateDetails.langcode,
                    priority: userPriority,
                    header_placeholder: resultInObj[item.wanumber][0].h1 || null,                                    
                    dynamic_url_placeholder: resultInObj[item.wanumber][0].d1 || null, 
                    createdt: null,
                    appid: appIdFlagoptin % 5,
                    campaignid: campainDetails.campaignid,
                    contactno: campainDetails.contactno,
                    msg_setting_id: campainDetails.msg_setting_id,
                    isoptin: item.wastatus  
                }
            })

            if (optinContactList && optinContactList.length) {
                await templateService.insertIntoRequestMaster(optinContactList);
                await contactService.deletefailedTempContacts(optinContactList, userId, campaignId);
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
                                //console.log(result);
                                return result[0];
                            } catch (error) {
                               // console.log(error);
                                //errorLogger.error(JSON.stringify(error));
                                console.log( waurl, [ oneRecord ]);
                                errorLogger.error(JSON.stringify(error.toString()));
                                //console.log('\x1b[31m%s\x1b[0m', `Number ${oneRecord} Failed\n`);
                                return {};
                            }
                        }))
        
                        const validWaContactList = [];
                        let appIdFlag = 0;
                        if (waContactList && waContactList.length) {
                            const contactList = waContactList.map((item, i) => {
                                if (item.status) {
                                    ++appIdFlag;                                
                                     validWaContactList.push({
                                        userid: userId,
                                        mobileno: tempWaIdList[i].mobileNumber.replace(/[^0-9]/g, ""), 
                                        wabaurl: waurl,
                                        templateid: templateDetails.tempid, 
                                        botid: 0,
                                        accesstoken: authtoken,
                                        namespace: hsmnamespace,
                                        templatetitle: templateDetails.temptitle,
                                        messagetype: campainDetails.template_type,
                                        media: tempWaIdList[i].media || null,
                                        mediaflag: mediaFlag,
                                        placeholders: tempWaIdList[i].placeholders || null,
                                        filename: tempWaIdList[i].filename || null,
                                        language: templateDetails.langcode,
                                        priority: userPriority,
                                        header_placeholder: tempWaIdList[i].h1 || null,                                    
                                        dynamic_url_placeholder: tempWaIdList[i].d1 || null, 
                                        createdt: null,
                                        appid: appIdFlag % 5,
                                        campaignid: campainDetails.campaignid,
                                        contactno: campainDetails.contactno,
                                        msg_setting_id: campainDetails.msg_setting_id,
                                        isoptin: item.status == 'valid' ? 1 : 2
                                    })
                                }
                                return {
                                    wanumber: item.input,
                                    status: item.status == 'valid' ? 1 : 2,
                                    wa_id: item.wa_id || null
                                }
                            }).filter(item => item.wanumber);

                            if (validWaContactList && validWaContactList.length) {
                                await templateService.insertIntoRequestMaster(validWaContactList);
                                await contactService.deletefailedTempContacts(validWaContactList, userId, campaignId);
                            }
                            await contactService.updateContactList(contactList);
                        }

                        //console.timeEnd('ExecutionTime');
                        console.log('\x1b[36m%s\x1b[0m', `Batch ${index + 1} Completed | Time: ${new Date().toLocaleString()}\n`);
        
                        if (parseInt(iteratorLength) == index + 1) {
                            // console.log('iteratorLength == index + 1 ', iteratorLength, index);
                            await callback();
                        }
                    } catch (error) {
                        //console.log(error);
                        errorLogger.error(JSON.stringify(error.toString()));
                    }
                }, 1000 * index);        
            }
        }
        
        const executeNonWhatsappBatch = async () => {
            try {
                // retry 1
                const retryOne = await contactService.selectTempContacts(userId, campaignId);
                console.log('failedRecords: ', retryOne.length);
                if(retryOne && retryOne.length && retry < 10){
                    // await whatsappService.callBroadCastAPI(apiKey, campaignId, ++req.body.retry);
                    await templateService.updateCampaignDetails(0, campaignId);
                    console.log('\x1b[36m%s\x1b[0m', `Retrying ${retryOne.length} records | Round ${retry}\n`);
                    await broadCastAPI(++retry);
                } else {
                    // save in send master
                    const failedNumbers = await contactService.selectFailedNumber(result, userId);
                    if(failedNumbers && failedNumbers.length){
                        const errorcode = 400;
                        const errormessage = 'TimeOut' ;
                        const createDate = new Date();
                        await contactService.insertIntoSendMaster(failedNumbers, errorcode, errormessage, createDate, userId, campaignId, campainDetails.contactno); 
                    }

                    console.log('\x1b[36m%s\x1b[0m', `Optin process is Completed\n`); 
                    await templateService.updateCampaignDetails(6, campaignId);
                }

                
            } catch (error) {
                console.log(error);
                errorLogger.error(JSON.stringify(error));
            }
        }

        await executeWhatsappBatch(executeNonWhatsappBatch);
       
        //return responseHelper(200, 'The Campaign is completed');
    } catch (error) {
        //console.log(error);
        errorLogger.error(JSON.stringify(error));
        //return;
        //return responseHelper(500, error.messagetype, null, error);
    }
}

// broadCastAPI()
//     .then(resp => console.log('success'))
//     .catch(console.log);

// module.exports = cron.schedule('*/30 * * * * *', () => {}, {
//     scheduled: false
// })


module.exports = cron.schedule('*/1 * * * *', broadCastAPI, { scheduled: false });