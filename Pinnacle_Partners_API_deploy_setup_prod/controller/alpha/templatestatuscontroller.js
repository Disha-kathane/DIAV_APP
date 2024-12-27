const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const async = require('async');

var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;

module.exports = (req, res) => {
    try {
        console.log(JSON.stringify(req.body));
        let templateid = req.body.templateid;

        let gettemplatestatus = function (callback) {
            userService.gettemplatestatus(templateid, (err, result) => {
                if (err) {
                    console.log('gettemplatestatus error==============>' + err);
                    return callback(err);
                }
                if (result != null && result.length > 0) {
                    callback(null, result);

                } else {
                    callback('Template not found');
                }
            });
        }

        async.waterfall([gettemplatestatus], function (err, result) {
            if (err) {
                // console.log('retriveTemplate err==============>' + JSON.stringify(err));
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err
                })
            } else {
                // console.log('retriveTemplate result==============>' + JSON.stringify(result));
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'Template retrived Successfully',
                    data: {
                        templateid : result[0].waba_approval_response_id,
                        templatestatus : result[0].status
                    }
                });
            }
        });

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));

    }
}