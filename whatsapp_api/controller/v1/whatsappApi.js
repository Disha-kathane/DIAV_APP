
const responseHelper = require('../../utils/responseHelper');
const userService = require('../../services/v1/users');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
let httpUrl = require('url');
let http = require('http');
let https = require('https');
let validateFileSize = require('../../utils/validateFileSize');
const { json } = require('stream/consumers');



module.exports = async (req, res) => {
    try {
        console.log("hey");


        console.log("rehvhghjbnj", req.body)
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }

        if (!req.headers.wanumber) {
            return responseHelper(403, 'Wanumber is required');
        }

        const WabaNumber = req.headers.wanumber;
        const apiKey = req.headers.apikey;

        console.log({ WabaNumber, apiKey })
        const { userId, wabaId, wanumber } = await userService.validateUser(apiKey, WabaNumber);
        if (!userId || !wabaId || !wanumber) {
            return responseHelper(404, 'Correct API Key And Wabanumber is required');
        }
        //     // User Validation

        if (!req.body.url) {
            return responseHelper(403, 'Media-Url is required');
        } else {
            let mediaUrl = req.body.url;

            let headers = {
                'cache-control': 'no-cache'
            };


            let config1 = {
                url: mediaUrl,
                method: 'GET',
                baseURL: mediaUrl,
                headers: headers,
                responseType: 'arraybuffer',
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            };

            try {
                const fileName = req.body.url.substring(req.body.url.lastIndexOf('/') + 1);

                console.log("url ======, ", fileName)
                // Extract the file extension from the file name
                const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1);
                console.log(fileExtension, "fileExtension");

                // Image Size validation
                if (fileExtension == "png" || fileExtension == "jpg" || fileExtension == "jpeg") {
                    let tempFileSize = await validateFileSize.fileSize(req.body.url);
                    console.log(tempFileSize, "Image File Size");
                    if (tempFileSize.urlFileSizeinMB > 5) {
                        return responseHelper(400, 'MediaUrl size is large');
                    }
                }

                // Video Size Validation
                if (fileExtension == "mp4" || fileExtension == "3gp" || fileExtension == "3gpp") {
                    let tempFileSize = await validateFileSize.fileSize(req.body.url);
                    console.log(tempFileSize, "Vided File Size");
                    if (tempFileSize.urlFileSizeinMB > 16) {
                        return responseHelper(400, 'MediaUrl size is large');
                    }
                }

                // Document Size Validation
                if (fileExtension == "pdf" || fileExtension == "txt" || fileExtension == "odt" || fileExtension == "pages") {
                    let tempFileSize = await validateFileSize.fileSize(req.body.url);
                    console.log(tempFileSize, "Document File Size");
                    if (tempFileSize.urlFileSizeinMB > 100) {
                        return responseHelper(400, 'MediaUrl size is large');
                    }
                }


                let protocol = httpUrl.parse(req.body.url).protocol;
                console.log("protocol =====> " + protocol)
                if (protocol != null && protocol == "https:") {
                    config1.httpsAgent = new https.Agent({
                        keepAlive: true,
                        rejectUnauthorized: false
                    }); //secureProtocol: 'TLSv1_method'
                } else {
                    config1.httpAgent = new http.Agent({
                        keepAlive: true,
                        rejectUnauthorized: false
                    }); //secureProtocol: 'TLSv1_method'
                }

                let mediaData = await axios.request(config1);
                console.log(mediaData.data, "mediaData");
                // Save media data to a file
                const filePath = "./media/" + new Date().getTime() + "_" + uuidv4() + "." + fileExtension;


                fs.writeFileSync(filePath, mediaData.data, 'binary');
                console.log('Media data saved successfully.');

                // Upload the saved file to another Axios API
                let data = new FormData();
                data.append('sheet', fs.createReadStream(filePath));
                const uploadConfig = {
                    method: 'post',
                    url: 'http://127.0.0.1:2707/v1/uploadmedia',
                    headers: {
                        'wanumber': WabaNumber,
                        'apikey': apiKey,
                        ...data.getHeaders(),

                    }, // Specify the upload URL
                    data: data,
                    maxBodyLength: Infinity,
                };
                try {
                    let uploadResponse = await axios(uploadConfig);
                    console.log('File uploaded successfully:', uploadResponse.data);
                    return responseHelper(200, "MediaId", uploadResponse.data.data[0]);

                } catch (error) {
                    console.log(error.message, "error with patners API");
                    return responseHelper(500, error.message);
                }

            } catch (error) {
                console.log(error.message, "Error in getting Media Data.");
                // console.log(JSON.stringify(erro. "hello error");
                return responseHelper(500, error.message);
            }
        }


    } catch (error) {
        console.log(error);
        return responseHelper(500, error.message);
    }
}