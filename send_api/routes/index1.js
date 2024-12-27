const multer = require('fastify-multer');
const fs = require('fs/promises');
const cors = require('fastify-cors');
const wamessageRouter = require('./v2/wamessage');

const upload = multer({
    storage: multer.diskStorage({
        destination: async (req, file, cb) => {
            cb(null, `uploads`);
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname);
        }
    })
});

module.exports = (fastify) => {
    fastify.register(multer.contentParser);
    fastify.register(cors);
    fastify.register(wamessageRouter(upload), { prefix: 'v2/wamessage' });
};
