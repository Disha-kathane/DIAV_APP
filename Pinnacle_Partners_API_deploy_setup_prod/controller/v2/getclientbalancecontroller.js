const dbpool = require('../../db/database');
const async = require('async');
var phoneUtil = require("google-libphonenumber").PhoneNumberUtil.getInstance();
const sendService = require('../../services/v1/send');
let axios = require('axios');
//const botUtils = require('../../util/bot');

function getCountryCodeNumeric(number) {
    if (/^\+/.test(number) == false) {
        number = '+' + number;
    }
    var countryCode = '';
    try {
        var mobileNumber = phoneUtil.parse(number, '');
        countryCode = mobileNumber.getCountryCode();
    } catch (e) {
        // errorLogger.error('Invalid Number ' + number);
        // errorLogger.error(e);
    }
    return countryCode;
}

module.exports = (req, res) => {

    let wanumber = req.headers.wanumber;
    let userid;
    let wabaCountryCodeNumeric = getCountryCodeNumeric(wanumber);
    let temp = {};


    async.waterfall([
        (done) => {
            sendService.selectwanumber(wanumber, (err, selectwanumberResult) => {
                if (err) {
                    console.log('selectwanumber err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('selectwanumber result=======================>' + JSON.stringify(selectwanumberResult));
                    if (selectwanumberResult[0].c > 0) {
                        done(null, selectwanumberResult);
                    } else {
                        done('Invalid Wanumber')
                    }
                }
            })
        },
        (selectwanumberResult, done) => {
            sendService.getbalanceamt(wanumber, (err, getbalanceamtResult) => {
                if (err) {
                    console.log('getbalanceamt err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('getbalanceamt result=======================>' + JSON.stringify(getbalanceamtResult));
                    temp.balance_amt = getbalanceamtResult;
                    done(null, temp);
                }
            })
        },
        (t, done) => {
            sendService.getbicuicrate(wabaCountryCodeNumeric, userid, (err, getbicuicrateResult) => {
                if (err) {
                    console.log('getbicuicrate err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('getbicuicrate result=======================>' + JSON.stringify(getbicuicrateResult));
                    t.bic_rate = getbicuicrateResult;
                    done(null, t);
                }
            })
        },
        (t, done) => {
            sendService.getlastrenewal(wanumber, (err, getlastrenewalResult) => {
                if (err) {
                    console.log('getlastrenewal err=======================>' + JSON.stringify(err));
                    done(err);
                } else {
                    console.log('getlastrenewal result=======================>' + JSON.stringify(getlastrenewalResult));
                    t.Amount = getlastrenewalResult;
                    done(null, t);
                }
            })
        }
    ], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send({
                balance: result.balance_amt[0].balance_amt,
                bi_price_for_currency_and_client_country: result.bic_rate[0].bic_rate,
                last_renewal: {
                    amount: result.Amount[0].Amount,
                    date: result.Amount[0].transactiondate
                },
                ui_price_for_currency_and_client_country: result.bic_rate[0].uic_rate,
                usage: [{
                    free_quantity: result.balance_amt[0].free_conversation
                }]
            });
            //res.send(result)
        }
    })
}