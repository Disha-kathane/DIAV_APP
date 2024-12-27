const sendService = require('../../services/v1/send');
const async = require('async');


module.exports = (req, res) => {

    let wabanumber = req.body.wanumber;
    let mobileno = req.body.mobileno;



    async.waterfall([
        function (done) {
            sendService.fetchwanumberuserid('+'+wabanumber, (err, fetchwanumberuseridResult) => {
                if (err) {
                    console.log('fetchwanumberuserid err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('fetchwanumberuserid result=======================>' + JSON.stringify(fetchwanumberuseridResult));
                    done(null, fetchwanumberuseridResult);
                }
            })
        },
        function (fetchwanumberuseridResult, done) {
            sendService.endLiveChatMessage(mobileno, fetchwanumberuseridResult[0].userid, (err, endlivechatMessageResult) => {
                if (err) {
                    console.log('endLiveChatMessage err=======================>' + JSON.stringify(err));
                   //done(err);
                } else {
                    console.log('endLiveChatMessage result=======================>' + JSON.stringify(endlivechatMessageResult));
                    done(null, endlivechatMessageResult);
                }
            })
        }

    ], (err, result) => {
        if (err) {
            res.send({
                code:100,
                status: 'Failed'
            })
        } else {
            res.send({
                code: 200,
                status: 'SUCCESS'
            });
        }
    })
}