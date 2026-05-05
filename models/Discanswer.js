const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const QuestionnaireSchema = new mongoose.Schema({
    user_id: {
    type: String
    },
    booking_id: {
        type: String
    },
    personality_type: {
        type: String
    },
    usertype: {
        type: String
    },
    quesid: {
        type: String
    },
    answer: {
        type: Number
    },
    question_type: {
        type: String
    }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Discanswer', QuestionnaireSchema);
