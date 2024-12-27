const whatsappService = require('../../services/v1/whatsapp');
const userService = require('../../services/v1/userStat');
const async = require('async');

module.exports = (req, res) => {
    try {

        let apikeys = req.headers.apikey;
        let wanumber = req.headers.wanumber;
        let id = req.body.id;
        // console.log(id);

        if (!req.headers.apikey) {
            return {
                code: 'WA001',
                status: 'FAILED',
                message: 'API Key is required',
                data: {}
            };
        }
        if (!req.headers.wanumber) {
            return {
                code: 'WA002',
                status: 'FAILED',
                message: 'Wanumber Key is required',
                data: {}
            };
        }
        if (!req.body.id) {
            return {
                code: 'WA003',
                status: 'FAILED',
                message: 'Template Name is required',
                data: {}
            };
        }


        let getusers = function (callback) {
            userService.getUserId(apikeys, wanumber,(err, result) => {
                if (err) {
                    // console.log(err)
                    return callback(err.message);
                }
                if (result != null && result.length > 0) {
                    // console.log(result)
                    userid = result[0].userid;
                    // console.log({userid},{wanumber})
                    callback(null, userid, wanumber, id);

                } else {
                    res.send({
                        code: 'WA006',
                        status: 'FAILED',
                        message: 'Correct API Key is required',
                        data: {}
                    });
                }
            });
        }

        let getwabaid = function (userid, wanumber, id, callback) {
            userService.getWabaId(userid, wanumber, (err, result) => {
                console.log(userid)
                if (err) {

                    return callback(err)
                }
                if (result != null && result.length > 0) {
                    wabaid = result[0].whatsapp_business_account_id;
                    callback(null, wabaid, id)
                }
            })
        }

        let getusersetting = function (wabaid, id, callback) {
            userService.getAccessToken((err, result) => {
                if (err) {

                    return callback(err);
                }
                if (result != null && result.length > 0) {

                    SystemAccessToken = result[0].value;
                    callback(null, SystemAccessToken, wabaid, id)
                }

            })
        }

        let gettemplatename = function (SystemAccessToken, wabaid, id, callback) {

            userService.getTemplateName(id, (err, result) => {
                if (err) {
                    console.log({ err })
                    return callback(err);
                }
                console.log(result)
                if (result != null && result.length > 0) {

                    templatename = result[0].temptitle
                    callback(null, SystemAccessToken, wabaid, templatename)
                } else {
                    res.send({
                        code: 'WA100',
                        status: 'FAILED',
                        message: 'TemplateName not found'

                    })
                }

            })
        }

        let deletetemplate = function (SystemAccessToken, wabaid, templatename, callback) {
            whatsappService.deleteTemplate(SystemAccessToken, wabaid, templatename, (err, result) => {
                if (err) {
                    console.log({ err })
                    let tempError = err.response.data.error.error_user_msg;
                    // console.log({ tempError })
                    return callback(tempError);
                }
                if (result != undefined) {
                    console.log({ result })
                    callback(null, result)
                }
            })
        }

        async.waterfall([getusers, getwabaid, getusersetting, gettemplatename, deletetemplate], function (err, result) {

            if (err) {
                res.send({
                    code: 'WA100',
                    status: 'FAILED',
                    message: err.message != undefined ? err.message : err
                })
            } else {
                res.send({
                    code: 200,
                    status: 'SUCCESS',
                    message: 'Template deleted Successfully',
                    data: result
                });
            }
        });

    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
    }
}