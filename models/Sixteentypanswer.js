const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const QuestionnaireSchema = new mongoose.Schema({
    user_id: {
    type: String
    },
    booking_id: {
        type: String
    },
    dichotomy_type: {
        type: String
    },
    facet_type: {
        type: String
    },
    sub_dichotomy: {
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

module.exports = mongoose.model('Sixteentypeanswer', QuestionnaireSchema);
