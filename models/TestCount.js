const mongoose = require('mongoose');

const TestCountSchema = new mongoose.Schema(
  {
    user_id: {
      type: String
    },
    unique_id: {
      type: String
    },
    count: {
      type: Number,
    },
    questionnaireType: {
      type: String
    },
  },

  {
    timestamps: true,
  }
);

const TestCount = mongoose.model('TestCount', TestCountSchema);

module.exports = TestCount;