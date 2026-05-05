const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        blog_body: {
            type: String,
            required: true,
        },
        blog_category_id: {
            type: String,
            required: true,
        },
        blog_category: {
            type: String,
        },
        featured_image: {
            type: String,
        },
        keyword: {
            type: Array,
        },
        author: {
            type: String,
        },
        slugname: {
            type: String,
        },
        titleTag: {
            type: String,
        },
        altAttribute: {
            type: String,
        },
        metaDescription: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const Blog = mongoose.model('Blog', categorySchema);

module.exports = Blog;
