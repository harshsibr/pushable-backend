const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const jwt = require('jsonwebtoken');
const { signInToken, tokenForVerify, sendEmail } = require('../config/auth');
const Admin = require('../models/Admin');
const Questionnaire = require('../models/Questionnaire');
const UserModel = require('../models/User');
const path = require("path");
const fs = require('fs');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const ejs = require('ejs');
const VendorBanner = require('../models/VendorBanner');
const UserCertInfo = require('../models/UserCertInfo');
const InvoiceInfo = require('../models/InvoiceInfo');
const Invoice = require('../models/Invoice');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const moment = require('moment');
const QuestionnaireAnswer = require('../models/QuestionnaireAnswer');
const Payments = require('../models/Payment');
const ReportData = require('../models/ReportData');
const EnneagrapQuestionnaire = require('../models/EnnaQuestionnaire');
const EnneagramReportData = require('../models/EnneagramReportData');
const SixteenTypeQuestionnaire = require('../models/SixteenType');
const SixteenTypeReportData = require('../models/SixteenTypeReportData');
const BigFiveQuestionnaries = require('../models/BigFiveQuestionnaries');
const BigFiveReportData = require("../models/BigFiveReportData");
const DiscQuestionnaries = require("../models/DiscQuestionnaries");
const DiscReportData = require('../models/DiscReportData');
const Ennagramanswers = require("../models/Ennagramanswer");
const Sixteentypeanswer = require("../models/Sixteentypanswer");
const Bigfiveans = require("../models/Bigfiveans");
const Discanswers = require("../models/Discanswer");
const CareerAptitudeQuestionnaire = require('../models/CareerAptitudeQuestionnaries');
const CareerAptitudeReportData = require('../models/CareerAptitudeReportData');
const CareerAptitudeAnswer = require('../models/CareerAptitudeAnswer');
const BlogCategory = require('../models/BlogCategory');
const Blog = require('../models/Blog');


const registerAdmin = async (req, res) => {
  try {
    const isAdded = await Admin.findOne({ email: req.body.email });
    if (isAdded) {
      return res.status(403).send({
        message: 'This Email already Added!',
      });
    } else {
      const newStaff = new Admin({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: bcrypt.hashSync(req.body.password),
      });
      const staff = await newStaff.save();
      const token = signInToken(staff);
      res.send({
        token,
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        joiningData: Date.now(),
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });
    if (admin && bcrypt.compareSync(req.body.password, admin.password)) {
      const token = signInToken(admin);
      res.send({
        token,
        _id: admin._id,
        name: admin.name,
        phone: admin.phone,
        email: admin.email,
        image: admin.image,
        role: admin?.role,
      });
    } else {
      res.status(401).send({
        message: 'Invalid Email or password!',
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const forgetPassword = async (req, res) => {
  const isAdded = await Admin.findOne({ email: req.body.verifyEmail });
  if (!isAdded) {
    return res.status(404).send({
      message: 'Admin/Staff Not found with this email!',
    });
  } else {
    const token = tokenForVerify(isAdded);

    const file = "../view/admins_forget_pass.ejs";
    const subject = "Forget password"
    const message = { email: isAdded.email, 'token': token }
    sendEmail(isAdded.email, token, subject, file, message);
    res.status(200).send({ msg: 'Please check your email to reset password!' });
  }
};

const resetPassword = async (req, res) => {
  const token = req.body.token;
  const { email } = jwt.decode(token);
  const staff = await Admin.findOne({ email: email });

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, (err, decoded) => {
      if (err) {
        return res.status(500).send({
          message: 'Token expired, please try again!',
        });
      } else {
        staff.password = bcrypt.hashSync(req.body.newPassword);
        staff.save();
        res.send({
          message: 'Your password change successful, you can login now!',
        });
      }
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const admin = await Admin.findById({ _id: req.user._id });
    if (!admin.password) {
      return res.send({
        message:
          'For change password,You need to sign in with email & password!',
      });
    } else if (
      admin &&
      bcrypt.compareSync(req.body.currentPassword, admin.password)
    ) {
      admin.password = bcrypt.hashSync(req.body.newPassword);
      await admin.save();
      res.send({
        message: 'Your password change successfully!',
      });
    } else {
      res.status(401).send({
        message: 'previous password does`t match!',
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const addStaff = async (req, res) => {
  try {
    const isAdded = await Admin.find({ email: req.body.data.email });
    if (isAdded) {
      return res.status(500).send({
        message: 'This Email already Added!',
      });
    } else {
      const newStaff = new Admin({
        name: req.body.data.name,
        email: req.body.data.email,
        password: bcrypt.hashSync(req.body.data.password),
        phone: req.body.data.phone,
        joiningDate: req.body.data.joiningDate,
        role: req.body.data.role,
        image: req.body.data.image,
      });
      await newStaff.save();
      res.status(200).send({
        message: 'Staff Added Successfully!',
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const admins = await Admin.find({}).sort({ _id: -1 });
    res.send(admins);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getStaffById = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.params.id }, { password: 0 });
    res.json(admin);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStaff = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (admin) {
      admin.name = req.body.data.name;
      admin.email = req.body.data.email;
      admin.phone = req.body.data.phone;
      admin.role = req.body.data.role;
      admin.joiningData = dayjs().utc().format(req.body.data.joiningDate);
      admin.password =
        req.body.data.password !== ('' || undefined)
          ? bcrypt.hashSync(req.body.data.password)
          : admin.password;
      admin.image = req.body.data.image;
      const updatedAdmin = await admin.save();
      const token = signInToken(updatedAdmin);
      res.send({
        token,
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        image: updatedAdmin.image,
        joiningData: updatedAdmin.joiningData,
      });
    }
  } catch (err) {
    res.status(404).send(err.message);
  }
};

const deleteStaff = (req, res) => {
  Admin.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: 'Admin Deleted Successfully!',
      });
    }
  });
};

const uploadImage = async (req, res) => {
  try {
    if (!req.files) {
      // throw new CustomError.BadRequestError("No File Uploaded");
      res.status(400).send("No File Uploaded");
    }
    const image = req.files.image;
    if (!image.mimetype.startsWith("image")) {
      // throw new CustomError.BadRequestError("Please Upload Image");
      res.status(400).send("Please Upload Image");

    }
    const maxSize = 1024 * 1024;
    if (image.size > maxSize) {
      // throw new CustomError.BadRequestError("Please upload image smaller 1MB");
      res.status(400).send("Please upload image smaller 1MB");
    }

    const newname = new Date().getTime() + '_' + image.name;
    const imagePath = path.join(
      __dirname,
      "../public/uploads/" + `${newname}`
    );
    await image.mv(imagePath);
    // res.end(req.protocol + '://'+req.headers.host+'/'+req.file.path);
    const imageurl = process.env.url + `/uploads/${newname}`;

    // const imageurl = "http://iq.ibrcloud.com" + `/uploads/${newname}`; 
    const admin = await Admin.findOne({ _id: req.params.id });
    admin.image = imageurl;
    await admin.save();
    res.status(200).json({ image: imageurl });
  } catch (err) {
    res.status(404).send(err.message);
  }

};

const addQuestionnaire = async (req, res) => {
  const { id, section, type, category, timer, isPaid, amount } = req.body;
  if (!section) {
    throw new CustomError.UnauthenticatedError('Questionnaire is required');
  }

  if (id) {
    const exist = await Questionnaire.findOne({ _id: id });
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions;
      console.log(section[i]._id);
      if (section[i]._id == "") {
        console.log("entry");
        section[i]._id = new mongoose.Types.ObjectId();
        for (var j = 0; j < questions.length; j++) {
          questions[j].quesid = new mongoose.Types.ObjectId();
          let audioimagePath = "";
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");

          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];
            console.log(extension)
            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
      else {

        for (var j = 0; j < questions.length; j++) {
          if (questions[j].quesid == "") {
            questions[j].quesid = new mongoose.Types.ObjectId();
          }
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");
          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio != undefined) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];

            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
    }
    const ques = await Questionnaire.findOneAndUpdate({ _id: id }, { section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });

    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Updated." });
  }
  else {
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions
      section[i]._id = new mongoose.Types.ObjectId();
      for (var j = 0; j < questions.length; j++) {
        questions[j].question = questions[j].question.replaceAll("&lt;", "<");
        for (var w = 0; w < questions[j].options.length; w++) {
          questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
        }
        questions[j].quesid = new mongoose.Types.ObjectId();
      }
    }
    const ques = await Questionnaire.create({ section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });
    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Added." });
  }
};

const getQuestionnaire = async (req, res) => {
  const Form = await Questionnaire.findOne({ _id: req.params.id });

  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question with id : ${req.params.id}`);
  }
  res.status(StatusCodes.OK).json({ Form });
}

const deleteQuestionnaire = async (req, res) => {
  const formid = await Questionnaire.findByIdAndDelete({ _id: req.params.id });
  res.status(StatusCodes.OK).json({ msg: "Questionnaire is deleted successfully!" });
}

const ckeditor_image = async (req, res) => {
  if (!req.files) {
    throw new CustomError.BadRequestError("No File Uploaded");
  }
  const ckeditImage = req.files.upload;
  if (!ckeditImage.mimetype.startsWith("image")) {
    throw new CustomError.BadRequestError("Please Upload Image");
  }
  const maxSize = 1024 * 1024;
  if (ckeditImage.size > maxSize) {
    throw new CustomError.BadRequestError("Please upload image smaller 1MB");
  }

  const newname = new Date().getTime() + '_' + ckeditImage.name;
  const imagePath = path.join(
    __dirname,
    "../public/uploads/ckeditor/" + `${newname}`
  );
  await ckeditImage.mv(imagePath);
  // res.end(req.protocol + '://'+req.headers.host+'/'+req.file.path);
  const imageurl =
    process.env.hostPath + `/uploads/ckeditor/${newname}`;

  res.status(StatusCodes.OK).json({ uploaded: true, url: imageurl });
};

const vendor_ckeditor = async (req, res) => {
  if (!req.files) {
    throw new CustomError.BadRequestError("No File Uploaded");
  }
  const ckeditImage = req.files.upload;
  if (!ckeditImage.mimetype.startsWith("image")) {
    throw new CustomError.BadRequestError("Please Upload Image");
  }
  const maxSize = 1024 * 1024;
  if (ckeditImage.size > maxSize) {
    throw new CustomError.BadRequestError("Please upload image smaller 1MB");
  }

  const newname = new Date().getTime() + '_' + ckeditImage.name;
  const imagePath = path.join(
    __dirname,
    "../public/uploads/vendor_ckeditor/" + `${newname}`
  );
  await ckeditImage.mv(imagePath);
  // res.end(req.protocol + '://'+req.headers.host+'/'+req.file.path);
  const imageurl =
    process.env.hostPath + `/uploads/vendor_ckeditor/${newname}`;

  res.status(StatusCodes.OK).json({ uploaded: true, url: imageurl });
}

const getAllQuestionnaire = async (req, res) => {
  const Form = await Questionnaire.find({ type: { $ne: "Personal Info" } });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

const getAllUsers = async (req, res) => {
  const startDate = req?.body?.startDate ? new Date(req.body.startDate) : null;
  const endDate = req?.body?.endDate ? new Date(req.body.endDate) : null;
  const page = parseInt(req?.body?.page) || 1;
  const pageSize = req?.body?.pageSize || 100;

  const end = endDate
    ? new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
    : null;

  try {
    // Base filter (exclude temp users)
    const filter = {
      isTempUser: { $ne: true }
    };

    // Date filter
    if (startDate && end) {
      filter.createdAt = { $gte: startDate, $lt: end };
    }

    const totalItems = await UserModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / pageSize);

    if (page > totalPages && totalPages !== 0) {
      return res.status(404).json({ message: 'Page not found' });
    }

    const users = await UserModel.find(filter)
      .sort({ _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.status(StatusCodes.OK).json({
      users,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


const addvendorbanner = async (req, res) => {
  console.log('addvendorbanner');

  try {
    const newData = new VendorBanner({
      title: req.body.title,
      status: req.body.status,
      banner: req.body.banner,
    });
    await newData.save();
    res.status(200).send({
      message: 'Vendor Banner Added Successfully!',
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
}

const getvendorbanner = async (req, res) => {
  console.log('getvendorbanner');
  try {
    const data = await VendorBanner.find();
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
}

const updatevendorbanner = async (req, res) => {
  const id = req.query._id;
  const { title, status, banner } = req.body;
  const update = await VendorBanner.findByIdAndUpdate({ "_id": id }, req.body);
  const data = await VendorBanner.findOne({ _id: id });
  console.log(data);
  res.status(201).send(data);
}

const removevedorbanner = async (req, res) => {
  try {
    const id = req.query._id;
    const remove = await VendorBanner.findOneAndDelete({ "_id": id });
    res.status(200).send({
      message: 'Vendor Banner Removed Successfully!',
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
}

const getOneVendorbanner = async (req, res) => {
  try {
    const id = req.query._id;
    const data = await VendorBanner.findOne({ _id: id });
    console.log(data);
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
}

const getUserCertInfo = async (req, res) => {
  try {
    var sort = { _id: -1 };
    // const usersinfo = await UserCertInfo.find().sort(sort);
    const usersinfo = await UserCertInfo.aggregate([
      {
        $lookup: {
          from: 'reportdatas',
          localField: 'unique_id',
          foreignField: 'unique_id',
          pipeline: [
            {
              $project: { payment_status: 1, paymentMethods: 1 }
            }
          ],
          as: 'reportData'
        }
      },
      {
        $unwind: {
          path: '$reportData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ])
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const getEnneagramReport = async (req, res) => {
  try {
    var sort = { _id: -1 };
    const usersinfo = await EnneagramReportData.find().populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'EnneagrapQuestionnaire',
      match: { _id: { $type: 'objectId' } }
    })
      .sort(sort);
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const deleteReports = async (req, res) => {
  const ids = req.body.ids;

  for (let i = 0; i < ids.length; i++) {
    // await UserCertInfo.deleteMany({ user_id: ids[i] });
    // await ReportData.deleteMany({ user_id: ids[i] });
    // const uniqueIds = userCertInf.map(certInfo => certInfo.unique_id);
    // await QuestionnaireAnswer.deleteMany({ unique_id: { $in: uniqueIds } });
    let userCertInf = await UserCertInfo.find({ user_id: { $in: ids } });
    const uniqueIds = userCertInf.map(certInfo => certInfo.unique_id);
    const questionnaireAns = await QuestionnaireAnswer.deleteMany({ unique_id: { $in: uniqueIds } });
    await ReportData.deleteMany({ user_id: ids[i] });
    // ennagram
    await Ennagramanswers.deleteMany({ user_id: { $in: ids[i] } });
    await EnneagramReportData.deleteMany({ user_id: ids[i] });
    // 16type
    await Sixteentypeanswer.deleteMany({ user_id: { $in: ids[i] } });
    await SixteenTypeReportData.deleteMany({ user_id: ids[i] });
    // bigfive
    await Bigfiveans.deleteMany({ user_id: { $in: ids[i] } });
    await BigFiveReportData.deleteMany({ user_id: ids[i] });
    // disc
    await Discanswers.deleteMany({ user_id: { $in: ids[i] } });
    await DiscReportData.deleteMany({ user_id: ids[i] });
    // career
    await CareerAptitudeAnswer.deleteMany({ user_id: { $in: ids[i] } });
    await CareerAptitudeReportData.deleteMany({ user_id: { $in: ids[i] } });
    // inoice
    await Invoice.deleteMany({ user_id: { $in: ids[i] } });
    await Payments.deleteMany({ user_id: ids[i] });
    await UserCertInfo.deleteMany({ user_id: ids[i] });
    await UserModel.deleteOne({ _id: ids[i] });
  }
  res.status(200).json({ mssg: "Records Successfully Deleted" });
}

const invoiceInfo = async (req, res) => {
  try {
    const newInfo = new InvoiceInfo({
      title: req.body.title,
      address: req.body.address,
    });
    await newInfo.save();
    res.status(200).send({
      info: newInfo,
      message: 'Info Added Successfully!',
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
}

const allInvoiceInfo = async (req, res) => {
  try {
    const info = await InvoiceInfo.find({}).sort({ _id: -1 });
    res.send(info);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
}

const getInvoiceInfo = async (req, res) => {
  try {
    const info = await InvoiceInfo.findOne({ _id: req.body.id });
    res.json(info);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
}

const updateInvoiceInfo = async (req, res) => {
  try {
    const info = await InvoiceInfo.findById(req.body.id);
    if (info) {
      // info.title = req.body.title;
      // info.address = req.body.address;
      info.titleOne = req.body.titleOne;
      info.titleTwo = req.body.titleTwo;
      info.titleThree = req.body.titleThree;
      info.addressOne = req.body.addressOne;
      info.addressTwo = req.body.addressTwo;
      info.invoice_object = req.body.invoice_object;
      const updatedInfo = await info.save();
      res.send({
        _id: updatedInfo._id,
        // title: updatedInfo.title,
        // address: updatedInfo.address,
        titleOne: updatedInfo.titleOne,
        titleTwo: updatedInfo.titleTwo,
        titleThree: updatedInfo.titleThree,
        addressOne: updatedInfo.addressOne,
        addressTwo: updatedInfo.addressTwo,
        invoice_object: updatedInfo.invoice_object,
      });
    }
  } catch (err) {
    res.status(404).send(err.message);
  }
}

const deleteInvoiceInfo = async (req, res) => {
  InvoiceInfo.deleteOne({ _id: req.body.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: 'Invoice Info Deleted Successfully!',
      });
    }
  });
}

const GenerateInvoice = async (typeOfFile, CssFilePath, filePath, newInfo, adminInfo) => {

  try {
    const template = fs.readFileSync(typeOfFile, 'utf-8');
    const css = fs.readFileSync(CssFilePath, 'utf8');
    const renderedTemplate = ejs.render(template, { newInfo, adminInfo });
    const compiledTemplate = handlebars.compile(renderedTemplate);
    // const browser = await puppeteer.launch({
    //   executablePath: '/usr/bin/chromium-browser'
    // });
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    // const browser = await puppeteer.launch();
    const format = {
      width: '8.2in', // Width in inches
      height: '8.9in', // Height in inches
    };

    const page = await browser.newPage();
    const htmlContent = compiledTemplate({ newInfo, adminInfo });
    await page.setContent(htmlContent);
    await page.addStyleTag({ content: css });
    await page.pdf({ path: filePath, ...format, printBackground: true });
    await browser.close();

    // return 'PDF generated successfully!';
  } catch (error) {
    console.error(error);
  }
};

const getInvoiceIso = async (req, res) => {
  try {
    const iso_cod = req.body.iso_cod;
    let counter = await Invoice.findOne({ iso_cod });
    if (counter) {
      res.status(200).send(counter);
      return
    } else {
      res.status(200).send({ msg: "counter not found" });
      return
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
}

const updateInvoiceIso = async (req, res) => {
  try {
    const iso_cod = req.body.iso_cod;
    const middlenumber = req.body.middlenumber;
    const sequential_number = req.body.sequential_number;
    let counter = await Invoice.findOne({ iso_cod });
    if (counter) {
      counter.middlenumber = middlenumber;
      counter.sequential_number = sequential_number; // Fix the typo here
    }
    await counter.save();
    res.status(200).send({
      counter: counter
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
}

const updateSequentialNumber = async (req, res) => {
  try {
    let updateSequentialNum = await Invoice.updateMany({ invoice_number: { $exists: false } }, { $set: { sequential_number: 0 } });
    res.status(200).send({
      msg: "Sequential Numbers are reset."
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
}

const getIso = async (req, res) => {
  let counter = await Invoice.find({ invoice_number: { $exists: false } });
  res.status(200).send(counter);
}

const updateIso = async (req, res) => {
  let uuuuu = await Invoice.findOneAndUpdate({ iso_cod: req.body.iso }, { country: req.body.country });
  let uuuuusss = await Invoice.findOne({ iso_cod: req.body.iso });
  res.status(200).send(uuuuusss);
}

const generateInvoiceNum = async (req, res) => {
  try {
    let middlenumber = req.body.middlenumber;
    let sequentialNum = req.body.sequentialNum;
    let iso_cod = req.body.iso_cod;
    const now = new Date();
    const year = now.getFullYear();
    sequentialNum = sequentialNum + 1;
    sequentialNum = String(sequentialNum).padStart(
      3,
      "0"
    );
    const invNum = `INV-${iso_cod}-${middlenumber}-${year}-${sequentialNum}`;
    res.status(200).send(invNum);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

const createInvoice = async (req, res) => {
  let invoiceObj = req.body.invoice_object;
  let userData = req.body.userData;
  try {
    const now = new Date();
    const year = now.getFullYear();
    const iso_cod = userData?.iso_cod;
    // const invoice_date = invoiceObj?.InvoiceDate;
    // const delivery_date = invoiceObj?.DeliveryDate;
    // const invDate = moment(invoice_date).format("DD-MM-YYYY");
    // const deliveryDate = moment(delivery_date).format("DD-MM-YYYY");

    // Find or create a counter document for the given iso_cod
    // let middlenumber = 632495;
    // let counter = await Invoice.findOne({ iso_cod });

    // if (!counter) {
    //   // If the counter document doesn't exist, create it
    //   counter = new Invoice({
    //     iso_cod: iso_cod,
    //     sequential_number: 1,
    //     middlenumber: middlenumber,
    //     country: userData?.country,
    //   });
    // } else {
    //   // Increment the sequential number for the existing counter document
    //   middlenumber = counter.middlenumber;
    //   counter.sequential_number += 1;
    // }
    // await counter.save();

    // let paddedSequentialNumber = String(counter.sequential_number).padStart(
    //   3,
    //   "0"
    // );

    // if (paddedSequentialNumber == 1000) {
    //   middlenumber = middlenumber + 1;
    //   let counter = await Invoice.findOne({ iso_cod });
    //   if (counter) {
    //     counter.middlenumber = middlenumber;
    //     middlenumber = counter.middlenumber;
    //     counter.sequential_number = 1;
    //     paddedSequentialNumber = String(counter.sequential_number).padStart(
    //       3,
    //       "0"
    //     );
    //   }
    //   await counter.save();
    // }

    // // sequential number restart from 1, if it becomes 999 (accourding a city)
    // const invNum = `INV-${iso_cod}-${middlenumber}-${year}-${paddedSequentialNumber}`;
    // // const invNum = "422521"
    // const orderID = `#${middlenumber}${paddedSequentialNumber}${iso_cod}`;

    const adminInfo = await InvoiceInfo.findOne({ _id: "64fc0122decb41ce6adbf4f7" });

    const newInfo = ({
      invoice_number: invoiceObj?.InvoiceNumber,
      invoice_date: invoiceObj?.InvoiceDate,
      // user_id: user_id,
      user_name: invoiceObj?.user_name,
      surname: invoiceObj?.last_name,
      // questionnaire_id: questionnaire_id,
      // booking_id: booking_id,
      user_address_one: invoiceObj?.user_address_one,
      user_address_two: invoiceObj?.user_address_two,
      postal_code: invoiceObj?.postal_code,
      city: invoiceObj?.city,
      state: invoiceObj?.state ? invoiceObj?.state : "",
      country: invoiceObj?.country,
      order_id_number: invoiceObj?.OrderIdNumber,
      delivery_date: invoiceObj?.DeliveryDate,
      description: invoiceObj?.Description,
      qty: invoiceObj?.Qty,
      unit_price: invoiceObj?.UnitPriceExclVat,
      sales_tax: "$0.00",
      total_amount: invoiceObj?.ItemSubtotalInclVat,
      // iso_cod: userData?.iso_cod,
      // admin_title: adminInfo.title,
      // admin_address: adminInfo.address,
      vat_rate: `${invoiceObj?.VatRate}`,
      unit_price_inc: invoiceObj?.ItemSubtotalInclVat,
      vat_subtotal: `${invoiceObj?.VatSubtotal}`,
    });

    // await newInfo.save();
    const invoicePath = path.join(
      __dirname,
      `../public/invoiceCreatedByAdmin/invoice_${newInfo.invoice_number}.pdf`
    );
    const data = await GenerateInvoice('../view/invoice.ejs', '../view/certificate-style.css', invoicePath, newInfo, adminInfo);
    let pdfurl = `${process.env.hostPath}/invoiceCreatedByAdmin/invoice_${newInfo.invoice_number}.pdf`;
    return res.status(200).send({
      info: newInfo,
      pdfurl,
    });
  } catch (err) {
    return res.status(400).send(err.message);
  }
}

const allInvoice = async (req, res) => {
  try {
    const info = await Invoice.find({ sequential_number: { $exists: false } }).sort({ _id: -1 });
    res.send(info);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
}

const getSingleInvoice = async (req, res) => {
  try {
    const info = await Invoice.findOne({ _id: req.body.id });
    res.json(info);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
}

const editInvoice = async (req, res) => {
  try {
    const info = await Invoice.findOneAndUpdate(
      { _id: req.body.id },
      {
        admin_title: req.body?.admin_title,
        admin_address: req.body?.admin_address,
        invoice_number: req.body?.invoice_number,
        invoice_date: req.body?.invoice_date,
        user_name: req.body?.user_name,
        last_name: req.body?.last_name,
        user_address_one: req.body?.user_address_one,
        user_address_two: req.body?.user_address_two,
        order_id_number: req.body?.order_id_number,
        delivery_date: req.body?.delivery_date,
        description: req.body?.description,
        qty: req.body?.qty,
        unit_price: req.body?.unit_price,
        sales_tax: req.body?.sales_tax,
        total_amount: req.body?.total_amount,
        iso_cod: req.body?.iso_cod,
      });
    const updateddata = await Invoice.findOne({ _id: req.body.id });
    res.send({ invoiceData: updateddata });
  } catch (err) {
    res.status(404).send(err.message);
  }
}

const userCertInfoByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const usersinfo = await UserCertInfo.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      }
    });

    for (const element of usersinfo) {
      const user_name = element.user_name;
      const user_id = element.user_id;
      const questionnaire_id = element.questionnaire_id;
      const unique_id = element.unique_id;
      const address_one = element.address_one;
      const address_two = element.address_two;
      const invoice_date = element.createdAt;
      const iso_cod = element.country_code;
      const amount = element.amount;
      const qtype = element.qtype;
      const phone = element.phone;
      let counter = await Invoice.findOne({ iso_cod: iso_cod });

      const invDate = moment(invoice_date).format('DD-MM-YYYY');

      if (!counter) {
        counter = await Invoice.create({
          iso_cod: iso_cod,
          sequential_number: 1,
        });
      } else {
        counter.sequential_number += 1;
        await counter.save(); // Save the updated counter
      }
      const paddedSequentialNumber = String(counter.sequential_number).padStart(3, '0');
      const invNum = `INV-${iso_cod}-632495-${year}-${paddedSequentialNumber}`;
      const orderID = `#632495${paddedSequentialNumber}${iso_cod}`;

      const adminInfo = await InvoiceInfo.findOne({ _id: "64fc0122decb41ce6adbf4f7" });

      const newInfo = new Invoice({
        invoice_number: invNum,
        invoice_date: invDate,
        user_id: user_id,
        user_name: user_name,
        phone: phone,
        questionnaire_id: questionnaire_id,
        unique_id: unique_id,
        user_address_one: address_one,
        user_address_two: address_two,
        order_id_number: orderID,
        delivery_date: invDate,
        description: qtype,
        qty: '1',
        unit_price: amount,
        sales_tax: '$0.00',
        total_amount: amount,
        iso_cod: iso_cod,
      });

      await newInfo.save();
      const invoicePath = path.join(
        __dirname,
        `../public/invoice/invoice_${newInfo.invoice_number}.pdf`
      );
      const data = await GenerateInvoice('../view/invoice.ejs', '../view/certificate-style.css', invoicePath, newInfo, adminInfo);
      let pdfurl = `${process.env.hostPath}/invoice/invoice_${newInfo.invoice_number}.pdf`;
      invoices.push({
        info: newInfo,
        pdfurl: pdfurl,
      });
    }
    res.status(200).send(invoices);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const removeUserAccount = async (req, res) => {
  try {
    const id = req.body.id;
    const user = await UserModel.findOne({ _id: id });
    const userCertInf = await UserCertInfo.find({ user_id: id });
    const uniqueIds = userCertInf.map(certInfo => certInfo.unique_id);
    const questionnaireAns = await QuestionnaireAnswer.deleteMany({ unique_id: { $in: uniqueIds } });
    const reportsdata = await ReportData.deleteMany({ user_id: id });

    // ennagram
    const ennagramAns = await Ennagramanswers.deleteMany({ user_id: { $in: id } });
    const ennagramReportsdata = await EnneagramReportData.deleteMany({ user_id: id });
    // 16type
    const SixteenTypeAns = await Sixteentypeanswer.deleteMany({ user_id: { $in: id } });
    const Sixteendata = await SixteenTypeReportData.deleteMany({ user_id: id });
    // bigfive
    const bigFiveAns = await Bigfiveans.deleteMany({ user_id: { $in: id } });
    const bigFiveReportsdata = await BigFiveReportData.deleteMany({ user_id: id });
    // disc
    const discAns = await Discanswers.deleteMany({ user_id: { $in: id } });
    const discReportsdata = await DiscReportData.deleteMany({ user_id: id });
    // career
    const careerAns = await CareerAptitudeAnswer.deleteMany({ user_id: { $in: id } });
    const career = await CareerAptitudeReportData.deleteMany({ user_id: { $in: id } });

    // inoice
    const invremove = await Invoice.deleteMany({ user_id: { $in: id } });

    const pay = await Payments.deleteMany({ user_id: id });
    const deleteResult = await UserCertInfo.deleteMany({ user_id: id });
    const deleteuser = await UserModel.deleteOne({ _id: id });
    res.send({ msg: 'User account removed.' });
  } catch (err) {
    res.status(400).send(err.message);
  }
}

const readInvoiceTemplate = (file, res) => {
  try {
    ejs.renderFile(file, function (err, data) {
      if (err) {
        res.status(500).send(err); // Send an error response
      } else {
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(data); // Send the rendered HTML as the response
      }
    });
  } catch (error) {
    res.status(500).send(error); // Send an error response
  }
};

// const getInvoiceTemplate = async (req, res) => {
//   const file = "view/invoice_editing.ejs";
//   readInvoiceTemplate(file, res); 
//   // const ejsTemplate = fs.readFileSync('view/invoice.ejs', 'utf8');
//   // res.send(ejsTemplate);
// }

const getInvoiceTemplate = async (req, res) => {
  const ejsTemplate = fs.readFileSync('../view/invoice.ejs', 'utf8');
  res.send(ejsTemplate);
}

const userReportByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const usersinfo = await UserCertInfo.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      }
    });
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const enneagramReportByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const usersinfo = await EnneagramReportData.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'EnneagrapQuestionnaire',
      match: { _id: { $type: 'objectId' } }
    });
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const enneagramInvoiceByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    var sort = { _id: -1 };
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const invoiceData = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      },
      invoice_number: { $exists: true },
      questionnaire_id: "65586e235046c32c7cd385cd"
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).sort(sort);
    res.status(200).send(invoiceData);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const iqInvoiceByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const invoiceData = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      },
      invoice_number: { $exists: true },
      // questionnaire_id: { $ne: "65586e235046c32c7cd385cd" }
      $or: [
        { questionnaire_id: "6436694cf923aa5ea7ad37cc" },
        { questionnaire_id: "64366966f923aa5ea7ad37d3" }
      ]
    });
    res.status(200).send(invoiceData);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const Generatetestpdf = async (typeOfFile, CssFilePath, filePath, answer, res) => {

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://www.google.com');
    await page.screenshot({ path: 'example.png' });

    await browser.close();

    // return 'PDF generated successfully!';
  } catch (err) {
    console.error(err);
    res.send({ msg: err.message || 'An error occurred' });
    return;
  }
};

const testpdf = async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/snap/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://www.google.com');
    await page.screenshot({ path: 'example.png' });

    await browser.close();
    res.send("function has been rundfdf")

    // return 'PDF generated successfully!';
  } catch (err) {
    console.error(err);
    res.send({ msg: err.message || 'An error occurred' });
    return;
  }

  return
  let unique_id = "12345678";
  let testinfo = {
    name: 'shubham',
    add: 'testuser'
  }
  const pdfpath = path.join(
    __dirname,
    `../public/certificate/testpdf_${unique_id}.pdf`
  );
  // res.status(200).send(pdfpath);

  // const data = await GeneratehtmlPdf('../view/testing.ejs', '../view/certificate-style.css', pdfpath, testinfo, res);
  const data = await Generatetestpdf('view/testing.ejs', 'view/certificate-style.css', pdfpath, testinfo, res);
  let pdfurl = `${process.env.hostPath}/certificate/testpdf_${unique_id}.pdf`;
  res.status(200).json({ pdfurl });
}


const getEnnaQuestionnaire = async (req, res) => {
  const Form = await EnneagrapQuestionnaire.findOne({ _id: req.params.id });

  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question with id : ${req.params.id}`);
  }
  res.status(StatusCodes.OK).json({ Form });
}


const addEnnaQuestionnaire = async (req, res) => {
  const { id, section, type, category, timer, isPaid, amount } = req.body;
  if (!section) {
    throw new CustomError.UnauthenticatedError('Questionnaire is required');
  }

  if (id) {
    const exist = await EnneagrapQuestionnaire.findOne({ _id: id });
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions;
      console.log(section[i]._id);
      if (section[i]._id == "") {
        console.log("entry");
        section[i]._id = new mongoose.Types.ObjectId();
        for (var j = 0; j < questions.length; j++) {
          questions[j].quesid = new mongoose.Types.ObjectId();
          let audioimagePath = "";
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");

          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];
            console.log(extension)
            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
      else {

        for (var j = 0; j < questions.length; j++) {
          if (questions[j].quesid == "") {
            questions[j].quesid = new mongoose.Types.ObjectId();
          }
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");
          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio != undefined) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];

            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
    }
    const ques = await EnneagrapQuestionnaire.findOneAndUpdate({ _id: id }, { section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });

    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Updated." });
  }
  else {
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions
      section[i]._id = new mongoose.Types.ObjectId();
      for (var j = 0; j < questions.length; j++) {
        questions[j].question = questions[j].question.replaceAll("&lt;", "<");
        for (var w = 0; w < questions[j].options.length; w++) {
          questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
        }
        questions[j].quesid = new mongoose.Types.ObjectId();
      }
    }
    const ques = await EnneagrapQuestionnaire.create({ section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });
    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Added." });
  }
};

const getAllEnnaQuestionnaire = async (req, res) => {
  const Form = await EnneagrapQuestionnaire.find({ type: { $ne: "Personal Info" } });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

// sixteen type questionnaire
const addSixteenTypeQuestionnaire = async (req, res) => {
  const { id, section, type, category, timer, isPaid, amount } = req.body;
  if (!section) {
    throw new CustomError.UnauthenticatedError('Questionnaire is required');
  }

  if (id) {
    const exist = await SixteenTypeQuestionnaire.findOne({ _id: id });
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions;
      console.log(section[i]._id);
      if (section[i]._id == "") {
        console.log("entry");
        section[i]._id = new mongoose.Types.ObjectId();
        for (var j = 0; j < questions.length; j++) {
          questions[j].quesid = new mongoose.Types.ObjectId();
          let audioimagePath = "";
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");

          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];
            console.log(extension)
            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
      else {

        for (var j = 0; j < questions.length; j++) {
          if (questions[j].quesid == "") {
            questions[j].quesid = new mongoose.Types.ObjectId();
          }
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");
          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio != undefined) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];

            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
    }
    const ques = await SixteenTypeQuestionnaire.findOneAndUpdate({ _id: id }, { section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });

    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Updated." });
  }
  else {
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions
      section[i]._id = new mongoose.Types.ObjectId();
      for (var j = 0; j < questions.length; j++) {
        questions[j].question = questions[j].question.replaceAll("&lt;", "<");
        for (var w = 0; w < questions[j].options.length; w++) {
          questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
        }
        questions[j].quesid = new mongoose.Types.ObjectId();
      }
    }
    const ques = await SixteenTypeQuestionnaire.create({ section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });
    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Added." });
  }
};

const getAllSixteentype = async (req, res) => {
  const Form = await SixteenTypeQuestionnaire.find({ type: { $ne: "Personal Info" } });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

const getSixteenQuestionnaire = async (req, res) => {
  const Form = await SixteenTypeQuestionnaire.findOne({ _id: req.params.id });

  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question with id : ${req.params.id}`);
  }
  res.status(StatusCodes.OK).json({ Form });
}

const getSixteenTypeReportData = async (req, res) => {
  try {
    var sort = { _id: -1 };
    const usersinfo = await SixteenTypeReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'Sixteentypquestionnaires',
      match: { _id: { $type: 'objectId' } }
    }).sort(sort);
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const sixteenTypeReportByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    console.log(startDate);
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const usersinfo = await SixteenTypeReportData.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'Sixteentypquestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    res.status(200).send(usersinfo);
  }
  catch (err) {
    console.log(err)
    res.status(400).send({
      message: err.message,
    });
  }
}

const sixteenTypeInvoiceByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    var sort = { _id: -1 };
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const invoiceData = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      },
      invoice_number: { $exists: true },
      questionnaire_id: "65d33b0f9bef2027f0594db2"
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).sort(sort);
    res.status(200).send(invoiceData);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const addBigFiveQuestionnaire = async (req, res) => {
  const { id, section, type, category, timer, isPaid, amount } = req.body;
  if (!section) {
    throw new CustomError.UnauthenticatedError('Questionnaire is required');
  }

  if (id) {
    const exist = await BigFiveQuestionnaries.findOne({ _id: id });
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions;
      console.log(section[i]._id);
      if (section[i]._id == "") {
        console.log("entry");
        section[i]._id = new mongoose.Types.ObjectId();
        for (var j = 0; j < questions.length; j++) {
          questions[j].quesid = new mongoose.Types.ObjectId();
          let audioimagePath = "";
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");

          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];
            console.log(extension)
            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
      else {

        for (var j = 0; j < questions.length; j++) {
          if (questions[j].quesid == "") {
            questions[j].quesid = new mongoose.Types.ObjectId();
          }
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");
          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio != undefined) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];

            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
    }
    const ques = await BigFiveQuestionnaries.findOneAndUpdate({ _id: id }, { section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });

    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Updated." });
  }
  else {
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions
      section[i]._id = new mongoose.Types.ObjectId();
      for (var j = 0; j < questions.length; j++) {
        questions[j].question = questions[j].question.replaceAll("&lt;", "<");
        for (var w = 0; w < questions[j].options.length; w++) {
          questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
        }
        questions[j].quesid = new mongoose.Types.ObjectId();
      }
    }
    const ques = await BigFiveQuestionnaries.create({ section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });
    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Added." });
  }
};

const getAllBigFIveType = async (req, res) => {
  const Form = await BigFiveQuestionnaries.find({ type: { $ne: "Personal Info" } });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

const getBigFIveQuestionnaire = async (req, res) => {
  const Form = await BigFiveQuestionnaries.findOne({ _id: req.params.id });

  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question with id : ${req.params.id}`);
  }
  res.status(StatusCodes.OK).json({ Form });
}

const getBigFiveReportData = async (req, res) => {
  try {
    var sort = { _id: -1 };
    const usersinfo = await BigFiveReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'BigFivequestionnaires',
      match: { _id: { $type: 'objectId' } }
    }).sort(sort);
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const bigfiveReportByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const usersinfo = await BigFiveReportData.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'BigFivequestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const bigfiveInvoiceByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    var sort = { _id: -1 };
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const invoiceData = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      },
      invoice_number: { $exists: true },
      questionnaire_id: "65ec352edbd8850c638f33fd"
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).sort(sort);
    res.status(200).send(invoiceData);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const addDiscQuestionnaire = async (req, res) => {
  const { id, section, type, category, timer, isPaid, amount } = req.body;
  if (!section) {
    throw new CustomError.UnauthenticatedError('Questionnaire is required');
  }

  if (id) {
    const exist = await DiscQuestionnaries.findOne({ _id: id });
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions;
      console.log(section[i]._id);
      if (section[i]._id == "") {
        console.log("entry");
        section[i]._id = new mongoose.Types.ObjectId();
        for (var j = 0; j < questions.length; j++) {
          questions[j].quesid = new mongoose.Types.ObjectId();
          let audioimagePath = "";
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");

          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];
            console.log(extension)
            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
      else {

        for (var j = 0; j < questions.length; j++) {
          if (questions[j].quesid == "") {
            questions[j].quesid = new mongoose.Types.ObjectId();
          }
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");
          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio != undefined) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];

            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
    }
    const ques = await DiscQuestionnaries.findOneAndUpdate({ _id: id }, { section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });

    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Updated." });
  }
  else {
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions
      section[i]._id = new mongoose.Types.ObjectId();
      for (var j = 0; j < questions.length; j++) {
        questions[j].question = questions[j].question.replaceAll("&lt;", "<");
        for (var w = 0; w < questions[j].options.length; w++) {
          questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
        }
        questions[j].quesid = new mongoose.Types.ObjectId();
      }
    }
    const ques = await DiscQuestionnaries.create({ section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });
    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Added." });
  }
};

const getAlldisc = async (req, res) => {
  const Form = await DiscQuestionnaries.find({ type: { $ne: "Personal Info" } });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

const getDiscQuestionnaire = async (req, res) => {
  const Form = await DiscQuestionnaries.findOne({ _id: req.params.id });

  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question with id : ${req.params.id}`);
  }
  res.status(StatusCodes.OK).json({ Form });
}

const getDiscReportData = async (req, res) => {
  try {
    var sort = { _id: -1 };
    const usersinfo = await DiscReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'Discquestionnaires',
      match: { _id: { $type: 'objectId' } }
    }).sort(sort);
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const discReportByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const usersinfo = await DiscReportData.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'Discquestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const discInvoiceByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    var sort = { _id: -1 };
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const invoiceData = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      },
      invoice_number: { $exists: true },
      questionnaire_id: "662f3b21d3279b1ec0877cd0"
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).sort(sort);
    res.status(200).send(invoiceData);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const getTotalOrder = async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  // const end = new Date(endDate);
  const end = new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000);
  const startOfToday = moment().startOf('day').toDate();
  const endOfToday = moment().endOf('day').toDate();
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();
  const startOfWeek = moment().startOf('week').day(0).toDate();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const data = await Payments.aggregate([
      {
        $facet: {
          today: [
            {
              $match: {
                createdAt: {
                  $gte: startOfToday,
                  $lte: endOfToday
                },
                status: { $in: [1, 2] }
              }
            },
            {
              $group: {
                _id: null,
                totalAmountCombined: { $sum: { $cond: [{ $in: ["$status", [1, 2]] }, { $toDouble: "$amount" }, 0] } },
                totalCountCombined: { $sum: 1 }
              }
            }
          ],
          thisMonth: [
            {
              $match: {
                createdAt: {
                  $gte: startOfMonth,
                  $lte: endOfMonth
                },
                status: { $in: [1, 2] }
              }
            },
            {
              $group: {
                _id: null,
                totalAmountMonth: { $sum: { $cond: [{ $in: ["$status", [1, 2]] }, { $toDouble: "$amount" }, 0] } },
                totalCountMonth: { $sum: 1 }
              }
            }
          ],
          allTime: [
            {
              $match: {
                status: { $in: [1, 2] }
              }
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: { $cond: [{ $in: ["$status", [1, 2]] }, { $toDouble: "$amount" }, 0] } },
                totalCount: { $sum: 1 }
              }
            }
          ],
          thisWeek: [
            {
              $match: {
                createdAt: {
                  $gte: startOfWeek,
                  $lte: endOfToday
                }
              }
            },
            {
              $group: {
                _id: { day: { $dayOfWeek: "$createdAt" } },
                totalAmount: { $sum: { $toDouble: "$amount" } },
                totalCount: { $sum: 1 }
              }
            },
            {
              $sort: { "_id.day": 1 }
            }
          ]
        }
      }
    ]);

    // const IQ_test = await ReportData.find();
    // const IQ_test = await UserCertInfo.find();
    const IQ_test = await UserCertInfo.aggregate([
      {
        $lookup: {
          from: 'reportdatas',
          localField: 'unique_id',
          foreignField: 'unique_id',
          pipeline: [
            {
              $project: { payment_status: 1, paymentMethods: 1 }
            }
          ],
          as: 'reportData'
        }
      },
      {
        $unwind: {
          path: '$reportData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);
    const ennagram_report = await EnneagramReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'EnneagrapQuestionnaire',
      match: { _id: { $type: 'objectId' } }
    });
    const sixteen_report = await SixteenTypeReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'Sixteentypquestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    const bigfive_report = await BigFiveReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'BigFivequestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    const disc_report = await DiscReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'Discquestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    const careeraptitude_report = await CareerAptitudeReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'CareerAptitudequestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    const allReports = [
      ...IQ_test,
      ...ennagram_report,
      ...sixteen_report,
      ...bigfive_report,
      ...disc_report,
      ...careeraptitude_report
    ];
    allReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalAmountToday = data[0].today.length ? data[0].today[0].totalAmountCombined : 0;
    const totalAmountThisMonth = data[0].thisMonth.length ? data[0].thisMonth[0].totalAmountMonth : 0;
    const totalAmountAllTime = data[0].allTime.length ? data[0].allTime[0].totalAmount : 0;
    const totalTodayTest = data[0].today.length ? data[0].today[0].totalCountCombined : 0;
    const totalMonthTest = data[0].thisMonth.length ? data[0].thisMonth[0].totalCountMonth : 0;
    const totaltest = data[0].allTime.length ? data[0].allTime[0].totalCount : 0;
    const thisWeekData = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i + 1,
      totalAmount: 0,
      totalCount: 0
    }));

    data[0].thisWeek.forEach(day => {
      thisWeekData[day._id.day - 1] = {
        dayOfWeek: day._id.day,
        totalAmount: day.totalAmount,
        totalCount: day.totalCount
      };
    });
    res.status(StatusCodes.OK).json({
      totalAmountToday,
      totalAmountThisMonth,
      totalAmountAllTime,
      totalTodayTest,
      totalMonthTest,
      totaltest,
      thisWeekData,
      allReports
    });
  } else {
    const data = await Payments.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lt: end
          },
          status: { $in: [1, 2] }
        }
      },
      {
        $group: {
          _id: null,
          totalAmountCombined: {
            $sum: { $cond: [{ $in: ["$status", [1, 2]] }, { $toDouble: "$amount" }, 0] }
          },
          totalCountCombined: { $sum: 1 }
        }
      }
    ]);
    // const IQ_test = await ReportData.find();
    // const IQ_test = await UserCertInfo.find();
    const IQ_test = await UserCertInfo.aggregate([
      {
        $lookup: {
          from: 'reportdatas',
          localField: 'unique_id',
          foreignField: 'unique_id',
          pipeline: [
            {
              $project: { payment_status: 1 }
            }
          ],
          as: 'reportData'
        }
      },
      {
        $unwind: {
          path: '$reportData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);
    const ennagram_report = await EnneagramReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'EnneagrapQuestionnaire',
      match: { _id: { $type: 'objectId' } }
    });
    const sixteen_report = await SixteenTypeReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'Sixteentypquestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    const bigfive_report = await BigFiveReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'BigFivequestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    const disc_report = await DiscReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'Discquestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    const careeraptitude_report = await CareerAptitudeReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'CareerAptitudequestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    const allReports = [
      ...IQ_test,
      ...ennagram_report,
      ...sixteen_report,
      ...bigfive_report,
      ...disc_report,
      ...careeraptitude_report
    ];
    const filteredReports = allReports.filter(report => {
      const reportDate = new Date(report.createdAt);
      return reportDate >= start && reportDate <= end;
    });
    filteredReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalAmountAllTime = data.length ? data[0].totalAmountCombined : 0;
    const totaltest = data.length ? data[0].totalCountCombined : 0;

    res.send({ totalAmountAllTime, totaltest, filteredReports })
  }
}


const getTotalOrderByQuiz = async (req, res) => {
  const Qid = req.body.qid;
  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  // const end = new Date(endDate);
  const end = new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000);
  const startOfToday = moment().startOf('day').toDate();
  const endOfToday = moment().endOf('day').toDate();
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();
  const startOfWeek = moment().startOf('week').day(0).toDate(); // Start of the week (Sunday)

  const statusCondition = Qid == "6436694cf923aa5ea7ad37cc" || Qid == "64366966f923aa5ea7ad37d3" ? { $in: [1, 2] } : 1;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const facets = {
      today: [
        {
          $match: {
            questionnaire_id: Qid,
            createdAt: {
              $gte: startOfToday,
              $lte: endOfToday
            },
            status: statusCondition
          }
        },
        {
          $group: {
            _id: { questionnaire_id: "$questionnaire_id" },
            totalAmountCombined: { $sum: { $cond: [{ $in: ["$status", [1, 2]] }, { $toDouble: "$amount" }, 0] } },
            totalCountCombined: { $sum: 1 }
          }
        }
      ],
      thisMonth: [
        {
          $match: {
            questionnaire_id: Qid,
            createdAt: {
              $gte: startOfMonth,
              $lte: endOfMonth
            },
            status: statusCondition
          }
        },
        {
          $group: {
            _id: { questionnaire_id: "$questionnaire_id" },
            totalAmountMonth: { $sum: { $cond: [{ $in: ["$status", [1, 2]] }, { $toDouble: "$amount" }, 0] } },
            totalCountMonth: { $sum: 1 }
          }
        }
      ],
      allTime: [
        {
          $match: {
            questionnaire_id: Qid,
            status: statusCondition
          }
        },
        {
          $group: {
            _id: { questionnaire_id: "$questionnaire_id" },
            totalAmount: { $sum: { $cond: [{ $in: ["$status", [1, 2]] }, { $toDouble: "$amount" }, 0] } },
            totalCount: { $sum: 1 }
          }
        }
      ],
      thisWeek: [
        {
          $match: {
            questionnaire_id: Qid,
            createdAt: {
              $gte: startOfWeek,
              $lte: endOfToday
            },
            status: statusCondition
          }
        },
        {
          $group: {
            _id: { day: { $dayOfWeek: "$createdAt" } },
            totalAmount: { $sum: { $toDouble: "$amount" } },
            totalCount: { $sum: 1 }
          }
        },
        {
          $sort: { "_id.day": 1 }
        }
      ]
    };
    const data = await Payments.aggregate([{ $facet: facets }]);
    const totalAmountToday = data[0].today.length ? data[0].today[0].totalAmountCombined : 0;
    const totalAmountThisMonth = data[0].thisMonth.length ? data[0].thisMonth[0].totalAmountMonth : 0;
    const totalAmountAllTimes = data[0].allTime.length ? data[0].allTime[0].totalAmount : 0;
    const totalTodayTest = data[0].today.length ? data[0].today[0].totalCountCombined : 0;
    const totalMonthTest = data[0].thisMonth.length ? data[0].thisMonth[0].totalCountMonth : 0;
    const totaltests = data[0].allTime.length ? data[0].allTime[0].totalCount : 0;
    const thisWeekData = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i + 1,
      totalAmount: 0,
      totalCount: 0
    }));
    data[0].thisWeek.forEach(day => {
      thisWeekData[day._id.day - 1] = {
        dayOfWeek: day._id.day,
        totalAmount: day.totalAmount,
        totalCount: day.totalCount
      };
    });

    if (Qid === '6436694cf923aa5ea7ad37cc' || Qid === '64366966f923aa5ea7ad37d3') {
      let IQ_test = await ReportData.find();
      for (let i = 0; i < IQ_test.length; i++) {
        const user = await UserModel.findById(IQ_test[i].user_id);
        if (user) {
          IQ_test[i] = {
            ...IQ_test[i]._doc,
            user_name: user.name,
            email: user.email,
            country: user.country
          };
        } else {
          IQ_test[i] = {
            ...IQ_test[i]._doc,
            user_name: 'Unknown',
            email: "Unknown@gmail.com",
            country: "Unknown"
          };
        }

      }
      report = IQ_test;
    } else if (Qid === '65586e235046c32c7cd385cd') {
      let ennagram_report = await EnneagramReportData.find({ report_status: true });
      report = ennagram_report;
    } else if (Qid === '65d33b0f9bef2027f0594db2') {
      let sixteen_report = await SixteenTypeReportData.find({ report_status: true });
      report = sixteen_report;
    } else if (Qid == '65ec352edbd8850c638f33fd') {
      let bigfive_report = await BigFiveReportData.find({ report_status: true });
      report = bigfive_report;
    } else if (Qid == "662f3b21d3279b1ec0877cd0") {
      let disc_report = await DiscReportData.find({ report_status: true });
      report = disc_report;
    }
    else if (Qid == '66433c87986a6833bc93d9bc') {
      let careeraptitude_report = await CareerAptitudeReportData.find({ report_status: true });
      report = careeraptitude_report;
    }
    report.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(StatusCodes.OK).json({
      totalAmountToday,
      totalAmountThisMonth,
      totalAmountAllTimes,
      totalTodayTest,
      totalMonthTest,
      totaltests,
      thisWeekData,
      report
    });
  }

  else {
    const data = await Payments.aggregate([
      {
        $match: {
          questionnaire_id: Qid,
          createdAt: {
            $gte: start,
            $lt: end
          },
          status: statusCondition
        }
      },
      {
        $group: {
          _id: { questionnaire_id: "$questionnaire_id" },
          totalAmountCombined: { $sum: { $cond: [{ $in: ["$status", [1, 2]] }, { $toDouble: "$amount" }, 0] } },
          totalCountCombined: { $sum: 1 }
        }
      }
    ])
    let report = [];
    if (Qid === '6436694cf923aa5ea7ad37cc' || Qid === '64366966f923aa5ea7ad37d3') {
      let IQ_test = await ReportData.find();
      for (let i = 0; i < IQ_test.length; i++) {
        const user = await UserModel.findById(IQ_test[i].user_id);
        if (user) {
          IQ_test[i] = {
            ...IQ_test[i]._doc,
            user_name: user.name,
            email: user.email,
            country: user.country
          };
        } else {
          IQ_test[i] = {
            ...IQ_test[i]._doc,
            user_name: 'Unknown',
            email: "Unknown@gmail.com",
            country: "Unknown"
          };
        }

      }
      report = IQ_test;
    } else if (Qid === '65586e235046c32c7cd385cd') {
      let ennagram_report = await EnneagramReportData.find({ report_status: true });
      report = ennagram_report;
    } else if (Qid === '65d33b0f9bef2027f0594db2') {
      let sixteen_report = await SixteenTypeReportData.find({ report_status: true });
      report = sixteen_report;
    } else if (Qid == '65ec352edbd8850c638f33fd') {
      let bigfive_report = await BigFiveReportData.find({ report_status: true });
      report = bigfive_report;
    } else if (Qid == "662f3b21d3279b1ec0877cd0") {
      let disc_report = await DiscReportData.find({ report_status: true });
      report = disc_report;
    }
    else if (Qid == '66433c87986a6833bc93d9bc') {
      let careeraptitude_report = await CareerAptitudeReportData.find({ report_status: true });
      report = careeraptitude_report;
    }
    report = report.filter(report => {
      const reportDate = new Date(report.createdAt);
      return reportDate >= start && reportDate <= end;
    });
    report.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalAmountAllTimes = data.length ? data[0].totalAmountCombined : 0;
    const totaltests = data.length ? data[0].totalCountCombined : 0;
    res.send({ totalAmountAllTimes, totaltests, report })
  }
};

// getAllPaidQues Amount
const getAllQuestAmt = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate
      ? new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      : null;

    const culture_fair = '6436694cf923aa5ea7ad37cc';
    const classical = '64366966f923aa5ea7ad37d3';
    const enneagram = '65586e235046c32c7cd385cd';
    const sixteentype = '65d33b0f9bef2027f0594db2';
    const big_five = '65ec352edbd8850c638f33fd';
    const disc = '662f3b21d3279b1ec0877cd0';
    const career = '66433c87986a6833bc93d9bc';

    const questionnaires = [
      { questionId: enneagram, is_free: false, status: [1] },
      { questionId: sixteentype, is_free: false, status: [1] },
      { questionId: big_five, is_free: false, status: [1] },
      { questionId: disc, is_free: false, status: [1] },
      { questionId: career, is_free: false, status: [1] },
      { questionId: culture_fair, is_free: false, status: [1, 2] },
      { questionId: classical, is_free: false, status: [1, 2] },
      { questionId: culture_fair, is_free: true, status: [1, 2] },
      { questionId: classical, is_free: true, status: [1, 2] },
    ];

    const aggregateAmount = async ({ questionId, is_free, status }) => {
      const match = {
        questionnaire_id: questionId,
        is_free: is_free,
        status: { $in: status },
      };

      if (start && end && !isNaN(start) && !isNaN(end)) {
        match.createdAt = { $gte: start, $lt: end };
      }

      const data = await Payments.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: { $toDouble: "$amount" } },
          },
        },
      ]);

      return data[0]?.totalAmount || 0;
    };

    const results = await Promise.all(
      questionnaires.map(q => aggregateAmount(q))
    );

    // Rounded amounts in SAME ORDER
    // const totalAmounts = results.map(val => Math.round(val));
    const totalAmounts = results.map(val =>
      Number((val || 0).toFixed(2))
    );


    res.status(StatusCodes.OK).json(totalAmounts);
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong",
    });
  }
};


// getTotal test taken 
const getTest = async (req, res) => {
  const excludedIds = ['642c2afb3b8d5e8965b283e1', '642d130602c5e8c94288dc59']
  const startOfToday = moment().startOf('day').toDate();
  const endOfToday = moment().endOf('day').toDate();
  // month
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();
  const data = await Payments.aggregate([
    {
      $facet: {
        today: [
          {
            $match: {
              createdAt: {
                $gte: startOfToday,
                $lte: endOfToday
              },
              status: { $in: [1, 2] }
            }
          },
          { $count: "count" }
        ],
        thisMonth: [
          {
            $match: {
              createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
              },
              status: { $in: [1, 2] }
            }
          },
          { $count: "count" }
        ],
        allTime: [
          {
            $match: {
              status: { $in: [1, 2] }
            }
          },
          { $count: "count" }
        ]
      }
    }
  ]);
  const todayCount = data[0].today[0] ? data[0].today[0].count : 0;
  const thisMonthCount = data[0].thisMonth[0] ? data[0].thisMonth[0].count : 0;
  const allTimeCount = data[0].allTime[0] ? data[0].allTime[0].count : 0;
  res.status(StatusCodes.OK).json({
    todayCount: todayCount,
    thisMonthCount: thisMonthCount,
    allTimeCount: allTimeCount
  });

  // const totalTest = await UserCertInfo.countDocuments({
  //   questionnaire_id: { $nin: excludedIds }
  // });
  // const todayTestTaken = await UserCertInfo.countDocuments({
  //   questionnaire_id: { $nin: excludedIds },
  //   createdAt: { $gte: startOfToday }
  // });
  // const thisMonthTestTaken = await UserCertInfo.countDocuments({
  //   questionnaire_id: { $nin: excludedIds },
  //   createdAt: { $gte: startOfMonth }
  // });

  res.status(StatusCodes.OK).json({
    data: data
  });
}

const getOrderBySorting = async (req, res) => {
  try {
    const totalOrder = req.body.totalOrder;
    const Qid = req.body.qid;

    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    if (today == "today") {
      const todayy = new Date();
      const timeZoneOffset = todayy.getTimezoneOffset();
      const startDate = new Date(todayy.getFullYear(), todayy.getMonth(), todayy.getDate(), 0, 0, 0, 0);
      const endDate = new Date(todayy.getFullYear(), todayy.getMonth(), todayy.getDate(), 23, 59, 59, 999);

      const payments = await Payments.find({
        createdAt: {
          $gte: startDate,
          $lt: new Date(endDate.getTime() + (timeZoneOffset * 60 * 1000))
        }
      });
      res.status(200).json(payments);
      return
    }

    const payments = await Payments.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      }
    });
    // Calculate total amount
    let totalAmount = 0;
    payments.forEach(payment => {
      totalAmount += parseFloat(payment.amount);
    });

    res.status(200).json(payments);
    return
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }

}

// career aptitude type questionnaire
const addCareerAptitudeQuestionnaire = async (req, res) => {
  const { id, section, type, category, timer, isPaid, amount } = req.body;
  if (!section) {
    throw new CustomError.UnauthenticatedError('Questionnaire is required');
  }

  if (id) {
    const exist = await CareerAptitudeQuestionnaire.findOne({ _id: id });
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions;
      console.log(section[i]._id);
      if (section[i]._id == "") {
        section[i]._id = new mongoose.Types.ObjectId();
        for (var j = 0; j < questions.length; j++) {
          questions[j].quesid = new mongoose.Types.ObjectId();
          let audioimagePath = "";
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");

          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];
            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
      else {

        for (var j = 0; j < questions.length; j++) {
          if (questions[j].quesid == "") {
            questions[j].quesid = new mongoose.Types.ObjectId();
          }
          questions[j].question = questions[j].question.replaceAll("&lt;", "<");
          for (var w = 0; w < questions[j].options.length; w++) {
            questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
          }
          if (questions[j].question_audio != undefined) {

            const wavUrl = questions[j].question_audio;
            const extension = wavUrl.split(';')[0].split('/')[1];

            //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            if (extension == "wav") {
              const buffer = Buffer.from(
                wavUrl.split('base64,')[1],  // only use encoded data after "base64,"
                'base64'
              )
              const newname = new Date().getTime() + '_audio.wav';
              const imagePath = path.join(
                __dirname,
                '../public/uploads/' + `${newname}`
              );
              // await productImage.mv(imagePath);
              //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
              const imageurl = process.env.host + `/public/uploads/${newname}`;
              const filel = fs.writeFileSync(imagePath, buffer);
              questions[j].question_audio = imageurl;
            }
            else {
              questions[j].question_audio = questions[j].question_audio;
            }
          }
        }
      }
    }
    const ques = await CareerAptitudeQuestionnaire.findOneAndUpdate({ _id: id }, { section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });

    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Updated." });
  }
  else {
    for (var i = 0; i < section.length; i++) {
      const questions = section[i].questions
      section[i]._id = new mongoose.Types.ObjectId();
      for (var j = 0; j < questions.length; j++) {
        questions[j].question = questions[j].question.replaceAll("&lt;", "<");
        for (var w = 0; w < questions[j].options.length; w++) {
          questions[j].options[w].option = questions[j].options[w].option.replaceAll("&lt;", "<");
        }
        questions[j].quesid = new mongoose.Types.ObjectId();
      }
    }
    const ques = await CareerAptitudeQuestionnaire.create({ section: section, type: type, category: category, timer: timer, isPaid: isPaid, amount: amount });
    res.status(StatusCodes.CREATED).json({ msg: "Question Success! Added." });
  }
};

const getAllCareerAptitude = async (req, res) => {
  const Form = await CareerAptitudeQuestionnaire.find({ type: { $ne: "Personal Info" } });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

const getCareerAptitudeQuestionnaire = async (req, res) => {
  const Form = await CareerAptitudeQuestionnaire.findOne({ _id: req.params.id });

  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question with id : ${req.params.id}`);
  }
  res.status(StatusCodes.OK).json({ Form });
}

const getCareerReportData = async (req, res) => {
  try {
    var sort = { _id: -1 };
    const usersinfo = await CareerAptitudeReportData.find({ report_status: true }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'CareerAptitudequestionnaires',
      match: { _id: { $type: 'objectId' } }
    }).sort(sort);
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const careerReportByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const usersinfo = await CareerAptitudeReportData.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).populate({
      path: 'questionnaire_id',
      model: 'CareerAptitudequestionnaires',
      match: { _id: { $type: 'objectId' } }
    });
    res.status(200).send(usersinfo);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const careerInvoiceByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    var sort = { _id: -1 };
    let invoices = [];
    const now = new Date();
    const year = now.getFullYear();
    const invoiceData = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      },
      invoice_number: { $exists: true },
      questionnaire_id: "66433c87986a6833bc93d9bc"
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).sort(sort);
    res.status(200).send(invoiceData);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const getUserInvoiceById = async (req, res) => {
  try {
    if (req.body.uniqueId) {
      const data = await Invoice.findOne({ unique_id: req.body.uniqueId });
      res.status(200).send(data);
    } else {
      const data = await Invoice.findOne({ booking_id: req.body.booking_id });
      res.status(200).send(data);
    }

  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const updateUserInvoice = async (req, res) => {
  try {
    if (req.body.uniqueId) {
      await Invoice.findOneAndUpdate({ unique_id: req.body.uniqueId }, req.body.data, { new: true });
      await UserModel.findOneAndUpdate({ _id: req.body.id },
        {
          name: req.body.data.user_name,
          surname: req.body.data.surname,
          address_one: req.body.data.user_address_one,
          address_two: req.body.data.user_address_two,
          postal_code: req.body.data.postal_code,
          city: req.body.data.city,
          state: req.body.data.state
        });
      const adminInfo = await InvoiceInfo.findOne({ _id: "64fc0122decb41ce6adbf4f7" });
      const newInfo = new Invoice({
        invoice_number: req.body.data.invoice_number,
        invoice_date: req.body.data.invoice_date,
        user_id: req.body.data.user_id,
        user_name: req.body.data.user_name,
        surname: req.body.data.surname,
        questionnaire_id: req.body.data.questionnaire_id,
        booking_id: req.body.data.booking_id ? req.body.data.booking_id : "",
        user_address_one: req.body.data.user_address_one,
        user_address_two: req.body.data.user_address_two,
        postal_code: req.body.data.postal_code,
        city: req.body.data.city,
        state: req.body.data.state ? req.body.data.state : "",
        country: req.body.data.country ? req.body.data.country : "",
        order_id_number: req.body.data.order_id_number,
        delivery_date: req.body.data.delivery_date,
        description: req.body.data.description,
        qty: req.body.data.qty,
        unit_price: req.body.data.unit_price,
        sales_tax: "$0.00",
        total_amount: req.body.data.total_amount,
        iso_cod: req.body.data.iso_cod,
        admin_title: adminInfo.titleOne,
        admin_address: adminInfo.addressOne,
        vat_rate: req.body.data.vat_rate,
        unit_price_inc: req.body.data.unit_price_inc,
        vat_subtotal: req.body.data.vat_subtotal,
      });
      //  const invoicePath = path.join(
      //   __dirname,
      //   `../public/invoice/invoice_${req.body.data.invoice_number}.pdf`
      // );
      const invoicePath = path.join(
        __dirname,
        `../public/invoice/invoice_${req.body.data.invoice_number}.pdf`
      );
      // const invoiceTemplatePath = path.join(__dirname, '../view/invoice.ejs');
      // const cssPath = path.join(__dirname, '../view/certificate-style.css');
      const invoicedata = await GenerateInvoice(
        '../view/invoice.ejs',
        '../view/certificate-style.css',
        // invoiceTemplatePath,
        // cssPath,
        invoicePath,
        newInfo,
        adminInfo
      );
      res.status(200).send({ msg: "update invoice succesfully" });

    } else {
      await Invoice.findOneAndUpdate({ booking_id: req.body.booking_id }, req.body.data, { new: true });
      await UserModel.findOneAndUpdate({ _id: req.body.id },
        {
          name: req.body.data.user_name,
          surname: req.body.data.surname,
          address_one: req.body.data.user_address_one,
          address_two: req.body.data.user_address_two,
          postal_code: req.body.data.postal_code,
          city: req.body.data.city,
          state: req.body.data.state
        });
      const adminInfo = await InvoiceInfo.findOne({ _id: "64fc0122decb41ce6adbf4f7" });
      const newInfo = new Invoice({
        invoice_number: req.body.data.invoice_number,
        invoice_date: req.body.data.invoice_date,
        user_id: req.body.data.user_id,
        user_name: req.body.data.user_name,
        surname: req.body.data.surname,
        questionnaire_id: req.body.data.questionnaire_id,
        booking_id: req.body.data.booking_id ? req.body.data.booking_id : "",
        user_address_one: req.body.data.user_address_one,
        user_address_two: req.body.data.user_address_two,
        postal_code: req.body.data.postal_code,
        city: req.body.data.city,
        state: req.body.data.state ? req.body.data.state : "",
        country: req.body.data.country ? req.body.data.country : "",
        order_id_number: req.body.data.order_id_number,
        delivery_date: req.body.data.delivery_date,
        description: req.body.data.description,
        qty: req.body.data.qty,
        unit_price: req.body.data.unit_price,
        sales_tax: "$0.00",
        total_amount: req.body.data.total_amount,
        iso_cod: req.body.data.iso_cod,
        admin_title: adminInfo.titleOne,
        admin_address: adminInfo.addressOne,
        vat_rate: req.body.data.vat_rate,
        unit_price_inc: req.body.data.unit_price_inc,
        vat_subtotal: req.body.data.vat_subtotal,
      });
      //  const invoicePath = path.join(
      //   __dirname,
      //   `../public/invoice/invoice_${req.body.data.invoice_number}.pdf`
      // );
      const invoicePath = path.join(
        __dirname,
        `../public/invoice/invoice_${req.body.booking_id}.pdf`
      );
      // const invoiceTemplatePath = path.join(__dirname, '../view/invoice.ejs');
      // const cssPath = path.join(__dirname, '../view/certificate-style.css');
      console.log(invoicePath);
      const invoicedata = await GenerateInvoice(
        '../view/invoice.ejs',
        '../view/certificate-style.css',
        // invoiceTemplatePath,
        // cssPath,
        invoicePath,
        newInfo,
        adminInfo
      );
      res.status(200).send({ msg: "update invoice succesfully" });
    }
  } catch (err) {
    console.log(err)
    res.status(400).send({
      message: err.message
    })
  }
}

const allInvoiceByDate = async (req, res) => {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    var sort = { _id: -1 };
    const now = new Date();
    const invoiceData = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      },
      invoice_number: { $exists: true },
    }).populate({
      path: 'user_id',
      model: 'User',
      match: { _id: { $type: 'objectId' } }
    }).sort(sort);
    res.status(200).send(invoiceData);
  }
  catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const getInvoiceDetailsByQId = async (req, res) => {
  try {
    const qid = req.body.quesid;
    console.log(qid)
    const country = req.body.country;
    console.log(country);
    let qamount = "";
    let vat_array = null;
    if (qid == "64366966f923aa5ea7ad37d3" || qid == "6436694cf923aa5ea7ad37cc") {
      const qinfo = await Questionnaire.find({ _id: qid });
      qamount = qinfo[0]?.amount;
      vat_array = [
        {
          country_name: "Austria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Belgium",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Bulgaria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Croatia",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Cyprus",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Czech Republic",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Denmark",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Estonia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Finland",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "France",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Germany",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Greece",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "Hungary",
          excl_vat: "$18.24",
          incl_vat: qamount,
          vat_per: 27,
          vat_value: "$6.75",
        },
        {
          country_name: "Ireland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Italy",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Latvia",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Lithuania",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Luxembourg",
          excl_vat: "$21",
          incl_vat: qamount,
          vat_per: 16,
          vat_value: "$3.98",
        },
        {
          country_name: "Malta",
          excl_vat: "$20.49",
          incl_vat: qamount,
          vat_per: 18,
          vat_value: "$4.5",
        },
        {
          country_name: "Netherlands",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Poland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Portugal",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Romania",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$4.75",
        },
        {
          country_name: "Slovakia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Slovenia",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Spain",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Sweden",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "United Kingdom",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
      ];

    } else if (qid == "65586e235046c32c7cd385cd") {
      const qinfo = await EnneagrapQuestionnaire.find({ _id: qid });
      qamount = qinfo[0]?.amount;
      vat_array = [
        {
          country_name: "Austria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Belgium",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Bulgaria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Croatia",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Cyprus",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Czech Republic",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Denmark",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Estonia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Finland",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "France",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Germany",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Greece",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "Hungary",
          excl_vat: "$18.24",
          incl_vat: qamount,
          vat_per: 27,
          vat_value: "$6.75",
        },
        {
          country_name: "Ireland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Italy",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Latvia",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Lithuania",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Luxembourg",
          excl_vat: "$21",
          incl_vat: qamount,
          vat_per: 16,
          vat_value: "$3.98",
        },
        {
          country_name: "Malta",
          excl_vat: "$20.49",
          incl_vat: qamount,
          vat_per: 18,
          vat_value: "$4.5",
        },
        {
          country_name: "Netherlands",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Poland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Portugal",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Romania",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$4.75",
        },
        {
          country_name: "Slovakia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Slovenia",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Spain",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Sweden",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "United Kingdom",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
      ];

    }
    else if (qid == "65d33b0f9bef2027f0594db2") {
      const qinfo = await SixteenTypeQuestionnaire.find({ _id: qid });
      qamount = qinfo[0]?.amount;
      vat_array = [
        {
          country_name: "Austria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Belgium",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Bulgaria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Croatia",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Cyprus",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Czech Republic",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Denmark",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Estonia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Finland",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "France",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Germany",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Greece",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "Hungary",
          excl_vat: "$18.24",
          incl_vat: qamount,
          vat_per: 27,
          vat_value: "$6.75",
        },
        {
          country_name: "Ireland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Italy",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Latvia",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Lithuania",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Luxembourg",
          excl_vat: "$21",
          incl_vat: qamount,
          vat_per: 16,
          vat_value: "$3.98",
        },
        {
          country_name: "Malta",
          excl_vat: "$20.49",
          incl_vat: qamount,
          vat_per: 18,
          vat_value: "$4.5",
        },
        {
          country_name: "Netherlands",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Poland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Portugal",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Romania",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$4.75",
        },
        {
          country_name: "Slovakia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Slovenia",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Spain",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Sweden",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "United Kingdom",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
      ];

    } else if (qid == "65ec352edbd8850c638f33fd") {
      const qinfo = await BigFiveQuestionnaries.find({ _id: qid });
      qamount = qinfo[0]?.amount;
      vat_array = [
        {
          country_name: "Austria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Belgium",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Bulgaria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Croatia",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Cyprus",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Czech Republic",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Denmark",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Estonia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Finland",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "France",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Germany",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Greece",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "Hungary",
          excl_vat: "$18.24",
          incl_vat: qamount,
          vat_per: 27,
          vat_value: "$6.75",
        },
        {
          country_name: "Ireland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Italy",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Latvia",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Lithuania",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Luxembourg",
          excl_vat: "$21",
          incl_vat: qamount,
          vat_per: 16,
          vat_value: "$3.98",
        },
        {
          country_name: "Malta",
          excl_vat: "$20.49",
          incl_vat: qamount,
          vat_per: 18,
          vat_value: "$4.5",
        },
        {
          country_name: "Netherlands",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Poland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Portugal",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Romania",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$4.75",
        },
        {
          country_name: "Slovakia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Slovenia",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Spain",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Sweden",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "United Kingdom",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
      ];
    } else if (qid == "662f3b21d3279b1ec0877cd0") {
      const qinfo = await DiscQuestionnaries.find({ _id: qid });
      qamount = qinfo[0]?.amount;
      vat_array = [
        {
          country_name: "Austria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Belgium",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Bulgaria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Croatia",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Cyprus",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Czech Republic",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Denmark",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Estonia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Finland",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "France",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Germany",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Greece",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "Hungary",
          excl_vat: "$18.24",
          incl_vat: qamount,
          vat_per: 27,
          vat_value: "$6.75",
        },
        {
          country_name: "Ireland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Italy",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Latvia",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Lithuania",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Luxembourg",
          excl_vat: "$21",
          incl_vat: qamount,
          vat_per: 16,
          vat_value: "$3.98",
        },
        {
          country_name: "Malta",
          excl_vat: "$20.49",
          incl_vat: qamount,
          vat_per: 18,
          vat_value: "$4.5",
        },
        {
          country_name: "Netherlands",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Poland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Portugal",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Romania",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$4.75",
        },
        {
          country_name: "Slovakia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Slovenia",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Spain",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Sweden",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "United Kingdom",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
      ];
    } else if (qid == "66433c87986a6833bc93d9bc") {
      const qinfo = await CareerAptitudeQuestionnaire.find({ _id: qid });
      qamount = qinfo[0]?.amount;
      vat_array = [
        {
          country_name: "Austria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Belgium",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Bulgaria",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Croatia",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Cyprus",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Czech Republic",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Denmark",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "Estonia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Finland",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "France",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Germany",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 19,
          vat_value: "$4.75",
        },
        {
          country_name: "Greece",
          excl_vat: "$18.99",
          incl_vat: qamount,
          vat_per: 24,
          vat_value: "$6",
        },
        {
          country_name: "Hungary",
          excl_vat: "$18.24",
          incl_vat: qamount,
          vat_per: 27,
          vat_value: "$6.75",
        },
        {
          country_name: "Ireland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Italy",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Latvia",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Lithuania",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Luxembourg",
          excl_vat: "$21",
          incl_vat: qamount,
          vat_per: 16,
          vat_value: "$3.98",
        },
        {
          country_name: "Malta",
          excl_vat: "$20.49",
          incl_vat: qamount,
          vat_per: 18,
          vat_value: "$4.5",
        },
        {
          country_name: "Netherlands",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Poland",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Portugal",
          excl_vat: "$19.24",
          incl_vat: qamount,
          vat_per: 23,
          vat_value: "$5.75",
        },
        {
          country_name: "Romania",
          excl_vat: "$20.24",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$4.75",
        },
        {
          country_name: "Slovakia",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
        {
          country_name: "Slovenia",
          excl_vat: "$19.49",
          incl_vat: qamount,
          vat_per: 22,
          vat_value: "$5.5",
        },
        {
          country_name: "Spain",
          excl_vat: "$19.74",
          incl_vat: qamount,
          vat_per: 21,
          vat_value: "$5.75",
        },
        {
          country_name: "Sweden",
          excl_vat: "$18.74",
          incl_vat: qamount,
          vat_per: 25,
          vat_value: "$6.75",
        },
        {
          country_name: "United Kingdom",
          excl_vat: "$19.99",
          incl_vat: qamount,
          vat_per: 20,
          vat_value: "$4.99",
        },
      ];
    }
    let vat_data = null;

    for (let i = 0; i < vat_array.length; i++) {
      if (vat_array[i].country_name == country) {
        vat_array[i].excl_vat = `$${(
          vat_array[i].incl_vat /
          (1 + vat_array[i].vat_per / 100)
        ).toFixed(2)}`;
        vat_array[i].vat_value = `$${(
          vat_array[i].incl_vat -
          vat_array[i].incl_vat / (1 + vat_array[i].vat_per / 100)
        ).toFixed(2)}`;
        vat_array[i].vat_per = `${vat_array[i].vat_per}%`;
        vat_data = vat_array[i];
      }
    }
    console.log(vat_data, "before")
    if (!vat_data?.country_name) {
      vat_data = {
        country_name: country,
        excl_vat: qamount,
        incl_vat: qamount,
        vat_per: "0%",
        vat_value: "$0",
        qamount: qamount
      };
    }
    res.status(200).send(vat_data);

  } catch {
    res.status(400).send({
      message: err.message,
    });
  }
}

const addBlogCategory = async (req, res) => {
  try {
    const isExist = await BlogCategory.findOne({ type: req.body.type });
    if (isExist) {
      return res.status(400).send({
        message: 'Category Already exist!',
      });
    } else {
      const newCategory = new BlogCategory(req.body);
      await newCategory.save();
      return res.status(200).send({
        message: 'Category Added Successfully!',
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getBlogCategories = async (req, res) => {
  try {
    const blogs = await BlogCategory.find();
    return res.status(200).send(blogs);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
}

const addBlog = async (req, res) => {
  try {
    const { title, description, blog_body, blog_category_id, keyword, author, slugname, titleTag, altAttribute, metaDescription } = req.body;

    if (!title || !description || !blog_body || !blog_category_id || !keyword || !author || !slugname || !altAttribute || !metaDescription) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const slugData = await Blog.findOne({ slugname: slugname });
    if (slugname && slugData) {
      return res.status(400).json({ message: "Slugname already exist!" });
    }

    const parsedKeyword = JSON.parse(keyword);

    const blogCategory = await BlogCategory.findOne({ _id: blog_category_id });
    let blog_category = blogCategory && blogCategory?.type ? blogCategory?.type : '';
    let featuredImage = req?.files?.featuredImage || null;
    let img;
    if (featuredImage) {
      const filePath = path.join(__dirname, '../public/blog/', `${featuredImage.name}`);
      var allowedExtensions = /(\.jpg|\.jpeg|\.JPEG|\.JPG|\.png|\.gif)/;
      img = `${process.env.hostPath}/blog/` + `${featuredImage.name}`;
      if (!allowedExtensions.exec(filePath)) {
        res.status(500).send('Invalid file type');
        return
      } else {
        featuredImage.mv(filePath, err => {
          if (err) return res.send(err)
        });
      }
    }

    const newBlog = new Blog({
      title,
      titleTag,
      description,
      blog_body,
      blog_category_id,
      blog_category,
      featured_image: img,
      altAttribute,
      keyword: parsedKeyword,
      author,
      slugname,
      metaDescription
    });

    const addBlog = await newBlog.save();

    return res.status(201).json({
      message: "Blog created successfully!"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllBlogAdmin = async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};
    if (category && category !== "All") {
      filter = { blog_category: category };
    }
    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

const getAllBlog = async (req, res) => {
  const page = parseInt(req?.body?.page) || 1;
  const pageSize = req?.body?.pageSize || 2;
  const { category } = req.body;

  try {
    let filter = {};
    if (category && category !== "All") {
      filter = { blog_category: category };
    }

    const totalItems = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / pageSize);

    // if (page > totalPages) {
    //   return res.status(404).json({ message: 'Page not found' });
    // }

    const blogs = await Blog.find(filter)
      .sort({ _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.status(StatusCodes.OK).json({ blogs: blogs, totalPages, currentPage: page, });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

const getAllBlogForSiteMap = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.status(StatusCodes.OK).json({ blogs: blogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({
      slugname: slug,
      // slugname: { $regex: new RegExp(slug.replace(/-/g, ' '), 'i') },
    });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blogID = req.body.id;
    await Blog.deleteOne({ _id: blogID });
    return res.status(200).json({ message: "Blog deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

const getBlogByID = async (req, res) => {
  const BlogData = await Blog.findOne({ _id: req.params.id });

  if (BlogData == null) {
    throw new CustomError.NotFoundError(`No Blog with id : ${req.params.id}`);
  }
  return res.status(StatusCodes.OK).json({ BlogData });
}

const updateBlog = async (req, res) => {
  try {
    const { id, title, description, blog_body, blog_category_id, keyword, author, slugname, titleTag, altAttribute, metaDescription } = req.body;

    if (!title || !description || !blog_body || !blog_category_id || !keyword || !author || !slugname || !titleTag || !altAttribute || !metaDescription) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const slugData = await Blog.findOne({ slugname: slugname, _id: { $ne: id } });
    if (slugname && slugData) {
      return res.status(400).json({ message: "Slugname already exist!" });
    }

    const parsedKeyword = JSON.parse(keyword);

    const blogCategory = await BlogCategory.findOne({ _id: blog_category_id });
    let blog_category = blogCategory && blogCategory?.type ? blogCategory?.type : '';
    let featuredImage = req?.files?.featuredImage || null;
    let img;
    if (req?.files && featuredImage) {
      const filePath = path.join(__dirname, '../public/blog/', `${featuredImage.name}`);
      var allowedExtensions = /(\.jpg|\.jpeg|\.JPEG|\.JPG|\.png|\.gif)/;
      img = `${process.env.hostPath}/blog/` + `${featuredImage.name}`;
      if (!allowedExtensions.exec(filePath)) {
        res.status(500).send('Invalid file type');
        return
      } else {
        featuredImage.mv(filePath, err => {
          if (err) return res.send(err)
        });
      }
    }

    const blogData = await Blog.findOne({ _id: id });
    await Blog.findOneAndUpdate(
      { _id: id },
      {
        title,
        description,
        blog_body,
        blog_category_id,
        blog_category,
        featured_image: !req?.files && blogData && blogData?.featured_image ? blogData?.featured_image : img,
        keyword: parsedKeyword,
        author,
        slugname,
        titleTag,
        altAttribute,
        metaDescription
      });

    return res.status(201).json({ message: "Blog updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

const addBlogWriter = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const isAdded = await Admin.findOne({ email: email });
    if (isAdded) {
      return res.status(403).send({
        message: 'This Email already Added!',
      });
    } else {
      let generatePass = Math.random().toString(36).substr(2, 6);
      const newWriter = new Admin({
        name: name,
        email: email,
        role: "BlogWriter",
        password: bcrypt.hashSync(generatePass),
        secureCode: generatePass
      });
      const writer = await newWriter.save();
      const token = signInToken(writer);
      return res.status(200).json({ message: "Blog Writer Created Successfully!" });
      // res.send({
      //   token,
      //   _id: writer._id,
      //   name: writer.name,
      //   email: writer.email,
      //   role: writer.role,
      //   joiningData: Date.now(),
      // });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllBlogWriter = async (req, res) => {
  try {
    const data = await Admin.find({ role: { $in: "BlogWriter" } }, { password: 0 }).sort({ createdAt: -1 });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

const getBlogWriterByID = async (req, res) => {
  const Data = await Admin.findOne({ _id: req.params.id }, { password: 0 });

  if (Data == null) {
    throw new CustomError.NotFoundError(`No Blog Writer with id : ${req.params.id}`);
  }
  return res.status(StatusCodes.OK).json({ Data });
}

const updateBlogWriter = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const isAdded = await Admin.findOne({ email: email });
    if (isAdded) {
      await Admin.updateOne(
        { email: email },
        { name: name, email: email }
      );
      return res.status(200).send({ message: 'Blog Writer Updated Successfully!' });
    } else {
      return res.status(403).send({ message: 'Writer not found!' });
    }

  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

const deleteBlogWriter = async (req, res) => {
  try {
    const writerID = req.body.id;
    await Admin.deleteOne({ _id: writerID });
    return res.status(200).json({ message: "Blog writer deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  registerAdmin,
  loginAdmin,
  forgetPassword,
  resetPassword,
  changePassword,
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  uploadImage,
  addQuestionnaire,
  getQuestionnaire,
  deleteQuestionnaire,
  ckeditor_image,
  vendor_ckeditor,
  getAllQuestionnaire,
  getAllUsers,
  addvendorbanner,
  getvendorbanner,
  updatevendorbanner,
  removevedorbanner,
  getOneVendorbanner,
  getUserCertInfo,
  getEnneagramReport,
  deleteReports,
  invoiceInfo,
  allInvoiceInfo,
  getInvoiceInfo,
  updateInvoiceInfo,
  deleteInvoiceInfo,
  getInvoiceIso,
  updateInvoiceIso,
  updateSequentialNumber,
  getIso,
  updateIso,
  createInvoice,
  allInvoice,
  getSingleInvoice,
  editInvoice,
  userCertInfoByDate,
  removeUserAccount,
  getInvoiceTemplate,
  userReportByDate,
  enneagramReportByDate,
  enneagramInvoiceByDate,
  iqInvoiceByDate,
  testpdf,
  getEnnaQuestionnaire,
  addEnnaQuestionnaire,
  getAllEnnaQuestionnaire,
  addSixteenTypeQuestionnaire,
  getAllSixteentype,
  getSixteenQuestionnaire,
  getSixteenTypeReportData,
  sixteenTypeReportByDate,
  sixteenTypeInvoiceByDate,
  addBigFiveQuestionnaire,
  getAllBigFIveType,
  getBigFIveQuestionnaire,
  getBigFiveReportData,
  bigfiveReportByDate,
  bigfiveInvoiceByDate,
  addDiscQuestionnaire,
  getAlldisc,
  getDiscQuestionnaire,
  getDiscReportData,
  discReportByDate,
  discInvoiceByDate,
  getTotalOrder,
  getTotalOrderByQuiz,
  getAllQuestAmt,
  getTest,
  getOrderBySorting,
  addCareerAptitudeQuestionnaire,
  getAllCareerAptitude,
  getCareerAptitudeQuestionnaire,
  getCareerReportData,
  careerReportByDate,
  careerInvoiceByDate,
  allInvoiceByDate,
  getUserInvoiceById,
  updateUserInvoice,
  generateInvoiceNum,
  getInvoiceDetailsByQId,
  addBlogCategory,
  getBlogCategories,
  addBlog,
  getAllBlogAdmin,
  getAllBlog,
  getAllBlogForSiteMap,
  getBlogBySlug,
  deleteBlog,
  getBlogByID,
  updateBlog,
  addBlogWriter,
  getAllBlogWriter,
  getBlogWriterByID,
  updateBlogWriter,
  deleteBlogWriter

};
