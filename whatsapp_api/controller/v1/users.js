const userService = require('../../services/v1/users')

exports.addUser = async (request, reply) => {

    const result = await userService.addUser({
        name: request.body.name,
        age: request.body.age
    });

    reply.type('application/json').code(200);
    console.log(result);

    return {
        message: 'this is users controller'
    };
}