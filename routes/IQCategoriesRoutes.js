const express = require('express');
const router = express.Router();

const {addiqcategory, getoneiqcategory, getalliqcategory, updateiqcategory, deleteiqcategory} = require('../controller/IQCategoriesController');

//add a iq-category
router.post('/add', addiqcategory);

//get a iq-category
router.get('/:id', getoneiqcategory);

//getall iq-category
router.get('/getall', getalliqcategory);

//update a iq-category
router.put('/:id', updateiqcategory);

//delete a iq-category
router.delete('/:id', deleteiqcategory);

module.exports = router;