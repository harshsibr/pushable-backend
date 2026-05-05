const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const PersonalInfoSchema = new mongoose.Schema({  
  user_id:{
    type: String,
  },
  questionair_id:{
    type: String,
  },
  question_id:{
    type: String,
  },
  answer:{
    type: Array,
  }
}, {
  timestamps: true,
  versionKey: false
});




module.exports = mongoose.model('PersonalInfo', PersonalInfoSchema);
