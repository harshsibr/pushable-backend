const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const invoiceSchema = new mongoose.Schema(
  {
    invoice_number: {
        type: String,
        // required: true,
      },
      invoice_date: {
        type: String,
      },
      order_id_number: {
        type: String,
      },
      delivery_date: {
        type: String,
      },
      description: {
        type: String,
      },
      qty: {
        type: String,
      },
      unit_price: {
        type: String,
      },
      sales_tax: {
        type: String,
      },
      total_amount: {
        type: String,
      },
      iso_cod: {
        type: String,
      },
      country: {
        type: String,
      },
      sequential_number: {
        type: Number,
      },
      middlenumber: {
        type: Number,
      },
      user_name: {
        type: String,
      },      
      surname: {
        type: String,
      },
      user_id: {
        type: String,
      },
      questionnaire_id: {
        type: String,
      },
      unique_id: {
        type: String,
      },
      booking_id: {
          type: String,
      },
      user_address_one: {
        type: String,
      },
      user_address_two: {
        type: String,
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
      phone: {
        type: String,
      },
      admin_title: {
        type: String,
      },
      admin_address: {
        type: String,
      },
      vat_rate: {
        type: String,
      },
      unit_price_inc: {
        type: String,
      },
      vat_subtotal: {
        type: String,
      }
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
