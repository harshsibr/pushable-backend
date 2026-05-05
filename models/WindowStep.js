const mongoose = require('mongoose');

const WindowStep = new mongoose.Schema(
  {
    user_id: {
      type: String
    },
    unique_id: {
      type: String,
      default: null
    },
    window_step: {
      type: Number,
      default: 1,
    },
    questionnaireId: {
        type: String
    },
    isTestEnd: {
        type: Boolean,
        default: false
    },
    finalPageData: {
      type: Object
    }
  },
  {
    timestamps: true,
  }
);

const TestCount = mongoose.model('WindowStep', WindowStep);

module.exports = TestCount;