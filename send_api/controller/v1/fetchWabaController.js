const sendService = require('../../services/v1/send');
const async = require('async');


module.exports = (req, res) => {

    let apikey = req.headers.apikey;

    async.waterfall([
        (done) => {
            sendService.fetchWabaNumber(apikey, (err, fetchWabaNumberResult) => {
                if (err) {
                    // console.log('fetchWabaNumber err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    // console.log('fetchWabaNumber result=======================>' + JSON.stringify(fetchWabaNumberResult));
                    done(null, fetchWabaNumberResult);
                }
            })
        }

    ], (err, result) => {
        if (err) {
            res.send({
                code: 100,
                status: 'failed',
                data:[]
            })
        } else {
            res.send({
                code: 200,
                status: 'success',
                data:result
            });
        }
    })
}