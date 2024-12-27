const schedule = require('node-schedule');
const sendService = require('../services/v1/newsend');
var axios = require('axios');
let http = require('http');
let https = require('https');

function addMinutes(date, minutes) {
    date.setMinutes(date.getMinutes() + minutes);
    return date;
}

let retryCallbackProcessor = async () => {
    let getDataFromFailedCallbackLogsResult = await sendService.getDataFromFailedCallbackLogs();
    // console.log({ getDataFromFailedCallbackLogsResult });
    console.log(getDataFromFailedCallbackLogsResult.length);
    if (getDataFromFailedCallbackLogsResult.length > 0) {
        for (let i = 0; i < getDataFromFailedCallbackLogsResult.length; i++) {
            let retryCount = getDataFromFailedCallbackLogsResult[i].retry_count;
            let messageId = getDataFromFailedCallbackLogsResult[i].messageid;
            var data = JSON.parse(getDataFromFailedCallbackLogsResult[i].payload);
            let retryDate = getDataFromFailedCallbackLogsResult[i].retrydt;
            // console.log({ retryCount, messageId, data, retryDate });


            if (retryDate !== null) {
                newRetryDate = new Date(retryDate);
                result2 = addMinutes(newRetryDate, 15);
                // console.log({ result2 });
            }
            else if (retryCount === 0) {
                newRetryDate = new Date();
                result2 = addMinutes(newRetryDate, 15);
                console.log({ retryCount });
                console.log({ result2 });
            }
            let currdate = new Date();


            // console.log('===============================>' + currdate, result2);
            // console.log(retryDate > result2);


            if (retryCount >= 0 && retryCount < 5 && currdate >= result2) {
                // console.log({ retryDate, result2 });
                console.log('RETRY PAYLOAD DATA =============================================> ' + getDataFromFailedCallbackLogsResult[i].payload);
                var config = {
                    method: 'post',
                    url: getDataFromFailedCallbackLogsResult[i].custom_callback,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    httpAgent: new http.Agent({ keepAlive: true }),
                    httpsAgent: new https.Agent({ keepAlive: true }),
                    data: data
                };
                try {
                    const response = await axios(config);
                    // console.log(JSON.stringify(response.data));
                    console.log('Success =================> ' + ' retryCount : ' + retryCount + ' messageId : ' + messageId);
                    retryCount = 0;
                    let updateRetryPayloadDataResult = await sendService.updateRetryPayloadData(retryCount, messageId);
                    // console.log({ updateRetryPayloadDataResult });
                    if (retryCount === 0) {
                        // console.log('Deleted block');
                        await sendService.deleteRetrySuccessPayloadData(messageId);
                    }
                }
                catch (err) {
                    console.log(err);
                    retryCount = retryCount + 1;
                    console.log('Failed =================> ' + ' retryCount : ' + retryCount + ' messageId : ' + messageId);
                    let updateRetryPayloadDataResult = await sendService.updateRetryPayloadData(retryCount, messageId);
                    // console.log({ updateRetryPayloadDataResult });

                }
            }
            else {
                console.log('Retrying limit exceeded for available job');
            }

        }

    }
    else if (getDataFromFailedCallbackLogsResult.length === 0) {
        console.log('No failed job available to retry');
    }

};

let timeVal = 5;

const job = schedule.scheduleJob("*/" + timeVal + " * * * * *", async () => {
    console.log('Retrying Failed Payload Data AFTER ' + timeVal + 's');
    await retryCallbackProcessor();

});
