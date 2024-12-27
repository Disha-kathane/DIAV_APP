const async = require('async');
const { errorLogger, infoLogger } = require('../../applogger');
const botUtils = require('../../utils/bot');
const cron = require('node-cron');
const campaignService = require('../../services/v1/campaign');
// const PropertiesReader = require('properties-reader');
// const properties = PropertiesReader(path.join(__dirname,'../settings/application.properties'));

module.exports = cron.schedule('*/10 * * * * *', async function () {
    try {
        let fetchMessages = (done) => {
            campaignService.fetchCampaigns(function (err, result) {
                if (err) {
                    setTimeout(() => {
                        return done({
                            code: 'WA001', status: 'SUCCESS', message: 'No Records Found'
                        });
                     }, 5000);
                } else {
                    console.log(result);
                    done(null, result);
                }
            });
        };

        let processMessage = (msgResult, done) => {
            for (let index = 0; index < msgResult.length; index++) {
                console.log(msgResult[index].apikey);
                async.waterfall([
                    function (done) {
                        campaignService.updateCampaignSchedulerProcessed(msgResult[index].campaignid, (err, result) => {
                            done(err, result);
                        });
                    },
                    function (result, done) {
                        let payload = {
                            'campaignId': msgResult[index].campaignid
                        };
                        let url = 'https://68.183.90.255:3000';
                        let api = msgResult[index].mediaurltype == 1 ? '/v1/wamessage/broadCastUrl' : '/v1/wamessage/broadCast';
                        let httpMethod = 1;
                        let requestType = 1;
                        let contentLength = Buffer.byteLength(JSON.stringify(payload));
                        let apiHeaders = [{
                            'headerName': 'apikey',
                            'headerVal': msgResult[index].apikey
                        }];
                        console.log(payload);

                        botUtils.callWhatsAppApi(url, api, payload, httpMethod, requestType, apiHeaders).then((response) => {
                            console.log(response);
                            errorLogger.info("*******************************************************");
                            errorLogger.info("CAMPAIGN_ID: " + msgResult[index].campaignid);
                            errorLogger.info("API_KEY: " + msgResult[index].apikey);
                            errorLogger.info("RESPONSE: " + response);
                            errorLogger.info("*******************************************************");
                        }).catch((err) => {
                            console.log(err);
                            errorLogger.error("*******************************************************");
                            errorLogger.error("CAMPAIGN_ID: " + msgResult[index].campaignid);
                            errorLogger.error("API_KEY: " + msgResult[index].apikey);
                            errorLogger.error("ERROR: " + err);
                            errorLogger.error("*******************************************************");
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log(result);
                    }
                });

                if (index == msgResult.length - 1) {
                    done(null, 'Success');
                }
            }
        };

        async.waterfall([
            fetchMessages,
            processMessage
        ], function (err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log(result);
            }
        });
    }
    catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
});