const multer = require('fastify-multer');
const fs = require('fs/promises');

const userRouter = require('./v1/users');
const wamessageRouter = require('./v1/wamessage');

const upload = multer({
    storage: multer.diskStorage({
        destination: async (req, file, cb) => {
            await fs.access(`assets`).catch(async err => {
                await fs.mkdir(`assets`);
            });
            await fs.access(`assets/watemplates`).catch(async err => {
                await fs.mkdir(`assets/watemplates`)
            });
            await fs.access(`assets/watemplates/${req.userId}`).catch(async err => {
                await fs.mkdir(`assets/watemplates/${req.userId}`)
            });
            
            cb(null, `assets/watemplates/${req.userId}`);
        },
        filename: (req, file, cb) => {
            cb(null, `file_${req.userId}.csv`);
        }
    })
})

module.exports = (fastify) => {
    fastify.register(multer.contentParser);
    fastify.register(userRouter, { prefix: '/v1/users' });
    fastify.register(wamessageRouter(upload), { prefix: 'v1/wamessage' })
}