const Queue = require('bull');
const redis = require('../redis/redis');
const customCallbackPayloadQueue = new Queue('custom-callback-payload', redis)

customCallbackPayloadQueue
    .on('completed', (job, results) => {
    console.log('queue completed a job');
    // customCallbackPayloadQueue.clean(60000, 'completed').then(() => console.log('Completed Jobs from custom callback Queue payload has been removed...'));

    customCallbackPayloadQueue.clean('completed').then(() => console.log('Completed Jobs from custom callback Queue payload has been removed...'));

    })
    .on('error', async (error) => {
    console.error('queue error ccpq : ', error.message)
    })
    .on('failed', async (job, error) => {
    console.error('queue failed ccpq : ', error.message)
})

module.exports = {
    customCallbackPayloadQueue
}