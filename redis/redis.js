// const Redis = require('ioredis');
// const redis = new Redis(6379, "10.139.244.222");

// // exports.handler = async (event) => {
// //     /*
// //     do stuff with redis
// //      */
// //     await redis.quit();
// //     /*
// //   do other stuff
// //    */
// //     return {
// //         response: "response"
// //     };
// // };

const redis = {
    redis: { port: 6379, host: "10.0.5.5" }
};

module.exports = redis;
