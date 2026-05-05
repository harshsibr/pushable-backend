const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IQCategorySchema = new Schema(
    {
        category_name: {
            type: String,
            required: true
        },
        description: {
            type: String
        }
    }
);

module.exports = mongoose.model('IQCategory', IQCategorySchema);