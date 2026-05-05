const IQCategory = require('../models/IQCategory');

const addiqcategory = async(req, res) => {
    try {
        const newIQCategory = new IQCategory(req.body);
        await newIQCategory.save();
        res.status(200).send({
            message: 'IQCategory Added Successfully!',
        });
    } catch (err) {
        res.status(500).send({
            message: err.message,
        });
    }
};

const getoneiqcategory = async(req, res) => {
    try {
        const IQCategories = await IQCategory.findById(req.params.id);
        res.send(IQCategories);
    } catch (err) {
        res.status(404).send(err.message);
    }
}

const getalliqcategory = async(req, res) => {
    try {
        const IQCategories = await IQCategory.find();
        res.status(200).send(IQCategories);
    } catch (err) {
        res.status(500).send({
            message: err.message,
        });
    }
    // IQCategory.findById({ _id: req.params.id }, (err) => {
    //     if (err) {
    //       res.status(500).send({
    //         message: err.message,
    //       });
    //     } else {
    //       res.status(200).send({
    //         message: 'IQCategory Deleted Successfully!',
    //       });
    //     }
    //   });
}

const updateiqcategory = async(req, res) => {
    try {
        const IQCategories = await IQCategory.findById(req.params.id);
        if(IQCategories){
            IQCategories.category_name = req.body.category_name;
            IQCategories.description = req.body.description;
            await IQCategories.save();
            res.send({ data: IQCategories, message: 'IQCategory updated successfully!' });
        }
    } catch (err) {
        res.status(404).send(err.message);
    }
};

const deleteiqcategory = async(req, res) => {
    IQCategory.deleteOne({ _id: req.params.id }, (err) => {
        if (err) {
          res.status(500).send({
            message: err.message,
          });
        } else {
          res.status(200).send({
            message: 'IQCategory Deleted Successfully!',
          });
        }
      });
}

module.exports = {
    addiqcategory,
    getoneiqcategory,
    getalliqcategory,
    updateiqcategory,
    deleteiqcategory
}