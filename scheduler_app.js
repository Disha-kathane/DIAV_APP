const app = require('fastify');
const initRoutes = require('./routes');
let port = 5977;
var host = "0.0.0.0";

const fastify = app({
    logger: false
});

fastify.register(require('fastify-swagger'), {
    routePrefix: '/documentation',
    swagger: {
        info: {
            title: 'Test swagger',
            description: 'Testing the Fastify swagger API',
            version: '0.1.0'
        },
        externalDocs: {
            url: 'https://swagger.io',
            description: 'Find more info here'
        },
        host: '68.183.90.255',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
            { name: 'user', description: 'User related end-points' },
            { name: 'code', description: 'Code related end-points' }
        ],
        definitions: {
            User: {
                type: 'object',
                required: ['id', 'email'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string', format: 'email' }
                }
            }
        },
        securityDefinitions: {
            apiKey: {
                type: 'apiKey',
                name: 'apiKey',
                in: 'header'
            }
        }
    },
    uiConfig: {
        docExpansion: 'full',
        deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    exposeRoute: true
});

async function start() {
    try {
        initRoutes(fastify);
        await fastify.listen(port, host, function () {
            console.log('Server listening on port ' + port);
        });

        // require('./cron/v1/sendMessageCron').start();
        // require('./cron/v1/sendScheduledMessageCron').start();
        require('./cron/v1/failedMessageCron').start();
        require('./cron/v1/stoppedCampaignCron').start();
        require('./cron/v1/unDeletedProcessedMessageCron').start();
        require('./cron/v1/tempFailedMessageCron').start();
        require('./cron/v1/failedMessageCron_1').start();
        // require('./cron/v1/failedMessageCron_2').start();

    } catch (err) {
        console.log(err);
    }
}
start();