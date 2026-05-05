const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema(
  {
    user_id: {
        type: String,
      },
      unique_id: {
        type: String
      },
      booking_id: {
        type: String
      },
      questionnaire_id: {
        type: String
      },
      amount: {
        type: String
      },
      status: {
        type: Number
      },
      is_free: {
        type: Boolean,
        default: false
      }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', PaymentSchema);