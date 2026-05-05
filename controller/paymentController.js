const Payments = require("../models/Payment");
const paypal = require("paypal-rest-sdk");
const path = require("path");
const Questionnaire = require("../models/Questionnaire");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  sendEmail,
  tokenForVerify,
  sendEmailwithCertificate,
  GenerateInvoice,
} = require("../config/auth");
require("dotenv").config();
const EnneagrapQuestionnaire = require("../models/EnnaQuestionnaire");
const SixteenTypeQuestionnaire = require("../models/SixteenType");
const Booking = require("../models/Booking");
const Invoice = require("../models/Invoice");
const EnneagramReportData = require("../models/EnneagramReportData");
const SixteenTypeReportData = require("../models/SixteenTypeReportData");
const BigFiveQuestionnaries = require("../models/BigFiveQuestionnaries");
const BigFiveReportData = require("../models/BigFiveReportData");
const DiscQuestionnaries = require("../models/DiscQuestionnaries");
const DiscReportData = require("../models/DiscReportData");
const CareerAptitudeReportData = require("../models/CareerAptitudeReportData");
const ReportData = require("../models/ReportData");
const CareerAptitudeQuestionnaries = require("../models/CareerAptitudeQuestionnaries");
const InvoiceInfo = require("../models/InvoiceInfo");
const TestCount = require("../models/TestCount");
const WindowStep = require("../models/WindowStep");
const UserCertInfo = require("../models/UserCertInfo");
const moment = require("moment");
const axios = require("axios");

var Publishable_Key =
  "pk_live_51NZqvzH2UQxVuupR7VvMhE3gwNWdCPDDhY3RAK9ZTdQiUJ6YC8YHP9w2f2YlUk4R9ys6oe1FftwQiIkFjHVA2sb500EbESHrNc";
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST);

paypal.configure({
  //sandbox
  // mode: "sandbox", //sandbox or live
  // client_id:
  //   "AXTsxthlMMTgoEYeZyoaICgDtTp-_qBjAQBPK5LKSxQIfZX-uKOkYWrcd2YI3lsh93psmbZ8uTXqUWao",
  // client_secret:
  //   "EFoXmFvYumaWkTg2-tQ5EQClpTnTxXCDC3OvVLoAo292PrsZS3KFMM2K9m-SC4OkOZJbxWmalLNFxOaX",

  //Live
  'mode': 'live', //sandbox or live
  'client_id': 'AQVTKyBneUFlqin5YE663Xy9HF7RjQGcqw8cAXZVfOTUBfKSTGtcUOiaMev58y_DW5EidPaSVFPYnsLu',
  'client_secret': 'ENd_PKIMfEjilqk3DYS1ZqbeZNXd3Xvdx3QpUBBeGuzqxnENF9n7RRq6WOk0jUl1GYaqC1lcMRVhFJ0p'
});

async function sendGa4Purchase({
  transactionId,   // MongoDB payment _id
  testId,           // "test_001"
  testName,         // "Career Aptitude Test"
  amount,           // number (199)
  currency = "USD",
  debug = true       // keep true for DebugView, false for prod
}) {
  try {
    const payload = {
      client_id: "server_debug_fixed_001", // same as curl
      timestamp_micros: Date.now() * 1000, // REQUIRED (microseconds)
      events: [
        {
          name: "purchase",
          params: {
            transaction_id: transactionId,
            value: amount,
            currency,
            engagement_time_msec: 100,
            debug_mode: debug,
            items: [
              {
                item_id: testId,
                item_name: testName,
                quantity: 1,
                price: amount
              }
            ]
          }
        }
      ]
    };

    await axios.post(
      "https://www.google-analytics.com/mp/collect",
      payload,
      {
        params: {
          measurement_id: process.env.GA4_MEASUREMENT_ID,
          api_secret: process.env.GA4_API_SECRET
        },
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ GA4 purchase sent:", transactionId);
  } catch (err) {
    console.error(
      "❌ GA4 purchase failed:",
      err.response?.data || err.message
    );
  }
}

const payment = async (req, res) => {
  res.sendFile(path.resolve("../view", "index.ejs"));
};

async function createUserInvoice(user_id, questionnaire_id, booking_id, res, paymentAmount) {
  let qamount = "";
  let qinfo = null;
  let vat_array = null;
  let userData = await User.findOne({ _id: user_id });

  if (questionnaire_id == "65586e235046c32c7cd385cd") {
    qinfo = await EnneagrapQuestionnaire.find({ _id: questionnaire_id });
    qamount = qinfo[0]?.amount;
    // formula to find this json
    // qamount * vat_per percent of qamount is a excl_vat
    // incl_vat = qamount - vat_per percent of qamount
    vat_array = [
      {
        country_name: "Austria",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Belgium",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Bulgaria",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Croatia",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "Cyprus",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$4.75",
      },
      {
        country_name: "Czech Republic",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Denmark",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "Estonia",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Finland",
        excl_vat: "$18.99",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$6",
      },
      {
        country_name: "France",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Germany",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$4.75",
      },
      {
        country_name: "Greece",
        excl_vat: "$18.99",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$6",
      },
      {
        country_name: "Hungary",
        excl_vat: "$18.24",
        incl_vat: qamount,
        vat_per: 27,
        vat_value: "$6.75",
      },
      {
        country_name: "Ireland",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Italy",
        excl_vat: "$19.49",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$5.5",
      },
      {
        country_name: "Latvia",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Lithuania",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Luxembourg",
        excl_vat: "$21",
        incl_vat: qamount,
        vat_per: 16,
        vat_value: "$3.98",
      },
      {
        country_name: "Malta",
        excl_vat: "$20.49",
        incl_vat: qamount,
        vat_per: 18,
        vat_value: "$4.5",
      },
      {
        country_name: "Netherlands",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Poland",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Portugal",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Romania",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$4.75",
      },
      {
        country_name: "Slovakia",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Slovenia",
        excl_vat: "$19.49",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$5.5",
      },
      {
        country_name: "Spain",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Sweden",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "United Kingdom",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
    ];
  } else if (questionnaire_id == "65d33b0f9bef2027f0594db2") {
    qinfo = await SixteenTypeQuestionnaire.find({ _id: questionnaire_id });
    qamount = qinfo[0]?.amount;
    vat_array = [
      {
        country_name: "Austria",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Belgium",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Bulgaria",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Croatia",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "Cyprus",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$4.75",
      },
      {
        country_name: "Czech Republic",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Denmark",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "Estonia",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Finland",
        excl_vat: "$18.99",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$6",
      },
      {
        country_name: "France",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Germany",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$4.75",
      },
      {
        country_name: "Greece",
        excl_vat: "$18.99",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$6",
      },
      {
        country_name: "Hungary",
        excl_vat: "$18.24",
        incl_vat: qamount,
        vat_per: 27,
        vat_value: "$6.75",
      },
      {
        country_name: "Ireland",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Italy",
        excl_vat: "$19.49",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$5.5",
      },
      {
        country_name: "Latvia",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Lithuania",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Luxembourg",
        excl_vat: "$21",
        incl_vat: qamount,
        vat_per: 16,
        vat_value: "$3.98",
      },
      {
        country_name: "Malta",
        excl_vat: "$20.49",
        incl_vat: qamount,
        vat_per: 18,
        vat_value: "$4.5",
      },
      {
        country_name: "Netherlands",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Poland",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Portugal",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Romania",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$4.75",
      },
      {
        country_name: "Slovakia",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Slovenia",
        excl_vat: "$19.49",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$5.5",
      },
      {
        country_name: "Spain",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Sweden",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "United Kingdom",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
    ];
  } else if (questionnaire_id == "65ec352edbd8850c638f33fd") {
    qinfo = await BigFiveQuestionnaries.find({ _id: questionnaire_id });
    qamount = qinfo[0]?.amount;
    vat_array = [
      {
        country_name: "Austria",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Belgium",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Bulgaria",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Croatia",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "Cyprus",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$4.75",
      },
      {
        country_name: "Czech Republic",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Denmark",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "Estonia",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Finland",
        excl_vat: "$18.99",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$6",
      },
      {
        country_name: "France",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Germany",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$4.75",
      },
      {
        country_name: "Greece",
        excl_vat: "$18.99",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$6",
      },
      {
        country_name: "Hungary",
        excl_vat: "$18.24",
        incl_vat: qamount,
        vat_per: 27,
        vat_value: "$6.75",
      },
      {
        country_name: "Ireland",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Italy",
        excl_vat: "$19.49",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$5.5",
      },
      {
        country_name: "Latvia",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Lithuania",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Luxembourg",
        excl_vat: "$21",
        incl_vat: qamount,
        vat_per: 16,
        vat_value: "$3.98",
      },
      {
        country_name: "Malta",
        excl_vat: "$20.49",
        incl_vat: qamount,
        vat_per: 18,
        vat_value: "$4.5",
      },
      {
        country_name: "Netherlands",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Poland",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Portugal",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Romania",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$4.75",
      },
      {
        country_name: "Slovakia",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Slovenia",
        excl_vat: "$19.49",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$5.5",
      },
      {
        country_name: "Spain",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Sweden",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "United Kingdom",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
    ];
  } else if (questionnaire_id == "662f3b21d3279b1ec0877cd0") {
    qinfo = await DiscQuestionnaries.find({ _id: questionnaire_id });
    qamount = qinfo[0]?.amount;
    vat_array = [
      {
        country_name: "Austria",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Belgium",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Bulgaria",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Croatia",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "Cyprus",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$4.75",
      },
      {
        country_name: "Czech Republic",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Denmark",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "Estonia",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Finland",
        excl_vat: "$18.99",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$6",
      },
      {
        country_name: "France",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Germany",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$4.75",
      },
      {
        country_name: "Greece",
        excl_vat: "$18.99",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$6",
      },
      {
        country_name: "Hungary",
        excl_vat: "$18.24",
        incl_vat: qamount,
        vat_per: 27,
        vat_value: "$6.75",
      },
      {
        country_name: "Ireland",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Italy",
        excl_vat: "$19.49",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$5.5",
      },
      {
        country_name: "Latvia",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Lithuania",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Luxembourg",
        excl_vat: "$21",
        incl_vat: qamount,
        vat_per: 16,
        vat_value: "$3.98",
      },
      {
        country_name: "Malta",
        excl_vat: "$20.49",
        incl_vat: qamount,
        vat_per: 18,
        vat_value: "$4.5",
      },
      {
        country_name: "Netherlands",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Poland",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Portugal",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Romania",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$4.75",
      },
      {
        country_name: "Slovakia",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Slovenia",
        excl_vat: "$19.49",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$5.5",
      },
      {
        country_name: "Spain",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Sweden",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "United Kingdom",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
    ];
  } else if (questionnaire_id == "66433c87986a6833bc93d9bc") {
    qinfo = await CareerAptitudeQuestionnaries.find({ _id: questionnaire_id });
    qamount = qinfo[0]?.amount;
    vat_array = [
      {
        country_name: "Austria",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Belgium",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Bulgaria",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Croatia",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "Cyprus",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$4.75",
      },
      {
        country_name: "Czech Republic",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Denmark",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "Estonia",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Finland",
        excl_vat: "$18.99",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$6",
      },
      {
        country_name: "France",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Germany",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$4.75",
      },
      {
        country_name: "Greece",
        excl_vat: "$18.99",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$6",
      },
      {
        country_name: "Hungary",
        excl_vat: "$18.24",
        incl_vat: qamount,
        vat_per: 27,
        vat_value: "$6.75",
      },
      {
        country_name: "Ireland",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Italy",
        excl_vat: "$19.49",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$5.5",
      },
      {
        country_name: "Latvia",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Lithuania",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Luxembourg",
        excl_vat: "$21",
        incl_vat: qamount,
        vat_per: 16,
        vat_value: "$3.98",
      },
      {
        country_name: "Malta",
        excl_vat: "$20.49",
        incl_vat: qamount,
        vat_per: 18,
        vat_value: "$4.5",
      },
      {
        country_name: "Netherlands",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Poland",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Portugal",
        excl_vat: "$19.24",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$5.75",
      },
      {
        country_name: "Romania",
        excl_vat: "$20.24",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$4.75",
      },
      {
        country_name: "Slovakia",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
      {
        country_name: "Slovenia",
        excl_vat: "$19.49",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$5.5",
      },
      {
        country_name: "Spain",
        excl_vat: "$19.74",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$5.75",
      },
      {
        country_name: "Sweden",
        excl_vat: "$18.74",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$6.75",
      },
      {
        country_name: "United Kingdom",
        excl_vat: "$19.99",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$4.99",
      },
    ];
  } else if (questionnaire_id == "6436694cf923aa5ea7ad37cc" || questionnaire_id == "64366966f923aa5ea7ad37d3") {
    qinfo = await Questionnaire.find({ _id: questionnaire_id });
    qamount = paymentAmount;
    if (paymentAmount == '3.85') {
      vat_array = [
        { country_name: "Austria", excl_vat: "$4.08", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.82" },
        { country_name: "Belgium", excl_vat: "$4.05", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.85" },
        { country_name: "Bulgaria", excl_vat: "$4.08", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.82" },
        { country_name: "Croatia", excl_vat: "$3.92", incl_vat: paymentAmount, vat_per: 25, vat_value: "$0.98" },
        { country_name: "Cyprus", excl_vat: "$4.12", incl_vat: paymentAmount, vat_per: 19, vat_value: "$0.78" },
        { country_name: "Czech Republic", excl_vat: "$4.05", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.85" },
        { country_name: "Denmark", excl_vat: "$3.92", incl_vat: paymentAmount, vat_per: 25, vat_value: "$0.98" },
        { country_name: "Estonia", excl_vat: "$4.08", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.82" },
        { country_name: "Finland", excl_vat: "$3.95", incl_vat: paymentAmount, vat_per: 24, vat_value: "$0.95" },
        { country_name: "France", excl_vat: "$4.08", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.82" },
        { country_name: "Germany", excl_vat: "$4.12", incl_vat: paymentAmount, vat_per: 19, vat_value: "$0.78" },
        { country_name: "Greece", excl_vat: "$3.95", incl_vat: paymentAmount, vat_per: 24, vat_value: "$0.95" },
        { country_name: "Hungary", excl_vat: "$3.86", incl_vat: paymentAmount, vat_per: 27, vat_value: "$1.04" },
        { country_name: "Ireland", excl_vat: "$3.98", incl_vat: paymentAmount, vat_per: 23, vat_value: "$0.92" },
        { country_name: "Italy", excl_vat: "$4.02", incl_vat: paymentAmount, vat_per: 22, vat_value: "$0.88" },
        { country_name: "Latvia", excl_vat: "$4.05", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.85" },
        { country_name: "Lithuania", excl_vat: "$4.05", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.85" },
        { country_name: "Luxembourg", excl_vat: "$4.22", incl_vat: paymentAmount, vat_per: 16, vat_value: "$0.68" },
        { country_name: "Malta", excl_vat: "$4.15", incl_vat: paymentAmount, vat_per: 18, vat_value: "$0.75" },
        { country_name: "Netherlands", excl_vat: "$4.05", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.85" },
        { country_name: "Poland", excl_vat: "$3.98", incl_vat: paymentAmount, vat_per: 23, vat_value: "$0.92" },
        { country_name: "Portugal", excl_vat: "$3.98", incl_vat: paymentAmount, vat_per: 23, vat_value: "$0.92" },
        { country_name: "Romania", excl_vat: "$4.12", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.78" },
        { country_name: "Slovakia", excl_vat: "$4.08", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.82" },
        { country_name: "Slovenia", excl_vat: "$4.02", incl_vat: paymentAmount, vat_per: 22, vat_value: "$0.88" },
        { country_name: "Spain", excl_vat: "$4.05", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.85" },
        { country_name: "Sweden", excl_vat: "$3.92", incl_vat: paymentAmount, vat_per: 25, vat_value: "$0.98" },
        { country_name: "United Kingdom", excl_vat: "$4.08", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.82" }
      ];
    } else if (paymentAmount == '5.00') {
      vat_array = [
        { country_name: "Austria", excl_vat: "$4.17", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.83" },
        { country_name: "Belgium", excl_vat: "$4.13", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.87" },
        { country_name: "Bulgaria", excl_vat: "$4.17", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.83" },
        { country_name: "Croatia", excl_vat: "$4.00", incl_vat: paymentAmount, vat_per: 25, vat_value: "$1.00" },
        { country_name: "Cyprus", excl_vat: "$4.20", incl_vat: paymentAmount, vat_per: 19, vat_value: "$0.80" },
        { country_name: "Czech Republic", excl_vat: "$4.13", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.87" },
        { country_name: "Denmark", excl_vat: "$4.00", incl_vat: paymentAmount, vat_per: 25, vat_value: "$1.00" },
        { country_name: "Estonia", excl_vat: "$4.17", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.83" },
        { country_name: "Finland", excl_vat: "$4.03", incl_vat: paymentAmount, vat_per: 24, vat_value: "$0.97" },
        { country_name: "France", excl_vat: "$4.17", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.83" },
        { country_name: "Germany", excl_vat: "$4.20", incl_vat: paymentAmount, vat_per: 19, vat_value: "$0.80" },
        { country_name: "Greece", excl_vat: "$4.03", incl_vat: paymentAmount, vat_per: 24, vat_value: "$0.97" },
        { country_name: "Hungary", excl_vat: "$3.94", incl_vat: paymentAmount, vat_per: 27, vat_value: "$1.06" },
        { country_name: "Ireland", excl_vat: "$4.05", incl_vat: paymentAmount, vat_per: 23, vat_value: "$0.95" },
        { country_name: "Italy", excl_vat: "$4.09", incl_vat: paymentAmount, vat_per: 22, vat_value: "$0.91" },
        { country_name: "Latvia", excl_vat: "$4.13", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.87" },
        { country_name: "Lithuania", excl_vat: "$4.13", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.87" },
        { country_name: "Luxembourg", excl_vat: "$4.31", incl_vat: paymentAmount, vat_per: 16, vat_value: "$0.69" },
        { country_name: "Malta", excl_vat: "$4.24", incl_vat: paymentAmount, vat_per: 18, vat_value: "$0.76" },
        { country_name: "Netherlands", excl_vat: "$4.13", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.87" },
        { country_name: "Poland", excl_vat: "$4.05", incl_vat: paymentAmount, vat_per: 23, vat_value: "$0.95" },
        { country_name: "Portugal", excl_vat: "$4.05", incl_vat: paymentAmount, vat_per: 23, vat_value: "$0.95" },
        { country_name: "Romania", excl_vat: "$4.20", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.80" },
        { country_name: "Slovakia", excl_vat: "$4.17", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.83" },
        { country_name: "Slovenia", excl_vat: "$4.09", incl_vat: paymentAmount, vat_per: 22, vat_value: "$0.91" },
        { country_name: "Spain", excl_vat: "$4.13", incl_vat: paymentAmount, vat_per: 21, vat_value: "$0.87" },
        { country_name: "Sweden", excl_vat: "$4.00", incl_vat: paymentAmount, vat_per: 25, vat_value: "$1.00" },
        { country_name: "United Kingdom", excl_vat: "$4.17", incl_vat: paymentAmount, vat_per: 20, vat_value: "$0.83" }
      ];
    } else {
      vat_array = [
        {
          country_name: "Austria",
          excl_vat: "$8.25",
          incl_vat: paymentAmount,
          vat_per: 20,
          vat_value: "$1.65",
        },
        {
          country_name: "Belgium",
          excl_vat: "$8.18",
          incl_vat: paymentAmount,
          vat_per: 21,
          vat_value: "$1.72",
        },
        {
          country_name: "Bulgaria",
          excl_vat: "$8.25",
          incl_vat: paymentAmount,
          vat_per: 20,
          vat_value: "$1.65",
        },
        {
          country_name: "Croatia",
          excl_vat: "$7.92",
          incl_vat: paymentAmount,
          vat_per: 25,
          vat_value: "$1.98",
        },
        {
          country_name: "Cyprus",
          excl_vat: "$8.32",
          incl_vat: paymentAmount,
          vat_per: 19,
          vat_value: "$1.58",
        },
        {
          country_name: "Czech Republic",
          excl_vat: "$8.18",
          incl_vat: paymentAmount,
          vat_per: 21,
          vat_value: "$1.72",
        },
        {
          country_name: "Denmark",
          excl_vat: "$7.92",
          incl_vat: paymentAmount,
          vat_per: 25,
          vat_value: "$1.98",
        },
        {
          country_name: "Estonia",
          excl_vat: "$8.25",
          incl_vat: paymentAmount,
          vat_per: 20,
          vat_value: "$1.65",
        },
        {
          country_name: "Finland",
          excl_vat: "$7.98",
          incl_vat: paymentAmount,
          vat_per: 24,
          vat_value: "$1.92",
        },
        {
          country_name: "France",
          excl_vat: "$8.25",
          incl_vat: paymentAmount,
          vat_per: 20,
          vat_value: "$1.65",
        },
        {
          country_name: "Germany",
          excl_vat: "$8.32",
          incl_vat: paymentAmount,
          vat_per: 19,
          vat_value: "$1.58",
        },
        {
          country_name: "Greece",
          excl_vat: "$7.98",
          incl_vat: paymentAmount,
          vat_per: 24,
          vat_value: "$1.92",
        },
        {
          country_name: "Hungary",
          excl_vat: "$7.80",
          incl_vat: paymentAmount,
          vat_per: 27,
          vat_value: "$2.10",
        },
        {
          country_name: "Ireland",
          excl_vat: "$8.05",
          incl_vat: paymentAmount,
          vat_per: 23,
          vat_value: "$1.85",
        },
        {
          country_name: "Italy",
          excl_vat: "$8.11",
          incl_vat: paymentAmount,
          vat_per: 22,
          vat_value: "$1.79",
        },
        {
          country_name: "Latvia",
          excl_vat: "$8.18",
          incl_vat: paymentAmount,
          vat_per: 21,
          vat_value: "$1.72",
        },
        {
          country_name: "Lithuania",
          excl_vat: "$8.18",
          incl_vat: paymentAmount,
          vat_per: 21,
          vat_value: "$1.72",
        },
        {
          country_name: "Luxembourg",
          excl_vat: "$8.53",
          incl_vat: paymentAmount,
          vat_per: 16,
          vat_value: "$1.37",
        },
        {
          country_name: "Malta",
          excl_vat: "$8.39",
          incl_vat: paymentAmount,
          vat_per: 18,
          vat_value: "$1.51",
        },
        {
          country_name: "Netherlands",
          excl_vat: "$8.18",
          incl_vat: paymentAmount,
          vat_per: 21,
          vat_value: "$1.72",
        },
        {
          country_name: "Poland",
          excl_vat: "$8.05",
          incl_vat: paymentAmount,
          vat_per: 23,
          vat_value: "$1.85",
        },
        {
          country_name: "Portugal",
          excl_vat: "$8.05",
          incl_vat: paymentAmount,
          vat_per: 23,
          vat_value: "$1.85",
        },
        {
          country_name: "Romania",
          excl_vat: "$8.32",
          incl_vat: paymentAmount,
          vat_per: 21,
          vat_value: "$1.58",
        },
        {
          country_name: "Slovakia",
          excl_vat: "$8.25",
          incl_vat: paymentAmount,
          vat_per: 20,
          vat_value: "$1.65",
        },
        {
          country_name: "Slovenia",
          excl_vat: "$8.11",
          incl_vat: paymentAmount,
          vat_per: 22,
          vat_value: "$1.79",
        },
        {
          country_name: "Spain",
          excl_vat: "$8.18",
          incl_vat: paymentAmount,
          vat_per: 21,
          vat_value: "$1.72",
        },
        {
          country_name: "Sweden",
          excl_vat: "$7.92",
          incl_vat: paymentAmount,
          vat_per: 25,
          vat_value: "$1.98",
        },
        {
          country_name: "United Kingdom",
          excl_vat: "$8.25",
          incl_vat: paymentAmount,
          vat_per: 20,
          vat_value: "$1.65",
        },
      ];
    }

  }

  let vat_data = null;

  for (let i = 0; i < vat_array.length; i++) {
    if (vat_array[i].country_name == userData?.country) {
      vat_array[i].excl_vat = `$${(
        vat_array[i].incl_vat /
        (1 + vat_array[i].vat_per / 100)
      ).toFixed(2)}`;
      vat_array[i].vat_value = `$${(
        vat_array[i].incl_vat -
        vat_array[i].incl_vat / (1 + vat_array[i].vat_per / 100)
      ).toFixed(2)}`;
      vat_array[i].vat_per = `${vat_array[i].vat_per}%`;
      vat_data = vat_array[i];
    }
  }

  if (!vat_data?.country_name) {
    vat_data = {
      country_name: userData?.country,
      excl_vat: qamount,
      incl_vat: qamount,
      vat_per: "0%",
      vat_value: "$0",
      qamount: qamount,
    };
  }

  const now = new Date();
  const year = now.getFullYear();
  const iso_cod = userData?.country_code;
  // const invoice_date = update_booking.createdAt;
  // const delivery_date = update_booking.createdAt;
  const invoice_date = now;
  const delivery_date = now;
  const invDate = moment(invoice_date).format("DD-MM-YYYY");
  const deliveryDate = moment(delivery_date).format("DD-MM-YYYY");

  // Find or create a counter document for the given iso_cod
  let middlenumber = 632495;
  let counter = await Invoice.findOne({ iso_cod });

  if (!counter) {
    // If the counter document doesn't exist, create it
    counter = new Invoice({
      iso_cod: iso_cod,
      sequential_number: 1,
      middlenumber: middlenumber,
      country: userData?.country,
    });
  } else {
    // Increment the sequential number for the existing counter document
    middlenumber = counter.middlenumber;
    counter.sequential_number += 1;
  }
  await counter.save();

  let paddedSequentialNumber = String(counter.sequential_number).padStart(
    3,
    "0"
  );

  if (paddedSequentialNumber == 1000) {
    middlenumber = middlenumber + 1;
    let counter = await Invoice.findOne({ iso_cod });
    if (counter) {
      counter.middlenumber = middlenumber;
      middlenumber = counter.middlenumber;
      counter.sequential_number = 1;
      paddedSequentialNumber = String(counter.sequential_number).padStart(
        3,
        "0"
      );
    }
    await counter.save();
  }

  // sequential number restart from 1, if it becomes 999 (accourding a city)
  const invNum = `INV-${iso_cod}-${middlenumber}-${year}-${paddedSequentialNumber}`;
  const orderID = `#${middlenumber}${paddedSequentialNumber}${iso_cod}`;

  const adminInfo = await InvoiceInfo.findOne({
    _id: "64fc0122decb41ce6adbf4f7",
  });

  const newInfo = new Invoice({
    invoice_number: invNum,
    invoice_date: invDate,
    user_id: user_id,
    user_name: userData?.name,
    surname: userData?.surname,
    questionnaire_id: questionnaire_id,
    booking_id: booking_id,
    user_address_one: userData?.address_one,
    user_address_two: userData?.address_two,
    postal_code: userData?.postal_code,
    city: userData?.city,
    state: userData?.state ? userData?.state : "",
    country: userData?.country,
    order_id_number: orderID,
    delivery_date: deliveryDate,
    description: qinfo[0].type,
    qty: "1",
    unit_price: vat_data.excl_vat,
    sales_tax: "$0.00",
    total_amount: paymentAmount ? paymentAmount : qinfo[0].amount,
    iso_cod: userData?.country_code,
    admin_title: adminInfo.title,
    admin_address: adminInfo.address,
    vat_rate: vat_data.vat_per,
    unit_price_inc: vat_data.incl_vat,
    vat_subtotal: vat_data.vat_value,
  });

  await newInfo.save();
  const invoicePath = path.join(
    __dirname,
    `../public/invoice/invoice_${(questionnaire_id == "6436694cf923aa5ea7ad37cc" || questionnaire_id == "64366966f923aa5ea7ad37d3") ? invNum : booking_id}.pdf`
  );
  const invoicedata = await GenerateInvoice(
    "../view/invoice.ejs",
    "../view/certificate-style.css",
    invoicePath,
    newInfo,
    adminInfo,
    res
  );
  let invoiceurl = `${process.env.hostPath}/invoice/invoice_${(questionnaire_id == "6436694cf923aa5ea7ad37cc" || questionnaire_id == "64366966f923aa5ea7ad37d3") ? invNum : booking_id}.pdf`;
  return { invoiceUrl: invoiceurl, invoiceNumber: invNum };
}

function identifyQuestionnaireName(quesId, isPaid) {
  let name = null;

  if (quesId === "6436694cf923aa5ea7ad37cc") {
    name = isPaid == 'yes' ? "Culture Fair IQ Test" : "Free Culture Fair IQ Test";
  } else if (quesId === "64366966f923aa5ea7ad37d3") {
    name = isPaid == 'yes' ? "Classical IQ Test" : "Free Classical IQ Test";
  } else if (quesId === "65586e235046c32c7cd385cd") {
    name = "Enneagram Personality Test";
  } else if (quesId === "65d33b0f9bef2027f0594db2") {
    name = "16 Types Personality Test";
  } else if (quesId === "65ec352edbd8850c638f33fd") {
    name = "Big Five Personality Test";
  } else if (quesId === "662f3b21d3279b1ec0877cd0") {
    name = "DISC Personality Test";
  } else if (quesId === "66433c87986a6833bc93d9bc") {
    name = "Career Aptitude Test";
  }

  return name;
}

const pay = async (req, res) => {
  let approvalurl = "";
  const user_id = req.body.user_id;
  const unique_id = req?.body?.unique_id;
  const amount = req.body.amount;
  const questionnaire_id = req.body.questionnaire_id;
  let booking_id = "undefined";
  booking_id = req.body?.booking_id || "undefined";
  let report_id = req?.body?.report_id;
  let isQuestionnairePaid = req?.body?.isQuestionnairePaid;
  let ennagramContents = {
    booking_id: booking_id,
    userId: user_id,
  };

  const addpayment = await Payments.create({
    user_id: user_id,
    unique_id: unique_id,
    booking_id: booking_id,
    questionnaire_id: questionnaire_id,
    amount: amount,
    status: 0,
  });
  const paymentId = addpayment._id;

  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: `${process.env.hostPath}/api/payment/success`,
      cancel_url: `${process.env.hostPath}/apipayment/cancel`,
      // "return_url": "http://localhost:5000/api/payment/success",
      // "cancel_url": "http://localhost:5000/apipayment/cancel"
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: questionnaire_id,
              sku: `${ennagramContents.booking_id}_${ennagramContents.userId}`,
              price: amount,
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: amount,
        },
        description: paymentId,
        custom: JSON.stringify({
          report_id: report_id,
          isQuestionnairePaid: isQuestionnairePaid
        })
      },
    ],
    application_context: { shipping_preference: "NO_SHIPPING" },
  };

  // const totalamount = create_payment_json.transactions[0].amount.total;

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel == "approval_url") {
          approvalurl = payment.links[i].href;
          // res.send(payment.links[i].href);
          res.send({ url: approvalurl });
        }
      }
    }
  });
};

function execute(paymentId, execute_payment_json) {
  return new Promise(function (resolve, reject) {
    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      function (error, payment) {
        if (error) {
          //console.log(error)
          reject(error);
        } else {
          // console.log(payment)
          resolve(payment);
        }
      }
    );
  });
}

const success = async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const execute_payment_json = {
    payer_id: payerId,
  };

  const checkPayment = await execute(paymentId, execute_payment_json);
  const questionnaireId = checkPayment.transactions[0].item_list.items[0].name;
  let ennagram_contents = checkPayment.transactions[0].item_list.items[0].sku;
  let [booking_id, userId] = ennagram_contents?.split("_");
  let customdata = JSON.parse(checkPayment.transactions[0]?.custom);

  if (checkPayment != undefined) {
    var payment = await Payments.findOneAndUpdate(
      { _id: checkPayment.transactions[0].description },
      { status: ((questionnaireId == "6436694cf923aa5ea7ad37cc" || questionnaireId == "64366966f923aa5ea7ad37d3") && customdata?.isQuestionnairePaid !== 'yes') ? 2 : 1, is_free: ((questionnaireId == "6436694cf923aa5ea7ad37cc" || questionnaireId == "64366966f923aa5ea7ad37d3") && customdata?.isQuestionnairePaid !== 'yes') ? true : false },
    );

    // Call google analytics api
    let quesnnaireName = identifyQuestionnaireName(questionnaireId, customdata?.isQuestionnairePaid)
    await sendGa4Purchase({
      transactionId: payment._id.toString(),
      testId: questionnaireId,
      testName: quesnnaireName,
      amount: Number(payment.amount),
      currency: "USD",
      debug: false
    });

    const userData = await User.findOne({ _id: userId });
    if (booking_id !== "undefined") {

      // IQ tests.................
      let checkCultureTest = await Invoice.find({
        user_id: userId,
        questionnaire_id: "6436694cf923aa5ea7ad37cc",
      });
      let cultureTestStatus = checkCultureTest.length > 0;

      let checkClassicalTest = await Invoice.find({
        user_id: userId,
        questionnaire_id: "64366966f923aa5ea7ad37d3",
      });
      let classicalTestStatus = checkClassicalTest.length > 0;

      // Personality tests.................
      let invoiceData = {};
      if (questionnaireId !== "66433c87986a6833bc93d9bc") {
        invoiceData = await createUserInvoice(
          userId,
          questionnaireId,
          booking_id,
          res
        );
      }
      let pdfurl;
      // let invoiceurl = `${process.env.hostPath}/invoice/invoice_${booking_id}.pdf`;
      let invoiceurl = invoiceData?.invoiceUrl;
      let invoiceNum = invoiceData?.invoiceNumber;
      let ennagramTestStatus;
      let sixteentypeTestStatus;
      let bigFiveTestStatus;
      let discTestStatus;
      let careerATestStatus;
      let filename;

      if (questionnaireId == "65586e235046c32c7cd385cd") {
        await EnneagramReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/enneagram_report/enneagram_report_${booking_id}.pdf`;
        filename = "Enneagram.pdf";
      }
      if (questionnaireId == "65d33b0f9bef2027f0594db2") {
        await SixteenTypeReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/sixteentype_report/sixteen_type_report_${booking_id}.pdf`;
        filename = "SixteenType.pdf";
      }
      if (questionnaireId == "65ec352edbd8850c638f33fd") {
        await BigFiveReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/bigfivetype_report/bigfivetype_report_${booking_id}.pdf`;
        filename = "BigFive.pdf";
      }
      if (questionnaireId == "662f3b21d3279b1ec0877cd0") {
        await DiscReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/disc_report/disc_report_${booking_id}.pdf`;
        filename = "Disc.pdf";
      }
      if (questionnaireId == "66433c87986a6833bc93d9bc") {
        // await CareerAptitudeReportData.updateOne(
        //   { booking_id: booking_id },
        //   {
        //     $set: {
        //       report_status: true,
        //       invoiceUrl: invoiceurl,
        //       invoice_number: invoiceNum,
        //     },
        //   }
        // );
        // pdfurl = `${process.env.hostPath}/careeraptitude_report/careeraptitude_report_${booking_id}.pdf`;
        // filename = "CareerAptitude.pdf";

        await Booking.findOneAndUpdate(
          { _id: booking_id },
          { count: 9 }
        );

        return res.redirect(
          `${process.env.redirectUrl}/career-aptitude-test`
        );
      }

      if (
        questionnaireId == "65586e235046c32c7cd385cd" ||
        questionnaireId == "65d33b0f9bef2027f0594db2" ||
        questionnaireId == "65ec352edbd8850c638f33fd" ||
        questionnaireId == "662f3b21d3279b1ec0877cd0"
        // questionnaireId == "66433c87986a6833bc93d9bc"
      ) {
        // let checkEnnagramTest = await Invoice.find({ user_id: userId, questionnaire_id: "65586e235046c32c7cd385cd" });
        let checkEnnagramTest = await EnneagramReportData.find({
          user_id: userId,
          questionnaire_id: "65586e235046c32c7cd385cd",
          report_status: true,
        });
        ennagramTestStatus = checkEnnagramTest.length > 0;

        // let checkSixteenTypeTest = await Invoice.find({ user_id: userId, questionnaire_id: "65d33b0f9bef2027f0594db2" });
        let checkSixteenTypeTest = await SixteenTypeReportData.find({
          user_id: userId,
          questionnaire_id: "65d33b0f9bef2027f0594db2",
          report_status: true,
        });
        sixteentypeTestStatus = checkSixteenTypeTest.length > 0;

        // let checkBigFiveTest = await Invoice.find({ user_id: userId, questionnaire_id: "65ec352edbd8850c638f33fd" });
        let checkBigFiveTest = await BigFiveReportData.find({
          user_id: userId,
          questionnaire_id: "65ec352edbd8850c638f33fd",
          report_status: true,
        });
        bigFiveTestStatus = checkBigFiveTest.length > 0;

        // let checkDiscTest = await Invoice.find({ user_id: userId, questionnaire_id: "662f3b21d3279b1ec0877cd0" });
        let checkDiscTest = await DiscReportData.find({
          user_id: userId,
          questionnaire_id: "662f3b21d3279b1ec0877cd0",
          report_status: true,
        });
        discTestStatus = checkDiscTest.length > 0;

        // let checkCareerATest = await Invoice.find({ user_id: userId, questionnaire_id: "66433c87986a6833bc93d9bc" });
        let checkCareerATest = await CareerAptitudeReportData.find({
          user_id: userId,
          questionnaire_id: "66433c87986a6833bc93d9bc",
          report_status: true,
        });
        careerATestStatus = checkCareerATest.length > 0;

        let data = {
          username: userData?.name,
          surname: userData?.surname,
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: ennagramTestStatus,
          sixteentypeTestStatus: sixteentypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerATestStatus: careerATestStatus,
        };

        const file = "../view/enneagram_msg.ejs";
        const subject = "Test Result";
        // let filename = 'enneagram.pdf';
        let filesname = "invoice.pdf";

        let attachment = [
          { filename: filename, path: pdfurl },
          { filename: filesname, path: invoiceurl },
        ];
        sendEmailwithCertificate(
          userData?.email,
          "token",
          subject,
          file,
          data,
          attachment,
          res
        );
        const update_booking = await Booking.findOneAndUpdate(
          { _id: booking_id },
          { status: false }
        );
      }

      // redirection to forntend report
      if (questionnaireId == "65586e235046c32c7cd385cd") {
        // res.redirect(`${process.env.redirectUrl}/user/questionaire/enneagram_report?booking_id=${booking_id}`);
        res.redirect(
          `${process.env.redirectUrl}?user?questionaire?enneagram_report?booking_id=${booking_id}`
        );
      }
      if (questionnaireId == "65d33b0f9bef2027f0594db2") {
        // res.redirect(`${process.env.redirectUrl}/user/questionaire/sixteentype_report?booking_id=${booking_id}`);
        res.redirect(
          `${process.env.redirectUrl}?user?questionaire?sixteentype_report?booking_id=${booking_id}`
        );
      }
      if (questionnaireId == "65ec352edbd8850c638f33fd") {
        // res.redirect(`${process.env.redirectUrl}/user/questionaire/bigfive_report?booking_id=${booking_id}`);
        res.redirect(
          `${process.env.redirectUrl}?user?questionaire?bigfive_report?booking_id=${booking_id}`
        );
      }
      if (questionnaireId == "662f3b21d3279b1ec0877cd0") {
        // res.redirect(`${process.env.redirectUrl}/user/questionaire/disc_report?booking_id=${booking_id}`);
        res.redirect(
          `${process.env.redirectUrl}?user?questionaire?disc_report?booking_id=${booking_id}`
        );
      }
      // if (questionnaireId == "66433c87986a6833bc93d9bc") {
      //   // res.redirect(`${process.env.redirectUrl}/user/questionaire/careeraptitude_report?booking_id=${booking_id}`);
      //   res.redirect(
      //     `${process.env.redirectUrl}?user?questionaire?careeraptitude_report?booking_id=${booking_id}`
      //   );
      // }
    } else {
      if (questionnaireId == "6436694cf923aa5ea7ad37cc" && customdata?.isQuestionnairePaid == 'yes') {
        res.redirect(`${process.env.redirectUrl}/culture-fair-iq-test`);
      } else if (questionnaireId == "6436694cf923aa5ea7ad37cc") { //this condition is when user come from the free test to paid test culture-fair-iq-test
        let paymentAmount = payment.amount;

        if (paymentAmount == '5.00' && customdata?.report_id) {

          let invoiceData = await createUserInvoice(
            userId,
            questionnaireId,
            booking_id,
            res,
            paymentAmount
          );
          const reportResponse = await ReportData.findOneAndUpdate({ _id: customdata?.report_id, user_id: userId, questionnaire_id: questionnaireId },
            {
              payment_status: { certificatePaymentStatus: true, reportPaymentStatus: true, },
              $push: {
                paymentMethods: "Paypal",
              },
            }
          );
          const stepData = await WindowStep.findOne({ user_id: userId, questionnaireId: questionnaireId, unique_id: reportResponse?.unique_id });

          const {
            cultureTestStatus,
            classicalTestStatus,
            enneagramTestStatus,
            sixteenTypeTestStatus,
            bigFiveTestStatus,
            discTestStatus,
            careerTestStatus,
          } = await getAllTestStatuses(userId);


          let sendmailID = userData?.email;
          const file = "../view/text_mssg.ejs";
          const subject = "IQ Test Result";
          let testpdfurl = `${process.env.hostPath}/certificate/cultureCertificate_${stepData?.unique_id}.pdf`;
          let filesname = "Report.pdf";
          let filesnames = "Invoice.pdf";
          let attachment = [
            { filename: filesname, path: testpdfurl },
            { filename: filesnames, path: invoiceData?.invoiceUrl },
          ];
          const sendmessage = {
            username: userData?.name,
            noofcurrectans: stepData?.finalPageData?.score,
            Qcountt: 30,
            percentile: reportResponse?.percentile,
            score: reportResponse?.score,
            paidTestButton: "",
            paidTestLink: "",
            questionnaire: 'Culture Fair IQ test',
            cultureTestStatus: cultureTestStatus,
            classicalTestStatus: classicalTestStatus,
            ennagramTestStatus: enneagramTestStatus,
            sixteentypeTestStatus: sixteenTypeTestStatus,
            bigFiveTestStatus: bigFiveTestStatus,
            discTestStatus: discTestStatus,
            careerTestStatus: careerTestStatus,
            isPassword: false
          };
          sendEmailwithCertificate(
            sendmailID,
            "token",
            subject,
            file,
            sendmessage,
            attachment,
            res
          );
        } else if (paymentAmount == '3.85' && customdata?.report_id) {

          let invoiceData = await createUserInvoice(
            userId,
            questionnaireId,
            booking_id,
            res,
            paymentAmount
          );

          const stepData = await WindowStep.findOne({ user_id: userId, questionnaireId: questionnaireId, isTestEnd: false }).sort({ createdAt: -1 });
          const reportResponse = await ReportData.findOne({ user_id: userId, questionnaire_id: questionnaireId }).sort({ createdAt: -1 });
          if (reportResponse) {
            await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
              {
                invoice_number: invoiceData?.invoiceNumber, unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, },
                $push: {
                  paymentMethods: "Paypal",
                },
              });
          }
          const certificateInfo = await UserCertInfo.findOne({ user_id: userId, questionnaire_id: questionnaireId }).sort({ createdAt: -1 });
          if (certificateInfo) {
            await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
              { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
          }

          const {
            cultureTestStatus,
            classicalTestStatus,
            enneagramTestStatus,
            sixteenTypeTestStatus,
            bigFiveTestStatus,
            discTestStatus,
            careerTestStatus,
          } = await getAllTestStatuses(userId);

          let sendmailID = userData?.email;
          const file = "../view/text_mssg.ejs";
          const subject = "IQ Test Result";
          let pdfurl = `${process.env.hostPath}/certificate/certificate_${stepData?.unique_id}.pdf`;
          let filename = "certificate.pdf";
          let filesnames = "Invoice.pdf";
          let attachment = [
            { filename: filename, path: pdfurl },
            { filename: filesnames, path: invoiceData?.invoiceUrl },
          ];

          const sendmessage = {
            username: userData?.name,
            noofcurrectans: stepData?.finalPageData?.score,
            Qcountt: 30,
            percentile: reportResponse?.percentile,
            score: reportResponse?.score,
            paidTestButton: "",
            paidTestLink: "",
            questionnaire: 'Culture Fair IQ test',
            cultureTestStatus: cultureTestStatus,
            classicalTestStatus: classicalTestStatus,
            ennagramTestStatus: enneagramTestStatus,
            sixteentypeTestStatus: sixteenTypeTestStatus,
            bigFiveTestStatus: bigFiveTestStatus,
            discTestStatus: discTestStatus,
            careerTestStatus: careerTestStatus,
            isPassword: false
          };

          sendEmailwithCertificate(
            sendmailID,
            "token",
            subject,
            file,
            sendmessage,
            attachment,
            res
          );
        } else {
          const stepData = await WindowStep.findOne({ user_id: userId, questionnaireId: questionnaireId, isTestEnd: false }).sort({ createdAt: -1 });
          const reportResponse = await ReportData.findOne({ user_id: userId, questionnaire_id: questionnaireId }).sort({ createdAt: -1 });
          if (reportResponse) {
            await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
              {
                unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, },
                $push: {
                  paymentMethods: "Paypal",
                },
              });
          }
          // const certificateInfo = await UserCertInfo.findOne({ user_id: userId, questionnaire_id: questionnaireId }).sort({ createdAt: -1 });
          // if (certificateInfo) {
          //   await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
          //     { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
          // }
          // await TestCount.findOneAndUpdate(
          //   { user_id: userId },
          //   { count: 0 }
          // );
          if (stepData) {
            await WindowStep.updateOne({ _id: stepData?._id }, { window_step: 9 });
          }
        }
        if (customdata?.report_id) {
          res.redirect(`${process.env.redirectUrl}/testresults`);
        } else {
          res.redirect(`${process.env.redirectUrl}/free-culture-fair-iq-test`);
        }
      } else if (questionnaireId == "64366966f923aa5ea7ad37d3" && customdata?.isQuestionnairePaid == 'yes') {
        res.redirect(`${process.env.redirectUrl}/classical-iq-test`);
      } else if (questionnaireId == "64366966f923aa5ea7ad37d3") { //this condition is when user come from the free test to paid test culture-fair-iq-test
        let paymentAmount = payment.amount;

        if (paymentAmount == '5.00' && customdata?.report_id) {

          let invoiceData = await createUserInvoice(
            userId,
            questionnaireId,
            booking_id,
            res,
            paymentAmount
          );
          const reportResponse = await ReportData.findOneAndUpdate({ _id: customdata?.report_id, user_id: userId, questionnaire_id: questionnaireId },
            {
              payment_status: { certificatePaymentStatus: true, reportPaymentStatus: true, },
              $push: {
                paymentMethods: "Paypal",
              },
            }
          );
          const stepData = await WindowStep.findOne({ user_id: userId, questionnaireId: questionnaireId, unique_id: reportResponse?.unique_id });

          const {
            cultureTestStatus,
            classicalTestStatus,
            enneagramTestStatus,
            sixteenTypeTestStatus,
            bigFiveTestStatus,
            discTestStatus,
            careerTestStatus,
          } = await getAllTestStatuses(userId);


          let sendmailID = userData?.email;
          const file = "../view/text_mssg.ejs";
          const subject = "IQ Test Result";
          let testpdfurl = `${process.env.hostPath}/certificate/classicalCertificate_${stepData?.unique_id}.pdf`;
          let filesname = "Report.pdf";
          let filesnames = "Invoice.pdf";
          let attachment = [
            { filename: filesname, path: testpdfurl },
            { filename: filesnames, path: invoiceData?.invoiceUrl },
          ];
          const sendmessage = {
            username: userData?.name,
            noofcurrectans: stepData?.finalPageData?.score,
            Qcountt: 30,
            percentile: reportResponse?.percentile,
            score: reportResponse?.score,
            paidTestButton: "",
            paidTestLink: "",
            questionnaire: 'Classical IQ test',
            cultureTestStatus: cultureTestStatus,
            classicalTestStatus: classicalTestStatus,
            ennagramTestStatus: enneagramTestStatus,
            sixteentypeTestStatus: sixteenTypeTestStatus,
            bigFiveTestStatus: bigFiveTestStatus,
            discTestStatus: discTestStatus,
            careerTestStatus: careerTestStatus,
            isPassword: false
          };
          sendEmailwithCertificate(
            sendmailID,
            "token",
            subject,
            file,
            sendmessage,
            attachment,
            res
          );
        } else if (paymentAmount == '3.85' && customdata?.report_id) {

          let invoiceData = await createUserInvoice(
            userId,
            questionnaireId,
            booking_id,
            res,
            paymentAmount
          );

          const stepData = await WindowStep.findOne({ user_id: userId, questionnaireId: questionnaireId, isTestEnd: false }).sort({ createdAt: -1 });
          const reportResponse = await ReportData.findOne({ user_id: userId, questionnaire_id: questionnaireId }).sort({ createdAt: -1 });
          if (reportResponse) {
            await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
              {
                invoice_number: invoiceData?.invoiceNumber, unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, },
                $push: {
                  paymentMethods: "Paypal",
                },
              });
          }
          const certificateInfo = await UserCertInfo.findOne({ user_id: userId, questionnaire_id: questionnaireId }).sort({ createdAt: -1 });
          if (certificateInfo) {
            await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
              { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
          }

          const {
            cultureTestStatus,
            classicalTestStatus,
            enneagramTestStatus,
            sixteenTypeTestStatus,
            bigFiveTestStatus,
            discTestStatus,
            careerTestStatus,
          } = await getAllTestStatuses(userId);

          let sendmailID = userData?.email;
          const file = "../view/text_mssg.ejs";
          const subject = "IQ Test Result";
          let pdfurl = `${process.env.hostPath}/certificate/certificate_${stepData?.unique_id}.pdf`;
          let filename = "certificate.pdf";
          let filesnames = "Invoice.pdf";
          let attachment = [
            { filename: filename, path: pdfurl },
            { filename: filesnames, path: invoiceData?.invoiceUrl },
          ];

          const sendmessage = {
            username: userData?.name,
            noofcurrectans: stepData?.finalPageData?.score,
            Qcountt: 30,
            percentile: reportResponse?.percentile,
            score: reportResponse?.score,
            paidTestButton: "",
            paidTestLink: "",
            questionnaire: 'Classical IQ test',
            cultureTestStatus: cultureTestStatus,
            classicalTestStatus: classicalTestStatus,
            ennagramTestStatus: enneagramTestStatus,
            sixteentypeTestStatus: sixteenTypeTestStatus,
            bigFiveTestStatus: bigFiveTestStatus,
            discTestStatus: discTestStatus,
            careerTestStatus: careerTestStatus,
            isPassword: false
          };

          sendEmailwithCertificate(
            sendmailID,
            "token",
            subject,
            file,
            sendmessage,
            attachment,
            res
          );
        } else {
          const stepData = await WindowStep.findOne({ user_id: userId, questionnaireId: questionnaireId, isTestEnd: false }).sort({ createdAt: -1 });
          const reportResponse = await ReportData.findOne({ user_id: userId, questionnaire_id: questionnaireId }).sort({ createdAt: -1 });
          if (reportResponse) {
            await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
              {
                unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, },
                $push: {
                  paymentMethods: "Paypal",
                },
              });
          }
          // const certificateInfo = await UserCertInfo.findOne({ user_id: userId, questionnaire_id: questionnaireId }).sort({ createdAt: -1 });
          // if (certificateInfo) {
          //   await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
          //     { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
          // }
          // await TestCount.findOneAndUpdate(
          //   { user_id: userId },
          //   { count: 0 }
          // );
          if (stepData) {
            await WindowStep.updateOne({ _id: stepData?._id }, { window_step: 9 });
          }
        }
        if (customdata?.report_id) {
          res.redirect(`${process.env.redirectUrl}/testresults`);
        } else {
          res.redirect(`${process.env.redirectUrl}/free-classical-iq-test`);
        }
      }
    }
  }
};

const checkpaymentstatus = async (req, res) => {
  const user_id = req.body.user_id;
  const questionnaire_id = req.body.questionnaire_id;

  const data = await Payments.findOne({
    user_id: user_id,
    questionnaire_id: questionnaire_id,
    status: 1,
  });

  if (data) {
    // res.send({paymentStatus: 0});
    res.send({ paymentStatus: data.status });
  } else {
    const resdata = await Payments.findOne({
      user_id: user_id,
      questionnaire_id: questionnaire_id,
      status: 0,
    });
    if (resdata) {
      res.send({ paymentStatus: resdata.status });
    }
    // if(data.status !== 2) {
    //   res.send({paymentStatus: data.status});
    // }
  }
};

const cancel = async (req, res) => {
  const user_id = req.body.user_id;
  const questionnaire_id = req.body.questionnaire_id;

  const data = await Payments.findOneAndUpdate(
    { user_id: user_id, questionnaire_id: questionnaire_id, status: 1 },
    { status: 2 }
  );

  const data2 = await Payments.findOne({
    user_id: user_id,
    questionnaire_id: questionnaire_id,
    status: 2,
  });

  res.status(200).send({ msg: "quiz completed", status: data2.status });
};

const refund = async (req, res) => {
  res.send("refund");
};

const stripePayment = async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      payment_method_types: ["card"],
      amount: amountInCents,
      currency: "usd",
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).send({ error });
  }
};


const stripeGooglePayment = async (req, res) => {
  try {
    const { currency } = req.body;
    const amount = parseFloat(req.body.amount);
    const amountInCents = Math.round(amount * 100);
    if (!amount || !currency) {
      return res.status(400).json({ error: "Amount and currency are required" });
    }

    // Stripe expects amount in the smallest currency unit (e.g., cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true, // Enables Google Pay, Apple Pay, etc.
      },
      description: "Google Pay test transaction",
      metadata: { integration_check: "google_pay" },
    });

    // Send the client secret to the frontend
    res.status(200).send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Stripe error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getAllTestStatuses = async (user_id) => {
  // map of all questionnaire IDs
  const testIds = {
    cultureTest: "6436694cf923aa5ea7ad37cc",
    classicalTest: "64366966f923aa5ea7ad37d3",
    enneagramTest: "65586e235046c32c7cd385cd",
    sixteenTypeTest: "65d33b0f9bef2027f0594db2",
    bigFiveTest: "65ec352edbd8850c638f33fd",
    discTest: "662f3b21d3279b1ec0877cd0",
    careerTest: "66433c87986a6833bc93d9bc",
  };

  const statuses = {};

  for (const [key, questionnaire_id] of Object.entries(testIds)) {
    const count = await Invoice.countDocuments({ user_id, questionnaire_id });
    statuses[`${key}Status`] = count > 0;
  }

  return statuses;
};


const stripeSuccess = async (req, res) => {
  try {
    const user_id = req.body.user_id;
    const unique_id = req.body.unique_id;
    const amount = req.body.amount;
    const questionnaire_id = req.body.questionnaire_id;
    let booking_id = "undefined";
    booking_id = req.body?.bookingId || "undefined";
    let report_id = req?.body?.report_id;
    let isQuestionnairePaid = req?.body?.isQuestionnairePaid;
    const addpayment = await Payments.create({
      user_id: user_id,
      unique_id: unique_id,
      booking_id: booking_id,
      questionnaire_id: questionnaire_id,
      amount: amount,
      status: ((questionnaire_id == "6436694cf923aa5ea7ad37cc" || questionnaire_id == "64366966f923aa5ea7ad37d3") && isQuestionnairePaid !== 'yes') ? 2 : 1,
      is_free: ((questionnaire_id == "6436694cf923aa5ea7ad37cc" || questionnaire_id == "64366966f923aa5ea7ad37d3") && isQuestionnairePaid !== 'yes') ? true : false,
    });

    // Call google analytics api
    let quesnnaireName = identifyQuestionnaireName(questionnaire_id, isQuestionnairePaid)
    await sendGa4Purchase({
      transactionId: addpayment?._id?.toString(),
      testId: questionnaire_id,
      testName: quesnnaireName,
      amount: Number(amount),
      currency: "USD",
      debug: false
    });

    const userData = await User.findOne({ _id: user_id });
    if (booking_id !== "undefined") {
      // IQ tests.................
      let checkCultureTest = await Invoice.find({
        user_id: user_id,
        questionnaire_id: "6436694cf923aa5ea7ad37cc",
      });
      let cultureTestStatus = checkCultureTest.length > 0;

      let checkClassicalTest = await Invoice.find({
        user_id: user_id,
        questionnaire_id: "64366966f923aa5ea7ad37d3",
      });
      let classicalTestStatus = checkClassicalTest.length > 0;

      // Personality tests.................
      let invoiceData = {};
      if (questionnaireId !== "66433c87986a6833bc93d9bc") {
        invoiceData = await createUserInvoice(
          userId,
          questionnaireId,
          booking_id,
          res
        );
      }
      let pdfurl;
      // let invoiceurl = `${process.env.hostPath}/invoice/invoice_${booking_id}.pdf`;
      let invoiceurl = invoiceData?.invoiceUrl;
      let invoiceNum = invoiceData?.invoiceNumber;
      let ennagramTestStatus;
      let sixteentypeTestStatus;
      let bigFiveTestStatus;
      let discTestStatus;
      let careerATestStatus;
      let filename;

      if (questionnaire_id == "65586e235046c32c7cd385cd") {
        await EnneagramReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/enneagram_report/enneagram_report_${booking_id}.pdf`;
        filename = "Enneagram.pdf";
      }
      if (questionnaire_id == "65d33b0f9bef2027f0594db2") {
        await SixteenTypeReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/sixteentype_report/sixteen_type_report_${booking_id}.pdf`;
        filename = "SixteenType.pdf";
      }
      if (questionnaire_id == "65ec352edbd8850c638f33fd") {
        await BigFiveReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/bigfivetype_report/bigfivetype_report_${booking_id}.pdf`;
        filename = "BigFive.pdf";
      }
      if (questionnaire_id == "662f3b21d3279b1ec0877cd0") {
        await DiscReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/disc_report/disc_report_${booking_id}.pdf`;
        filename = "Disc.pdf";
      }
      if (questionnaire_id == "66433c87986a6833bc93d9bc") {
        // await CareerAptitudeReportData.updateOne(
        //   { booking_id: booking_id },
        //   {
        //     $set: {
        //       report_status: true,
        //       invoiceUrl: invoiceurl,
        //       invoice_number: invoiceNum,
        //     },
        //   }
        // );
        // pdfurl = `${process.env.hostPath}/careeraptitude_report/careeraptitude_report_${booking_id}.pdf`;
        // filename = "CareerAptitude.pdf";

        await Booking.findOneAndUpdate(
          { _id: booking_id },
          { count: 9 }
        );

        return res.redirect(
          `${process.env.redirectUrl}/career-aptitude-test`
        );
      }

      if (
        questionnaire_id == "65586e235046c32c7cd385cd" ||
        questionnaire_id == "65d33b0f9bef2027f0594db2" ||
        questionnaire_id == "65ec352edbd8850c638f33fd" ||
        questionnaire_id == "662f3b21d3279b1ec0877cd0"
        // questionnaire_id == "66433c87986a6833bc93d9bc"
      ) {
        // let checkEnnagramTest = await Invoice.find({ user_id: user_id, questionnaire_id: "65586e235046c32c7cd385cd" });
        let checkEnnagramTest = await EnneagramReportData.find({
          user_id: user_id,
          questionnaire_id: "65586e235046c32c7cd385cd",
          report_status: true,
        });
        ennagramTestStatus = checkEnnagramTest.length > 0;

        // let checkSixteenTypeTest = await Invoice.find({ user_id: user_id, questionnaire_id: "65d33b0f9bef2027f0594db2" });
        let checkSixteenTypeTest = await SixteenTypeReportData.find({
          user_id: user_id,
          questionnaire_id: "65d33b0f9bef2027f0594db2",
          report_status: true,
        });
        sixteentypeTestStatus = checkSixteenTypeTest.length > 0;

        // let checkBigFiveTest = await Invoice.find({ user_id: user_id, questionnaire_id: "65ec352edbd8850c638f33fd" });
        let checkBigFiveTest = await BigFiveReportData.find({
          user_id: user_id,
          questionnaire_id: "65ec352edbd8850c638f33fd",
          report_status: true,
        });
        bigFiveTestStatus = checkBigFiveTest.length > 0;

        // let checkDiscTest = await Invoice.find({ user_id: user_id, questionnaire_id: "662f3b21d3279b1ec0877cd0" });
        let checkDiscTest = await DiscReportData.find({
          user_id: user_id,
          questionnaire_id: "662f3b21d3279b1ec0877cd0",
          report_status: true,
        });
        discTestStatus = checkDiscTest.length > 0;

        // let checkCareerATest = await Invoice.find({ user_id: user_id, questionnaire_id: "66433c87986a6833bc93d9bc" });
        let checkCareerATest = await CareerAptitudeReportData.find({
          user_id: user_id,
          questionnaire_id: "66433c87986a6833bc93d9bc",
          report_status: true,
        });
        careerATestStatus = checkCareerATest.length > 0;

        let data = {
          username: userData?.name,
          surname: userData?.surname,
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: ennagramTestStatus,
          sixteentypeTestStatus: sixteentypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerATestStatus: careerATestStatus,
        };

        const file = "../view/enneagram_msg.ejs";
        const subject = "Test Result";
        // filename = 'enneagram.pdf';
        let filesname = "invoice.pdf";

        let attachment = [
          { filename: filename, path: pdfurl },
          { filename: filesname, path: invoiceurl },
        ];
        sendEmailwithCertificate(
          userData?.email,
          "token",
          subject,
          file,
          data,
          attachment,
          res
        );
        const update_booking = await Booking.findOneAndUpdate(
          { _id: booking_id },
          { status: false }
        );
      }
    }

    if (questionnaire_id == "6436694cf923aa5ea7ad37cc" && isQuestionnairePaid !== 'yes') {
      let paymentAmount = amount;

      if (paymentAmount == '5.00' && report_id) {
        let invoiceData = await createUserInvoice(
          user_id,
          questionnaire_id,
          booking_id,
          res,
          paymentAmount
        );
        console.log("report id ", report_id)
        const reportResponse = await ReportData.findOneAndUpdate({ _id: report_id, user_id: user_id, questionnaire_id: questionnaire_id },
          {
            payment_status: { certificatePaymentStatus: true, reportPaymentStatus: true, },
            $push: {
              paymentMethods: "Stripe",
            },
          }
        );

        const {
          cultureTestStatus,
          classicalTestStatus,
          enneagramTestStatus,
          sixteenTypeTestStatus,
          bigFiveTestStatus,
          discTestStatus,
          careerTestStatus,
        } = await getAllTestStatuses(user_id);

        let sendmailID = userData?.email;
        const file = "../view/text_mssg.ejs";
        const subject = "IQ Test Result";
        let testpdfurl = `${process.env.hostPath}/certificate/cultureCertificate_${reportResponse?.unique_id}.pdf`;
        let filesname = "Report.pdf";
        let filesnames = "Invoice.pdf";
        let attachment = [
          // { filename: filename, path: pdfurl },
          { filename: filesname, path: testpdfurl },
          { filename: filesnames, path: invoiceData?.invoiceUrl },
        ];
        const sendmessage = {
          username: userData?.name,
          noofcurrectans: reportResponse?.noofcurrectans,
          Qcountt: 30,
          percentile: reportResponse?.percentile,
          score: reportResponse?.score,
          paidTestButton: "",
          paidTestLink: "",
          questionnaire: 'Culture Fair IQ test',
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: enneagramTestStatus,
          sixteentypeTestStatus: sixteenTypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerTestStatus: careerTestStatus,
          isPassword: false
        };

        sendEmailwithCertificate(
          sendmailID,
          "token",
          subject,
          file,
          sendmessage,
          attachment,
          res
        );
      } else if (paymentAmount == '3.85' && report_id) {
        let invoiceData = await createUserInvoice(
          user_id,
          questionnaire_id,
          booking_id,
          res,
          paymentAmount
        );
        const stepData = await WindowStep.findOne({ user_id: user_id, questionnaireId: questionnaire_id, isTestEnd: false }).sort({ createdAt: -1 });
        const reportResponse = await ReportData.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
            {
              invoice_number: invoiceData?.invoiceNumber, unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, },
              $push: {
                paymentMethods: "Stripe",
              },
            });
        }
        const certificateInfo = await UserCertInfo.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
            { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
        }
        const {
          cultureTestStatus,
          classicalTestStatus,
          enneagramTestStatus,
          sixteenTypeTestStatus,
          bigFiveTestStatus,
          discTestStatus,
          careerTestStatus,
        } = await getAllTestStatuses(user_id);

        let sendmailID = userData?.email;
        const file = "../view/text_mssg.ejs";
        const subject = "IQ Test Result";
        let pdfurl = `${process.env.hostPath}/certificate/certificate_${stepData?.unique_id}.pdf`;
        let filename = "certificate.pdf";
        let filesnames = "Invoice.pdf";

        let attachment = [
          { filename: filename, path: pdfurl },
          { filename: filesnames, path: invoiceData?.invoiceUrl },
        ];

        const sendmessage = {
          username: userData?.name,
          noofcurrectans: stepData?.finalPageData?.score,
          Qcountt: 30,
          percentile: reportResponse?.percentile,
          score: reportResponse?.score,
          paidTestButton: "",
          paidTestLink: "",
          questionnaire: 'Culture Fair IQ test',
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: enneagramTestStatus,
          sixteentypeTestStatus: sixteenTypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerTestStatus: careerTestStatus,
          isPassword: false
        };

        sendEmailwithCertificate(
          sendmailID,
          "token",
          subject,
          file,
          sendmessage,
          attachment,
          res
        );
      } else {
        const stepData = await WindowStep.findOne({ user_id: user_id, questionnaireId: questionnaire_id, isTestEnd: false }).sort({ createdAt: -1 });
        const reportResponse = await ReportData.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
            // { invoice_number: invoiceData?.invoiceNumber, unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, } });
            {
              unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true },
              $push: {
                paymentMethods: "Stripe",
              },
            });
        }
        // const certificateInfo = await UserCertInfo.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        // if (reportResponse) {
        //   await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
        //     { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
        // }
        // await TestCount.findOneAndUpdate(
        //   { user_id: user_id },
        //   { count: 0 }
        // );
        if (stepData) {
          await WindowStep.updateOne({ _id: stepData?._id }, { window_step: 9 });
        }
      }
    }

    if (questionnaire_id == "64366966f923aa5ea7ad37d3" && isQuestionnairePaid !== 'yes') {
      let paymentAmount = amount;

      if (paymentAmount == '5.00' && report_id) {
        let invoiceData = await createUserInvoice(
          user_id,
          questionnaire_id,
          booking_id,
          res,
          paymentAmount
        );
        console.log("report id ", report_id)
        const reportResponse = await ReportData.findOneAndUpdate({ _id: report_id, user_id: user_id, questionnaire_id: questionnaire_id },
          {
            payment_status: { certificatePaymentStatus: true, reportPaymentStatus: true, },
            $push: {
              paymentMethods: "Stripe",
            },
          }
        );

        const {
          cultureTestStatus,
          classicalTestStatus,
          enneagramTestStatus,
          sixteenTypeTestStatus,
          bigFiveTestStatus,
          discTestStatus,
          careerTestStatus,
        } = await getAllTestStatuses(user_id);

        let sendmailID = userData?.email;
        const file = "../view/text_mssg.ejs";
        const subject = "IQ Test Result";
        let testpdfurl = `${process.env.hostPath}/certificate/classicalCertificate_${reportResponse?.unique_id}.pdf`;
        let filesname = "Report.pdf";
        let filesnames = "Invoice.pdf";
        let attachment = [
          // { filename: filename, path: pdfurl },
          { filename: filesname, path: testpdfurl },
          { filename: filesnames, path: invoiceData?.invoiceUrl },
        ];
        const sendmessage = {
          username: userData?.name,
          noofcurrectans: reportResponse?.noofcurrectans,
          Qcountt: 45,
          percentile: reportResponse?.percentile,
          score: reportResponse?.score,
          paidTestButton: "",
          paidTestLink: "",
          questionnaire: 'Classical IQ test',
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: enneagramTestStatus,
          sixteentypeTestStatus: sixteenTypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerTestStatus: careerTestStatus,
          isPassword: false
        };

        sendEmailwithCertificate(
          sendmailID,
          "token",
          subject,
          file,
          sendmessage,
          attachment,
          res
        );
      } else if (paymentAmount == '3.85' && report_id) {
        let invoiceData = await createUserInvoice(
          user_id,
          questionnaire_id,
          booking_id,
          res,
          paymentAmount
        );
        const stepData = await WindowStep.findOne({ user_id: user_id, questionnaireId: questionnaire_id, isTestEnd: false }).sort({ createdAt: -1 });
        const reportResponse = await ReportData.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
            {
              invoice_number: invoiceData?.invoiceNumber, unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, },
              $push: {
                paymentMethods: "Stripe",
              },
            });
        }
        const certificateInfo = await UserCertInfo.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
            { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
        }
        const {
          cultureTestStatus,
          classicalTestStatus,
          enneagramTestStatus,
          sixteenTypeTestStatus,
          bigFiveTestStatus,
          discTestStatus,
          careerTestStatus,
        } = await getAllTestStatuses(user_id);

        let sendmailID = userData?.email;
        const file = "../view/text_mssg.ejs";
        const subject = "IQ Test Result";
        let pdfurl = `${process.env.hostPath}/certificate/certificate_${stepData?.unique_id}.pdf`;
        let filename = "certificate.pdf";
        let filesnames = "Invoice.pdf";

        let attachment = [
          { filename: filename, path: pdfurl },
          { filename: filesnames, path: invoiceData?.invoiceUrl },
        ];

        const sendmessage = {
          username: userData?.name,
          noofcurrectans: stepData?.finalPageData?.score,
          Qcountt: 45,
          percentile: reportResponse?.percentile,
          score: reportResponse?.score,
          paidTestButton: "",
          paidTestLink: "",
          questionnaire: 'Classical IQ test',
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: enneagramTestStatus,
          sixteentypeTestStatus: sixteenTypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerTestStatus: careerTestStatus,
          isPassword: false
        };

        sendEmailwithCertificate(
          sendmailID,
          "token",
          subject,
          file,
          sendmessage,
          attachment,
          res
        );
      } else {
        const stepData = await WindowStep.findOne({ user_id: user_id, questionnaireId: questionnaire_id, isTestEnd: false }).sort({ createdAt: -1 });
        const reportResponse = await ReportData.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
            // { invoice_number: invoiceData?.invoiceNumber, unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, } });
            {
              unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true },
              $push: {
                paymentMethods: "Stripe",
              },
            });
        }
        // const certificateInfo = await UserCertInfo.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        // if (reportResponse) {
        //   await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
        //     { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
        // }
        // await TestCount.findOneAndUpdate(
        //   { user_id: user_id },
        //   { count: 0 }
        // );
        if (stepData) {
          await WindowStep.updateOne({ _id: stepData?._id }, { window_step: 9 });
        }
      }
    }
    return res
      .status(200)
      .json({ questionnaire_id: questionnaire_id, msg: "Payment is success" });
  } catch (err) {
    return res.status(400).json(err);
  }
};

const stripeGooglePaySuccess = async (req, res) => {
  try {
    const user_id = req.body.user_id;
    const unique_id = req.body.unique_id;
    const amount = req.body.amount;
    const questionnaire_id = req.body.questionnaire_id;
    let booking_id = "undefined";
    booking_id = req.body?.bookingId || "undefined";
    let report_id = req?.body?.report_id;
    let isQuestionnairePaid = req?.body?.isQuestionnairePaid;
    const addpayment = await Payments.create({
      user_id: user_id,
      unique_id: unique_id,
      booking_id: booking_id,
      questionnaire_id: questionnaire_id,
      amount: amount,
      status: ((questionnaire_id == "6436694cf923aa5ea7ad37cc" || questionnaire_id == "64366966f923aa5ea7ad37d3") && isQuestionnairePaid !== 'yes') ? 2 : 1,
      is_free: ((questionnaire_id == "6436694cf923aa5ea7ad37cc" || questionnaire_id == "64366966f923aa5ea7ad37d3") && isQuestionnairePaid !== 'yes') ? true : false,
    });

    // Call google analytics api
    let quesnnaireName = identifyQuestionnaireName(questionnaire_id, isQuestionnairePaid)
    await sendGa4Purchase({
      transactionId: addpayment?._id?.toString(),
      testId: questionnaire_id,
      testName: quesnnaireName,
      amount: Number(amount),
      currency: "USD",
      debug: false
    });

    const userData = await User.findOne({ _id: user_id });
    if (booking_id !== "undefined") {
      // IQ tests.................
      let checkCultureTest = await Invoice.find({
        user_id: user_id,
        questionnaire_id: "6436694cf923aa5ea7ad37cc",
      });
      let cultureTestStatus = checkCultureTest.length > 0;

      let checkClassicalTest = await Invoice.find({
        user_id: user_id,
        questionnaire_id: "64366966f923aa5ea7ad37d3",
      });
      let classicalTestStatus = checkClassicalTest.length > 0;

      // Personality tests.................
      let invoiceData = {};
      if (questionnaireId !== "66433c87986a6833bc93d9bc") {
        invoiceData = await createUserInvoice(
          userId,
          questionnaireId,
          booking_id,
          res
        );
      }
      let pdfurl;
      // let invoiceurl = `${process.env.hostPath}/invoice/invoice_${booking_id}.pdf`;
      let invoiceurl = invoiceData?.invoiceUrl;
      let invoiceNum = invoiceData?.invoiceNumber;
      let ennagramTestStatus;
      let sixteentypeTestStatus;
      let bigFiveTestStatus;
      let discTestStatus;
      let careerATestStatus;
      let filename;

      if (questionnaire_id == "65586e235046c32c7cd385cd") {
        await EnneagramReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/enneagram_report/enneagram_report_${booking_id}.pdf`;
        filename = "Enneagram.pdf";
      }
      if (questionnaire_id == "65d33b0f9bef2027f0594db2") {
        await SixteenTypeReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/sixteentype_report/sixteen_type_report_${booking_id}.pdf`;
        filename = "SixteenType.pdf";
      }
      if (questionnaire_id == "65ec352edbd8850c638f33fd") {
        await BigFiveReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/bigfivetype_report/bigfivetype_report_${booking_id}.pdf`;
        filename = "BigFive.pdf";
      }
      if (questionnaire_id == "662f3b21d3279b1ec0877cd0") {
        await DiscReportData.updateOne(
          { booking_id: booking_id },
          {
            $set: {
              report_status: true,
              invoiceUrl: invoiceurl,
              invoice_number: invoiceNum,
            },
          }
        );
        pdfurl = `${process.env.hostPath}/disc_report/disc_report_${booking_id}.pdf`;
        filename = "Disc.pdf";
      }
      if (questionnaire_id == "66433c87986a6833bc93d9bc") {
        // await CareerAptitudeReportData.updateOne(
        //   { booking_id: booking_id },
        //   {
        //     $set: {
        //       report_status: true,
        //       invoiceUrl: invoiceurl,
        //       invoice_number: invoiceNum,
        //     },
        //   }
        // );
        // pdfurl = `${process.env.hostPath}/careeraptitude_report/careeraptitude_report_${booking_id}.pdf`;
        // filename = "CareerAptitude.pdf";

        await Booking.findOneAndUpdate(
          { _id: booking_id },
          { count: 9 }
        );

        return res.redirect(
          `${process.env.redirectUrl}/career-aptitude-test`
        );
      }

      if (
        questionnaire_id == "65586e235046c32c7cd385cd" ||
        questionnaire_id == "65d33b0f9bef2027f0594db2" ||
        questionnaire_id == "65ec352edbd8850c638f33fd" ||
        questionnaire_id == "662f3b21d3279b1ec0877cd0"
        // questionnaire_id == "66433c87986a6833bc93d9bc"
      ) {
        // let checkEnnagramTest = await Invoice.find({ user_id: user_id, questionnaire_id: "65586e235046c32c7cd385cd" });
        let checkEnnagramTest = await EnneagramReportData.find({
          user_id: user_id,
          questionnaire_id: "65586e235046c32c7cd385cd",
          report_status: true,
        });
        ennagramTestStatus = checkEnnagramTest.length > 0;

        // let checkSixteenTypeTest = await Invoice.find({ user_id: user_id, questionnaire_id: "65d33b0f9bef2027f0594db2" });
        let checkSixteenTypeTest = await SixteenTypeReportData.find({
          user_id: user_id,
          questionnaire_id: "65d33b0f9bef2027f0594db2",
          report_status: true,
        });
        sixteentypeTestStatus = checkSixteenTypeTest.length > 0;

        // let checkBigFiveTest = await Invoice.find({ user_id: user_id, questionnaire_id: "65ec352edbd8850c638f33fd" });
        let checkBigFiveTest = await BigFiveReportData.find({
          user_id: user_id,
          questionnaire_id: "65ec352edbd8850c638f33fd",
          report_status: true,
        });
        bigFiveTestStatus = checkBigFiveTest.length > 0;

        // let checkDiscTest = await Invoice.find({ user_id: user_id, questionnaire_id: "662f3b21d3279b1ec0877cd0" });
        let checkDiscTest = await DiscReportData.find({
          user_id: user_id,
          questionnaire_id: "662f3b21d3279b1ec0877cd0",
          report_status: true,
        });
        discTestStatus = checkDiscTest.length > 0;

        // let checkCareerATest = await Invoice.find({ user_id: user_id, questionnaire_id: "66433c87986a6833bc93d9bc" });
        let checkCareerATest = await CareerAptitudeReportData.find({
          user_id: user_id,
          questionnaire_id: "66433c87986a6833bc93d9bc",
          report_status: true,
        });
        careerATestStatus = checkCareerATest.length > 0;

        let data = {
          username: userData?.name,
          surname: userData?.surname,
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: ennagramTestStatus,
          sixteentypeTestStatus: sixteentypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerATestStatus: careerATestStatus,
        };

        const file = "../view/enneagram_msg.ejs";
        const subject = "Test Result";
        // filename = 'enneagram.pdf';
        let filesname = "invoice.pdf";

        let attachment = [
          { filename: filename, path: pdfurl },
          { filename: filesname, path: invoiceurl },
        ];
        sendEmailwithCertificate(
          userData?.email,
          "token",
          subject,
          file,
          data,
          attachment,
          res
        );
        const update_booking = await Booking.findOneAndUpdate(
          { _id: booking_id },
          { status: false }
        );
      }
    }

    if (questionnaire_id == "6436694cf923aa5ea7ad37cc" && isQuestionnairePaid !== 'yes') {
      let paymentAmount = amount;

      if (paymentAmount == '5.00' && report_id) {
        console.log("enter in report buy only")
        let invoiceData = await createUserInvoice(
          user_id,
          questionnaire_id,
          booking_id,
          res,
          paymentAmount
        );
        console.log("report id ", report_id)
        const reportResponse = await ReportData.findOneAndUpdate({ _id: report_id, user_id: user_id, questionnaire_id: questionnaire_id },
          {
            payment_status: { certificatePaymentStatus: true, reportPaymentStatus: true, },
            $push: {
              paymentMethods: "Stripe",
            },
          }
        );

        const {
          cultureTestStatus,
          classicalTestStatus,
          enneagramTestStatus,
          sixteenTypeTestStatus,
          bigFiveTestStatus,
          discTestStatus,
          careerTestStatus,
        } = await getAllTestStatuses(user_id);

        let sendmailID = userData?.email;
        const file = "../view/text_mssg.ejs";
        const subject = "IQ Test Result";
        let testpdfurl = `${process.env.hostPath}/certificate/cultureCertificate_${reportResponse?.unique_id}.pdf`;
        let filesname = "Report.pdf";
        let filesnames = "Invoice.pdf";
        let attachment = [
          // { filename: filename, path: pdfurl },
          { filename: filesname, path: testpdfurl },
          { filename: filesnames, path: invoiceData?.invoiceUrl },
        ];
        const sendmessage = {
          username: userData?.name,
          noofcurrectans: reportResponse?.noofcurrectans,
          Qcountt: 30,
          percentile: reportResponse?.percentile,
          score: reportResponse?.score,
          paidTestButton: "",
          paidTestLink: "",
          questionnaire: 'Culture Fair IQ test',
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: enneagramTestStatus,
          sixteentypeTestStatus: sixteenTypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerTestStatus: careerTestStatus,
          isPassword: false
        };

        sendEmailwithCertificate(
          sendmailID,
          "token",
          subject,
          file,
          sendmessage,
          attachment,
          res
        );
      } else if (paymentAmount == '3.85' && report_id) {
        console.log("enter in certficate buy only", report_id)
        let invoiceData = await createUserInvoice(
          user_id,
          questionnaire_id,
          booking_id,
          res,
          paymentAmount
        );
        const stepData = await WindowStep.findOne({ user_id: user_id, questionnaireId: questionnaire_id, isTestEnd: false }).sort({ createdAt: -1 });
        const reportResponse = await ReportData.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
            {
              invoice_number: invoiceData?.invoiceNumber, unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, },
              $push: {
                paymentMethods: "Stripe",
              },
            });
        }
        const certificateInfo = await UserCertInfo.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
            { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
        }
        const {
          cultureTestStatus,
          classicalTestStatus,
          enneagramTestStatus,
          sixteenTypeTestStatus,
          bigFiveTestStatus,
          discTestStatus,
          careerTestStatus,
        } = await getAllTestStatuses(user_id);

        let sendmailID = userData?.email;
        const file = "../view/text_mssg.ejs";
        const subject = "IQ Test Result";
        let pdfurl = `${process.env.hostPath}/certificate/certificate_${stepData?.unique_id}.pdf`;
        let filename = "certificate.pdf";
        let filesnames = "Invoice.pdf";

        let attachment = [
          { filename: filename, path: pdfurl },
          { filename: filesnames, path: invoiceData?.invoiceUrl },
        ];

        const sendmessage = {
          username: userData?.name,
          noofcurrectans: stepData?.finalPageData?.score,
          Qcountt: 30,
          percentile: reportResponse?.percentile,
          score: reportResponse?.score,
          paidTestButton: "",
          paidTestLink: "",
          questionnaire: 'Culture Fair IQ test',
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: enneagramTestStatus,
          sixteentypeTestStatus: sixteenTypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerTestStatus: careerTestStatus,
          isPassword: false
        };

        sendEmailwithCertificate(
          sendmailID,
          "token",
          subject,
          file,
          sendmessage,
          attachment,
          res
        );
      } else {
        const stepData = await WindowStep.findOne({ user_id: user_id, questionnaireId: questionnaire_id, isTestEnd: false }).sort({ createdAt: -1 });
        const reportResponse = await ReportData.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
            // { invoice_number: invoiceData?.invoiceNumber, unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, } });
            {
              unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true },
              $push: {
                paymentMethods: "Stripe",
              },
            });
        }
        // const certificateInfo = await UserCertInfo.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        // if (reportResponse) {
        //   await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
        //     { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
        // }
        // await TestCount.findOneAndUpdate(
        //   { user_id: user_id },
        //   { count: 0 }
        // );
        if (stepData) {
          await WindowStep.updateOne({ _id: stepData?._id }, { window_step: 9 });
        }
      }
    }

    if (questionnaire_id == "64366966f923aa5ea7ad37d3" && isQuestionnairePaid !== 'yes') {
      let paymentAmount = amount;

      if (paymentAmount == '5.00' && report_id) {
        console.log("enter in report buy only")
        let invoiceData = await createUserInvoice(
          user_id,
          questionnaire_id,
          booking_id,
          res,
          paymentAmount
        );
        console.log("report id ", report_id)
        const reportResponse = await ReportData.findOneAndUpdate({ _id: report_id, user_id: user_id, questionnaire_id: questionnaire_id },
          {
            payment_status: { certificatePaymentStatus: true, reportPaymentStatus: true, },
            $push: {
              paymentMethods: "Stripe",
            },
          }
        );

        const {
          cultureTestStatus,
          classicalTestStatus,
          enneagramTestStatus,
          sixteenTypeTestStatus,
          bigFiveTestStatus,
          discTestStatus,
          careerTestStatus,
        } = await getAllTestStatuses(user_id);

        let sendmailID = userData?.email;
        const file = "../view/text_mssg.ejs";
        const subject = "IQ Test Result";
        let testpdfurl = `${process.env.hostPath}/certificate/classicalCertificate_${reportResponse?.unique_id}.pdf`;
        let filesname = "Report.pdf";
        let filesnames = "Invoice.pdf";
        let attachment = [
          // { filename: filename, path: pdfurl },
          { filename: filesname, path: testpdfurl },
          { filename: filesnames, path: invoiceData?.invoiceUrl },
        ];
        const sendmessage = {
          username: userData?.name,
          noofcurrectans: reportResponse?.noofcurrectans,
          Qcountt: 30,
          percentile: reportResponse?.percentile,
          score: reportResponse?.score,
          paidTestButton: "",
          paidTestLink: "",
          questionnaire: 'Classical IQ test',
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: enneagramTestStatus,
          sixteentypeTestStatus: sixteenTypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerTestStatus: careerTestStatus,
          isPassword: false
        };

        sendEmailwithCertificate(
          sendmailID,
          "token",
          subject,
          file,
          sendmessage,
          attachment,
          res
        );
      } else if (paymentAmount == '3.85' && report_id) {
        console.log("enter in certficate buy only", report_id)
        let invoiceData = await createUserInvoice(
          user_id,
          questionnaire_id,
          booking_id,
          res,
          paymentAmount
        );
        const stepData = await WindowStep.findOne({ user_id: user_id, questionnaireId: questionnaire_id, isTestEnd: false }).sort({ createdAt: -1 });
        const reportResponse = await ReportData.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
            {
              invoice_number: invoiceData?.invoiceNumber, unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, },
              $push: {
                paymentMethods: "Stripe",
              },
            });
        }
        const certificateInfo = await UserCertInfo.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
            { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
        }
        const {
          cultureTestStatus,
          classicalTestStatus,
          enneagramTestStatus,
          sixteenTypeTestStatus,
          bigFiveTestStatus,
          discTestStatus,
          careerTestStatus,
        } = await getAllTestStatuses(user_id);

        let sendmailID = userData?.email;
        const file = "../view/text_mssg.ejs";
        const subject = "IQ Test Result";
        let pdfurl = `${process.env.hostPath}/certificate/certificate_${stepData?.unique_id}.pdf`;
        let filename = "certificate.pdf";
        let filesnames = "Invoice.pdf";

        let attachment = [
          { filename: filename, path: pdfurl },
          { filename: filesnames, path: invoiceData?.invoiceUrl },
        ];

        const sendmessage = {
          username: userData?.name,
          noofcurrectans: stepData?.finalPageData?.score,
          Qcountt: 30,
          percentile: reportResponse?.percentile,
          score: reportResponse?.score,
          paidTestButton: "",
          paidTestLink: "",
          questionnaire: 'Classical IQ test',
          cultureTestStatus: cultureTestStatus,
          classicalTestStatus: classicalTestStatus,
          ennagramTestStatus: enneagramTestStatus,
          sixteentypeTestStatus: sixteenTypeTestStatus,
          bigFiveTestStatus: bigFiveTestStatus,
          discTestStatus: discTestStatus,
          careerTestStatus: careerTestStatus,
          isPassword: false
        };

        sendEmailwithCertificate(
          sendmailID,
          "token",
          subject,
          file,
          sendmessage,
          attachment,
          res
        );
      } else {
        const stepData = await WindowStep.findOne({ user_id: user_id, questionnaireId: questionnaire_id, isTestEnd: false }).sort({ createdAt: -1 });
        const reportResponse = await ReportData.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        if (reportResponse) {
          await ReportData.findOneAndUpdate({ _id: reportResponse?._id },
            // { invoice_number: invoiceData?.invoiceNumber, unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true, } });
            {
              unique_id: stepData?.unique_id, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: paymentAmount == '3.85' ? false : true },
              $push: {
                paymentMethods: "Stripe",
              },
            });
        }
        // const certificateInfo = await UserCertInfo.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
        // if (reportResponse) {
        //   await UserCertInfo.findOneAndUpdate({ _id: certificateInfo?._id },
        //     { invoiceurl: invoiceData?.invoiceUrl, invoice_number: invoiceData?.invoiceNumber });
        // }
        // await TestCount.findOneAndUpdate(
        //   { user_id: user_id },
        //   { count: 0 }
        // );
        if (stepData) {
          await WindowStep.updateOne({ _id: stepData?._id }, { window_step: 9 });
        }
      }
    }
    return res
      .status(200)
      .json({ questionnaire_id: questionnaire_id, msg: "Payment is success" });
  } catch (err) {
    return res.status(400).json(err);
  }
};



const quesamount = async (req, res) => {
  const id = req.body.id;
  if (id == "65586e235046c32c7cd385cd") {
    const amt = await EnneagrapQuestionnaire.find({ _id: id });
    res.status(200).send({ amount: amt[0].amount, name: amt[0].type });
  } else if (id == "65d33b0f9bef2027f0594db2") {
    const amt = await SixteenTypeQuestionnaire.find({ _id: id });
    res.status(200).send({ amount: amt[0].amount, name: amt[0].type });
  } else if (id == "65ec352edbd8850c638f33fd") {
    const amt = await BigFiveQuestionnaries.find({ _id: id });
    res.status(200).send({ amount: amt[0].amount, name: amt[0].type });
  } else if (id == "662f3b21d3279b1ec0877cd0") {
    const amt = await DiscQuestionnaries.find({ _id: id });
    res.status(200).send({ amount: amt[0].amount, name: amt[0].type });
  } else if (id == "66433c87986a6833bc93d9bc") {
    const amt = await CareerAptitudeQuestionnaries.find({ _id: id });
    res.status(200).send({ amount: amt[0].amount, name: amt[0].type });
  } else {
    const amt = await Questionnaire.find({ _id: id });
    res.status(200).send({ amount: amt[0].amount, name: amt[0].type });
  }
};

const stripetest3 = async (req, res) => {
  try {
    const user_id = req.body.user_id;
    const unique_id = req.body.unique_id;
    const amount = req.body.amount;
    const questionnaire_id = req.body.questionnaire_id;

    let paymentId = "";

    const addpayment = await Payments.create({
      user_id: user_id,
      unique_id: unique_id,
      questionnaire_id: questionnaire_id,
      amount: amount,
      status: 0,
    });
    paymentId = addpayment._id;

    const paymentIntent = await stripe.paymentIntents.create({
      payment_method_types: ["card"],
      amount: amount,
      currency: "usd",
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentId,
    });
  } catch (error) {
    console.log(error);
  }
};

const checkUserLogin = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email }, { password: 0 });
    if (user) {
      res.status(200).send({ user: user, msg: "User already exist." });
      return;
    } else {
      generatePass = Math.random().toString().substr(2, 6);
      let password = bcrypt.hashSync(generatePass);
      const create = await User.create({
        email: email,
        name: "Test",
        password: password,
      });
      const token = tokenForVerify(create);
      const file = "../view/user_registration.ejs";
      const subject = "Successfully Register";
      const message = {
        email: email,
        token: token,
        password: generatePass,
        redirect_url: process.env.redirectUrl,
      };
      sendEmail(email, token, subject, file, message);
      res.status(200).send({
        _id: create._id,
        name: create.name,
        email: create.email,
      });
    }
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

module.exports = {
  payment,
  pay,
  success,
  checkpaymentstatus,
  cancel,
  refund,
  stripePayment,
  stripeGooglePayment,
  stripeSuccess,
  stripeGooglePaySuccess,
  quesamount,
  stripetest3,
  checkUserLogin,
  createUserInvoice,
  getAllTestStatuses
};
