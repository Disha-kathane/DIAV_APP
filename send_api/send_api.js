const app = require('fastify');
const initRoutes = require('./routes');
// const initRoutes1 = require('./routes/index1');
let port = 5976;
let host = "0.0.0.0";
let { readFileSync } = require('fs');
// let privateKey = readFileSync('/home/certs_2021/STAR_pinbot_ai.key', 'utf8');
// let certificate = readFileSync('/home/certs_2021/STAR_pinbot_ai.crt', 'utf8');

let fastify = app({
    // https: {
    //     allowHTTP1: true,
    //     key: privateKey,
    //     cert: certificate
    // },
    logger: false
});

fastify.get('/', async function handler (request, reply) {
  reply.send('DIAV API is running sucessfully');
})

async function start() {
    try {
        initRoutes(fastify);
        // initRoutes1(fastify);
        await fastify.listen(port, host, function () {
            console.log('Server listening on port ' + port);
        });
    } catch (err) {
        console.log(err);
    }
}
start();
