let app = require('fastify');
let initRoutes = require('./routes');
let port = 2707;
let host = "0.0.0.0";
let { readFileSync } = require('fs');
const assets_folder = require('@fastify/static');
const path = require('path');
// let privateKey = readFileSync('/home/certs_2021/STAR_pinbot_ai.key', 'utf8');
// let certificate = readFileSync('/home/certs_2021/STAR_pinbot_ai.crt', 'utf8');

//DEMO CALLBACK
// https://callback.pinnacle.in/dev/wacallback/5eaeea2f-a461-11e9-b6ac-d094664b194b

//NEW CALLBACK
// https://callback.pinbot.ai/v1/wamessage/callback/cef8e6e0-6155-11ec-a7c7-9606c7e32d76/919552599883


// https://demo.pinnacle.in/v1/wamessage/callback/33de41e3-4203-11ec-ab09-9606c7e32d76/919552599883

var fastify = app({
    // https: {
    //     allowHTTP1: true,
    //     key: privateKey,
    //     cert: certificate
    // },
    logger: false,
    bodyLimit: 100 * 1024 * 1024
});

fastify.register(assets_folder, {
    root: path.join(__dirname, 'assets'),
    prefix: '/public/',
});

async function start() {
    try {
        initRoutes(fastify);
        // await fastify.listen(port, host, function () {
        //     console.log('Pinnacles API for Partners is listening on port ' + port);
        // });

        await fastify.listen({ port: port, host:host }, (err, address) => {
            if (err)
                throw err;
            console.log('Pinnacles API for Partners is listening on port ' + address);
            console.log(__dirname);
        });
    } catch (err) {
        console.log(err);
    }
}
start();
