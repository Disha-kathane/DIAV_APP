const { contactsPayloadQueue } = require('../queue/contactsPayloadQueue')
const contactsQueueController = require('../controller/v1/contactsQueueController')

contactsPayloadQueue.process((job, done) => {
    console.log('running task')

    contactsQueueController.storeContactPayloadLogs(job);
    done();
});

console.log('CONTACTS QUEUE PROCESSOR');