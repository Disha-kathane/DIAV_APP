const multer = require('fastify-multer');
const fs = require('fs/promises');

const wamessagesRouter = require('./v1/wamessages');
const alphaRouter = require('./alpha/wamessages');
const v2Router = require('./v2/wamessages');

const upload = multer({
    storage: multer.diskStorage({
        destination: async (req, file, cb) => {
            // console.log(file.originalname);
            await fs.access(`assets`).catch(async err => {
                await fs.mkdir(`assets`);
            });
            await fs.access(`assets/watemplates`).catch(async err => {
                await fs.mkdir(`assets/watemplates`);
            });
            await fs.access(`assets/watemplates`).catch(async err => {
                await fs.mkdir(`assets/watemplates`);
            });

            cb(null, `assets/watemplates`);
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname);
        }
    })
});

module.exports = (fastify) => {
    fastify.register(multer.contentParser);
    fastify.register(wamessagesRouter(upload), { prefix: 'v1' });
    fastify.register(alphaRouter(upload), { prefix: 'alpha' });
    fastify.register(v2Router(upload), { prefix: 'v2' });

};