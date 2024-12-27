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
const campaignFiles = 5;
const totalRecords = 100;

module.exports = cron.schedule('*/2 * * * * *', async () => {
    try {
        console.log('Optin cron started');
        const campaignList = await templateService.getCampaignId(campaignFiles);
        const batchSize = parseInt(totalRecords / campaignList.length);
        console.log('campaignList', campaignList);
        console.log('batchSize', batchSize);

        
        if(!(campaignList && campaignList.length)){
            console.log('No records to optin');
            return;
        }
        await Promise.all(campaignList.map(async oneCampaign => {
            const { userId, campaignId } = oneCampaign;
            // const { waurl, authtoken, hsmnamespace } = await userService.getWaUserSettings(campaignId);
            console.log(waurl, authtoken, campaignId);
            const optinMobileNumbers = await contactService.getMobileNumbersToOptin(userId, campaignId, batchSize);
            if(!(optinMobileNumbers && optinMobileNumbers.length)){
                console.log('No records to optin'); 
            }

            let optInSuccessContacts = [];
            let optInFailedContacts = [];
            
            await Promise.all(optinMobileNumbers.map(async oneRecord => {
                try {
                    const countryCode = botUtils.getCountryCode(oneRecord.mobileno);
                    //oneRecord.mobileno = botUtils.formatMobileLocal(oneRecord.mobileno, countryCode);
                    oneRecord.mobileno = botUtils.formatMobileWhatsapp(oneRecord.mobileno, countryCode);
                    let result = await whatsappService.getContactList(oneRecord.accesstoken, oneRecord.wabaurl, [ oneRecord.mobileno]);
                   // console.log(result[0]);
                    optInSuccessContacts.push(result[0]);
                    return;
                } catch (error) {
                    await contactService.updateOptinRetryAttempt(userId, campaignId, [ oneRecord.mobileno ])
                    console.log('\x1b[31m%s\x1b[0m', `Number ${oneRecord.mobileno} ${campaignId} Failed\n`);
                    optInFailedContacts.push(oneRecord);
                    return;  
                }
            }).filter(item => item));

            const contactList = optInSuccessContacts.map(item => {
                return {
                    wanumber: item.input,
                    status: item.status == 'valid' ? 1 : 2,
                    wa_id: item.wa_id || null
                }
            });

            const validContactList = contactList.filter(item => {
                return item.status == 1;
            })

            const invalidContactList = contactList.filter(item => {
                return item.status == 2;
            })

            if(validContactList && validContactList.length){
                //console.log('validContactList',validContactList);
                await contactService.updateOptinStatus(validContactList, userId, campaignId, 1);
            }

            if(invalidContactList && invalidContactList.length){
                
               // console.log('invalidContactList',invalidContactList);
                await contactService.insertIntoNonWhatsMaster(invalidContactList, campaignId, userId);
                await contactService.updateOptinStatus(invalidContactList, userId, campaignId, 2);
                //await contactService.deleteInvalidMobileNo(invalidContactList, campaignId, userId);
            }

            if(contactList && contactList.length){
                await contactService.updateContactList(contactList);
            }

            console.log('Optin cron stopped');
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