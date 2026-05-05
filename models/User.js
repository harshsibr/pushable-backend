const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    surname: {
      type: String,
    },
    gender: {
      type: String
    },
    age: {
      type: String
    },
    qualification: {
      type: String
    },
    image: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    country_code: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    address_one: {
      type: String,
      required: false,
    },
    address_two: {
      type: String,
      required: false,
    },
    postal_code: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: false,
    },
    paymentstatus: {
      type: Boolean,
    },
    email_is_verified: {
      type: String
    },
    isTempUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
