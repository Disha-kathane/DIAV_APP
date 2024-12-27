const whatsappService = require('../../services/v1/whatsapp');
const templateService = require('../../services/v1/template');
const userService = require('../../services/v1/users');
const config = require('../../config');
var appLoggers = require('../../applogger.js');
const axios = require('axios');
const fs = require('fs');
var FormData = require('form-data');
const async = require('async');
const path = require('path');
const mimeTypes = require('mime-types');
const responseHelper = require('../../utils/responseHelper');
var errorLogger = appLoggers.errorLogger;
module.exports = async (req, res) => {
    try {
        console.log('Media Token Request Body : ' + JSON.stringify(req.body));
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
        let { waurl, authtoken, hsmnamespace, phone_number_id } = await userService.getWaUserSettings(campaignId);
        // Campaignid Validation
        if (!(campaignId)) {
            return responseHelper(400, 'campaign Id is needed');
        }

        if (phone_number_id != null) {
            authtoken = await userService.fetchAccessToken();
        }

        //Getting campaign Details 
        // const campainDetails = await templateService.getCampaignDetails(userId, campaignId, 0);

        const campainDetails = await templateService.getCampaignDetailsNew(userId, campaignId);
        let templateDetails = await templateService.getTemplateDetails(campainDetails.templateid, userId);

        if (!templateDetails) {
            return responseHelper(404, 'Template details no found');
        }

        if (campainDetails.mediaurltype == 0 && phone_number_id == null) { //commonURL
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
        else if (campainDetails.mediaurltype == 0 && phone_number_id != null) {
            let waMediafile, mediaFileType, mediaFileLength, mediaFileBuffer, waMediaFileName;

            async.waterfall([
                (done) => {
                    try {
                        waurl = waurl.replace('messages', 'media');
                        waMediaFileName = path.basename(campainDetails.mediaurl);
                        // axios.get(campainDetails.mediaurl, {
                        //     responseType: 'stream'
                        // }).then(response => {
                        //     // Saving file to working directory
                        //     writeToFile(response, campainDetails.mediaurl, (err, waMediaFileResult) => {
                        //         mediaFileType = response.data.headers['content-type'];
                        //         done(null, waMediaFileResult, mediaFileType);
                        //     });
                        // }).catch(error => {
                        //     console.log(error);
                        //     done('File Error');
                        // });

                        downloadFile(waMediafile, campainDetails.mediaurl, (err, waMediaFileResult, contentTypeResult) => {
                            if (err) {
                                done('File Error');
                            } else {
                                mediaFileType = contentTypeResult;
                                console.log('Content-Type : ' + mediaFileType);
                                done(null, waMediaFileResult, mediaFileType);
                            }
                        });
                    } catch (error) {
                        console.log('downloadFile Error : ' + error);
                        done('File not found');
                    }
                },
                (waMediafile, mediaFileType, done) => {
                    console.log('File Size : ' + getFilesizeInBytes(waMediafile));
                    var data = new FormData();
                    data.append('file', fs.createReadStream(waMediafile));
                    data.append('messaging_product', 'whatsapp');
                    // data.append('type', mediaFileType);

                    var config = {
                        method: 'POST',
                        url: waurl,
                        headers: {
                            // 'Content-Type': 'application/json',
                            'Content-Type': mediaFileType,
                            'Authorization': 'Bearer ' + authtoken,
                            'cache-control': 'no-cache',
                            ...data.getHeaders()
                        },
                        maxBodyLength: Infinity,
                        data: data
                    };

                    axios(config)
                        .then(function (response) {
                            console.log(JSON.stringify(response.data));
                            templateService.insertMediaDetails(response.data.id, templateDetails.head_mediatype, campainDetails.mediaurl, waMediaFileName, userId);
                            fs.unlinkSync(waMediafile);
                            done(null, response.data.id);
                        })
                        .catch(function (error) {
                            console.log(error);
                            done('Media Upload Error');
                        });
                }
            ], (err, result) => {
                if (err) {
                    res.send({
                        code: 400,
                        status: 'FAILED',
                        message: err,
                        data: []
                    });
                } else {
                    res.send({
                        code: 200,
                        status: 'SUCCESS',
                        message: 'Token Generated',
                        data: {
                            mediaToken: result,
                            fileName: waMediaFileName
                        }
                    });
                }
            });
        }

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return responseHelper(500, error.message, null, error);
    }
};


// function writeToFile(response, mediaurl, next) {
//     waMediafile = '/home/whatsapp_api/assets/media/' + new Date().getTime() + '_' + path.basename(mediaurl);
//     response.data.pipe(fs.createWriteStream(waMediafile));
//     next(null, waMediafile);
// }


async function downloadFile(waMediafile, mediaurl, next) {
    let response = await axios.get(mediaurl, {
        responseType: 'stream'
    });

    // waMediafile = '/home/DIAV_Backend_Apps/whatsapp_api/assets/media/' + new Date().getTime() + '_' + path.basename(mediaurl);
    waMediafile = '/home/DIAV_Backend_Prod_Apps/DIAV_Backend_Apps/whatsapp_api/assets/media/' + new Date().getTime() + '_' + path.basename(mediaurl);
    let writer = fs.createWriteStream(waMediafile);
    response.data.pipe(writer);

    writer.on('finish', () => {
        next(null, waMediafile, response.data.headers['content-type']);
    });

    writer.on('error', () => {
        next(err);
    });
}

function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}