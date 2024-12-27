const app = require('fastify');
const initRoutes = require('./routes');

const contactService = require('./services/v1/contacts');

const port = 3000;
var host = "0.0.0.0";
let { readFileSync } = require('fs');
// let privateKey = readFileSync('/home/certs_2021/STAR_pinbot_ai.key', 'utf8');
// let certificate = readFileSync('/home/certs_2021/STAR_pinbot_ai.crt', 'utf8');

let fastify = app({
    // https: {
    // allowHTTP1: true,
    // key: privateKey,
    // cert: certificate
    // },
    logger: false
});

async function start() {
    try {
        // await fastify.register(fastifyExpress);
        initRoutes(fastify);
        await fastify.listen(port, host, async function () {
            console.log('Server listening on port ' + port);
            //try {
              //  let campaignIdList = await contactService.checkTempContacts();
                // console.log(campaignIdList);
                //if (campaignIdList.length) {
                  //  campaignIdList = campaignIdList.map(item => item.campaignid);
                    //await contactService.updateCampaignStatus(campaignIdList);
                    //console.log('Campaign status are updated');
                //}
            //} catch (error) {
                // console.log(error);
              //  console.log('Error in update campaign status after starting server');
            //}
        });
        // require('./cron/v1/optinLoginCron').start();
        // // require('./cron/v1/optinContactCron').start();
        require('./cron/v1/templateStatusCron').start();
        // require('./cron/v1/templateCategoryCron').start();
        // //require('./cron/v1/DBStatsCron').start();
        // //require('./cron/v1/broadCastCronAPI').start();
        // //require('./cron/v1/sendMessagesCron').start();

    } catch (err) {
        console.log(err);
    }
}
start();

process.on('uncaughtException', (err) => {
    console.log('uncaughtException Error', err);
    process.exit(1);
});


