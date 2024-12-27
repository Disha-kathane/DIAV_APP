const whatsappService = require('../../services/v1/whatsapp');
const templateService = require('../../services/v1/template')
const userService = require('../../services/v1/users');
const config = require('../../config');
var appLoggers = require('../../applogger.js');
const axios = require('axios');
const fs = require('fs/promises');
const mimeTypes = require('mime-types');
const responseHelper = require('../../utils/responseHelper');
var errorLogger = appLoggers.errorLogger;
module.exports = async (req, res) => {
    try {
        console.log('Media Token Request Body : ' + JSON.stringify(req.body));
        console.log('Media Token API KEY : ' + req.headers.apikey);
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
        // const campainDetails = await templateService.getCampaignDetails(userId, campaignId, 0);

        const campainDetails = await templateService.getCampaignDetailsNew(userId, campaignId);
        let templateDetails = await templateService.getTemplateDetails(campainDetails.templateid, userId);
       

        if (!templateDetails) {
            return responseHelper(404, 'Template details no found')
        }

        if (campainDetails.mediaurltype == 0) { //commonURL
            let waMediafile, mediaFileType, mediaFileLength, mediaFileBuffer;
            if (campainDetails.mediaurl != null && campainDetails.mediaurl.length > 0) {
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
            console.log('Media Token ID : ' + JSON.stringify(mediaToken));
            await templateService.insertMediaDetails(mediaToken, templateDetails.head_mediatype, campainDetails.mediaurl, templateDetails.head_media_filename, userId);
            return responseHelper(200, 'Token Generated', {
                mediaToken: mediaToken,
                fileName: mediaFileName
            });
        }

    } catch (error) {
        console.log('MEdia token MAin Error : '+error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.message, null, error);
    }
}