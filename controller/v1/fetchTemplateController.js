const sendService = require('../../services/v1/send');
const async = require('async');


module.exports = (req, res) => {

    let apikey = req.headers.apikey;

    async.waterfall([
        (done) => {
            sendService.fetchWabaTemplate(apikey, (err, fetchWabaTemplateResult) => {
                if (err) {
                    // console.log('fetchWabaTemplate err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    // console.log('fetchWabaTemplate result=======================>' + JSON.stringify(fetchWabaTemplateResult));
                    done(null, fetchWabaTemplateResult);
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