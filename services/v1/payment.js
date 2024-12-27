const Razorpay = require('razorpay');
const { getRazorpayAuthDetail } = require('./newsend.js');
var axios = require('axios');


let getRazorpayAuthDetailResult = null;
let keyId = null;
let keySecret = null;

let getPaymentDetailsResult = null;
let getDataFromNonCatalogueMasterResult = null;


let paymentTransactionId = null;
let paymentTransactionType = null;
let paymentReferenceId = null;
let PaymentCurrency = null;
let paymentStatus = null;
let paymentTotalAmount = null;
let paymentTotalAmountOffest = null;
let temp1 = null;
let t1 = null;
let t2 = null;
let trnValue = null;


let getDataFromNonCataloguePurchaseMasterResult = null;

paymentResult = async (productAmount, orderId, contactno, emailId) => {

    try {
        var data = JSON.stringify({
            "amount": productAmount * 100,
            "currency": "INR",
            "order_id": orderId,
            "email": emailId,
            "contact": contactno,
            "upi": {
                "flow": "intent"
            }
        });
        console.log({ data });

        var config = {
            method: 'post',
            url: 'https://api.razorpay.com/v1/payments/create/upi',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic cnpwX2xpdmVfdkhSc0ltZjNPbmlGaDc6dzB1c1N1aFZ2Ylpwa2dXMUFaV3V4V0NT'
            },
            data: data
        };


        try {
            const response = await axios(config);
            let paymentResponse = response.data;
            console.log({ paymentResponse });

            return paymentResponse;
        } catch (err) {
            console.log(err);
            // console.log(JSON.stringify(err.response.data.error));
        }
    }
    catch (err) {
        console.log('RZP error ==========================> ' + err);
        next(err);
    }



};

paymentOption = async (userId, productRetailerId, contactno, next) => {

    try {
        let isRzpLive = 1;
        getRazorpayAuthDetailResult = await getRazorpayAuthDetail(userId, isRzpLive);
        // console.log({ getRazorpayAuthDetailResult });
        keyId = getRazorpayAuthDetailResult[0].keyid;
        keySecret = getRazorpayAuthDetailResult[0].keysecret;
        isLive = getRazorpayAuthDetailResult[0].is_live;
        console.log({ keyId, keySecret, isLive });


        var instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });

        getPaymentDetailsResult = await getPaymentDetails(userId);
        // console.log({ getPaymentDetailsResult });

        console.log({ userId }, { productRetailerId });
        if (productRetailerId !== null) {
            getDataFromNonCatalogueMasterResult = await getDataFromNonCatalogueMaster(userId, productRetailerId);
            console.log({ getDataFromNonCatalogueMasterResult });
            let productAmount = getDataFromNonCatalogueMasterResult[0].productamount;
            let productQuantity = getDataFromNonCatalogueMasterResult[0].productquantity;
            let amount = getDataFromNonCatalogueMasterResult[0].amount;
            console.log({ productAmount, productQuantity, amount });

            let orderCreationResult = await instance.orders.create({
                "amount": amount * 100,
                "currency": "INR",

            });

            // console.log({ orderCreationResult });


            let orderId = await orderCreationResult.id;
            console.log({ orderId });
            // return orderId;



            emailId = 'vaibhav.dongre@pinnacle.in';
            // console.log(productAmount, orderId, contactno, emailId);

            let res1 = await paymentResult(amount, orderId, contactno, emailId);
            // console.log({ res1 });
            if (res1 !== undefined) {
                temp1 = res1.link.split('&');
                // console.log({ temp1 });
                t1 = res1.link.split('tr=');
                t2 = t1[1].split('&');
                trnValue = t2[0];
                // console.log({ trnValue });
            }


            let payIdResult = {
                orderId,
                trnValue

            };
            console.log(payIdResult);
            return payIdResult;
            next(null, payIdResult);
        }
    }
    catch (err) {
        console.log('RZP error ==========================> ' + err);
        next(err);
    }



};


paymentOptionForCatalogue = async (userId, productAmount, contactno, next) => {

    try {
        let isRzpLive = 1;
        getRazorpayAuthDetailResult = await getRazorpayAuthDetail(userId, isRzpLive);
        // console.log({ getRazorpayAuthDetailResult });
        keyId = getRazorpayAuthDetailResult[0].keyid;
        keySecret = getRazorpayAuthDetailResult[0].keysecret;
        isLive = getRazorpayAuthDetailResult[0].is_live;
        console.log({ keyId, keySecret, isLive });


        var instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });

        let orderCreationResult = await instance.orders.create({
            "amount": productAmount * 100,
            "currency": "INR",

        });

        // console.log({ orderCreationResult });


        let orderId = await orderCreationResult.id;
        console.log({ orderId });
        // return orderId;


        // contactno = '919978572120';
        emailId = 'vaibhav.dongre@pinnacle.in';
        // console.log(productAmount, orderId, contactno, emailId);

        let res1 = await paymentResult(parseInt(productAmount), orderId, contactno, emailId);
        // console.log({ res1 });
        if (res1 !== undefined) {
            temp1 = res1.link.split('&');
            // console.log({ temp1 });
            t1 = res1.link.split('tr=');
            t2 = t1[1].split('&');
            trnValue = t2[0];
            // console.log({ trnValue });
        }


        let payIdResult = {
            orderId,
            trnValue

        };
        console.log(payIdResult);
        next(null, payIdResult);
    }
    catch (err) {
        console.log('RZP error ==========================> ' + err);
        next(err);
    }


};



paymentStatus = async (userId, trValue) => {

    try {
        let getDataFromNonCataloguePurchaseMasterResult = await getDataFromNonCataloguePurchaseMaster(userId, trValue);
        let rzpOrderId = getDataFromNonCataloguePurchaseMasterResult[0].rzp_orderid;
        console.log({ rzpOrderId });


        var config = {
            method: 'get',
            url: 'https://api.razorpay.com/v1/orders/' + rzpOrderId + '/payments',
            headers: {
                'Authorization': 'Basic cnpwX2xpdmVfdkhSc0ltZjNPbmlGaDc6dzB1c1N1aFZ2Ylpwa2dXMUFaV3V4V0NT'
            }
        };

        try {
            const response = await axios(config);
            // console.log(JSON.stringify(response.data));
            return response.data;
        } catch (err) {
            console.log(err);
        }
    }
    catch (err) {
        console.log('RZP error ==========================> ' + err);
        next(err);
    }



};

// contactno = '919978572120';
// // paymentResult('399', 'order_LBSSkODjQjFcq8', contactno, emailId);


// paymentOption(760, '123', contactno, (err, res) => {
//     if (err) {
//         console.log(err);
//     }
//     else {
//         console.log('=============================>' + JSON.stringify(res));
//     }
// });




module.exports = {
    paymentOption,
    paymentResult,
    paymentOptionForCatalogue,
    paymentStatus
}




