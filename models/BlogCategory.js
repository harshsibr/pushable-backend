const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
});

const BlogCategory = mongoose.model('BlogCategory', categorySchema);

module.exports = BlogCategory;
