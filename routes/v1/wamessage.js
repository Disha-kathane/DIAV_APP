const sendController = require('../../controller/v1/send');
const waCallbackController = require('../../controller/v1/wacallback');

module.exports = (upload) => {

    const sendOpts = {
        handler: sendController
    }

    const waCallbackOpts = {
        handler: waCallbackController
    };

    return (fastify, opts, done) => {
        fastify.post('/send', sendOpts);
        done();

    }
}