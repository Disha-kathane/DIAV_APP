let async = require('async');

module.exports = (req, res) => {
    console.log(req.query['hub.mode'])
    let VERIFY_TOKEN = 'f5369e75-41fc-4402-91bb-8023eb504963';
    let mode = req.query['hub.mode'];
    let challenge = req.query['hub.challenge'];
    let token = req.query['hub.verify_token'];

    let verifyToken = (done)=>{
        if(mode == 'subscribe' && token == VERIFY_TOKEN){
            done(null, challenge);
        }else{
            done({
                code: 100,
                status:'failed',
                message: 'incorrect token'
            });
        }
    }

    async.waterfall([
        verifyToken
    ],(err, result)=>{
        if(err){
            res.send(err);
        }else{
            res.send(result);
        }
    });
}