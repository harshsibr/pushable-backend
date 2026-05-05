const express = require('express');
const router = express.Router();

const {payment, pay, success, checkpaymentstatus, cancel, refund, stripePayment,stripeGooglePayment, stripeSuccess,stripeGooglePaySuccess, quesamount, stripetest3, checkUserLogin} = require('../controller/paymentController');

router.get('/', payment);

router.post('/pay', pay);

router.get('/success', success);

router.post('/checkpaymentstatus', checkpaymentstatus);

router.post('/cancelpayment', cancel);

router.get('/refund', refund);

router.post('/stripe-payment', stripePayment);
router.post('/stripe-google-payment', stripeGooglePayment);
router.post('/stripe-success', stripeSuccess);
router.post('/stripe-google-success', stripeGooglePaySuccess);

router.post('/ques-amount', quesamount);

router.post('/stripe-test3', stripetest3);
router.post('/checkUserLogin', checkUserLogin);
router.get('/redirect', (req, res) => {
    //   res.redirect(302, 'https://testuity.com?');  // Temporary redirect with forward slash
      res.redirect(302, 'https://testuity.com?user?questionaire?quiz?questionnaireID=6436694cf923aa5ea7ad37cc');
      
    });
module.exports = router;