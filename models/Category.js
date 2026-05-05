const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  parent: {
    type: String,
    required: false,
  },
  slug: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: false,
  },
  children: [{}],
  status: {
    type: String,
    enum: ['Show', 'Hide'],
    default: 'Show',
  },
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
