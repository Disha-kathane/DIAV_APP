// var axios = require('axios');
const dbpool = require('../../db/wabot');
const sendService = require('../../services/v1/newsend');

module.exports = async (req, res) => {
    try {
        // let obj = req.body;
        // let transactionId = 0;
        // let transactionType = 0;
        // // let totalAmount = 0;
        // // let currency = 0;
        // let orderFlag = 0;
        // let paymentData = null;
        // let failedReason = null;
        // let txnId = null;
        // let status = null;
        // let recipient_id = null;
        // let paymentReferenceId = null;


        // let query = null;
        // let rows = null;

        console.log('PAYMENT DETAILS by PAYU CONTROLLER ================> ' + JSON.stringify(req.body));
        // txnId = obj.payload.payment.entity.order_id;
        // status = obj.payload.payment.entity.status;
        return res.send({ status: "ok" });


    }
    catch (err) {
        console.log('PAYMENT DETAILS by PAYU CONTROLLER ERR ================> ' + err);
        return res.send(err);


    }
};