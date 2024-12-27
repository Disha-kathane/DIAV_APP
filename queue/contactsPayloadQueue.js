const Queue = require('bull');
const redis = require('../redis/redis');
const contactsPayloadQueue = new Queue('contacts-payload', redis)

contactsPayloadQueue
    .on('completed', (job, results) => {
    console.log('queue completed a job');
    contactsPayloadQueue.clean(60000, 'completed').then(() => console.log('Completed Jobs from contacts Queue payload has been removed...'));
    })
    .on('error', async (error) => {
    console.error('queue error conpq : ', error.message)
    })
    .on('failed', async (job, error) => {
    console.error('queue failed conpq : ', error.message)
})

module.exports = {
    contactsPayloadQueue
}