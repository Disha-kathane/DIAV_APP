const { customCallbackPayloadQueue } = require('../queue/customCallbackPayloadQueue')
const customCallbackQueueController = require('../controller/v1/customCallbackQueueController')

customCallbackPayloadQueue.process(500, (job, done) => {
    console.log('running task');

    customCallbackQueueController.storeCustomCallbackPayloadLogs(job);
    done();
});

console.log('CUSTOM CALLBACK QUEUE PROCESSOR');