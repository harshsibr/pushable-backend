const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const QuestionnaireSchema = new mongoose.Schema({
  section:{
    type: Array,
  },
  type:
  {
    type: String,
  },
  category:
  {
    type: String,
  },
  timer: {
    type: String,
  },
  isPaid: {
    type: Boolean
  },
  amount: {
    type: String
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('CareerAptitudequestionnaires', QuestionnaireSchema);
