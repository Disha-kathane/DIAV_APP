let app = require('fastify');
let initRoutes = require('./routes');
let port = 5973;
let host = "0.0.0.0";
let { readFileSync } = require('fs');
// let privateKey  = readFileSync('/home/certs_2021/STAR_pinbot_ai.key', 'utf8');
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
    logger: false
});

async function start () {
    try {
        initRoutes(fastify);
        await fastify.listen(port, host, function () {
            console.log('Server listening on port ' + port);
        });
    } catch (err) {
        console.log(err);
    }
}
start();