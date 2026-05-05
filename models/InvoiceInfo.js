const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const invoiceInfoSchema = new mongoose.Schema(
  {
    // title: {
    //   type: String,
    //   required: true,
    // },
    // address: {
    //   type: String,
    //   required: false,
    // },
    titleOne: {
      type: String,
      // required: true,
    },
    addressOne: {
      type: String,
      required: false,
    },
    titleTwo: {
      type: String,
      default: null
    },
    addressTwo: {
      type: String,
      default: null
    },
    titleThree: {
      type: String,
    },
    invoice_object: {
      type: Object,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

const InvoiceInfo = mongoose.models.InvoiceInfo || mongoose.model('InvoiceInfo', invoiceInfoSchema);

module.exports = InvoiceInfo;
