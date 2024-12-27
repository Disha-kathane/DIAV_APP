const botUtils = require('../../utils/bot1');
const {
    errorLogger,
    infoLogger
} = require('../../applogger1.js');
const fs = require('fs/promises');
const config = require('../../config');



const downloadCloudMedia = async (url, SystemAccessToken, next) => {

    const instanceUrl = url;
    const httpMethod = 0;
    const requestType = 0;
    const apiHeaders = [
        {
            'headerName': 'Authorization',
            'headerVal': 'Bearer ' + SystemAccessToken
        },
        {
            'headerName': 'Content-Type',
            'headerVal': 'application/json'
        }
    ];


    await botUtils.downloadWhatsappMediaCloud(instanceUrl, apiHeaders)
        .then((response) => {
            // console.log(response);
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });
};


const getMediaUrl = async (MediaId, SystemAccessToken, next) => {
    const instanceUrl = 'https://graph.facebook.com';
    const api = '/v13.0/' + MediaId;
    const apiHeaders = [
        {
            'headerName': 'Authorization',
            'headerVal': 'Bearer ' + SystemAccessToken
        },
        {
            'headerName': 'Content-Type',
            'headerVal': 'application/json'
        }
    ];


    await botUtils.getMediaUrlCloud(instanceUrl + api, apiHeaders)
        .then((response) => {
            // console.log(response);
            next(null, response);
        })
        .catch((err) => {
            next(err);
        });
};


module.exports = {
    downloadCloudMedia,
    getMediaUrl

};