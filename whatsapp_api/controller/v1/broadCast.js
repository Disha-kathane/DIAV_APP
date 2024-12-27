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
        //API Validation
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
        const apiKey = req.headers.apikey;
       
        const { userId, wabaId } = await userService.getUserId(apiKey);
        const userPriority = await userService.getUserIdPriority(userId);

        const campaignId = req.body.campaignId;
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
            return responseHelper(404, 'CSV File not found');
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
            const [ __, h1, d1, ...filePlaceholders ] = Object.values(result[0]);
            if (filePlaceholders.length != templateDetails.placeholders.length || !h1 || !d1) {
                return responseHelper(400, "Either header or dynamic values are missing or Placeholders does not match with template");
            }
            result = result.map(item => {
                item.mobileNumber = item.mobileNumber.toString();
                const [ _, h1, d1, ...args] = Object.values(item);
                return {
                    mobileNumber: item.mobileNumber,
                    placeholders: args,
                    h1,
                    d1
                };
            });
        }

        if(parseInt(templateDetails.placeholder_template_type) == 2){
            const [ __, h1, ...filePlaceholders ] = Object.values(result[0]);
            if (filePlaceholders.length != templateDetails.placeholders.length || !h1) {
                return responseHelper(400, "Either header are missing or Placeholders does not match with template");
            }
            result = result.map(item => {
                item.mobileNumber = item.mobileNumber.toString();
                const [ _, h1, ...args] = Object.values(item);
                return {
                    mobileNumber: item.mobileNumber,
                    placeholders: args,
                    h1
                };
            });
        }

        if(parseInt(templateDetails.placeholder_template_type) == 3){
            const [ __, ...filePlaceholders ] = Object.values(result[0]);
            if (filePlaceholders.length != templateDetails.placeholders.length) {
                return responseHelper(400, "Placeholders does not match with template");
            }
            result = result.map(item => {
                item.mobileNumber = item.mobileNumber.toString();
                const [ _, ...args] = Object.values(item);
                return {
                    mobileNumber: item.mobileNumber,
                    placeholders: args
                };
            });
        }

        if(parseInt(templateDetails.placeholder_template_type) == 4){
            const [ __, d1, ...filePlaceholders ] = Object.values(result[0]);
            if (filePlaceholders.length != templateDetails.placeholders.length || !d1) {
                return responseHelper(400, "Either dynamic URL is missing or Placeholders does not match with template");
            }
            result = result.map(item => {
                item.mobileNumber = item.mobileNumber.toString();
                const [ _, d1, ...args] = Object.values(item);
                return {
                    mobileNumber: item.mobileNumber,
                    placeholders: args,
                    d1
                };
            });
        }
        
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

       


        //checking the mobile number against the campaign
        // const sendWaNumber = await contactService.alreadyInsertWaNumbers(userId, result, campaignId);
        // if(!(sendWaNumber && sendWaNumber.length)){
        //     let tempContactsToInsert = await contactService.InsertTempWaNumbers(result, campaignId, userId);   
        // }

        // if(sendWaNumber && sendWaNumber.length){
        //     result = result.filter((value) => sendWaNumber.findIndex((item) => item.wanumber == value.mobileNumber) + 1);
        // }



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

       if(result && result.length){

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
                //await contactService.deleteTempContacts(optinContactList, userId, campaignId);
                console.log('\x1b[36m%s\x1b[0m', `Optin Batch Completed\n`);
               
            }
        }
        
        const iteratorLength = (waIdList.length % batchSize) == 0 ? (waIdList.length / batchSize): (waIdList.length / batchSize) + 1;
        const executeWhatsappBatch = async (callback) => {
            if (!iteratorLength) {
               // console.log('iteratorLength ', iteratorLength);
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
                        // try {
                        //     waContactList = await whatsappService.getContactList(authtoken, waurl, waIdBatch);
                        // } catch (error) {
                        //     try {
                        //         await timeUtils.wait(1);
                        //         console.log(`Batch ${index + 1} | Retry 1 | Time: ${new Date().toLocaleString()}\n`);
                        //         waContactList = await whatsappService.getContactList(authtoken, waurl, waIdBatch);
                        //     } catch (error) {
                        //         try {
                        //             await timeUtils.wait(1);
                        //             console.log(`Batch ${index + 1} | Retry 2 | Time: ${new Date().toLocaleString()}\n`);
                        //             waContactList = await whatsappService.getContactList(authtoken, waurl, waIdBatch);
                        //         } catch (error) {

                        //             console.log('\x1b[31m%s\x1b[0m', `Batch ${index + 1} Failed\n`);
                        //                 return;
                        //             // try {
                        //             //     await timeUtils.wait(1);
                        //             //     console.log(`Batch ${index + 1} | Retry 3 | Time: ${new Date().toLocaleString()}\n`);
                        //             //     waContactList = await whatsappService.getContactList(authtoken, waurl, waIdBatch);
                        //             // } catch (error) {
                        //             //     console.log('\x1b[31m%s\x1b[0m', `Batch ${index + 1} Failed\n`);
                        //             //     return;
                        //             // }
                        //         }
                        //     }
                        // }

                        waContactList = await Promise.all(waIdBatch.map(async oneRecord => {
                            try {
                                let result = await whatsappService.getContactList(authtoken, waurl, [ oneRecord ]);
                                return result[0];
                            } catch (error) {
                          
                                console.log('\x1b[31m%s\x1b[0m', `Batch ${oneRecord} Failed\n`);
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
                                //}
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
                }, 1000 * index * 2);        
            }
        }
        
        const executeNonWhatsappBatch = async () => {
            try {
                const invalidWhatsAppNumber = await contactService.getInvalidWhatsAppNumber(result, userId);
                if(invalidWhatsAppNumber && invalidWhatsAppNumber.length){
                    await templateService.insertIntoNonWhatsMaster(invalidWhatsAppNumber, campaignId, userId);
                    //await contactService.deletefailedTempContacts(invalidWhatsAppNumber, userId, campaignId);  
                }
                //const updateResult =  await templateService.updateCampaignDetails(6, campaignId);
                //console.log(updateResult);
                console.log('\x1b[36m%s\x1b[0m', `Non whatsApp Batch Completed\n`);
                
            } catch (error) {
                errorLogger.error(JSON.stringify(error));
            }
        }

        await executeWhatsappBatch(executeNonWhatsappBatch);
        
        await templateService.updateCampaignDetails(1, campaignId);
        return responseHelper(200, 'The Campaign is completed');
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        //return;
        return responseHelper(500, error.messagetype, null, error);
    }
}
