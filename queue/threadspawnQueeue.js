const Queue = require('bull');
const redis = require('../redis/redis');
const threadsqueue = new Queue('MessagesPayload', redis);

// threadsqueue
//     .on('completed', (job, results) => {
//         console.log('queue completed a job');
//         statusesPayloadQueue.clean('completed').then(() => console.log('Completed Jobs from statuses payload has been removed...'));

//     })
//     .on('error', async (error) => {
//         console.error('queue error', error.message)
//     })
//     .on('failed', async (job, error) => {
//         console.error('queue error', error.message)
//     })

module.exports = {
    threadsqueue
}