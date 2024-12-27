const Queue = require('bull');
const redis = require('../redis/redis');
const businessesPayloadQueue = new Queue('businesses-payload', redis)

businessesPayloadQueue
    .on('completed', (job, results) => {
    console.log('queue completed a job');
    businessesPayloadQueue.clean(60000, 'completed').then(() => console.log('Completed Jobs from businesses Queue payload has been removed...'));
    })
    .on('error', async (error) => {
    console.error('queue error bpq : ', error)
    })
    .on('failed', async (job, error) => {
    console.error('queue failed bpq : ', error.message)
})

module.exports = {
    businessesPayloadQueue
}