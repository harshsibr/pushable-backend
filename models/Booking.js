const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const QuestionnaireSchema = new mongoose.Schema({
  user_id: {
    type: String
  },
  status: {
    type: Boolean
  },
  count: {
    type: Number
  },
  arrayscore: {
    type: Array,
    default: null
  }
  ,
  about_type: {
    type: String,
    default: null
  },
  questionnaire_id: {
    type: String,
    default: null
  },
  single_dichotomies: {
    type: Array,
    default: null
  },
  greater_var: {
    type: Array,
    default: null
  },
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('booking', QuestionnaireSchema);
