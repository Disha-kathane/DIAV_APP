const multer = require('fastify-multer');
const fs = require('fs/promises');
const cors = require('fastify-cors');
// const userRouter = require('./v1/users');
const wamessageRouter = require('./v1/wamessage');
const wamessageRouter1 = require('./v2/wamessage');

const upload = multer({
    storage: multer.diskStorage({
        destination: async (req, file, cb) => {
            cb(null, `uploads`);
        },
        filename: (req, file, cb) => {
            // console.log(file.originalname);
            cb(null, file.originalname);
        }
    })
});

module.exports = (fastify) => {
    fastify.register(multer.contentParser);
    fastify.register(cors);
    // fastify.register(userRouter, { prefix: '/v1/users' });
    fastify.register(wamessageRouter(upload), { prefix: 'v1/wamessage' });
    fastify.register(wamessageRouter1(upload), { prefix: 'v2/wamessage' });
};
