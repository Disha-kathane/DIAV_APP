let app = require('fastify');
let initRoutes = require('./routes');
let { readFileSync } = require('fs');
let port = 5970;
var host = "0.0.0.0";

// let privateKey = readFileSync('/home/certs_2020/STAR_pinbot_ai.key', 'utf8');
// let certificate = readFileSync('/home/certs_2020/STAR_pinbot_ai.crt', 'utf8');



let fastify = app({
    // https: {
    //     allowHTTP1: true,
    //     key: privateKey,
    //     cert: certificate
    // },   
    logger: false
});

async function start() {
    try {
        // await fastify.register(fastifyExpress);
        initRoutes(fastify);
        await fastify.listen(port, host, function () {
            console.log('Server listening on port ' + port);
        });
        // require('./cron/v1/optinLoginCron').start();
        // require('./cron/v1/optinContactCron').start();
        // require('./cron/v1/templateStatusCron').start();
        //require('./cron/v1/DBStatsCron').start();
        // require('./cron/v1/sendMessageCron').start();
        // require('./cron/v1/campaignCron').start();
        require('./cron/v1/Cron').start();
    } catch (err) {
        console.log(err);
    }
}
start();


