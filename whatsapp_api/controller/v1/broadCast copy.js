const botUtils = require('../../utils/bot');
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

const batchSize = 50;

module.exports = async (req, res) => {
    try {
        let result;
        //API Validation
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
        const apiKey = req.headers.apikey;
        const campaignId = req.body.campaignId;
        const { userId, wabaId } = await userService.getUserId(apiKey);
        

        // User Validation
        if (!userId) {
            return responseHelper(400, 'Correct API Key is required');
        }
        // getting users details
        const { waurl, authtoken, hsmnamespace } = await userService.getUserSettings(userId);
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
            return responseHelper(404, 'File not found');
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
            let waMediafile, mediaFileType, mediaFileLength, mediaFileBuffer;
           
            if(templateDetails.head_media_filename != null && templateDetails.head_media_filename.length > 0) {
                try {
                    waMediafile = await axios.get(`http://68.183.90.255/assets/watemplates/${userId}/${templateDetails.head_media_filename}`, {
                        responseType: 'arraybuffer'
                    });
                    
                    // waMediafile = await fs.readFile(`assets/watemplates/${userId}/${templateDetails.head_media_filename}`)
                } catch (error) {
                    return responseHelper(400, "File not found");
                }
                mediaFileBuffer = waMediafile.data;
                mediaFileType = waMediafile.headers['content-type'];
                mediaFileLength = waMediafile.headers['content-length'];
                mediaFileName = templateDetails.head_media_filename;
                mediaFlag = 1;
            }

            if(templateDetails.head_media_url != null && templateDetails.head_media_url.length > 0){
                try {
                    waMediafile = await axios.get(templateDetails.head_media_url, {
                        responseType: 'arraybuffer'
                    });
                } catch (error) {
                    return responseHelper(400, 'File not found');
                }
                mediaFileType = waMediafile.headers['content-type'];
                mediaFileLength = waMediafile.headers['content-length'];
                mediaFileBuffer = waMediafile.data;
                [mediaFileName] = templateDetails.head_media_url.match(/[^\/]+$/g);
                mediaFlag = 1;
            }

            mediaToken = await whatsappService.getWhatsappMediaId(waurl, authtoken, mediaFileBuffer, mediaFileType);
            await templateService.insertMediaDetails(mediaToken, templateDetails.head_mediatype, templateDetails.head_media_url, templateDetails.head_media_filename, userId);
        }

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
        const contacts = await Promise.all(result.map(async waNumber => {
            waNumber.mobileNumber = waNumber.mobileNumber.replace(/[^0-9]/g, "");
            return contactService.getOneContact(waNumber.mobileNumber, userId);
        }));

        let contactsToInsert = result.filter((_, index) => !contacts[index].length);

        // if (!contactsToInsert.length) {
        //     return responseHelper(400, 'Contacts already inserted');
        // }

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

        if(contactsToInsert && contactsToInsert.length){
            await contactService.insertContacts(contactsToInsert, userId, campaignId);
        }
        if (invalidContacts.length) {
            setImmediate(() => {
                contactService.insertInvalidContacts(invalidContacts, userId).catch(err => {
                    console.log(err);
                    errorLogger.error(JSON.stringify(err));
                });
            })
        }

        const waNumberResult = await contactService.getWaNumberFromContacts();
        const waIdList = contactsToInsert && contactsToInsert.length ? 
            contactsToInsert.map(item => {
                const countryCode = botUtils.getCountryCode(item.mobileNumber);
                item.mobileNumber = botUtils.formatMobileLocal(item.mobileNumber, countryCode);
                return {
                    fromFile: true,
                    mobileNumber: botUtils.formatMobileWhatsapp(item.mobileNumber, countryCode),
                    placeholders: item.placeholders,
                    h1: item.h1,
                    d1: item.d1
                };
            }) :
            waNumberResult.map(item => {
                const countryCode = botUtils.getCountryCode(item.wanumber);
                item.wanumber = botUtils.formatMobileLocal(item.wanumber, countryCode);
                return {
                    fromFile: false,
                    mobileNumber: botUtils.formatMobileWhatsapp(item.wanumber, countryCode)
                };
            })
        const iteratorLength = (waIdList.length % batchSize) == 0 ? (waIdList.length / batchSize): (waIdList.length / batchSize) + 1;
        for (let index = 0; index < parseInt(iteratorLength); index++) {
            setTimeout(async () => {
                //console.time('ExecutionTime');
                const tempWaIdList = Object.assign({}, waIdList);
                let waIdBatch = waIdList.splice(0, batchSize);
                waIdBatch = waIdBatch.map(item => item.mobileNumber);
                const waContactList = await whatsappService.getContactList(authtoken, waurl, waIdBatch);

                const validWaContactList = [];
                let appIdFlag = 0;
                if (waContactList && waContactList.length) {
                    const contactList = waContactList.map((item, i) => {
                        if (item.status == 'valid' && tempWaIdList[i].fromFile) {   
                             
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
                                priority: 5,
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
                    await templateService.insertIntoRequestMaster(validWaContactList, userId);
                    await contactService.updateContactList(contactList);
                }
                //console.timeEnd('ExecutionTime');
                console.log('\x1b[36m%s\x1b[0m', `Batch ${index + 1} Completed\n`);

            }, 1000 * index);        
        }
        await templateService.updateCampaignDetails(campaignId);
        return responseHelper(200, 'The Campaign is completed');
    } catch (error) {
       // console.log(error);
        return responseHelper(500, error.messagetype, null, error);
    }
}
