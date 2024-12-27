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

const batchSize = 25;

module.exports = async (req, res) => {
    try {

        
        let result;
        //API key Validation
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
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
        //const campaignCount = await templateService.updateCampaignCounts(campaignId);
        let tempPath, fileType, msgDateTime;
        
        if(!(campainDetails && campainDetails.csv_filename)){
            return responseHelper(404, 'CSV File not found'); 
        }

       

        //Reading file from database
        const filePath = `http://68.183.90.255/assets/campaigncsv/${userId}/${campainDetails.csv_filename}`;
        // console.log(filePath);
        try {
            csvFiles = await axios.get(filePath, {
                responseType: 'arraybuffer'
            });
            // wafile = await fs.readFile(filePath);
            fileType = csvFiles.headers['content-type'];
            // fileLength = csvFiles.headers['content-length'];
            // fileBuffer = csvFiles.data;
            await fs.access(`uploads`).catch(async err => {
            await fs.mkdir(`uploads`);
            });
            tempPath = `uploads/${userId}_${campainDetails.csv_filename}`;
            await fs.writeFile(tempPath, csvFiles.data);
        } catch (error) {
            return responseHelper(404, 'Media File not found');
        }

       
        //checking file type
        if (fileType == 'text/csv') {
            result = await csvtojson().fromFile(tempPath);
        } else {
            const excelSheet = xlsx.readFile(tempPath);
            result = xlsx.utils.sheet_to_json(excelSheet.Sheets.Sheet1);
        }
       // await fs.unlink(tempPath);
        if (!(result && result[0] && Object.keys(result[0]).length && Object.keys(result[0])[0] == 'mobileNumber')) {
            return responseHelper(400, "First Column must be 'mobileNumber'");
        }

        if (!(result && result[0] && Object.keys(result[0]).length && Object.keys(result[0])[1] == 'mediaURL')) {
            return responseHelper(400, "Second Column must be 'mediaURL'");
        }

        
        if(result.length > 100000) {
            return responseHelper(400, "Exceeded the mobile numbers allowed");
        }

        //update Msg Counts in campaignDetails
        if(result.length){
            const campaignMsgCount = await templateService.updateCampaignMsgCounts(result.length, campaignId);   
        }

         // Checking place holders with template   
        let templateDetails  = await templateService.getTemplateDetails(campainDetails.templateid, userId);

        if (!templateDetails) {
            return responseHelper(404, 'Template details no found')
        }

        if(campainDetails.is_schedule == 1){
            msgDateTime = campainDetails.schedule_datetime;  
        }

        // 1 -> All Placeholders, 2 -> Header + Body, 3 -> Body, 4 - Dynamic url + Body
        templateDetails.placeholders = (templateDetails && templateDetails.placeholders) ? templateDetails.placeholders.split(',') : [];

        if(parseInt(templateDetails.placeholder_template_type) == 1){
            const [ __, mediaURL, h1, d1, ...filePlaceholders ] = Object.values(result[0]);
            if (filePlaceholders.length != templateDetails.placeholders.length || !mediaURL|| !h1 || !d1) {
                return responseHelper(400, "Either Media URL or header or dynamic values are missing or Placeholders does not match with template");
            }
            result = result.map(item => {
                item.mobileNumber = item.mobileNumber.toString();
                const [ _, mediaURL, h1, d1, ...args] = Object.values(item);
                return {
                    mobileNumber: item.mobileNumber,
                    placeholders: args,
                    mediaURL,
                    h1,
                    d1
                };
            });
        }

        if(parseInt(templateDetails.placeholder_template_type) == 2){
            const [ __, mediaURL, h1, ...filePlaceholders ] = Object.values(result[0]);
            if (filePlaceholders.length != templateDetails.placeholders.length || !mediaURL|| !h1) {
                return responseHelper(400, "Either Media URL or header are missing or Placeholders does not match with template");
            }
            result = result.map(item => {
                item.mobileNumber = item.mobileNumber.toString();
                const [ _, mediaURL, h1, ...args] = Object.values(item);
                return {
                    mobileNumber: item.mobileNumber,
                    placeholders: args,
                    mediaURL,
                    h1
                };
            });
        }

        if(parseInt(templateDetails.placeholder_template_type) == 3){
            const [ __, mediaURL, ...filePlaceholders ] = Object.values(result[0]);
            if (filePlaceholders.length != templateDetails.placeholders.length || !mediaURL) {
                return responseHelper(400, "Either Media URL is missing or Placeholders does not match with template");
            }
            result = result.map(item => {
                item.mobileNumber = item.mobileNumber.toString();
                const [ _, mediaURL, ...args] = Object.values(item);
                return {
                    mobileNumber: item.mobileNumber,
                    placeholders: args,
                    mediaURL
                };
            });
        }

        if(parseInt(templateDetails.placeholder_template_type) == 4){
            const [ __, mediaURL, d1, ...filePlaceholders ] = Object.values(result[0]);
            if (filePlaceholders.length != templateDetails.placeholders.length || !mediaURL|| !d1) {
                return responseHelper(400, "Either Media URL or dynamic URL is missing or Placeholders does not match with template");
            }
            result = result.map(item => {
                item.mobileNumber = item.mobileNumber.toString();
                const [ _, mediaURL, d1, ...args] = Object.values(item);
                return {
                    mobileNumber: item.mobileNumber,
                    placeholders: args,
                    mediaURL,
                    d1
                };
            });
        }
        
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

        //Removing Special Character and checking the mobile number against the campaign
        const contacts = await Promise.all(result.map(async waNumber => {
            waNumber.mobileNumber = waNumber.mobileNumber.replace(/[^0-9]/g, "");
            return contactService.getOneContact(waNumber.mobileNumber, userId);
        }));

        let contactsToInsert = result.filter((_, index) => !contacts[index].length);

        // if (!contactsToInsert.length) {
        //     return responseHelper(400, 'Either the contacts are already inserted or CSV or Excel file is corrupted.');
        // }

        contactsToInsert = contactsToInsert.map(waNumber => {
            const countryCode = botUtils.getCountryCode(waNumber.mobileNumber);
            waNumber.mobileNumber = botUtils.formatMobileLocal(waNumber.mobileNumber, countryCode);
            return {
                mobileNumber: waNumber.mobileNumber,
                placeholders: waNumber.placeholders,
                mediaURL: waNumber.mediaURL,
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
                item.mediaURL = resultInObj[item.wanumber][0].mediaURL; 
                item.h1 = resultInObj[item.wanumber][0].h1;
                item.d1 = resultInObj[item.wanumber][0].d1;

            const countryCode = botUtils.getCountryCode(item.wanumber);
            item.wanumber = botUtils.formatMobileLocal(item.wanumber, countryCode);

            // Extract the placeholder from the above file 
            return {
                fromFile: false,
                mobileNumber: botUtils.formatMobileWhatsapp(item.wanumber, countryCode),
                placeholders: item.placeholders,
                mediaURL: item.mediaURL,
                h1: item.h1,
                d1: item.d1
            };
        }))

       
      
        let appIdFlag = 0;
        let mediaFlag = 2;

       if(result && result.length){
            const optinContacts = await contactService.selectAlreadyOptin(result, userId);
            optinContactList = optinContacts.map(item => {
                ++appIdFlag; 
                const urlData = resultInObj[item.wanumber][0].mediaURL.split('/');
                const mediaFileName = urlData[urlData.length - 1];  

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
                    media: resultInObj[item.wanumber][0].mediaURL || null,
                    mediaflag: mediaFlag,
                    placeholders: resultInObj[item.wanumber][0].placeholders || null,
                    filename: mediaFileName || null,
                    language: templateDetails.langcode,
                    priority: userPriority,
                    header_placeholder: resultInObj[item.wanumber][0].h1 || null,                                    
                    dynamic_url_placeholder: resultInObj[item.wanumber][0].d1 || null, 
                    createdt: msgDateTime || null,
                    appid: appIdFlag % 5,
                    campaignid: campainDetails.campaignid,
                    contactno: campainDetails.contactno,
                    msg_setting_id: campainDetails.msg_setting_id
                }
            })

            if (optinContactList && optinContactList.length) {
                await templateService.insertIntoRequestMaster(optinContactList);
                console.log('\x1b[36m%s\x1b[0m', `Optin Batch  Completed\n`);
            }
        }

        const iteratorLength = (waIdList.length % batchSize) == 0 ? (waIdList.length / batchSize): (waIdList.length / batchSize) + 1;
        
        const executeWhatsappBatch = async (callback) => {
            if (!iteratorLength) {
                //console.log('iteratorLength ', iteratorLength);
                await callback();
            }
            for (let index = 0; index < parseInt(iteratorLength); index++) {
                setTimeout(async () => {
                    try {
                    const campaignStatusCode = await templateService.getcampaignStatus(campaignId);
                    if (campaignStatusCode != 0 && campaignStatusCode != 1) {
                        console.log("Either the campaign is Paused or Cancelled");
                        return;
                    }
                    //console.time('ExecutionTime');
                    const tempWaIdList = Object.assign({}, waIdList);
                    // Replace waIdList with tempWaIdList and check if it is working as expected
                    let waIdBatch = waIdList.splice(0, batchSize);
                    waIdBatch = waIdBatch.map(item => item.mobileNumber);
                    
                    let waContactList;
                    try {
                        waContactList = await whatsappService.getContactList(authtoken, waurl, waIdBatch);
                    } catch (error) {
                        try {
                            await timeUtils.wait(1);
                            console.log(`Batch ${index + 1} | Retry 1 | Time: ${new Date().toLocaleString()}\n`);
                            waContactList = await whatsappService.getContactList(authtoken, waurl, waIdBatch);
                        } catch (error) {
                            try {
                                await timeUtils.wait(1);
                                console.log(`Batch ${index + 1} | Retry 2 | Time: ${new Date().toLocaleString()}\n`);
                                waContactList = await whatsappService.getContactList(authtoken, waurl, waIdBatch);
                            } catch (error) {
                                console.log('\x1b[31m%s\x1b[0m', `Batch ${index + 1} Failed\n`);
                                    return;
                                // try {
                                //     await timeUtils.wait(1);
                                //     console.log(`Batch ${index + 1} | Retry 3 | Time: ${new Date().toLocaleString()}\n`);
                                //     waContactList = await whatsappService.getContactList(authtoken, waurl, waIdBatch);
                                // } catch (error) {
                                //     console.log('\x1b[31m%s\x1b[0m', `Batch ${index + 1} Failed\n`);
                                //     return;
                                // }
                            }
                        }
                    }
    

                    const validWaContactList = [];
                    appIdFlag = 0;
                    if (waContactList && waContactList.length) {
                        const contactList = waContactList.map((item, i) => {
                            if (item.status == 'valid') {  
                                ++appIdFlag; 

                                const urlData = tempWaIdList[i].mediaURL.split('/');
                                const mediaFileName = urlData[urlData.length - 1];
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
                                    media: tempWaIdList[i].mediaURL || null,
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
                                    msg_setting_id: campainDetails.msg_setting_id
                                })
                            }
                            return {
                                wanumber: item.input,
                                status: item.status == 'valid' ? 1 : 2,
                                wa_id: item.wa_id || null
                            }
                        })
                        if (validWaContactList && validWaContactList.length) {
                            await templateService.insertIntoRequestMaster(validWaContactList);
                        }
                        await contactService.updateContactList(contactList);
                        
                    }
                    //console.timeEnd('ExecutionTime');
                    console.log('\x1b[36m%s\x1b[0m', `Batch ${index + 1} Completed\n`);
                    if (parseInt(iteratorLength) == index + 1) {
                        // console.log('iteratorLength == index + 1 ', iteratorLength, index);
                        await callback();
                    }
                } catch (error) {
                    errorLogger.error(JSON.stringify(error));
                }

                }, 1000 * index);        
            }
        }
        
        const executeNonWhatsappBatch = async () => {
            try {
           
                const invalidWhatsAppNumber = await contactService.getInvalidWhatsAppNumber(result, userId);
                if(invalidWhatsAppNumber && invalidWhatsAppNumber.length){
                    await templateService.insertIntoNonWhatsMaster(invalidWhatsAppNumber, campaignId, userId);  
                }
                console.log('\x1b[36m%s\x1b[0m', `Non whatsApp Batch Completed\n`); 
               // await templateService.updateCampaignDetails(6, campaignId);
            } catch (error) {
                errorLogger.error(JSON.stringify(error));
            }
        }

        await executeWhatsappBatch(executeNonWhatsappBatch);
        //await templateService.updateCampaignDetails(1, campaignId);
        return responseHelper(200, 'The Media Campaign is completed');
    } catch (error) {
        console.log(error);

        errorLogger.error(JSON.stringify(error));
        //return;
      return responseHelper(500, error.messagetype, null, error);
    }
}
