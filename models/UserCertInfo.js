const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    user_name: {
      type: String
    },
    last_name: {
      type: String
    },
    user_id: {
      type: String
    },
    email: {
      type: String
    },
    unique_id: {
      type: String
    },
    questionnaire_id: {
      type: String
    },
    pdfurl: {
      type: String
    },
    gender: {
      type: String
    },
    age: {
      type: String
    },
    phone: {
      type: String,
      required: false,
    },
    amount: {
      type: String,
      required: false,
    },
    qtype: {
      type: String,
      required: false,
    },
    address_one: {
      type: String
    },
    address_two: {
      type: String
    },
    postal_code: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    country: {
      type: String
    },
    country_code: {
      type: String
    },
    qualification: {
      type: String
    },
    score: {
      type: Number
    },
    percentile: {
      type: Number
    },
    percentage: {
      type: String
    },
    iqscore: {
      type: String
    },
    invoiceurl: {
      type: String
    },
    invoice_number: {
        type: String,
    },
    isFreeCertificate: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

const UserCertInfo = mongoose.model('UserCertInfo', userSchema);

module.exports = UserCertInfo;
