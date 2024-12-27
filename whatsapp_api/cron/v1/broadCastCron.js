const cron = require('node-cron');
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


module.exports = cron.schedule('*/2 * * * * *', async () => {
    try {
        
        const campaignList = await templateService.selectCampaignId();


        if(!(campaignList && campaignList.length)){
            console.log('No campaign files to process');
            return;
        }
        await Promise.all(campaignList.map(async oneCampaign => {

            const { userId, campaignId } = oneCampaign;
            const userPriority = await userService.getUserIdPriority(userId);
            const campainDetails = await templateService.getCampaignDetails(userId, campaignId);
            let templateDetails  = await templateService.getTemplateDetails(campainDetails.templateid, userId);
            await templateService.updateCampaignDetails(1, campaignId);
    
            // User Validation
            if (!userId) {
                console.log('User not found');
                return;
            }
            
            if (!campaignId) {
                console.log('campaign Id is needed');
                return;
            }
    
            let result = await contactService.selectTempContacts(userId, campaignId);
            if(!result.length){
                console.log('No broadcast contacts to process');
                return;
            }
    
            // getting users details
            const { waurl, authtoken, hsmnamespace } = await userService.getWaUserSettings(campaignId);
    
            //Getting campaign Details 
            if (!templateDetails) {
                console.log('Template details not found');
                return;
            }
    
            let mediaFlag = 0;
            let msgDateTime;
            if (templateDetails.head_temptype == '1') { // media
                mediaFlag = 1;
            }

            if(campainDetails.is_schedule == 1){
                msgDateTime = campainDetails.schedule_datetime;  
            }
    
            result = _.uniqBy(result, 'mobileNumber');
    
            const invalidContacts = [];
            result = result.filter(waNumber => {
                if (waNumber.mobileNumber.length >= 12) {
                    return true;
                }
                invalidContacts.push(waNumber.mobileNumber);
                return false;
            })
    
            if (invalidContacts.length) {
                setImmediate(() => {
                    contactService.insertInvalidContacts(invalidContacts, userId, campaignId).catch(err => {
                        errorLogger.error(JSON.stringify(err));
                        
                    });
                })
                
            }
    
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

            const resultInObj = _.groupBy(result, 'mobileNumber');
    
            const expiredContacts = await contactService.getExpiredContacts(result, userId);
            let waNumberResult = await contactService.getWaNumberFromContacts(result, userId);
            waNumberResult = waNumberResult.concat(expiredContacts);
    
            // map all the mobile numbers as per whatsapp formate
            let waIdList = [];
            waIdList = waIdList.concat(waNumberResult.map(item => {
                item.placeholders = resultInObj[item.wanumber][0].placeholders;
                item.h1 = resultInObj[item.wanumber][0].h1;
                item.d1 = resultInObj[item.wanumber][0].d1;
                item.media = resultInObj[item.wanumber][0].media;
                item.filename = resultInObj[item.wanumber][0].filename; 
                const countryCode = botUtils.getCountryCode(item.wanumber);
                item.wanumber = botUtils.formatMobileLocal(item.wanumber, countryCode);
    
                // Extract the placeholder from the above file 
                return {
                    mobileNumber: item.wanumber,
                    placeholders: item.placeholders,
                    h1: item.h1,
                    d1: item.d1,
                    media: item.media,
                    filename: item.filename
                };
            }));

            let appIdFlag = 0;
            let appIdFlagoptin = 0;
            const isoptin = 0;
    
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
                        createdt: msgDateTime || null,
                        appid: appIdFlagoptin % 5,
                        campaignid: campainDetails.campaignid,
                        contactno: campainDetails.contactno,
                        msg_setting_id: campainDetails.msg_setting_id,
                        isoptin: item.wastatus
                    }
                })
    
                if (optinContactList && optinContactList.length) {
                    const invalidWhatsAppNumber = await contactService.getInvalidWhatsAppNumber(result, userId);
                    if(invalidWhatsAppNumber && invalidWhatsAppNumber.length){
                        await contactService.insertIntoNonWhatsMaster(invalidWhatsAppNumber, campaignId, userId);
                    }
                    await templateService.insertIntoRequestMaster(optinContactList);
                    await contactService.deletefailedTempContacts(optinContactList, userId, campaignId);
                    console.log('invalidWhatsAppNumber', invalidWhatsAppNumber.length);
                   
                    console.log('\x1b[36m%s\x1b[0m', `Optin Batch Completed\n`);
                }
            }
                
            if (waIdList && waIdList.length) {
               // const tempWaIdList = JSON.parse(JSON.stringify(waIdList));
               console.log("waIdList", waIdList)
                const contactList = waIdList.map((item) => {
                    ++appIdFlag;                            
                    return {
                        userid: userId,
                        mobileno: item.mobileNumber, 
                        wabaurl: waurl,
                        templateid: templateDetails.tempid, 
                        botid: 0,
                        accesstoken: authtoken,
                        namespace: hsmnamespace,
                        templatetitle: templateDetails.temptitle,
                        messagetype: campainDetails.template_type,
                        media: item.media || null,
                        mediaflag: mediaFlag,
                        placeholders: item.placeholders || null,
                        filename: item.filename || null,
                        language: templateDetails.langcode,
                        priority: userPriority,
                        header_placeholder: item.h1 || null,                                    
                        dynamic_url_placeholder: item.d1 || null, 
                        createdt: msgDateTime || null,
                        appid: appIdFlag % 5,
                        campaignid: campainDetails.campaignid,
                        contactno: campainDetails.contactno,
                        msg_setting_id: campainDetails.msg_setting_id,
                        isoptin: 0
                    }
                });
    
                if (contactList && contactList.length) {
                    await templateService.insertIntoRequestMaster(contactList);
                    await contactService.deletefailedTempContacts(contactList, userId, campaignId);
                    console.log('contactList', contactList.length);
                    console.log('\x1b[36m%s\x1b[0m', `Non Optin Batch is processing\n`);
                }
               
                //await templateService.updateCampaignDetails(2, campaignId);

            }
            if (invalidContacts && invalidContacts.length) {
                await contactService.deleteTempContacts(invalidContacts, userId, campaignId);
                //console.log('invalidContacts', invalidContacts);
            }
           
            console.log('Broad cast cron stopped');
        }));
    
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        //return;
        return responseHelper(500, error.messagetype, null, error);
    }
}, {
    scheduled: true
})