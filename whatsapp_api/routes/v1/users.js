const userController = require('../../controller/v1/users');

const addUserOpts = {
    schema: {
        body: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                age: { type: 'number' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            }
        }
    },
    handler: userController.addUser
}

module.exports = (fastify, opts, done) => {
    fastify.post('/', addUserOpts);
    done();
}