const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const QuestionnaireAnswerSchema = new mongoose.Schema({
  form_id:{
    type: String,
  },
  section_id:{
    type: String,
  },
  question_id:{
    type: String,
  },
  user_id:{
    type: String,
  },
  user_member_id:{
    type: String,
  },
  booking_id:{
    type: String,
  },
  answer:{
    type: Array,
  },
  answer_type:{
    type: String,
  },
  unique_id:{
    type: String,
  },
  is_correct:{
    type: Boolean,
  },
  category: {
    type: String,
  },
  questionnaire_id:{
    type: String,
  },
}, {
  timestamps: true,
  versionKey: false
});




module.exports = mongoose.model('QuestionnaireAnswer', QuestionnaireAnswerSchema);
