const Queue = require('bull');
const redis = require('../redis/redis');
const statusesPayloadQueue = new Queue('statuses-payload', redis)

statusesPayloadQueue
    .on('completed', (job, results) => {
        console.log('queue completed a job');
        statusesPayloadQueue.clean('completed').then(() => console.log('Completed Jobs from statuses payload has been removed...'));

    })
    .on('error', async (error) => {
        console.error('queue error spq : ', error.message);
    })
    .on('failed', async (job, error) => {
        console.error('queue failed spq : ', error.message);
        statusesPayloadQueue.clean(10000,'failed').then(() => console.log('Completed Jobs from statuses payload has been removed...'));
    })

module.exports = {
    statusesPayloadQueue
}