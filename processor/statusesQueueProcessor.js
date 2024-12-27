const { statusesPayloadQueue } = require('../queue/statusesPayloadQueue');
const update_Delivery = require('../controller/v1/updateDelivery');

statusesPayloadQueue.process(500, (job, done) => {
    console.log('running task');
    update_Delivery.updateDeliveryCloud100823(job,done);
});

console.log('STATUS QUEUE PROCESSOR');