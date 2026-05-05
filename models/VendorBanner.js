const mongoose = require('mongoose');

const VendorBannerSchema = new mongoose.Schema(
  {
    title: {
      type: String
    },
    banner: {
      type: String,
    },
    status: {
      type: String
    },
  },

  {
    timestamps: true,
  }
);

const VendorBanner = mongoose.model('VendorBanner', VendorBannerSchema);

module.exports = VendorBanner;