require("dotenv").config();
const allscoredata = require("../utils/data.json");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const UserCertInfo = require("../models/UserCertInfo");
const {
  signInToken,
  tokenForVerify,
  sendEmail,
  sendEmailwithCertificate,
  sendEmailToAdmin,
  sendEmailContactForm,
} = require("../config/auth");
const Questionnaire = require("../models/Questionnaire");
const PersonalInfo = require("../models/PersonalInfo");
const QuestionnaireAnswer = require("../models/QuestionnaireAnswer");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const ejs = require("ejs");
// const htmlPdf = require('html-pdf');
const fs = require("fs");
// var html_to_pdf = require('html-pdf-node');
const path = require("path");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");
const randomstring = require("randomstring");
const TestCount = require("../models/TestCount");
const Payments = require("../models/Payment");
const InvoiceInfo = require("../models/InvoiceInfo");
const Invoice = require("../models/Invoice");
const ReportData = require("../models/ReportData");
const moment = require("moment");
const EnneagrapQuestionnaire = require("../models/EnnaQuestionnaire");
const Ennagramanswers = require("../models/Ennagramanswer");
const Booking = require("../models/Booking");
const EnneagramReportData = require("../models/EnneagramReportData");
const SixteenTypeQuestionnaire = require("../models/SixteenType");
const Sixteentypeanswer = require("../models/Sixteentypanswer");
const SixteenTypeReportData = require("../models/SixteenTypeReportData");
const BigFiveQuestionnaries = require("../models/BigFiveQuestionnaries");
const Bigfiveans = require("../models/Bigfiveans");
const BigFiveReportData = require("../models/BigFiveReportData");
const DiscQuestionnaries = require("../models/DiscQuestionnaries");
const Discanswers = require("../models/Discanswer");
const DiscReportData = require('../models/DiscReportData');
const CareerAptitudeQuestionnaire = require('../models/CareerAptitudeQuestionnaries');
const CareerAptitudeAnswer = require('../models/CareerAptitudeAnswer');
const CareerAptitudeReportData = require("../models/CareerAptitudeReportData");
const WindowStep = require("../models/WindowStep");

const mongoose = require('mongoose');
const pdf = require("html-pdf");

const { getAllTestStatuses, createUserInvoice } = require("./paymentController")
const verifyEmailAddress = async (req, res) => {
  const isAdded = await User.findOne({ email: req.body.email });
  if (isAdded) {
    return res.status(403).send({
      message: "This Email already Added!",
    });
  } else {
    const token = tokenForVerify(req.body);

    const file = "../view/users_verifyEmail.ejs";
    var subject = "Email Activation";
    var subject = "Verify Your Email";
    const message = {
      email: req.body.email,
      token: token,
      domain_url: process.env.redirectUrl,
    };

    sendEmail(req.body.email, token, subject, file, message);
    res.status(200).send({ msg: "Please check your email to verify!" });
  }
};

const registerUser = async (req, res) => {
  const token = req.params.token;
  const { name, surname, email, password } = jwt.decode(token);
  const isAdded = await User.findOne({ email: email });

  if (isAdded) {
    const token = signInToken(isAdded);
    return res.send({
      token,
      name: isAdded.name,
      email: isAdded.email,
      message: "Email Already Verified!",
    });
  }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Token Expired, Please try again!",
        });
      } else {
        const newUser = new User({
          name,
          surname,
          email,
          password: bcrypt.hashSync(password),
        });
        newUser.save();
        const token = signInToken(newUser);
        res.send({
          token,
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          message: "Email Verified, Please Login Now!",
        });
      }
    });
  }
};

function randomString(length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

const emailVerify = async (req, res) => {
  var tokenn = randomString(
    150,
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  );
  const { name, surname, email, password } = req.body;
  const isAdded = await User.findOne({ email: email });
  if (isAdded) {
    if (isAdded.email_is_verified === "active") {
      return res.status(403).send({
        message: "Email address already exists and verified, Please login.",
      });
    } else if (isAdded.email_is_verified) {
      return res.status(403).send({
        message:
          "Verification email already send to your email please confirm!",
      });
    }
  } else {
    const newUser = new User({
      name,
      surname,
      email,
      password: bcrypt.hashSync(password),
      email_is_verified: tokenn,
    });
    newUser.save();
    const token = tokenn;
    const file = "../view/users_verifyEmail.ejs";
    var subject = "Verify Your Email";
    const message = {
      email: req.body.email,
      token: token,
      domain_url: process.env.redirectUrl,
    };
    sendEmail(req.body.email, token, subject, file, message);
    res
      .status(200)
      .send({ message: "Please check your email to verify your account!" });
  }
};

const resendVerificationEmail = async (req, res) => {
  var tokenn = randomString(
    150,
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  );
  const IsUser = await User.findOne({ email: req.body.email });
  if (IsUser) {
    const updated_user = await User.updateOne(
      { _id: IsUser._id },
      { email_is_verified: tokenn }
    );
    const token = tokenn;
    const file = "../view/users_verifyEmail.ejs";
    var subject = "Verify Your Email";
    const message = {
      email: req.body.email,
      token: token,
      domain_url: process.env.redirectUrl,
    };
    sendEmail(req.body.email, token, subject, file, message);
    res
      .status(200)
      .send({ message: "Please check your email to verify your account!" });
  } else {
    return res.status(404).send({
      message: "Somthing went wrong",
    });
  }
};

const userRegister = async (req, res) => {
  const token = req.params.token;
  const IsToken = await User.findOne({ email_is_verified: token });
  if (IsToken) {
    const updated_user = await User.updateOne(
      { _id: IsToken._id },
      { email_is_verified: "active" }
    );
    return res.send({
      message: "Email Verified, Please Login Now!",
    });
  } else {
    return res.status(404).send({
      message: "Please verify your email",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.registerEmail });

    if (
      user &&
      user.password &&
      bcrypt.compareSync(req.body.password, user.password)
    ) {
      const token = signInToken(user);
      res.send({
        token,
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        phone: user.phone,
        image: user.image,
      });
    } else {
      res.status(401).send({
        message: "Invalid user or password!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const forgetPassword = async (req, res) => {
  const isAdded = await User.findOne({ email: req.body.verifyEmail });
  if (!isAdded) {
    return res.status(404).send({
      message: "User Not found with this email!",
    });
  } else {
    const token = tokenForVerify(isAdded);

    const file = "../view/users_forget_pass.ejs";
    const subject = "Forget password";
    const message = { email: isAdded.email, token: token };
    sendEmail(isAdded.email, token, subject, file, message);
    res.status(200).send({ msg: "Please check your email to reset password!" });
  }
};

const resetPassword = async (req, res) => {
  const token = req.body.token;
  const { email } = jwt.decode(token);
  const user = await User.findOne({ email: email });

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, (err, decoded) => {
      if (err) {
        return res.status(500).send({
          message: "Token expired, please try again!",
        });
      } else {
        user.password = bcrypt.hashSync(req.body.newPassword);
        user.save();
        res.send({
          message: "Your password change successful, you can login now!",
        });
      }
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.user._id });
    if (!user.password) {
      return res.send({
        message:
          "For change password,You need to sign in with email & password!",
      });
    } else if (
      user &&
      bcrypt.compareSync(req.body.currentPassword, user.password)
    ) {
      user.password = bcrypt.hashSync(req.body.newPassword);
      await user.save();
      res.send({
        message: "Your password change successfully!",
      });
    } else {
      res.status(401).send({
        message: "previous password does`t match!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const signUpWithProvider = async (req, res) => {
  try {
    const isAdded = await User.findOne({ email: req.body.email });
    if (isAdded) {
      const token = signInToken(isAdded);
      res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        address: isAdded.address,
        phone: isAdded.phone,
        image: isAdded.image,
      });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        image: req.body.image,
      });

      const user = await newUser.save();
      const token = signInToken(user);
      res.send({
        token,
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ _id: -1 });
    res.send(users);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.send(user);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name;
      user.email = req.body.email;
      user.address = req.body.address;
      user.phone = req.body.phone;
      user.image = req.body.image;

      const updatedUser = await user.save();
      const token = signInToken(updatedUser);
      res.send({
        token,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address,
        phone: updatedUser.phone,
        image: updatedUser.image,
      });
    }
  } catch (err) {
    res.status(404).send({
      message: "Your email is not valid!",
    });
  }
};

const updateTempUser = async (req, res) => {
  try {
    const { email, age } = req.body;

    // Find temp user by ID
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // 🧩 If email is NOT present → only update age
    if (!email) {
      user.age = age || user.age;
      const updatedUser = await user.save();

      return res.send({
        message: "User age updated successfully.",
        _id: updatedUser._id,
        age: updatedUser.age,
      });
    }

    // 🧩 If email IS present → run normal email flow
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(200).send({
        isUserExits: true,
        message: "User already exists. Please login or try another email.",
      });
    }

    // ✅ Update user email
    user.email = email || user.email;

    const updatedUser = await user.save();

    // Generate token
    const token = signInToken(updatedUser);

    res.send({
      token,
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      address: updatedUser.address,
      phone: updatedUser.phone,
      image: updatedUser.image,
    });
  } catch (err) {
    console.error("Error updating temp user:", err);
    res.status(500).send({
      message: "Something went wrong while updating user!",
    });
  }
};

const userUpdate = async (req, res) => {
  try {
    const name = req.body.name;
    const surname = req.body.surname;
    const age = req.body.age;
    const gender = req.body.gender;
    const country = req.body.country;
    const qualification = req.body.qualification;
    let img = null;
    let users = "";
    const user = await User.findById(req.params.id);
    if (user.image == "") {
      img = "";
    } else {
      img = user.image;
    }
    if (!req.files) {
      const images = await User.findOneAndUpdate(
        { _id: user._id },
        {
          name: name,
          surname: surname,
          age: age,
          gender: gender,
          country: country,
          qualification: qualification,
          image: img,
        }
      );
      const users = await User.findOne({ _id: user._id });
      const updateddata = users;
      res.status(200).send(updateddata);
    } else if (req.files.image) {
      const file = req.files.image;

      const filePath = path.join(
        __dirname,
        "../public/userdata/",
        `${file.name}`
      );
      var allowedExtensions = /(\.jpg|\.jpeg|\.JPEG|\.JPG|\.png|\.PNG|\.gif)/;

      const imageUrl = `${process.env.hostPath}/userdata/` + `${file.name}`;

      if (!allowedExtensions.exec(filePath)) {
        res.status(500).send("Invalid file type");
      } else {
        file.mv(filePath, (err) => {
          if (err) return res.send(err);
        });
      }
      const data = await User.findOneAndUpdate(
        { _id: user._id },
        {
          name: name,
          surname: surname,
          age: age,
          gender: gender,
          country: country,
          qualification: qualification,
          image: imageUrl,
        }
      );
      users = await User.findOne({ _id: user._id });
    }
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteUser = (req, res) => {
  User.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: "User Deleted Successfully!",
      });
    }
  });
};

const getQuestionnaire = async (req, res) => {
  const data = await Questionnaire.findOne({ type: "Personal Info" });
  const Form = await Questionnaire.findOne({ _id: req.params.id });

  if (!Form) {
    throw new CustomError.NotFoundError(
      `No Question with id : ${req.params.id}`
    );
  }

  res.status(StatusCodes.OK).json({ Form: Form, Personal_quetion: data });
};

const getAllQuestionnaire = async (req, res) => {
  const Form = await Questionnaire.find({
    type: { $ne: "Personal Info" },
  }, { section: 0 }).sort({ _id: 1 });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

const answerQuestionnaire = async (req, res) => {
  const { answers } = req.body;
  if (!answers) {
    res.status(400).send({ msg: "Please provide all values" });
  }
  for (var i = 0; i < answers.length; i++) {

    let audioimagePath = "";
    if (answers[i].answer_type == "Upload File") {
      if (answers[i].answer.length != 0) {
        const wavUrl = answers[i].answer[0];

        const extension = wavUrl.split(";")[0].split("/")[1];

        //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];

        if (extension == "wav") {
          const buffer = Buffer.from(
            wavUrl.split("base64,")[1], // only use encoded data after "base64,"
            "base64"
          );
          const newname = new Date().getTime() + "_audio.wav";
          const imagePath = path.join(
            __dirname,
            "../public/uploads/" + `${newname}`
          );
          // await productImage.mv(imagePath);
          //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
          const imageurl = process.env.host + `/public/uploads/${newname}`;

          const filel = fs.writeFileSync(imagePath, buffer);
          answers[i].answer[0] = imageurl;
        } else {
          answers[i].answer[0] = answers[i].answer[0];
        }
      }
    }
    if (answers[i].answer_type == "Video") {
      if (answers[i].answer.length != 0) {
        const wavUrl = answers[i].answer[0];

        const extension = wavUrl.split(";")[0].split("/")[1];
        //let mimeType = answers[i].answer[0].match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];

        if (extension == "webm") {
          const buffer = Buffer.from(
            wavUrl.split("base64,")[1], // only use encoded data after "base64,"
            "base64"
          );
          const newname = new Date().getTime() + "_video.webm";
          const imagePath = path.join(
            __dirname,
            "../public/uploads/" + `${newname}`
          );
          // await productImage.mv(imagePath);
          //const imageurl= req.protocol + '://'+req.headers.host+`/uploads/${newname}`;
          const imageurl = process.env.host + `/public/uploads/${newname}`;
          const filel = fs.writeFileSync(imagePath, buffer);
          answers[i].answer[0] = imageurl;
        } else {
          answers[i].answer[0] = answers[i].answer[0];
        }
      }
    }
    if (answers[i].answer_type == "Reasoning") {
      answers[i].answer[0] = answers[i].answer[0].replaceAll("&lt;", "<");
    }

    //!form_id||!question_id||!user_id||!user_member_id||!answer_type||!answer

    // Correct ans handling.................................................................
    const questionsdata = await Questionnaire.findOne({ _id: answers[i].questionnaire_id });

    isCorrectAns = false;
    const getQuestionById = (questionsdata, quesid) => {
      for (const section of questionsdata?.section) {
        for (const question of section?.questions) {
          if (question.quesid === quesid) {

            for (const optionss of question?.options) {
              if (optionss?.rightAns && optionss?.option) {
                if (optionss?.option === answers[i].answer[0]) {
                  return isCorrectAns = true;
                } else {
                  return isCorrectAns = false;
                }
              }
            }
          }
        }
      }
    };

    // Call the function for correct ans handling
    isCorrectAns = getQuestionById(questionsdata, answers[i].question_id);
    // Correct ans handling.................................................................

    req.body.unique_id = answers[i].unique_id;
    req.body.section_id = answers[i].section_id;
    req.body.question_id = answers[i].question_id;
    req.body.questionnaire_id = answers[i].questionnaire_id;
    req.body.user_id = answers[i].user_id;
    req.body.booking_id = answers[i].booking_id;
    req.body.user_member_id = answers[i].user_member_id;
    req.body.answer_type = answers[i].answer_type;
    req.body.answer = answers[i].answer;
    // req.body.is_correct = answers[i].is_correct;
    req.body.is_correct = isCorrectAns;
    req.body.audio = audioimagePath;
    req.body.category = answers[i].category;
    // const exist = await QuestionnaireAnswer.findOne({ section_id: answers[i].section_id, question_id: answers[i].question_id, user_id: answers[i].user_id, booking_id: answers[i].booking_id });
    // if (exist) {
    //   const ans = await QuestionnaireAnswer.findOneAndUpdate({ section_id: answers[i].section_id, question_id: answers[i].question_id, user_id: answers[i].user_id, booking_id: answers[i].booking_id }, { answer: req.body.answer });

    // }
    const exist = await QuestionnaireAnswer.findOne({
      unique_id: answers[i].unique_id,
      question_id: answers[i].question_id,
    });
    if (exist) {
      const ans = await QuestionnaireAnswer.findOneAndUpdate(
        {
          unique_id: answers[i].unique_id,
          question_id: answers[i].question_id,
        },
        { answer: req.body.answer, is_correct: req.body.is_correct }
      );
    } else {
      const ans = await QuestionnaireAnswer.create(req.body);
    }
  }

  res
    .status(StatusCodes.CREATED)
    .json({ msg: "Answer sucessfully submitted!" });
};

const getAnswers = async (req, res) => {
  const unique_id = req.body.unique_id;
  const questionnaire_id = req.body.questionnaire_id;
  // const {user_id,user_member_id,type}=req.body;
  //req.user._id = req.user._id.toString().replace(/ObjectId\("(.*)"\)/, "$1");
  // const Answers = await QuestionnaireAnswer.findOne({ user_id: req.params.id, answer_type: req.params.answer_type});
  const Answers = await QuestionnaireAnswer.findOne({
    unique_id: unique_id,
    questionnaire_id: questionnaire_id,
  });

  if (Answers) {
    const questionsdata = await Questionnaire.find();
    for (var k = 0; k < questionsdata.length; k++) {
      const secc = questionsdata[k].section;
      for (var i = 0; i < secc.length; i++) {
        const questions = secc[i].questions;
        for (var j = 0; j < questions.length; j++) {
          const q_type = questions[j].q_type;
          for (var x = 0; x < Answers.length; x++) {
            if (q_type == Answers[x].answer_type) {
              q_type = Answers[x].answer_type;
            }
          }
        }
      }
    }
    res.status(StatusCodes.OK).json({ questionsdata });
  } else {
    res.status(500).send({
      message: "not found",
    });
  }
};

const getAllAnswers = async (req, res) => {
  try {
    const user_id = req.body.user_id;
    const unique_id = req.body.unique_id;
    const questionnaireId = req?.body?.questionnaireId;
    let Answers = null;
    const questionnaireType = req?.body?.questionnaireType;
    const testcount = await TestCount.findOne({ user_id: user_id, questionnaireType });
    const stepData = await WindowStep.findOne({
      user_id,
      isTestEnd: false,
      unique_id: testcount.unique_id,
      questionnaireId: questionnaireId,
      window_step: { $gt: 8 }
    }).sort({ createdAt: -1 });

    if (!stepData && questionnaireId) {
      console.log("window updated")
      await WindowStep.findOneAndUpdate(
        {
          user_id,
          isTestEnd: false,
          unique_id: testcount.unique_id,
          window_step: { $lte: 8 }   // not greater than 7
        },
        {
          $set: { unique_id: unique_id }
        },
        {
          sort: { createdAt: -1 },
          new: true
        }
      );
    }

    if (testcount) {
      Answers = await QuestionnaireAnswer.updateMany({ unique_id: testcount.unique_id }, { $set: { unique_id: unique_id } });
      Answers = await QuestionnaireAnswer.find({
        unique_id: unique_id
      });
      // Answers = await QuestionnaireAnswer.find({
      //   unique_id: testcount.unique_id,
      // });
      // Answers.forEach(async (element, i) => {
      //   // if(element.is_correct == true) {
      //   element.unique_id = unique_id;
      //   let checkAns = await QuestionnaireAnswer.findOne({
      //     unique_id: unique_id,
      //   });
      //   if (checkAns == null) {
      //     let addanswer = await QuestionnaireAnswer.create(element);
      //   }
      //   // }
      // });
    }
    const testcounts = await TestCount.findOneAndUpdate(
      { user_id: user_id, questionnaireType },
      { unique_id: unique_id }
    );
    // Answers = await QuestionnaireAnswer.find({ unique_id: testcount.unique_id });
    res.status(StatusCodes.OK).json({ Answers });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const personalInfo = async (req, res) => {
  try {
    const newPersonalInfo = new PersonalInfo(req.body);
    await newPersonalInfo.save();
    res.status(200).send({
      message: "PersonalInfo Added Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const GeneratePdf = async (typeOfFile, CssFilePath, filePath, answer, res) => {
  try {
    const template = fs.readFileSync(typeOfFile, "utf-8");
    const css = fs.readFileSync(CssFilePath, "utf8");
    const renderedTemplate = ejs.render(template, { answer });
    const compiledTemplate = handlebars.compile(renderedTemplate);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    // const browser = await puppeteer.launch();

    const format = {
      width: "8.2in", // Width in inches
      height: "6.3in", // Height in inches
    };

    const page = await browser.newPage();
    const htmlContent = compiledTemplate({ answer });
    await page.setContent(htmlContent);
    await page.addStyleTag({ content: css });
    await page.pdf({ path: filePath, ...format, printBackground: true });
    await browser.close();

    // return 'PDF generated successfully!';
  } catch (error) {
    res.send({ error: error.message });
    console.error(error);
  }
};

const GenerateCulturePdf = async (
  getFile,
  CssFile,
  pdftextpath,
  culturetestinfo,
  res
) => {
  try {
    const template = fs.readFileSync(getFile, "utf-8");
    const css = fs.readFileSync(CssFile, "utf8");
    const renderedTemplate = ejs.render(template, { culturetestinfo });
    const compiledTemplate = handlebars.compile(renderedTemplate);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // const browser = await puppeteer.launch();

    const page = await browser.newPage();
    const htmlContent = compiledTemplate({ culturetestinfo });
    await page.setContent(htmlContent);
    await page.addStyleTag({ content: css });
    await page.pdf({ path: pdftextpath, format: "A4", printBackground: true });
    await browser.close();

    // return 'PDF generated successfully!';
  } catch (error) {
    res.send({ error: error.message });
    console.error(error);
  }
};

const GenerateClassicalPdf = async (
  getFile,
  CssFile,
  pdftextpath,
  classictestinfo,
  res
) => {
  try {
    const template = fs.readFileSync(getFile, "utf-8");
    const css = fs.readFileSync(CssFile, "utf8");
    const renderedTemplate = ejs.render(template, { classictestinfo });
    const compiledTemplate = handlebars.compile(renderedTemplate);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // const browser = await puppeteer.launch();

    const page = await browser.newPage();
    const htmlContent = compiledTemplate({ classictestinfo });
    await page.setContent(htmlContent);
    await page.addStyleTag({ content: css });
    await page.pdf({ path: pdftextpath, format: "A4", printBackground: true });
    await browser.close();

    // return 'PDF generated successfully!';
  } catch (error) {
    res.send({ error: error.message });
    console.error(error);
  }
};

const population_count = async (questionnaire_id) => {
  const info = await UserCertInfo.find({ questionnaire_id: questionnaire_id });

  var a = 0;
  var b = 0;
  var c = 0;
  var d = 0;
  var e = 0;
  var f = 0;
  var g = 0;

  let total = info.length;
  for (var i = 0; i < info.length; i++) {
    let inf = info[i].score;
    if (inf < 70) {
      a++;
    } else if (inf >= 70 && inf <= 79) {
      b++;
    } else if (inf >= 80 && inf <= 89) {
      c++;
    } else if (inf >= 90 && inf <= 110) {
      d++;
    } else if (inf >= 111 && inf <= 120) {
      e++;
    } else if (inf >= 121 && inf <= 130) {
      f++;
    } else if (inf > 130) {
      g++;
    }
  }

  a = (a * 100) / total;
  b = (b * 100) / total;
  c = (c * 100) / total;
  d = (d * 100) / total;
  e = (e * 100) / total;
  f = (f * 100) / total;
  g = (g * 100) / total;

  let population_percent = [
    {
      iq_scale: "Above 130",
      interpretation: "very gifted",
      population: g,
    },
    {
      iq_scale: "121-130",
      interpretation: "Gifted",
      population: f,
    },
    {
      iq_scale: "111-120",
      interpretation: "Above average intelligence",
      population: e,
    },
    {
      iq_scale: "90-110",
      interpretation: ":Average intelligence",
      population: d,
    },
    {
      iq_scale: "80-89",
      interpretation: "Below average intelligence",
      population: c,
    },
    {
      iq_scale: "70-79",
      interpretation: "Cognitively impaired",
      population: b,
    },
    {
      iq_scale: "Below 70",
      interpretation: "Cognitively impaired",
      population: a,
    },
  ];

  return population_percent;
};

const GenerateInvoice = async (
  typeOfFile,
  CssFilePath,
  filePath,
  newInfo,
  adminInfo,
  res
) => {
  try {
    const template = fs.readFileSync(typeOfFile, "utf-8");
    const css = fs.readFileSync(CssFilePath, "utf8");
    const renderedTemplate = ejs.render(template, { newInfo, adminInfo });
    const compiledTemplate = handlebars.compile(renderedTemplate);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // const browser = await puppeteer.launch();

    const format = {
      width: "8.2in", // Width in inches
      height: "11.4in", // Height in inches
    };

    const page = await browser.newPage();
    const htmlContent = compiledTemplate({ newInfo, adminInfo });
    await page.setContent(htmlContent);
    await page.addStyleTag({ content: css });
    await page.pdf({ path: filePath, ...format, printBackground: true });
    await browser.close();

    return "PDF generated successfully!";
  } catch (error) {
    res.send({ error: error.message });
    return error;
    console.error(error);
  }
};

const createCultureReport = async (
  user_id,
  questionnaire_id,
  culturetestinfo,
  unique_id,
  testpdfurl
) => {
  const createReport = await ReportData.create({
    user_id: user_id,
    questionnaire_id: questionnaire_id,
    unique_id: unique_id,
    noofcurrectans: culturetestinfo.noofcurrectans,
    Qcountt: culturetestinfo.Qcountt,
    percentile: culturetestinfo.percentile,
    score: culturetestinfo.score,
    lessScore: culturetestinfo.lessScore,
    greaterScore: culturetestinfo.greaterScore,
    scoreurl1: culturetestinfo.scoreurl1,
    scoreurl2: culturetestinfo.scoreurl2,
    reportUrl: testpdfurl,
  });
};

const createclassicalReport = async (
  user_id,
  questionnaire_id,
  classictestinfo,
  unique_id,
  testpdfurl
) => {
  const createReport = await ReportData.create({
    user_id: user_id,
    questionnaire_id: questionnaire_id,
    unique_id: unique_id,
    noofcurrectans: classictestinfo.noofcurrectans,
    Qcountt: classictestinfo.Qcountt,
    percentile: classictestinfo.percentile,
    score: classictestinfo.score,
    lessScore: classictestinfo.lessScore,
    greaterScore: classictestinfo.greaterScore,
    scoreurl1: classictestinfo.scoreurl1,
    scoreurl2: classictestinfo.scoreurl2,
    category: classictestinfo.category,
    reportUrl: testpdfurl,
  });
};

const certificate = async (req, res) => {
  try {
    const user_name = req.body.user_name;
    const last_name = req.body.last_name;
    let iqscore = null;
    let score = null;
    let finalScore = "";
    let paidTestLink = "";
    let percentile = null;
    let finalpercentile = "";
    let intelligenceTest = "";
    let scoreurl1 = "";
    let scoreurl2 = "";
    let percentage = null;
    let usercertinfos = "";
    let testpdfurl = "";
    let sendmailID = "";
    let Qcount = "";
    let generatePass = "";
    let attachment = "";
    const gender = req.body.gender;
    const age = req.body.age;
    const phone = req.body.phone;
    const country = req.body.country;
    const address_one = req.body.address_one;
    const address_two = req.body.address_two;
    const postal_code = req.body.postal_code;
    const city = req.body.city;
    const state = req.body.state;
    const country_code = req.body.country_code;
    const qualification = req.body.qualification;
    let user_id = req.body.user_id;
    let createReport = "";
    let category = {
      verbal: null,
      numeric: null,
      spatial: null,
      logical: null,
    };
    // const user_id = req.body.user_id;
    const email = req.body.email;
    const unique_id = req.body.unique_id;
    const questionnaire_id = req.body.questionnaire_id;
    const questionnaireType = req?.body?.questionnaireType;

    const amt = await Questionnaire.find({ _id: questionnaire_id });
    const qamount = amt[0]?.amount;
    // new code

    let vat_array = [
      {
        country_name: "Austria",
        excl_vat: "$8.25",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$1.65",
      },
      {
        country_name: "Belgium",
        excl_vat: "$8.18",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$1.72",
      },
      {
        country_name: "Bulgaria",
        excl_vat: "$8.25",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$1.65",
      },
      {
        country_name: "Croatia",
        excl_vat: "$7.92",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$1.98",
      },
      {
        country_name: "Cyprus",
        excl_vat: "$8.32",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$1.58",
      },
      {
        country_name: "Czech Republic",
        excl_vat: "$8.18",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$1.72",
      },
      {
        country_name: "Denmark",
        excl_vat: "$7.92",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$1.98",
      },
      {
        country_name: "Estonia",
        excl_vat: "$8.25",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$1.65",
      },
      {
        country_name: "Finland",
        excl_vat: "$7.98",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$1.92",
      },
      {
        country_name: "France",
        excl_vat: "$8.25",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$1.65",
      },
      {
        country_name: "Germany",
        excl_vat: "$8.32",
        incl_vat: qamount,
        vat_per: 19,
        vat_value: "$1.58",
      },
      {
        country_name: "Greece",
        excl_vat: "$7.98",
        incl_vat: qamount,
        vat_per: 24,
        vat_value: "$1.92",
      },
      {
        country_name: "Hungary",
        excl_vat: "$7.80",
        incl_vat: qamount,
        vat_per: 27,
        vat_value: "$2.10",
      },
      {
        country_name: "Ireland",
        excl_vat: "$8.05",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$1.85",
      },
      {
        country_name: "Italy",
        excl_vat: "$8.11",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$1.79",
      },
      {
        country_name: "Latvia",
        excl_vat: "$8.18",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$1.72",
      },
      {
        country_name: "Lithuania",
        excl_vat: "$8.18",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$1.72",
      },
      {
        country_name: "Luxembourg",
        excl_vat: "$8.53",
        incl_vat: qamount,
        vat_per: 16,
        vat_value: "$1.37",
      },
      {
        country_name: "Malta",
        excl_vat: "$8.39",
        incl_vat: qamount,
        vat_per: 18,
        vat_value: "$1.51",
      },
      {
        country_name: "Netherlands",
        excl_vat: "$8.18",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$1.72",
      },
      {
        country_name: "Poland",
        excl_vat: "$8.05",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$1.85",
      },
      {
        country_name: "Portugal",
        excl_vat: "$8.05",
        incl_vat: qamount,
        vat_per: 23,
        vat_value: "$1.85",
      },
      {
        country_name: "Romania",
        excl_vat: "$8.32",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$1.58",
      },
      {
        country_name: "Slovakia",
        excl_vat: "$8.25",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$1.65",
      },
      {
        country_name: "Slovenia",
        excl_vat: "$8.11",
        incl_vat: qamount,
        vat_per: 22,
        vat_value: "$1.79",
      },
      {
        country_name: "Spain",
        excl_vat: "$8.18",
        incl_vat: qamount,
        vat_per: 21,
        vat_value: "$1.72",
      },
      {
        country_name: "Sweden",
        excl_vat: "$7.92",
        incl_vat: qamount,
        vat_per: 25,
        vat_value: "$1.98",
      },
      {
        country_name: "United Kingdom",
        excl_vat: "$8.25",
        incl_vat: qamount,
        vat_per: 20,
        vat_value: "$1.65",
      },
    ];

    let vat_data = null;

    for (let i = 0; i < vat_array.length; i++) {
      if (vat_array[i].country_name == country) {
        vat_array[i].excl_vat = `$${(
          vat_array[i].incl_vat /
          (1 + vat_array[i].vat_per / 100)
        ).toFixed(2)}`;
        // vat_array[i].excl_vat = `$${(vat_array[i].incl_vat - (vat_array[i].incl_vat * vat_array[i].vat_per / 100)).toFixed(2)}`;
        vat_array[i].vat_value = `$${(
          vat_array[i].incl_vat -
          vat_array[i].incl_vat / (1 + vat_array[i].vat_per / 100)
        ).toFixed(2)}`;
        vat_array[i].vat_per = `${vat_array[i].vat_per}%`;
        vat_data = vat_array[i];
      }
    }

    if (!vat_data?.country_name) {
      vat_data = {
        country_name: country,
        // excl_vat: "$0",
        excl_vat: qamount,
        incl_vat: qamount,
        vat_per: "0%",
        vat_value: "$0",
      };
    }

    // const amt = await Questionnaire.find({ _id: questionnaire_id });

    const checklogin = await User.findOne({ email: email });
    if (!checklogin) {
      generatePass = Math.random().toString().substr(2, 6);
    }
    const answer = await QuestionnaireAnswer.countDocuments({
      unique_id: unique_id,
      questionnaire_id: questionnaire_id,
      is_correct: true,
    });

    const questionnaire = await Questionnaire.findOne({
      _id: questionnaire_id,
    });
    const population_percent = await population_count(questionnaire_id);

    if (
      questionnaire.type == "Free Culture Fair IQ test" ||
      questionnaire.type == "Free Classical IQ test"
    ) {
      const isAdded = await User.findOne({ email: email });
      if (!isAdded) {
        const newUser = new User({
          gender: gender,
          age: age,
          country: country,
          country_code: country_code,
          qualification: qualification,
          name: user_name,
          email: email,
          password: bcrypt.hashSync(generatePass),
        });
        newUser.save();
      }
      if (isAdded) {
        const body = {
          user_name: user_name,
          last_name: last_name,
          user_id: isAdded._id,
          email: email,
          unique_id: unique_id,
          questionnaire_id: questionnaire_id,
          score: answer,
          gender: gender,
          age: age,
          phone: phone,
          address_one: address_one,
          address_two: address_two,
          postal_code: postal_code,
          city: city,
          state: state,
          country_code: country_code,
          country: country,
          qualification: qualification,
          amount: amt[0].amount,
          qtype: amt[0].type,
        };
        const usercertinfos = await UserCertInfo.create(body);
      } else {
        const body = {
          user_name: user_name,
          last_name: last_name,
          email: email,
          unique_id: unique_id,
          questionnaire_id: questionnaire_id,
          score: answer,
          gender: gender,
          age: age,
          phone: phone,
          address_one: address_one,
          address_two: address_two,
          postal_code: postal_code,
          city: city,
          state: state,
          country_code: country_code,
          country: country,
          qualification: qualification,
          amount: amt[0].amount,
          qtype: amt[0].type,
        };
        const usercertinfos = await UserCertInfo.create(body);
      }

      const usinfo = await UserCertInfo.findOne({ unique_id: unique_id });
      const us = await User.findOne({ email: email });
      if (us) {
        await User.updateOne(
          { email: email },
          {
            name: usinfo.user_name,
            surname: last_name,
            gender: gender,
            age: age,
            country: country,
            country_code: country_code,
            qualification: qualification,
          }
        );
        await UserCertInfo.updateOne(
          { unique_id: unique_id },
          { user_id: us._id }
        );
      }
    } else if (
      questionnaire.type == "Culture Fair IQ test" ||
      questionnaire.type == "Classical IQ test"
    ) {
      // const random = await QuestionnaireAnswer.find({ unique_id, questionnaire_id })

      if (questionnaire.type == "Classical IQ test") {
        category.verbal = await QuestionnaireAnswer.countDocuments({
          unique_id: unique_id,
          category: "Verbal",
          is_correct: true,
        });
        category.numeric = await QuestionnaireAnswer.countDocuments({
          unique_id: unique_id,
          category: "Numeric",
          is_correct: true,
        });
        category.spatial = await QuestionnaireAnswer.countDocuments({
          unique_id: unique_id,
          category: "Spatial",
          is_correct: true,
        });
        category.logical = await QuestionnaireAnswer.countDocuments({
          unique_id: unique_id,
          category: "Logical",
          is_correct: true,
        });
      }

      const info = await User.findOne({ _id: user_id });
      if (info) {
        usercertinfos = await UserCertInfo.create({
          user_name: user_name,
          last_name: last_name,
          user_id: user_id,
          email: info.email,
          unique_id: unique_id,
          questionnaire_id: questionnaire_id,
          score: answer,
          gender: gender,
          age: age,
          phone: phone,
          address_one: address_one,
          address_two: address_two,
          postal_code: postal_code,
          city: city,
          state: state,
          country_code: country_code,
          country: country,
          qualification: qualification,
          amount: amt[0].amount,
          qtype: amt[0].type,
        });

        const us = await User.findOne({ _id: user_id });
        if (us) {
          const updateuser = await User.updateOne(
            { _id: user_id },
            {
              name: user_name,
              surname: last_name,
              gender: gender,
              age: age,
              country: country,
              country_code: country_code,
              qualification: qualification,
              address_one: address_one,
              address_two: address_two,
              postal_code: postal_code,
              city: city,
              state: state,
            }
          );
        }
      }
    }

    const usercertinfo = await UserCertInfo.findOne({ unique_id: unique_id });

    let Qcounts = questionnaire.section;
    Qcounts = Qcounts.length - 1;
    percentage = (answer * 100) / Qcounts;

    if (questionnaire.type == "Free Culture Fair IQ test") {
      iqscore = allscoredata.Culture_Fair_Test_free[answer];
      score = answer;
      Qcount = questionnaire.section;
      Qcount = Qcount.length - 1;
      // finalScore = allscoredata.Culture_Fair_Test_free[answer];
      finalScore = "You have answered " +
        answer +
        " of " +
        Qcount +
        " questions correctly.";
      finalpercentile = "";
      paidTestButton = "Culture Fair IQ test";
      paidTestLink =
        // `${process.env.redirectUrl}/user/questionaire/quiz?questionnaireID=6436694cf923aa5ea7ad37cc`;
        `${process.env.redirectUrl}/culture-fair-iq-test`;
    } else if (questionnaire.type == "Free Classical IQ test") {
      iqscore = allscoredata.Classical_Test_Free[answer];
      score = answer;
      Qcount = questionnaire.section;
      Qcount = Qcount.length - 1;
      finalScore =
        "You have answered " +
        answer +
        " of " +
        Qcount +
        " questions correctly.";
      finalpercentile = "";
      paidTestButton = "Classical IQ test";
      paidTestLink =
        // `${process.env.redirectUrl}/user/questionaire/quiz?questionnaireID=64366966f923aa5ea7ad37d3`;
        `${process.env.redirectUrl}/classical-iq-test`;
    } else if (questionnaire.type == "Culture Fair IQ test") {
      percentile =
        allscoredata.Culture_Fair_Test_Percentile[usercertinfo.age][answer];
      score = allscoredata.Percentile_IQ[percentile];
      Qcount = questionnaire.section;
      Qcount = Qcount.length - 1;
      finalScore =
        "You have answered <b>" +
        answer +
        "</b> of <b>" +
        30 +
        " </b> questions correctly.";
      finalpercentile =
        "You scored higher than <b> " +
        percentile +
        "% </b> of all people that took this test.";
      iqscore =
        "Your IQ test results correspond <b> with an IQ of " + score + "</b>.";
      paidTestButton = "";
      paidTestLink = "";
      let lessScore = score - 5;
      let greaterScore = score + 5;
      intelligenceTest =
        "Depending on your level of concentration, your experience in taking IQ tests and  other specific circumstances under which you took the test your result is not an absolute or fixed value . This the reason why  the report also lists a range within which your score may vary . A reliable estimate of your IQ score according to industry standards lies within a range of <b> " +
        (score - 5) +
        "</b> and <b>" +
        (score + 5) +
        ".</b>";
      scoreurl1 = `${process.env.hostPath}/uploads/graph/49Graph1/${score}.png`;
      scoreurl2 = `${process.env.hostPath}/uploads/graph/49Graph2/${score}.png`;
      const testcounts = await TestCount.findOneAndUpdate(
        { user_id: user_id, questionnaireType },
        { count: 0 }
      );

      let culturetestinfo = {
        // cultureScore: finalScore,
        noofcurrectans: answer,
        Qcountt: Qcount,
        // finalpercentile: finalpercentile,
        percentile: percentile,
        // iqscore: iqscore,
        score: score,
        // intelligenceTest: intelligenceTest,
        lessScore: lessScore,
        greaterScore: greaterScore,
        scoreurl1: scoreurl1,
        scoreurl2: scoreurl2,
      };

      const pdftextpath = path.join(
        __dirname,
        `../public/certificate/cultureCertificate_${unique_id}.pdf`
      );
      const culturepdf = await GenerateCulturePdf(
        "../view/CultureFairCertificate.ejs",
        "../view/CultureFairCertificate-style.css",
        pdftextpath,
        culturetestinfo,
        res
      );
      testpdfurl = `${process.env.hostPath}/certificate/cultureCertificate_${unique_id}.pdf`;

      // createCultureReport(user_id, questionnaire_id, culturetestinfo, unique_id, testpdfurl);
      createReport = await ReportData.create({
        user_id: user_id,
        questionnaire_id: questionnaire_id,
        unique_id: unique_id,
        reportName: "Your culture fair intelligence test results",
        noofcurrectans: culturetestinfo.noofcurrectans,
        Qcountt: culturetestinfo.Qcountt,
        percentile: culturetestinfo.percentile,
        score: culturetestinfo.score,
        lessScore: culturetestinfo.lessScore,
        greaterScore: culturetestinfo.greaterScore,
        scoreurl1: culturetestinfo.scoreurl1,
        scoreurl2: culturetestinfo.scoreurl2,
        reportUrl: testpdfurl,
      });
    } else if (questionnaire.type == "Classical IQ test") {
      percentile =
        allscoredata.Classical_Test_Percentile[usercertinfo.age][answer];
      score = allscoredata.Percentile_IQ[percentile];
      Qcount = questionnaire.section;
      Qcount = Qcount.length - 1;
      finalScore =
        "You have answered <b>" +
        answer +
        "</b> of <b>" +
        Qcount +
        "<b> questions correctly.";
      finalpercentile =
        "You scored higher than <b>" +
        percentile +
        "% </b> of all people that took this test.";
      iqscore =
        "Your IQ test results correspond <b> with an IQ of " + score + "</b>.";
      paidTestButton = "";
      paidTestLink = "";
      let lessScore = score - 5;
      let greaterScore = score + 5;
      intelligenceTest =
        "Depending on your level of concentration, your experience in taking IQ tests and  other specific circumstances under which you took the test your result is not an absolute or fixed value . This the reason why  the report also lists a range within which your score may vary . A reliable estimate of your IQ score according to industry standards lies within a range of <b>" +
        (score - 5) +
        "</b> and <b>" +
        (score + 5) +
        ".</b>";
      // intelligenceTest = `Depending on your level of concentration, your experience in taking IQ tests and  other specific circumstances under which you took the test your result is not an absolute or fixed value . This the reason why  the report also lists a range within which your score may vary . A reliable estimate of your IQ score according to industry standards lies within a range of <span style="font-weight: bold;">${lessScore}</span> and <span style="font-weight: bold;">${greaterScore}</span>`;

      scoreurl1 = `${process.env.hostPath}/uploads/graph/49Graph1/${score}.png`;
      scoreurl2 = `${process.env.hostPath}/uploads/graph/49Graph2/${score}.png`;

      let classictestinfo = {
        // classicalScore: finalScore,
        noofcurrectans: answer,
        Qcountt: Qcount,
        // finalpercentile: finalpercentile,
        percentile: percentile,
        // iqscore: iqscore,
        score: score,
        // intelligenceTest: intelligenceTest,
        lessScore: lessScore,
        greaterScore: greaterScore,
        scoreurl1: scoreurl1,
        scoreurl2: scoreurl2,
        category: category,
      };

      const pdftextpath = path.join(
        __dirname,
        `../public/certificate/classicalCertificate_${unique_id}.pdf`
      );

      const culturepdf = await GenerateClassicalPdf(
        "../view/ClassicalFairCertificate.ejs",
        "../view/ClassicalFairCertificate-style.css",
        pdftextpath,
        classictestinfo,
        res
      );
      testpdfurl = `${process.env.hostPath}/certificate/classicalCertificate_${unique_id}.pdf`;

      // createclassicalReport(user_id, questionnaire_id, classictestinfo, unique_id, testpdfurl);
      createReport = await ReportData.create({
        user_id: user_id,
        questionnaire_id: questionnaire_id,
        unique_id: unique_id,
        reportName: "Your classical intelligence test results",
        noofcurrectans: classictestinfo.noofcurrectans,
        Qcountt: classictestinfo.Qcountt,
        percentile: classictestinfo.percentile,
        score: classictestinfo.score,
        lessScore: classictestinfo.lessScore,
        greaterScore: classictestinfo.greaterScore,
        scoreurl1: classictestinfo.scoreurl1,
        scoreurl2: classictestinfo.scoreurl2,
        category: classictestinfo.category,
        reportUrl: testpdfurl,
      });
    }
    let usersname = "";
    if (
      questionnaire.type == "Classical IQ test" ||
      questionnaire.type == "Culture Fair IQ test"
    ) {
      const updateUsercertinfo = await UserCertInfo.findOneAndUpdate(
        { unique_id: unique_id },
        {
          percentile: percentile,
          percentage: percentage,
          iqscore: score,
          testurl: testpdfurl,
        }
      );
      const usercertinfo = await UserCertInfo.findOne({ user_id: user_id });
      usersname = usercertinfo.user_name;
    } else {
      const updateUsercertinfo = await UserCertInfo.findOneAndUpdate(
        { unique_id: unique_id },
        {
          percentile: percentile,
          percentage: percentage,
          iqscore: "__",
          testurl: testpdfurl,
        }
      );
      usersname = user_name;
    }

    let testinfo = {
      // iqscore: finalScore,
      noofcurrectans: answer,
      Qcount: Qcount,
      iqscoreforpaid:
        questionnaire.type == "Classical IQ test" ||
          questionnaire.type == "Culture Fair IQ test"
          ? score
          : "",
      questionnaire: questionnaire.type,
      name: usersname,
      surname: last_name,
      email: email,
      score: score,
    };

    const pdfpath = path.join(
      __dirname,
      `../public/certificate/certificate_${unique_id}.pdf`
    );
    // res.status(200).send(pdfpath);
    const data = await GeneratePdf(
      "../view/certificate.ejs",
      "../view/certificate-style.css",
      pdfpath,
      testinfo,
      res
    );
    let pdfurl = `${process.env.hostPath}/certificate/certificate_${unique_id}.pdf`;

    if (
      questionnaire.type == "Free Culture Fair IQ test" ||
      questionnaire.type == "Free Classical IQ test"
    ) {
      sendmailID = email;
    } else if (
      questionnaire.type == "Culture Fair IQ test" ||
      questionnaire.type == "Classical IQ test"
    ) {
      const emailID = await UserCertInfo.findOne({ user_id: user_id });
      sendmailID = emailID.email;
    }

    const file = "../view/text_mssg.ejs";
    const subject = "IQ Test Result";
    let filename = "certificate.pdf";

    // if(testpdfurl != "") {
    //   let filesname = 'Report.pdf';
    //   attachment = [{ filename: filename, path: pdfurl }, { filename: filesname, path: testpdfurl }];
    // } else {
    //   attachment = [{ filename: filename, path: pdfurl }];
    // }

    let resData = {
      pdfurl: pdfurl,
      testpdfurl,
      score: answer,
      iqscore: iqscore,
      total_iqscore: score,
      age: age,
      // classicalScore:
      //   questionnaire.type == "Free Classical IQ test" ||
      //     questionnaire.type == "Culture Fair IQ test" ||
      //     questionnaire.type == "Classical IQ test"
      //     ? finalScore
      //     : "",
      classicalScore: finalScore,
      finalpercentile: finalpercentile,
      population_percent: population_percent,
      intelligenceTest: intelligenceTest,
      scoreurl1: scoreurl1,
      scoreurl2: scoreurl2,
      category: category,
    };
    // const iqscorereturn = resData.classicalScore;

    const usersinfo = await UserCertInfo.findOne({ unique_id: unique_id });

    let invoiceurl;
    let invNum;

    if (
      questionnaire.type == "Culture Fair IQ test" ||
      questionnaire.type == "Classical IQ test"
    ) {
      const iso_cod = usersinfo.country_code;
      const invoice_date = usersinfo.createdAt;
      const delivery_date = usersinfo.createdAt;
      const invDate = moment(invoice_date).format("DD-MM-YYYY");
      const deliveryDate = moment(delivery_date).format("DD-MM-YYYY");
      const now = new Date();
      const year = now.getFullYear();

      // Find or create a counter document for the given iso_cod
      let middlenumber = 632495;
      let counter = await Invoice.findOne({ iso_cod });

      if (!counter) {
        // If the counter document doesn't exist, create it
        counter = new Invoice({
          iso_cod: iso_cod,
          sequential_number: 1,
          middlenumber: middlenumber,
          country: country,
        });
      } else {
        // Increment the sequential number for the existing counter document
        middlenumber = counter.middlenumber;
        counter.sequential_number += 1;
      }
      await counter.save();

      let paddedSequentialNumber = String(counter.sequential_number).padStart(
        3,
        "0"
      );

      if (paddedSequentialNumber == 1000) {
        middlenumber = middlenumber + 1;
        let counter = await Invoice.findOne({ iso_cod });
        if (counter) {
          counter.middlenumber = middlenumber;
          middlenumber = counter.middlenumber;
          counter.sequential_number = 1;
          paddedSequentialNumber = String(counter.sequential_number).padStart(
            3,
            "0"
          );
        }
        await counter.save();
      }

      // sequential number restart from 1, if it becomes 999 (accourding a city)
      invNum = `INV-${iso_cod}-${middlenumber}-${year}-${paddedSequentialNumber}`;
      const orderID = `#${middlenumber}${paddedSequentialNumber}${iso_cod}`;

      const adminInfo = await InvoiceInfo.findOne({
        _id: "64fc0122decb41ce6adbf4f7",
      });

      const newInfo = new Invoice({
        invoice_number: invNum,
        invoice_date: invDate,
        user_id: usersinfo.user_id,
        user_name: usersinfo.user_name,
        surname: usersinfo.last_name,
        questionnaire_id: usersinfo.questionnaire_id,
        unique_id: usersinfo.unique_id,
        user_address_one: usersinfo.address_one,
        user_address_two: usersinfo.address_two,
        postal_code: usersinfo.postal_code,
        city: usersinfo.city,
        state: usersinfo && usersinfo.state ? usersinfo.state : "",
        country: usersinfo.country,
        order_id_number: orderID,
        delivery_date: deliveryDate,
        description: usersinfo.qtype,
        qty: "1",
        unit_price: vat_data.excl_vat,
        sales_tax: "$0.00",
        total_amount: usersinfo.amount,
        iso_cod: usersinfo.country_code,
        admin_title: adminInfo.title,
        admin_address: adminInfo.address,
        vat_rate: vat_data.vat_per,
        unit_price_inc: vat_data.incl_vat,
        vat_subtotal: vat_data.vat_value,
      });

      await newInfo.save();
      const invoicePath = path.join(
        __dirname,
        `../public/invoice/invoice_${newInfo.invoice_number}.pdf`
      );
      const invoicedata = await GenerateInvoice(
        "../view/invoice.ejs",
        "../view/certificate-style.css",
        invoicePath,
        newInfo,
        adminInfo,
        res
      );
      // return res.status(200).json(invoicedata);
      invoiceurl = `${process.env.hostPath}/invoice/invoice_${newInfo.invoice_number}.pdf`;
    }
    // res.status(200).json(invoiceurl);
    // return;
    const files = "../view/admin_mssg.ejs";
    const sub = "IQ Test Result";
    let filesname = "Report.pdf";
    let filesnames = "Invoice.pdf";
    if (
      questionnaire.type == "Culture Fair IQ test" ||
      questionnaire.type == "Classical IQ test"
    ) {
      // let filesname = 'Report.pdf';
      attachment = [
        { filename: filename, path: pdfurl },
        { filename: filesname, path: testpdfurl },
        { filename: filesnames, path: invoiceurl },
      ];
    } else {
      attachment = "";
    }

    let checkCultureTest = await Invoice.find({
      user_id: user_id ? user_id : usersinfo.user_id,
      questionnaire_id: "6436694cf923aa5ea7ad37cc",
    });
    let cultureTestStatus = checkCultureTest.length > 0;

    let checkClassicalTest = await Invoice.find({
      user_id: user_id ? user_id : usersinfo.user_id,
      questionnaire_id: "64366966f923aa5ea7ad37d3",
    });
    let classicalTestStatus = checkClassicalTest.length > 0;

    let checkEnneagramTest = await Invoice.find({
      user_id: user_id ? user_id : usersinfo.user_id,
      questionnaire_id: "65586e235046c32c7cd385cd",
    });
    let enneagramTestStatus = checkEnneagramTest.length > 0;

    let checkSixteenTypeTest = await Invoice.find({
      user_id: user_id ? user_id : usersinfo.user_id,
      questionnaire_id: "65d33b0f9bef2027f0594db2",
    });
    let sixteentypeTestStatus = checkSixteenTypeTest.length > 0;

    let checkBigFiveTest = await Invoice.find({
      user_id: user_id ? user_id : usersinfo.user_id,
      questionnaire_id: "65ec352edbd8850c638f33fd",
    });
    let bigFiveTestStatus = checkBigFiveTest.length > 0;

    let checkDiscTest = await Invoice.find({
      user_id: user_id ? user_id : usersinfo.user_id,
      questionnaire_id: "662f3b21d3279b1ec0877cd0",
    });
    let discTestStatus = checkDiscTest.length > 0;

    let checkCareerTest = await Invoice.find({
      user_id: user_id ? user_id : usersinfo.user_id,
      questionnaire_id: "66433c87986a6833bc93d9bc",
    });
    let careerTestStatus = checkCareerTest.length > 0;

    const sendmessage = {
      username: usersname,
      // finalScore: iqscorereturn,
      noofcurrectans: answer,
      Qcountt: Qcount,
      // finalpercentile: finalpercentile,
      percentile: percentile,
      // iqscore: iqscore,
      score: score,
      paidTestLink: paidTestLink,
      paidTestButton: paidTestButton,
      password: generatePass ? generatePass.toString() : "",
      isPassword: generatePass ? true : false,
      questionnaire: questionnaire.type,
      cultureTestStatus: cultureTestStatus,
      classicalTestStatus: classicalTestStatus,
      ennagramTestStatus: enneagramTestStatus,
      sixteentypeTestStatus: sixteentypeTestStatus,
      bigFiveTestStatus: bigFiveTestStatus,
      discTestStatus: discTestStatus,
      careerTestStatus: careerTestStatus
    };
    let adminAttachment = [
      { filename: filename, path: pdfurl },
      { filename: filesname, path: testpdfurl },
      { filename: filesnames, path: invoiceurl },
    ];
    sendEmailToAdmin(
      "iqmanagementamdin1605@gmail.com",
      "token",
      sub,
      files,
      sendmessage,
      adminAttachment,
      res
    );
    sendEmailwithCertificate(
      sendmailID,
      "token",
      subject,
      file,
      sendmessage,
      attachment,
      res
    );
    var certificateData = {
      certificateUrl: pdfurl,
      username: user_name,
      iqscore: iqscore,
      score: score,
    };
    if (
      questionnaire.type == "Classical IQ test" ||
      questionnaire.type == "Culture Fair IQ test"
    ) {
      const dddd = await ReportData.findOneAndUpdate(
        { _id: createReport._id },
        { certificateData: certificateData, invoice_number: invNum, payment_status: { certificatePaymentStatus: true, reportPaymentStatus: true } }
      );
      const updatecertinfo = await UserCertInfo.findOneAndUpdate(
        { unique_id: unique_id },
        { invoiceurl: invoiceurl, invoice_number: invNum }
      );
    }
    res.status(200).send(resData);
  } catch (err) {
    res.status(400).send({
      message: "dfsdf",
    });
    return;
  }
};

const getiqresult = async (req, res) => {
  try {
    const unique_id = req.body.unique_id;
    const answer = await QuestionnaireAnswer.countDocuments({
      unique_id: unique_id,
      is_correct: true,
    });
    const usercertinfo = await UserCertInfo.findOne({ unique_id: unique_id });
    const questionnaire = await Questionnaire.findOne({
      _id: usercertinfo.questionnaire_id,
    });

    let iqscore = null;
    let finalScore = "";
    let percentile = null;
    let finalpercentile = "";
    let intelligenceTest = "";
    let scoreurl1 = "";
    let scoreurl2 = "";

    if (questionnaire.type == "Free Culture Fair IQ test") {
      iqscore = allscoredata.Culture_Fair_Test_free[answer];
    } else if (questionnaire.type == "Free Classical IQ test") {
      iqscore = allscoredata.Classical_Test_Free[answer];
      let Qcount = questionnaire.section;
      Qcount = Qcount.length - 1;
      finalScore =
        "You have answered " +
        answer +
        " of " +
        Qcount +
        " questions correctly.";
    } else if (questionnaire.type == "Culture Fair IQ test") {
      percentile =
        allscoredata.Culture_Fair_Test_Percentile[usercertinfo.age][answer];
      let score = allscoredata.Percentile_IQ[percentile];
      // let Qcount = questionnaire.section;
      // Qcount = Qcount.length-1;
      finalScore =
        "You have answered " + answer + " of " + 30 + " questions correctly.";
      finalpercentile =
        "You scored higher than " +
        percentile +
        "% of all people that took this test.";
      iqscore = "Your IQ test results correspond with an IQ of " + score;
      intelligenceTest =
        "Depending on your level of concentration, your experience in taking IQ tests and  other specific circumstances under which you took the test your result is not an absolute or fixed value . This the reason why  the report also lists a range within which your score may vary . A reliable estimate of your IQ score according to industry standards lies within a range of " +
        (score - 5) +
        " and " +
        (score + 5);
      scoreurl1 = `${process.env.hostPath}/uploads/graph/49Graph1/${score}.png`;
      scoreurl2 = `${process.env.hostPath}/uploads/graph/49Graph2/${score}.png`;
    } else if (questionnaire.type == "Classical IQ test") {
      percentile =
        allscoredata.Classical_Test_Percentile[usercertinfo.age][answer];
      let score = allscoredata.Percentile_IQ[percentile];
      let Qcount = questionnaire.section;
      Qcount = Qcount.length - 1;
      finalScore =
        "You have answered " +
        answer +
        " of " +
        Qcount +
        " questions correctly.";
      finalpercentile =
        "You scored higher than " +
        percentile +
        "% of all people that took this test.";
      iqscore = "Your IQ test results correspond with an IQ of " + score;
      intelligenceTest =
        "Depending on your level of concentration, your experience in taking IQ tests and  other specific circumstances under which you took the test your result is not an absolute or fixed value . This the reason why  the report also lists a range within which your score may vary . A reliable estimate of your IQ score according to industry standards lies within a range of " +
        (score - 5) +
        " and " +
        (score + 5);
      scoreurl1 = `${process.env.hostPath}/uploads/graph/49Graph1/${score}.png`;
      scoreurl2 = `${process.env.hostPath}/uploads/graph/49Graph2/${score}.png`;
    }

    let resData = {
      score: answer,
      iqscore: iqscore,
      classicalScore: finalScore,
      questionnaire: questionnaire,
      finalpercentile: finalpercentile,
      intelligenceTest: intelligenceTest,
      scoreurl1: scoreurl1,
      scoreurl2: scoreurl2,
    };
    res.status(200).send(resData);
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

const testcount = async (req, res) => {
  try {
    const user_id = req.body.user_id;
    const unique_id = req.body.unique_id;
    const count = req.body.count;
    const questionnaire_id = req.body.questionnaire_id;
    const questionnaireType = req?.body?.questionnaireType;
    const checkcount = await TestCount.findOne({ user_id: user_id, questionnaireType });
    let testcount = 0;
    if (!checkcount) {
      testcount = await TestCount.create({
        user_id: user_id,
        unique_id: unique_id,
        count: count,
        questionnaireType
      });
    } else {
      const testcounts = await TestCount.findOneAndUpdate(
        { user_id: user_id, questionnaireType },
        { count: count, unique_id: unique_id }
      );
      testcount = await TestCount.findOne({ user_id: user_id, questionnaireType });
    }
    res.status(200).send(testcount);
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

const gettestcount = async (req, res) => {
  try {
    const user_id = req.body.user_id;
    const questionnaireType = req?.body?.questionnaireType;
    const checkcount = await TestCount.findOne({ user_id: user_id, questionnaireType });
    res.status(200).send(checkcount);
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

// const userdata = async (req, res) => {
//   try {
//     const email = req.body.email;
//     const username = req.body.name;
//     const topic = req.body.topic;
//     const sub = req.body.subject;
//     const message = req.body.message;
//     const img = req.files.image;

//     const filePath = path.join(__dirname, "../public/userdata/", `${img.name}`);
//     var allowedExtensions = /(\.jpg|\.jpeg|\.JPEG|\.JPG|\.png|\.PNG|\.gif)/;

//     let imgurl = `${process.env.hostPath}/userdata/` + `${img.name}`;

//     if (!allowedExtensions.exec(filePath)) {
//       res.status(500).send("Invalid file type");
//       return;
//     } else {
//       img.mv(filePath, (err) => {
//         if (err) return res.send(err);
//       });
//     }

//     file = "../view/userData.ejs";
//     let sendmailID = email;
//     let subject = sub;
//     let filename = `image.${allowedExtensions.exec(filePath)[0]}`;
//     const attachment = [{ filename: filename, path: imgurl }];
//     let msg = { username, topic, message, attachment };

//     // const data = ({mssg: 'Your mail has been sent!', userdata: req.body, imgurl});

//     sendEmailwithCertificate(
//       "info@testuity.com",
//       "token",
//       subject,
//       file,
//       msg,
//       attachment,
//       res
//     );
//     res.status(200).send({ mssg: "Your mail has been sent!" });
//   } catch (err) {
//     res.status(400).send({
//       message: err.message,
//     });
//   }
// };


const userdata = async (req, res) => {
  try {
    const email = req.body?.email;
    const username = req.body?.name;
    const topic = req.body?.topic;
    const sub = req.body?.subject;
    const message = req.body?.message;
    const img = req.files?.image;
    const file = "../view/userData.ejs";
    let subject = sub;

    if (img) {
      const filePath = path.join(__dirname, "../public/userdata/", `${img.name}`);
      const allowedExtensions = /(\.jpg|\.jpeg|\.JPEG|\.JPG|\.png|\.PNG|\.gif)/;
      const imgurl = `${process.env.hostPath}/userdata/` + `${img.name}`;

      if (!allowedExtensions.exec(filePath)) {
        return res.status(400).send("Invalid file type");
      }

      img.mv(filePath, (err) => {
        if (err) {
          console.error("Error moving image:", err);
          return res.status(500).send({ error: "Error saving the image" });
        }
      });

      const attachment = [{ filename: img.name, path: imgurl }];
      const msg = { email, username, topic, message, attachment };

      sendEmailContactForm(
        "mailto:info@testuity.com",
        "token",
        subject,
        file,
        msg,
        attachment,
        res
      );
    } else {
      const msg = { email, username, topic, message };

      sendEmailContactForm(
        "mailto:info@testuity.com",
        "token",
        subject,
        file,
        msg,
        [],
        res
      );
    }
  } catch (err) {
    console.error("Error in userdata:", err);
    res.status(400).send({
      message: err.message,
    });
  }
};

const allUserReport = async (req, res) => {
  try {
    const report = await ReportData.find({
      user_id: req.body.user_id,
      questionnaire_id: req.body.questionnaire_id,
    }).sort({ createdAt: -1 });
    res.status(200).send({ reportData: report });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

const userReport = async (req, res) => {
  try {
    const report = await ReportData.findOne({ _id: req.params.report_id });
    res.status(200).send({ reportData: report });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

const getAllEnnaQuestionnaire = async (req, res) => {
  const Form = await EnneagrapQuestionnaire.find({}, { section: 0 });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

const getEnnaQuestionnaire = async (req, res) => {
  const data = await EnneagrapQuestionnaire.findOne({ type: "Personal Info" });
  const Form = await EnneagrapQuestionnaire.findOne({ _id: req.params.id });

  if (!Form) {
    throw new CustomError.NotFoundError(
      `No Question with id : ${req.params.id}`
    );
  }

  res.status(StatusCodes.OK).json({ Form: Form, Personal_quetion: data });
};

const save_question = async (req, res) => {
  let user_id = req.body.user_id;
  let booking_id = req.body.booking_id;
  let personality_type = req.body.personality_type;
  let group_type = req.body.group_type;
  let quesid = req.body.quesid;
  let answer = req.body.answer;
  let question_type = req.body.question_type;

  const existanswer = await Ennagramanswers.findOne({
    booking_id: booking_id,
    quesid: quesid,
  });

  if (existanswer) {
    const data = await Ennagramanswers.updateOne(
      { booking_id: booking_id, quesid: quesid },
      { answer: answer }
    );
  } else {
    const data = await Ennagramanswers.create({
      user_id,
      booking_id,
      personality_type,
      group_type,
      quesid,
      answer,
      question_type,
    });
  }

  res.send("data updated successfully");
};

const getBooking = async (req, res) => {
  let user_id = req.body.user_id;
  let questionnaire_id = req?.body?.questionnaire_id;

  const response = await Booking.findOne({
    user_id: user_id,
    status: true,
    questionnaire_id: questionnaire_id,
  }).sort({ createdAt: -1 });
  if (response) {
    res.send(response);
  } else {
    // let data = await Booking.create({ user_id: user_id, status: true, count: 1 });
    // res.send(data)
    res.send({ msg: "booking not found" });
  }
};

const get_answers = async (req, res) => {
  let booking_id = req.body.booking_id;
  const answers = await Ennagramanswers.find({ booking_id: booking_id });

  let obj = {};
  for (let i = 0; i < answers.length; i++) {
    obj = { ...obj, [answers[i].quesid]: answers[i].answer };
  }
  res.send(obj);
};

const get_count = async (req, res) => {
  let booking_id = req.body.booking_id;

  const booking_data = await Booking.findOne({ _id: booking_id });

  if (booking_data.count == 8) {
    res.send({
      count: 8,
      arrayscore: booking_data.arrayscore,
      about_type: booking_data.about_type,
    });
    return;
  }

  const Form = await EnneagrapQuestionnaire.find();
  let sections = Form[0].section;
  let count = 1;
  let section_one = 0;
  let section_two = 0;
  let section_three = 0;
  let section_four = 0;
  let section_five = 0;
  let section_six = 0;

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].section_name == "section one") {
      section_one = sections[i].questions.length;
    }
    if (sections[i].section_name == "section two") {
      section_two = sections[i].questions.length;
    }
    if (sections[i].section_name == "section three") {
      section_three = sections[i].questions.length;
    }
    if (sections[i].section_name == "section four") {
      section_four = sections[i].questions.length;
    }
    if (sections[i].section_name == "section five") {
      section_five = sections[i].questions.length;
    }
    if (sections[i].section_name == "section six") {
      section_six = sections[i].questions.length;
    }
  }
  // res.send({section_one: section_one, section_two: section_two, section_three: section_three, section_four: section_four, section_five: section_five, section_six: section_six})

  const one = await Ennagramanswers.countDocuments({
    booking_id: booking_id,
    question_type: "section one",
  });
  const two = await Ennagramanswers.countDocuments({
    booking_id: booking_id,
    question_type: "section two",
  });
  const three = await Ennagramanswers.countDocuments({
    booking_id: booking_id,
    question_type: "section three",
  });
  const four = await Ennagramanswers.countDocuments({
    booking_id: booking_id,
    question_type: "section four",
  });
  const five = await Ennagramanswers.countDocuments({
    booking_id: booking_id,
    question_type: "section five",
  });
  const six = await Ennagramanswers.countDocuments({
    booking_id: booking_id,
    question_type: "section six",
  });

  if (one == section_one) {
    count = count + 1;
  }
  if (two == section_two) {
    count = count + 1;
  }
  if (three == section_three) {
    count = count + 1;
  }
  if (four == section_four) {
    count = count + 1;
  }
  if (five == section_five) {
    count = count + 1;
  }
  if (six == section_six) {
    count = count + 1;
  }

  res.send({
    count: count,
    arrayscore: booking_data.arrayscore,
    about_type: booking_data.about_type,
  });
};

function calculatePercentageAndValue(numerator, denominator) {
  if (denominator === 0) {
    throw new Error("Denominator cannot be zero.");
  }

  const percentage = (numerator / denominator) * 100;
  const intValue = Math.round(percentage);

  return intValue;
}

const GenerateEnnagramPdf = async (typeOfFile, filePath, answer) => {
  try {
    const template = fs.readFileSync(typeOfFile, "utf-8");
    const renderedTemplate = ejs.render(template, { answer });
    const compiledTemplate = handlebars.compile(renderedTemplate);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // const browser = await puppeteer.launch();


    // const format = {
    //   width: '8.2in', // Width in inches
    //   height: '10.3in', // Height in inches
    // };

    const page = await browser.newPage();

    const htmlContent = compiledTemplate({ answer });
    await page.setContent(htmlContent);
    await page.pdf({
      path: filePath,
      printBackground: true,
      format: "A4",
      margin: {
        top: page.number == 1 ? "0mm" : "10mm",
        bottom: "10mm",
      },
    });
    await browser.close();

    // return 'PDF generated successfully!';
  } catch (error) {
    console.error(error);
  }
};

const getBookingfun = async (user_id, questionnaire_id) => {
  let data = await Booking.create({
    user_id: user_id,
    status: true,
    count: 1,
    questionnaire_id: questionnaire_id,
  });
  return data;
};

const get_result = async (req, res) => {
  let email = req.body.email;
  let user_name = req.body.user_name;
  let last_name = req.body.last_name;
  let gender = req?.body?.gender;
  let age = req?.body?.age;
  let country = req.body.country;
  let address_one = req.body.address_one;
  let address_two = req.body.address_two;
  let postal_code = req.body.postal_code;
  let city = req.body.city;
  let state = req.body.state;
  let country_code = req.body.country_code;
  let qualification = req?.body?.qualification;
  let user_id = req?.body?.user_id;
  let booking_id = req?.body?.booking_id;
  let questionnaire_id = req?.body?.questionnaire_id;
  let answer = req?.body?.answer;
  let timeZone = req?.body?.timeZone;

  if (!user_id) {
    const exist = await User.findOne({ email: email });
    if (exist) {
      const result = await getBookingfun(exist?._id, questionnaire_id);
      booking_id = result._id;

      let questions = await EnneagrapQuestionnaire.findOne({
        _id: questionnaire_id,
      });
      questions = questions.section;

      for (let i = 0; i < questions.length; i++) {
        for (let j = 0; j < questions[i].questions.length; j++) {
          const data = await Ennagramanswers.create({
            user_id,
            booking_id,
            personality_type: questions[i].questions[j].personality_type,
            group_type: questions[i].questions[j].group_type,
            quesid: questions[i].questions[j].quesid,
            answer: answer[questions[i].questions[j].quesid],
            question_type: questions[i].section_name,
          });
        }
      }

      res.send({ msg: "User already exist", booking_id: booking_id });
      return;
    }
    const user = await User.create({
      email,
      name: user_name,
      surname: last_name,
      country,
      country_code,
      address_one,
      address_two,
      postal_code,
      city,
      state,
      qualification,
    });
    user_id = user._id;
    let generatePass = Math.random().toString().substr(2, 6);
    let password = bcrypt.hashSync(generatePass);

    const updateuser = await User.findOneAndUpdate(
      { email: email },
      { password: password }
    );

    const sendmessage = {
      username: user_name,
      surname: last_name,
      password: generatePass,
    };

    const file = "../view/enneagram_pass.ejs";
    const subject = "Login Credential";
    let attachment = "";

    sendEmailwithCertificate(
      email,
      "token",
      subject,
      file,
      sendmessage,
      attachment
    );
  } else {
    const updateuser = await User.updateOne(
      { _id: user_id },
      {
        name: user_name,
        surname: last_name,
        gender: gender,
        age: age,
        country: country,
        country_code: country_code,
        qualification: qualification,
        address_one: address_one,
        address_two: address_two,
        postal_code: postal_code,
        city: city,
        state: state,
      }
    );
  }

  if (!booking_id) {
    const result = await getBookingfun(user_id, questionnaire_id);
    booking_id = result._id;

    let questions = await EnneagrapQuestionnaire.findOne({
      _id: questionnaire_id,
    });
    questions = questions.section;

    for (let i = 0; i < questions.length; i++) {
      for (let j = 0; j < questions[i].questions.length; j++) {
        const data = await Ennagramanswers.create({
          user_id,
          booking_id,
          personality_type: questions[i].questions[j].personality_type,
          group_type: questions[i].questions[j].group_type,
          quesid: questions[i].questions[j].quesid,
          answer: answer[questions[i].questions[j].quesid],
          question_type: questions[i].section_name,
        });
      }
    }
  }

  let one_type = 0;
  let two_type = 0;
  let three_type = 0;
  let four_type = 0;
  let five_type = 0;
  let six_type = 0;
  let seven_type = 0;
  let eight_type = 0;
  let nine_type = 0;

  let answers = await Ennagramanswers.find({ booking_id: booking_id });

  for (let i = 0; i < answers.length; i++) {
    if (answers[i].personality_type == "1") {
      one_type = one_type + answers[i].answer;
    }
    if (answers[i].personality_type == "2") {
      two_type = two_type + answers[i].answer;
    }
    if (answers[i].personality_type == "3") {
      three_type = three_type + answers[i].answer;
    }
    if (answers[i].personality_type == "4") {
      four_type = four_type + answers[i].answer;
    }
    if (answers[i].personality_type == "5") {
      five_type = five_type + answers[i].answer;
    }
    if (answers[i].personality_type == "6") {
      six_type = six_type + answers[i].answer;
    }
    if (answers[i].personality_type == "7") {
      seven_type = seven_type + answers[i].answer;
    }
    if (answers[i].personality_type == "8") {
      eight_type = eight_type + answers[i].answer;
    }
    if (answers[i].personality_type == "9") {
      nine_type = nine_type + answers[i].answer;
    }
  }

  let one_type_percent = calculatePercentageAndValue(one_type, 55);
  let two_type_percent = calculatePercentageAndValue(two_type, 55);
  let three_type_percent = calculatePercentageAndValue(three_type, 55);
  let four_type_percent = calculatePercentageAndValue(four_type, 55);
  let five_type_percent = calculatePercentageAndValue(five_type, 55);
  let six_type_percent = calculatePercentageAndValue(six_type, 55);
  let seven_type_percent = calculatePercentageAndValue(seven_type, 55);
  let eight_type_percent = calculatePercentageAndValue(eight_type, 55);
  let nine_type_percent = calculatePercentageAndValue(nine_type, 55);

  let bodyScore = {
    0: {
      movieName: "ONE",
      moviePercentage: one_type_percent,
    },
    1: {
      movieName: "EIGHT",
      moviePercentage: eight_type_percent,
    },
    2: {
      movieName: "NINE",
      moviePercentage: nine_type_percent,
    },
  };
  let headScore = {
    0: {
      movieName: "SEVEN",
      moviePercentage: seven_type_percent,
    },
    1: {
      movieName: "FIVE",
      moviePercentage: five_type_percent,
    },
    2: {
      movieName: "SIX",
      moviePercentage: six_type_percent,
    },
  };
  let heartScore = {
    0: {
      movieName: "Two",
      moviePercentage: two_type_percent,
    },
    1: {
      movieName: "THREE",
      moviePercentage: three_type_percent,
    },
    2: {
      movieName: "FOUR",
      moviePercentage: four_type_percent,
    },
  };

  let greater_flag;

  let myArray = [
    one_type_percent,
    two_type_percent,
    three_type_percent,
    four_type_percent,
    five_type_percent,
    six_type_percent,
    seven_type_percent,
    eight_type_percent,
    nine_type_percent,
  ];

  // Sort in descending order
  myArray.sort(function (a, b) {
    return b - a;
  });

  if (one_type_percent == myArray[0]) {
    greater_flag = "one";
    bodyScore = {
      0: {
        movieName: "ONE",
        moviePercentage: one_type_percent,
      },
      1: {
        movieName: "EIGHT",
        moviePercentage: eight_type_percent,
      },
      2: {
        movieName: "NINE",
        moviePercentage: nine_type_percent,
      },
    };
  } else if (two_type_percent == myArray[0]) {
    greater_flag = "two";
    heartScore = {
      0: {
        movieName: "Two",
        moviePercentage: two_type_percent,
      },
      1: {
        movieName: "THREE",
        moviePercentage: three_type_percent,
      },
      2: {
        movieName: "FOUR",
        moviePercentage: four_type_percent,
      },
    };
  } else if (three_type_percent == myArray[0]) {
    greater_flag = "three";
    heartScore = {
      0: {
        movieName: "THREE",
        moviePercentage: three_type_percent,
      },
      1: {
        movieName: "Two",
        moviePercentage: two_type_percent,
      },
      2: {
        movieName: "FOUR",
        moviePercentage: four_type_percent,
      },
    };
  } else if (four_type_percent == myArray[0]) {
    greater_flag = "four";
    heartScore = {
      0: {
        movieName: "FOUR",
        moviePercentage: four_type_percent,
      },
      1: {
        movieName: "Two",
        moviePercentage: two_type_percent,
      },
      2: {
        movieName: "THREE",
        moviePercentage: three_type_percent,
      },
    };
  } else if (five_type_percent == myArray[0]) {
    greater_flag = "five";
    headScore = {
      0: {
        movieName: "FIVE",
        moviePercentage: five_type_percent,
      },
      1: {
        movieName: "SIX",
        moviePercentage: six_type_percent,
      },
      2: {
        movieName: "SEVEN",
        moviePercentage: seven_type_percent,
      },
    };
  } else if (six_type_percent == myArray[0]) {
    greater_flag = "six";
    headScore = {
      0: {
        movieName: "SIX",
        moviePercentage: six_type_percent,
      },
      1: {
        movieName: "FIVE",
        moviePercentage: five_type_percent,
      },
      2: {
        movieName: "SEVEN",
        moviePercentage: seven_type_percent,
      },
    };
  } else if (seven_type_percent == myArray[0]) {
    greater_flag = "seven";
    headScore = {
      0: {
        movieName: "SEVEN",
        moviePercentage: seven_type_percent,
      },
      1: {
        movieName: "FIVE",
        moviePercentage: five_type_percent,
      },
      2: {
        movieName: "SIX",
        moviePercentage: six_type_percent,
      },
    };
  } else if (eight_type_percent == myArray[0]) {
    greater_flag = "eight";
    bodyScore = {
      0: {
        movieName: "EIGHT",
        moviePercentage: eight_type_percent,
      },
      1: {
        movieName: "ONE",
        moviePercentage: one_type_percent,
      },
      2: {
        movieName: "NINE",
        moviePercentage: nine_type_percent,
      },
    };
  } else if (nine_type_percent == myArray[0]) {
    greater_flag = "nine";
    bodyScore = {
      0: {
        movieName: "NINE",
        moviePercentage: nine_type_percent,
      },
      1: {
        movieName: "ONE",
        moviePercentage: one_type_percent,
      },
      2: {
        movieName: "EIGHT",
        moviePercentage: eight_type_percent,
      },
    };
  }

  // pdf work
  const book = await Booking.findOne({ _id: booking_id });
  // const date = new Date('Jan 18, 2021 08:37:00');
  const date = new Date(book.createdAt);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: timeZone,
  };
  const formattedDate = date.toLocaleString("en-US", options);

  let boydScoreParseInt = Object.entries(bodyScore).map(([key, value]) => [
    parseInt(key),
    value,
  ]);
  let headScoreParseInt = Object.entries(headScore).map(([key, value]) => [
    parseInt(key),
    value,
  ]);
  let heartScoreParseInt = Object.entries(heartScore).map(([key, value]) => [
    parseInt(key),
    value,
  ]);

  /* atout types array */
  let about_types_array = [
    {
      greater_flag: "one",
      about_content:
        "The Perfectionist, is characterized by a steadfast pursuit of goodness and a commitment to high standards. Ones are meticulous and detail-oriented, driven by a core desire to do what is right and avoid making mistakes. They often serve as moral compasses, upholding principles and striving for perfection in both themselves and others. The Perfectionist's sense of responsibility and integrity is commendable, yet it can also manifest as a critical inner voice that constantly evaluates and seeks improvement. This internal critic pushes Ones to achieve excellence but can also lead to a sense of inner tension and self-criticism.",
    },
    {
      greater_flag: "two",
      about_content:
        "The Helper, radiates warmth and compassion, driven by a core desire to be loved and needed. These individuals are natural caregivers, always attuned to the emotional needs of those around them. The Helper's altruistic nature is expressed through acts of service and a genuine desire to make a positive impact on the lives of others. Known for their nurturing qualities, Type 2 individuals often place the needs of others above their own, seeking validation through their ability to support and care for those they love. However, this generous nature can sometimes lead to a challenge in recognizing and addressing their own needs and desires.",
    },
    {
      greater_flag: "three",
      about_content:
        "The Achiever, is a dynamic and success-oriented individual driven by a core desire for accomplishment and recognition. Threes are natural go-getters, channeling their energy into setting and achieving ambitious goals. Their adaptable and results-oriented nature often leads them to excel in various aspects of life. Known for their impressive communication skills and a keen sense of presentation, Achievers are image-conscious and strive to portray an image of success to the world. This focus on external validation, however, can pose a challenge as Threes may grapple with the need to balance their external achievements with a deeper understanding of their authentic selves.",
    },
    {
      greater_flag: "four",
      about_content:
        "The Individualist, is a deeply introspective and emotionally expressive individual, characterized by a core desire for authenticity and uniqueness. Fours are the creative romantics of the Enneagram, driven by a need to create an identity that is both genuine and distinct from others. Known for their artistic flair and rich emotional depth, Individualists have an innate ability to tap into their feelings and express them in unique and creative ways. However, this intense connection to their emotions can sometimes lead to a sense of melancholy or a feeling of being misunderstood.",
    },
    {
      greater_flag: "five",
      about_content:
        "The Investigator, is a cerebral and insightful individual characterized by a core desire for understanding and a fear of being overwhelmed. Fives are the intellectual explorers of the Enneagram, driven by a thirst for knowledge and a natural inclination to analyze and observe. Known for their keen perception and analytical prowess, Investigators excel in delving into complex subjects. However, their pursuit of understanding can sometimes lead to a tendency to withdraw from the world, seeking solace in their inner thoughts and ideas.",
    },
    {
      greater_flag: "six",
      about_content:
        "The Loyalist, is a vigilant and security-oriented individual, characterized by a core desire for safety and a fear of being without support. Loyalists are the cautious skeptics of the Enneagram, often anticipating potential challenges and forming alliances to navigate the uncertainties of life. Known for their loyalty and dependability, Sixes are trustworthy allies who excel in creating a sense of stability within their social circles. However, their vigilant nature can sometimes lead to anxiety as they constantly assess potential risks and seek reassurance from external sources.",
    },
    {
      greater_flag: "seven",
      about_content:
        "The Enthusiast, is a lively and adventurous individual driven by a core desire for experience and a fear of being limited or bored. Sevens are the spontaneous optimists of the Enneagram, always seeking joy and avoiding pain, embracing life with boundless enthusiasm. Known for their upbeat and fun-loving nature, Enthusiasts are adept at finding excitement in various experiences and often bring an infectious energy to their social circles. However, their fear of discomfort and the constant pursuit of novelty can sometimes lead to a tendency to avoid facing deeper emotions.",
    },
    {
      greater_flag: "eight",
      about_content:
        "The Challenger, is a dynamic and powerful personality marked by assertiveness, independence, and a fierce protective instinct. With a natural inclination to lead, Eights are known for their strong, commanding presence and a preference for making independent decisions. Their protective instinct manifests in a loyalty that makes them formidable guardians of those they care about. Direct communication is a hallmark of Type 8, reflecting their no-nonsense approach to life. Fearlessness defines them; Eights fearlessly confront challenges, unafraid of direct confrontation and tackling obstacles head-on. Their desire for control is evident, as they seek autonomy and resist situations where they feel powerless or vulnerable.",
    },
    {
      greater_flag: "nine",
      about_content:
        "The Peacemaker, embodies a set of characteristics that contribute to a calm and harmonious presence. Nines are known for their easygoing and agreeable nature, seeking inner peace and avoiding conflict whenever possible. They value a tranquil environment, often acting as stabilizing forces in relationships and group dynamics. Nines possess a remarkable ability to see multiple perspectives, making them natural mediators and diplomats. Their desire for unity and avoidance of tension can, however, lead to a tendency to merge with others' desires, potentially losing sight of their own needs and desires in the process.",
    },
  ];

  let about_data = null;

  for (let i = 0; i < about_types_array.length; i++) {
    if (about_types_array[i].greater_flag == greater_flag) {
      about_data = about_types_array[i];
    }
  }

  let pdfdata = {
    user_name: user_name + " " + last_name,
    formattedDate: formattedDate,
    greater_flag: greater_flag,
    about_type: about_data.about_content,
    graphoScore: {
      one_type_percent,
      two_type_percent,
      three_type_percent,
      four_type_percent,
      five_type_percent,
      six_type_percent,
      seven_type_percent,
      eight_type_percent,
      nine_type_percent,
    },
    score: {
      one_type_percent,
      two_type_percent,
      three_type_percent,
      four_type_percent,
      five_type_percent,
      six_type_percent,
      seven_type_percent,
      eight_type_percent,
      nine_type_percent,
    },
    bodyScore: boydScoreParseInt,
    headScore: headScoreParseInt,
    heartScore: heartScoreParseInt,
    arrayscore: [
      one_type_percent,
      two_type_percent,
      three_type_percent,
      four_type_percent,
      five_type_percent,
      six_type_percent,
      seven_type_percent,
      eight_type_percent,
      nine_type_percent,
    ],
  };

  const pdfpath = path.join(
    __dirname,
    `../public/enneagram_report/enneagram_report_${booking_id}.pdf`
  );
  // res.status(200).send(pdfpath);
  const data = await GenerateEnnagramPdf(
    "../view/enneagram.ejs",
    pdfpath,
    pdfdata
  );
  let pdfurl = `${process.env.hostPath}/enneagram_report/enneagram_report_${booking_id}.pdf`;

  const update_booking = await Booking.findOneAndUpdate(
    { _id: booking_id },
    {
      count: 8,
      arrayscore: pdfdata?.arrayscore,
      about_type: pdfdata?.about_type,
    }
  );

  let createReport = await EnneagramReportData.create({
    user_id: user_id,
    questionnaire_id: questionnaire_id,
    booking_id: booking_id,
    user_name: user_name,
    last_name: last_name,
    email: email,
    gender: gender,
    age: age,
    country: country,
    qualification: qualification,
    reportName: "Your enneagram test results",
    // invoice_number: invNum,
    reportUrl: pdfurl,
    // invoiceUrl: invoiceurl,
  });

  if (update_booking) {
    // res.send({ count: 8 },{arrayscore: pdfdata.arrayscore});
    res.status(StatusCodes.OK).json({
      count: 8,
      arrayscore: pdfdata?.arrayscore,
      about_type: pdfdata?.about_type,
      booking_id,
      user_id,
      user_name,
    });
  }
};

const userEnneagramReport = async (req, res) => {
  try {
    const report = await EnneagramReportData.find({
      user_id: req.body.user_id,
      questionnaire_id: req.body.questionnaire_id,
      report_status: true,
    });
    res.status(200).send({ reportData: report });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

// sixteen type questionnaire
const getAllsixteentypequestionnaire = async (req, res) => {
  const Form = await SixteenTypeQuestionnaire.find({}, { section: 0 });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

const getSixteentypeQuestionnaire = async (req, res) => {
  const data = await SixteenTypeQuestionnaire.findOne({
    type: "Personal Info",
  });
  const Form = await SixteenTypeQuestionnaire.findOne({ _id: req.params.id });

  if (!Form) {
    throw new CustomError.NotFoundError(
      `No Question with id : ${req.params.id}`
    );
  }

  res.status(StatusCodes.OK).json({ Form: Form, Personal_quetion: data });
};

const get_sixteentype_count = async (req, res) => {
  let booking_id = req.body.booking_id;

  const booking_data = await Booking.findOne({ _id: booking_id });

  if (booking_data.count == 9) {
    res.send({
      count: 9,
      arrayscore: booking_data.arrayscore,
      about_type: booking_data.about_type,
      single_dichotomies: booking_data.single_dichotomies,
      greater_var: booking_data.greater_var,
    });
    return;
  }

  const Form = await SixteenTypeQuestionnaire.find();
  let sections = Form[0].section;
  let count = 1;
  let section_one = 0;
  let section_two = 0;
  let section_three = 0;
  let section_four = 0;
  let section_five = 0;
  let section_six = 0;
  let section_seven = 0;

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].section_name == "section one") {
      section_one = sections[i].questions.length;
    }
    if (sections[i].section_name == "section two") {
      section_two = sections[i].questions.length;
    }
    if (sections[i].section_name == "section three") {
      section_three = sections[i].questions.length;
    }
    if (sections[i].section_name == "section four") {
      section_four = sections[i].questions.length;
    }
    if (sections[i].section_name == "section five") {
      section_five = sections[i].questions.length;
    }
    if (sections[i].section_name == "section six") {
      section_six = sections[i].questions.length;
    }
    if (sections[i].section_name == "section seven") {
      section_seven = sections[i].questions.length;
    }
  }

  const one = await Sixteentypeanswer.countDocuments({
    booking_id: booking_id,
    question_type: "section one",
  });
  const two = await Sixteentypeanswer.countDocuments({
    booking_id: booking_id,
    question_type: "section two",
  });
  const three = await Sixteentypeanswer.countDocuments({
    booking_id: booking_id,
    question_type: "section three",
  });
  const four = await Sixteentypeanswer.countDocuments({
    booking_id: booking_id,
    question_type: "section four",
  });
  const five = await Sixteentypeanswer.countDocuments({
    booking_id: booking_id,
    question_type: "section five",
  });
  const six = await Sixteentypeanswer.countDocuments({
    booking_id: booking_id,
    question_type: "section six",
  });
  const seven = await Sixteentypeanswer.countDocuments({
    booking_id: booking_id,
    question_type: "section seven",
  });

  if (one == section_one) {
    count = count + 1;
  }
  if (two == section_two) {
    count = count + 1;
  }
  if (three == section_three) {
    count = count + 1;
  }
  if (four == section_four) {
    count = count + 1;
  }
  if (five == section_five) {
    count = count + 1;
  }
  if (six == section_six) {
    count = count + 1;
  }
  if (seven == section_seven) {
    count = count + 1;
  }

  res.send({
    count: count,
    arrayscore: "booking_data.arrayscore",
    about_type: "booking_data.about_type",
  });
};

const get_sixteentype_answers = async (req, res) => {
  let booking_id = req.body.booking_id;
  const answers = await Sixteentypeanswer.find({ booking_id: booking_id });

  let obj = {};
  for (let i = 0; i < answers.length; i++) {
    obj = { ...obj, [answers[i].quesid]: answers[i].answer };
  }
  res.send(obj);
};

const GenerateSixteenTypePdf = async (typeOfFile, filePath, answer) => {
  try {
    const template = fs.readFileSync(typeOfFile, "utf-8");
    const renderedTemplate = ejs.render(template, { answer });
    const compiledTemplate = handlebars.compile(renderedTemplate);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    // const browser = await puppeteer.launch();

    // const format = {
    //   width: '8.2in', // Width in inches
    //   height: '10.3in', // Height in inches
    // };

    const page = await browser.newPage();

    const htmlContent = compiledTemplate({ answer });
    await page.setContent(htmlContent);
    await page.pdf({
      path: filePath,
      printBackground: true,
      format: "A4",
      margin: {
        top: page.number == 1 ? "0mm" : "15mm",
        bottom: "15mm",
      },
    });
    await browser.close();

    // return 'PDF generated successfully!';
  } catch (error) {
    console.error(error);
  }
};


const get_sixteentype_result = async (req, res) => {
  let email = req.body.email;
  let user_name = req.body.user_name;
  let last_name = req.body.last_name;
  let gender = req?.body?.gender;
  let age = req?.body?.age;
  let country = req.body.country;
  let address_one = req.body.address_one;
  let address_two = req.body.address_two;
  let postal_code = req.body.postal_code;
  let city = req.body.city;
  let state = req.body.state;
  let country_code = req.body.country_code;
  let qualification = req?.body?.qualification;
  let user_id = req?.body?.user_id;
  let booking_id = req?.body?.booking_id;
  let questionnaire_id = req?.body?.questionnaire_id;
  let answer = req?.body?.answer;
  let timeZone = req?.body?.timeZone;

  if (!user_id) {
    const exist = await User.findOne({ email: email });
    if (exist) {
      const result = await getBookingfun(exist?._id, questionnaire_id);
      booking_id = result._id;

      let questions = await SixteenTypeQuestionnaire.findOne({
        _id: questionnaire_id,
      });
      questions = questions.section;

      for (let i = 0; i < questions.length; i++) {
        for (let j = 0; j < questions[i].questions.length; j++) {
          const data = await Sixteentypeanswer.create({
            user_id,
            booking_id,
            dichotomy_type: questions[i].questions[j].single_dichotomies,
            facet_type: questions[i].questions[j].facet_type,
            sub_dichotomy: questions[i].questions[j].Sub_dichotomies,
            quesid: questions[i].questions[j].quesid,
            answer: answer[questions[i].questions[j].quesid],
            question_type: questions[i].section_name,
          });
        }
      }

      res.send({ msg: "User already exist", booking_id: booking_id });
      return;
    }
    const user = await User.create({
      email,
      name: user_name,
      surname: last_name,
      country,
      country_code,
      address_one,
      address_two,
      postal_code,
      city,
      state,
      qualification,
    });

    user_id = user._id;
    let generatePass = Math.random().toString().substr(2, 6);
    let password = bcrypt.hashSync(generatePass);

    const updateuser = await User.findOneAndUpdate(
      { email: email },
      { password: password }
    );

    const sendmessage = {
      username: user_name,
      surname: last_name,
      password: generatePass,
    };

    const file = "../view/enneagram_pass.ejs";
    const subject = "Login Credential";
    let attachment = "";

    sendEmailwithCertificate(
      email,
      "token",
      subject,
      file,
      sendmessage,
      attachment
    );
  } else {
    const updateuser = await User.updateOne(
      { _id: user_id },
      {
        name: user_name,
        surname: last_name,
        gender: gender,
        age: age,
        country: country,
        country_code: country_code,
        qualification: qualification,
        address_one: address_one,
        address_two: address_two,
        postal_code: postal_code,
        city: city,
        state: state,
      }
    );
  }

  if (!booking_id) {
    const result = await getBookingfun(user_id, questionnaire_id);
    booking_id = result._id;

    let questions = await SixteenTypeQuestionnaire.findOne({
      _id: questionnaire_id,
    });
    questions = questions.section;

    for (let i = 0; i < questions.length; i++) {
      for (let j = 0; j < questions[i].questions.length; j++) {
        const data = await Sixteentypeanswer.create({
          user_id,
          booking_id,
          dichotomy_type: questions[i].questions[j].single_dichotomies,
          facet_type: questions[i].questions[j].facet_type,
          sub_dichotomy: questions[i].questions[j].Sub_dichotomies,
          quesid: questions[i].questions[j].quesid,
          answer: answer[questions[i].questions[j].quesid],
          question_type: questions[i].section_name,
        });
      }
    }
  }

  // result code
  let single_dichotomies = {
    Perceiving: 0,
    Thinking: 0,
    Feeling: 0,
    Extraversion: 0,
    Introversion: 0,
    Judging: 0,
    Sensing: 0,
    Intuition: 0,
  };

  const result = await Sixteentypeanswer.aggregate([
    {
      $match: {
        booking_id: String(booking_id),
      },
    },
    {
      $group: {
        _id: "$dichotomy_type",
        total: { $sum: "$answer" },
      },
    },
  ]);

  result.map((ele) => {
    if (ele?._id == "Perceiving") {
      single_dichotomies.Perceiving = ele?.total;
    } else if (ele?._id == "Thinking") {
      single_dichotomies.Thinking = ele?.total;
    } else if (ele?._id == "Feeling") {
      single_dichotomies.Feeling = ele?.total;
    } else if (ele?._id == "Extraversion") {
      single_dichotomies.Extraversion = ele?.total;
    } else if (ele?._id == "Introversion") {
      single_dichotomies.Introversion = ele?.total;
    } else if (ele?._id == "Judging") {
      single_dichotomies.Judging = ele?.total;
    } else if (ele?._id == "Sensing") {
      single_dichotomies.Sensing = ele?.total;
    } else if (ele?._id == "Intuition") {
      single_dichotomies.Intuition = ele?.total;
    }
  });

  let sub_dichotomy = {
    Reserved: 0,
    Outgoing: 0,
    Intimate: 0,
    Gregarious: 0,
    Private: 0,
    Companionable: 0,
    Gentle: 0,
    Forceful: 0,
    Abstract: 0,
    Concrete: 0,
    Practical: 0,
    Conceptual: 0,
    Traditional: 0,
    Cognitive: 0,
    Pragmatic: 0,
    Inventive: 0,
    Logical: 0,
    Empathetic: 0,
    Objective: 0,
    Personal: 0,
    Tough: 0,
    Considerate: 0,
    Organized_T: 0,
    Adaptable: 0,
    Orderly: 0,
    Open_ended: 0,
    Organized_J: 0,
    Casual: 0,
    Scheduled: 0,
    Pressure_prompted: 0,
    Confirming: 0,
    Questioning: 0,
  };

  const sub_result = await Sixteentypeanswer.aggregate([
    {
      $match: {
        booking_id: String(booking_id),
      },
    },
    {
      $group: {
        _id: "$sub_dichotomy",
        total: { $sum: "$answer" },
      },
    },
  ]);

  sub_result.map((ele) => {
    if (ele?._id == "Reserved") {
      sub_dichotomy.Reserved = ele?.total;
    } else if (ele?._id == "Outgoing") {
      sub_dichotomy.Outgoing = ele?.total;
    } else if (ele?._id == "Intimate") {
      sub_dichotomy.Intimate = ele?.total;
    } else if (ele?._id == "Gregarious") {
      sub_dichotomy.Gregarious = ele?.total;
    } else if (ele?._id == "Private") {
      sub_dichotomy.Private = ele?.total;
    } else if (ele?._id == "Companionable") {
      sub_dichotomy.Companionable = ele?.total;
    } else if (ele?._id == "Gentle") {
      sub_dichotomy.Gentle = ele?.total;
    } else if (ele?._id == "Forceful") {
      sub_dichotomy.Forceful = ele?.total;
    } else if (ele?._id == "Abstract") {
      sub_dichotomy.Abstract = ele?.total;
    } else if (ele?._id == "Concrete") {
      sub_dichotomy.Concrete = ele?.total;
    } else if (ele?._id == "Practical") {
      sub_dichotomy.Practical = ele?.total;
    } else if (ele?._id == "Conceptual") {
      sub_dichotomy.Conceptual = ele?.total;
    } else if (ele?._id == "Traditional") {
      sub_dichotomy.Traditional = ele?.total;
    } else if (ele?._id == "Cognitive") {
      sub_dichotomy.Cognitive = ele?.total;
    } else if (ele?._id == "Pragmatic") {
      sub_dichotomy.Pragmatic = ele?.total;
    } else if (ele?._id == "Inventive") {
      sub_dichotomy.Inventive = ele?.total;
    } else if (ele?._id == "Logical") {
      sub_dichotomy.Logical = ele?.total;
    } else if (ele?._id == "Empathetic") {
      sub_dichotomy.Empathetic = ele?.total;
    } else if (ele?._id == "Objective") {
      sub_dichotomy.Objective = ele?.total;
    } else if (ele?._id == "Personal") {
      sub_dichotomy.Personal = ele?.total;
    } else if (ele?._id == "Tough") {
      sub_dichotomy.Tough = ele?.total;
    } else if (ele?._id == "Considerate") {
      sub_dichotomy.Considerate = ele?.total;
    } else if (ele?._id == "Organized_J") {
      sub_dichotomy.Organized_J = ele?.total;
    } else if (ele?._id == "Adaptable") {
      sub_dichotomy.Adaptable = ele?.total;
    } else if (ele?._id == "Orderly") {
      sub_dichotomy.Orderly = ele?.total;
    } else if (ele?._id == "Open-ended") {
      sub_dichotomy.Open_ended = ele?.total;
    } else if (ele?._id == "Organized_T") {
      sub_dichotomy.Organized_T = ele?.total;
    } else if (ele?._id == "Casual") {
      sub_dichotomy.Casual = ele?.total;
    } else if (ele?._id == "Scheduled") {
      sub_dichotomy.Scheduled = ele?.total;
    } else if (ele?._id == "Pressure-prompted") {
      sub_dichotomy.Pressure_prompted = ele?.total;
    } else if (ele?._id == "Confirming") {
      sub_dichotomy.Confirming = ele?.total;
    } else if (ele?._id == "Questioning") {
      sub_dichotomy.Questioning = ele?.total;
    }
  });

  // personality type
  let the_champion_ENFP =
    single_dichotomies.Extraversion +
    single_dichotomies.Intuition +
    single_dichotomies.Feeling +
    single_dichotomies.Perceiving;
  let the_performer_ESFP =
    single_dichotomies.Extraversion +
    single_dichotomies.Sensing +
    single_dichotomies.Feeling +
    single_dichotomies.Perceiving;
  let the_teacher_ENFJ =
    single_dichotomies.Extraversion +
    single_dichotomies.Intuition +
    single_dichotomies.Feeling +
    single_dichotomies.Judging;
  let the_provider_ESFJ =
    single_dichotomies.Extraversion +
    single_dichotomies.Sensing +
    single_dichotomies.Feeling +
    single_dichotomies.Judging;
  let the_healer_INFP =
    single_dichotomies.Introversion +
    single_dichotomies.Intuition +
    single_dichotomies.Feeling +
    single_dichotomies.Perceiving;
  let the_inventor_ENTP =
    single_dichotomies.Extraversion +
    single_dichotomies.Intuition +
    single_dichotomies.Thinking +
    single_dichotomies.Perceiving;
  let the_dynamo_ESTP =
    single_dichotomies.Extraversion +
    single_dichotomies.Sensing +
    single_dichotomies.Thinking +
    single_dichotomies.Perceiving;
  let the_composer_ISFP =
    single_dichotomies.Introversion +
    single_dichotomies.Sensing +
    single_dichotomies.Feeling +
    single_dichotomies.Perceiving;
  let the_counselor_INFJ =
    single_dichotomies.Introversion +
    single_dichotomies.Intuition +
    single_dichotomies.Feeling +
    single_dichotomies.Judging;
  let the_commander_ENTJ =
    single_dichotomies.Extraversion +
    single_dichotomies.Intuition +
    single_dichotomies.Thinking +
    single_dichotomies.Judging;
  let the_protector_ISFJ =
    single_dichotomies.Introversion +
    single_dichotomies.Sensing +
    single_dichotomies.Feeling +
    single_dichotomies.Judging;
  let the_supervisor_ESTJ =
    single_dichotomies.Extraversion +
    single_dichotomies.Sensing +
    single_dichotomies.Thinking +
    single_dichotomies.Judging;
  let the_architect_INTP =
    single_dichotomies.Introversion +
    single_dichotomies.Intuition +
    single_dichotomies.Thinking +
    single_dichotomies.Perceiving;
  let the_craftsman_ISTP =
    single_dichotomies.Introversion +
    single_dichotomies.Sensing +
    single_dichotomies.Thinking +
    single_dichotomies.Perceiving;
  let the_mastermind_INTJ =
    single_dichotomies.Introversion +
    single_dichotomies.Intuition +
    single_dichotomies.Thinking +
    single_dichotomies.Judging;
  let the_inspector_ISTJ =
    single_dichotomies.Introversion +
    single_dichotomies.Sensing +
    single_dichotomies.Thinking +
    single_dichotomies.Judging;

  // sum of all personalities
  let sum_of_personalities =
    the_champion_ENFP +
    the_performer_ESFP +
    the_teacher_ENFJ +
    the_provider_ESFJ +
    the_healer_INFP +
    the_inventor_ENTP +
    the_dynamo_ESTP +
    the_composer_ISFP +
    the_counselor_INFJ +
    the_commander_ENTJ +
    the_protector_ISFJ +
    the_supervisor_ESTJ +
    the_architect_INTP +
    the_craftsman_ISTP +
    the_mastermind_INTJ +
    the_inspector_ISTJ;
  // temeperaments
  let the_guardians_SJ = Math.round(
    ((the_inspector_ISTJ +
      the_protector_ISFJ +
      the_supervisor_ESTJ +
      the_provider_ESFJ) *
      100) /
    sum_of_personalities
  );
  let the_artisans_SP = Math.round(
    ((the_performer_ESFP +
      the_dynamo_ESTP +
      the_composer_ISFP +
      the_craftsman_ISTP) *
      100) /
    sum_of_personalities
  );
  let the_rationals_NT = Math.round(
    ((the_inventor_ENTP +
      the_commander_ENTJ +
      the_architect_INTP +
      the_mastermind_INTJ) *
      100) /
    sum_of_personalities
  );
  let the_idealists_NF = Math.round(
    ((the_champion_ENFP +
      the_teacher_ENFJ +
      the_healer_INFP +
      the_counselor_INFJ) *
      100) /
    sum_of_personalities
  );

  // percentage
  the_champion_ENFP = Math.round((the_champion_ENFP * 100) / 320);
  the_performer_ESFP = Math.round((the_performer_ESFP * 100) / 320);
  the_teacher_ENFJ = Math.round((the_teacher_ENFJ * 100) / 320);
  the_provider_ESFJ = Math.round((the_provider_ESFJ * 100) / 320);
  the_healer_INFP = Math.round((the_healer_INFP * 100) / 320);
  the_inventor_ENTP = Math.round((the_inventor_ENTP * 100) / 320);
  the_dynamo_ESTP = Math.round((the_dynamo_ESTP * 100) / 320);
  the_composer_ISFP = Math.round((the_composer_ISFP * 100) / 320);
  the_counselor_INFJ = Math.round((the_counselor_INFJ * 100) / 320);
  the_commander_ENTJ = Math.round((the_commander_ENTJ * 100) / 320);
  the_protector_ISFJ = Math.round((the_protector_ISFJ * 100) / 320);
  the_supervisor_ESTJ = Math.round((the_supervisor_ESTJ * 100) / 320);
  the_architect_INTP = Math.round((the_architect_INTP * 100) / 320);
  the_craftsman_ISTP = Math.round((the_craftsman_ISTP * 100) / 320);
  the_mastermind_INTJ = Math.round((the_mastermind_INTJ * 100) / 320);
  the_inspector_ISTJ = Math.round((the_inspector_ISTJ * 100) / 320);

  single_dichotomies.Perceiving = Math.round(
    (single_dichotomies.Perceiving * 100) /
    (single_dichotomies.Judging + single_dichotomies.Perceiving)
  );
  single_dichotomies.Judging = 100 - single_dichotomies.Perceiving;
  single_dichotomies.Thinking = Math.round(
    (single_dichotomies.Thinking * 100) /
    (single_dichotomies.Feeling + single_dichotomies.Thinking)
  );
  single_dichotomies.Feeling = 100 - single_dichotomies.Thinking;
  single_dichotomies.Sensing = Math.round(
    (single_dichotomies.Sensing * 100) /
    (single_dichotomies.Intuition + single_dichotomies.Sensing)
  );
  single_dichotomies.Intuition = 100 - single_dichotomies.Sensing;
  single_dichotomies.Introversion = Math.round(
    (single_dichotomies.Introversion * 100) /
    (single_dichotomies.Extraversion + single_dichotomies.Introversion)
  );
  single_dichotomies.Extraversion = 100 - single_dichotomies.Introversion;

  sub_dichotomy.Reserved = Math.round(
    (sub_dichotomy.Reserved * 100) /
    (sub_dichotomy.Outgoing + sub_dichotomy.Reserved)
  );
  sub_dichotomy.Outgoing = 100 - sub_dichotomy.Reserved;
  sub_dichotomy.Intimate = Math.round(
    (sub_dichotomy.Intimate * 100) /
    (sub_dichotomy.Gregarious + sub_dichotomy.Intimate)
  );
  sub_dichotomy.Gregarious = 100 - sub_dichotomy.Intimate;
  sub_dichotomy.Private = Math.round(
    (sub_dichotomy.Private * 100) /
    (sub_dichotomy.Companionable + sub_dichotomy.Private)
  );
  sub_dichotomy.Companionable = 100 - sub_dichotomy.Private;
  sub_dichotomy.Gentle = Math.round(
    (sub_dichotomy.Gentle * 100) /
    (sub_dichotomy.Forceful + sub_dichotomy.Gentle)
  );
  sub_dichotomy.Forceful = 100 - sub_dichotomy.Gentle;
  sub_dichotomy.Concrete = Math.round(
    (sub_dichotomy.Concrete * 100) /
    (sub_dichotomy.Abstract + sub_dichotomy.Concrete)
  );
  sub_dichotomy.Abstract = 100 - sub_dichotomy.Concrete;
  sub_dichotomy.Practical = Math.round(
    (sub_dichotomy.Practical * 100) /
    (sub_dichotomy.Conceptual + sub_dichotomy.Practical)
  );
  sub_dichotomy.Conceptual = 100 - sub_dichotomy.Practical;
  sub_dichotomy.Traditional = Math.round(
    (sub_dichotomy.Traditional * 100) /
    (sub_dichotomy.Cognitive + sub_dichotomy.Traditional)
  );
  sub_dichotomy.Cognitive = 100 - sub_dichotomy.Traditional;
  sub_dichotomy.Pragmatic = Math.round(
    (sub_dichotomy.Pragmatic * 100) /
    (sub_dichotomy.Inventive + sub_dichotomy.Pragmatic)
  );
  sub_dichotomy.Inventive = 100 - sub_dichotomy.Pragmatic;
  sub_dichotomy.Logical = Math.round(
    (sub_dichotomy.Logical * 100) /
    (sub_dichotomy.Empathetic + sub_dichotomy.Logical)
  );
  sub_dichotomy.Empathetic = 100 - sub_dichotomy.Logical;
  sub_dichotomy.Objective = Math.round(
    (sub_dichotomy.Objective * 100) /
    (sub_dichotomy.Personal + sub_dichotomy.Objective)
  );
  sub_dichotomy.Personal = 100 - sub_dichotomy.Objective;
  sub_dichotomy.Tough = Math.round(
    (sub_dichotomy.Tough * 100) /
    (sub_dichotomy.Considerate + sub_dichotomy.Tough)
  );
  sub_dichotomy.Considerate = 100 - sub_dichotomy.Tough;
  sub_dichotomy.Organized_T = Math.round(
    (sub_dichotomy.Organized_T * 100) /
    (sub_dichotomy.Adaptable + sub_dichotomy.Organized_T)
  );
  sub_dichotomy.Adaptable = 100 - sub_dichotomy.Organized_T;
  sub_dichotomy.Orderly = Math.round(
    (sub_dichotomy.Orderly * 100) /
    (sub_dichotomy.Open_ended + sub_dichotomy.Orderly)
  );
  sub_dichotomy.Open_ended = 100 - sub_dichotomy.Orderly;
  sub_dichotomy.Organized_J = Math.round(
    (sub_dichotomy.Organized_J * 100) /
    (sub_dichotomy.Casual + sub_dichotomy.Organized_J)
  );
  sub_dichotomy.Casual = 100 - sub_dichotomy.Organized_J;
  sub_dichotomy.Scheduled = Math.round(
    (sub_dichotomy.Scheduled * 100) /
    (sub_dichotomy.Pressure_prompted + sub_dichotomy.Scheduled)
  );
  sub_dichotomy.Pressure_prompted = 100 - sub_dichotomy.Scheduled;
  sub_dichotomy.Confirming = Math.round(
    (sub_dichotomy.Confirming * 100) /
    (sub_dichotomy.Questioning + sub_dichotomy.Confirming)
  );
  sub_dichotomy.Questioning = 100 - sub_dichotomy.Confirming;

  // to get the greater personality type
  let personlality_types = [
    the_champion_ENFP,
    the_performer_ESFP,
    the_teacher_ENFJ,
    the_provider_ESFJ,
    the_healer_INFP,
    the_inventor_ENTP,
    the_dynamo_ESTP,
    the_composer_ISFP,
    the_counselor_INFJ,
    the_commander_ENTJ,
    the_protector_ISFJ,
    the_supervisor_ESTJ,
    the_architect_INTP,
    the_craftsman_ISTP,
    the_mastermind_INTJ,
    the_inspector_ISTJ,
  ];

  personlality_types.sort((a, b) => b - a);
  let personalityObj = [
    {
      number: the_champion_ENFP,
      graterflag: "ENFP",
      para: "You are a visionary and champion of ideas. With your contagious enthusiasm and boundless curiosity, you illuminate paths of creativity and innovation. Your empathetic nature and passion for connection make you a natural leader, inspiring others to embrace their unique journeys and pursue their dreams",
    },
    {
      number: the_performer_ESFP,
      graterflag: "ESFP",
      para: "You are the life of the party and a natural entertainer. With your vibrant energy and spontaneous nature, you infuse every moment with joy and excitement. Your outgoing personality and adaptability make you a magnetic presence, effortlessly connecting with others and bringing people together to celebrate life's moments",
    },
    {
      number: the_teacher_ENFJ,
      graterflag: "ENFJ",
      para: "You are a compassionate and charismatic leader. With your natural ability to inspire and empathize, you cultivate harmonious environments where everyone feels valued and supported. Your strong intuition and vision guide you in empowering others to reach their full potential, fostering meaningful connections and driving positive change",
    },
    {
      number: the_provider_ESFJ,
      graterflag: "ESFJ",
      para: "You are a nurturing and dependable caretaker. With your unwavering commitment to others, you create warm and inclusive spaces where everyone feels welcomed and supported. Your attention to detail and practical approach ensure that tasks are completed efficiently, while your empathy and sensitivity foster strong bonds and lasting relationships",
    },
    {
      number: the_healer_INFP,
      graterflag: "INFP",
      para: "You are a thoughtful and idealistic dreamer. With an innate sense of empathy and a deep appreciation for authenticity, you bring a unique perspective to every interaction. Your creativity and imagination ignite pathways to innovation, while your gentle spirit and compassion create safe havens for emotional expression and personal growth.",
    },
    {
      number: the_inventor_ENTP,
      graterflag: "ENTP",
      para: "You are a innovative and curious explorer. With a sharp intellect and boundless curiosity, you thrive on challenging the status quo and exploring new ideas. Your quick wit and strategic thinking make you a natural problem solver, while your charismatic charm and adaptability make you a captivating presence in any setting.",
    },
    {
      number: the_dynamo_ESTP,
      graterflag: "ESTP",
      para: "You are a bold and adventurous doer. With an innate knack for seizing opportunities and living in the moment, you thrive in dynamic and fast-paced environments. Your daring spirit and practical approach make you a natural problem solver, while your charisma and enthusiasm inspire others to embrace life's adventures alongside you.",
    },
    {
      number: the_composer_ISFP,
      graterflag: "ISFP",
      para: "You are a sensitive and artistic soul. With a deep appreciation for beauty and a keen eye for detail, you infuse creativity into every aspect of life. Your gentle nature and compassionate spirit foster meaningful connections, while your quiet strength and authenticity inspire others to embrace their own unique expressions of self.",
    },
    {
      number: the_counselor_INFJ,
      graterflag: "INFJ",
      para: "You are a insightful and empathetic counselor. With an innate ability to understand and uplift others, you create profound connections and foster emotional growth. Your visionary mindset and deep intuition guide you in navigating complex landscapes, while your unwavering compassion and authenticity inspire positive change in the world around you.",
    },
    {
      number: the_commander_ENTJ,
      graterflag: "ENTJ",
      para: "You are a strategic and visionary leader. With a commanding presence and a sharp analytical mind, you excel in driving progress and achieving ambitious goals. Your decisive nature and strong leadership skills inspire confidence and empower others to reach their full potential. With a focus on efficiency and innovation, you fearlessly navigate challenges and shape a path towards success.",
    },
    {
      // number: the_supervisor_ESTJ,
      number: the_protector_ISFJ,
      graterflag: "ISFJ",
      para: "You are a dependable and nurturing caregiver. With a steadfast dedication to supporting others, you create a sense of security and stability in every environment. Your attention to detail and meticulous planning ensure that tasks are executed flawlessly, while your warm-hearted nature and empathy foster deep connections and harmony within relationships. As a pillar of strength and reliability, you embody the essence of compassion and service.",
    },
    {
      // number: the_protector_ISFJ,
      number: the_supervisor_ESTJ,
      graterflag: "ESTJ",
      para: "You are a practical and efficient organizer. With a natural talent for planning and execution, you excel in leading with clarity and structure. Your strong sense of duty and commitment to excellence ensure that tasks are completed with precision and reliability. As a confident and decisive leader, you inspire trust and respect, driving teams toward success with your steadfast determination and unwavering focus on results",
    },
    {
      number: the_architect_INTP,
      graterflag: "INTP",
      para: "You are an analytical and inventive thinker. With a keen intellect and insatiable curiosity, you excel in unraveling complex puzzles and exploring new ideas. Your independent and creative approach to problem-solving inspires innovation and pushes the boundaries of possibility. As a deep thinker and visionary, you bring a unique perspective to every challenge, driving progress and igniting intellectual discourse with your boundless imagination.",
    },
    {
      number: the_craftsman_ISTP,
      graterflag: "ISTP",
      para: "You are a practical and adaptable problem solver. With a keen eye for detail and a natural knack for hands-on exploration, you thrive in navigating the complexities of the world around you. Your calm and collected demeanor, coupled with your resourceful nature, make you adept at finding innovative solutions to challenges. As a master of action and a lover of freedom, you embrace each opportunity with a sense of adventure, ready to tackle whatever comes your way with skill and precision.",
    },
    {
      number: the_mastermind_INTJ,
      graterflag: "INTJ",
      para: "You are a strategic and visionary mastermind. With a razor-sharp intellect and unparalleled foresight, you excel in devising long-term plans and navigating complex systems. Your analytical prowess and relentless pursuit of knowledge drive innovation and progress in every endeavor. As a natural leader and problem solver, you inspire others with your unwavering determination and ability to see the bigger picture, shaping a path towards success with clarity and precision.",
    },
    {
      number: the_inspector_ISTJ,
      graterflag: "ISTJ",
      para: "You are a dependable and methodical guardian. With a strong sense of duty and unwavering reliability, you ensure that tasks are completed with precision and efficiency. Your meticulous attention to detail and respect for tradition create stability and order in every environment. As a dedicated and trustworthy individual, you embody integrity and discipline, setting high standards and inspiring others to follow suit with your steadfast commitment to excellence.",
    },
  ];

  let personalityTypes = [
    {
      name: "ENFP",
      color: ["yellow", "#81539B", "#D2497C", "#F90"],
      title: "The Champion",
      percentage: the_champion_ENFP,
      dis: "ENFPs are enthusiastic and creative individuals who embrace possibilities, inspire others with their optimism, and value authenticity and connection.",
    },
    {
      name: "ESFP",
      color: ["yellow", "green", "#D2497C", "#F90"],
      title: "The Performer",
      percentage: the_performer_ESFP,
      dis: "ESFPs are vibrant and spontaneous individuals who thrive on excitement, bringing  joy and energy to every moment with their zest for life,creativity, and love of adventure.",
    },
    {
      name: "ENFJ",
      color: ["yellow", "#81539B", "#D2497C", "#F90"],
      title: "The Teacher",
      percentage: the_teacher_ENFJ,
      dis: "ENFJs are empathetic leaders who inspire and uplift others through their warmth, charisma, and dedication to serving the greater good.",
    },
    {
      name: "ESFJ",
      color: ["yellow", "green", "#D2497C", "#F90"],
      title: "The Provider",
      percentage: the_provider_ESFJ,
      dis: "ESFJs are nurturing individuals who thrive on creating harmony and supporting others with their.",
    },
    {
      name: "INFP",
      color: ["blue", "#81539B", "#D2497C", "#F90"],
      title: "The Healer",
      percentage: the_healer_INFP,
      dis: "INFPs are introspective and empathetic individuals who value authenticity, creativity, and meaningful connections, often inspiring others with their idealism, compassion, and unique perspective on the world.",
    },
    {
      name: "ENTP",
      color: ["yellow", "#81539B", "orange", "#F90"],
      title: "The Inventor",
      percentage: the_inventor_ENTP,
      dis: "ENTPs are innovative and intellectually curious individuals who thrive on exploring new ideas, challenging conventions, and finding creative solutions to complex problems with their sharp wit, ingenuity, and adaptability.",
    },
    {
      name: "ESTP",
      color: ["yellow", "green", "orange", "#F90"],
      title: "The Dynamo",
      percentage: the_dynamo_ESTP,
      dis: "ESTPs are bold and energetic individuals who embrace excitement and thrive in dynamic environments, often seizing opportunities and taking risks with their spontaneity, charm, and actionoriented mindset.",
    },
    {
      name: "ISFP",
      color: ["blue", "green", "#D2497C", "#F90"],
      title: "The Composer",
      percentage: the_composer_ISFP,
      dis: "ISFPs are artistic and sensitive individuals who thrive on selfexpression, embracing beauty, and experiencing life's sensory pleasures ISFPs are artistic and sensitive individuals who thrive on selfexpression, embracing beauty, and experiencing life's sensory pleasures.",
    },
    {
      name: "INFJ",
      color: ["blue", "#81539B", "#D2497C", "#F90"],
      title: "The Counselor",
      percentage: the_counselor_INFJ,
      dis: "INFJs are compassionate and insightful individuals who possess a deep understanding of human nature and a strong desire to make a positive difference in the world through their empathy, intuition, and vision.",
    },
    {
      name: "ENTJ",
      color: ["yellow", "#81539B", "orange", "#F90"],
      title: "The Commander",
      percentage: the_commander_ENTJ,
      dis: "ENTJs are driven and decisive leaders who excel in strategic planning, execution, and achieving their ambitious goals with confidence and determination.",
    },
    {
      name: "ESTJ",
      color: ["yellow", "green", "orange", "#F90"],
      title: "The Supervisor",
      percentage: the_supervisor_ESTJ,
      dis: " ESTJs are efficient and organized individuals who excel in leadership roles, bringing structure, responsibility, and practicality to every task with their strong work ethic and commitment to excellence.",
    },
    {
      name: "ISFJ",
      color: ["blue", "green", "#D2497C", "#F90"],
      title: "The Protector",
      percentage: the_protector_ISFJ,
      dis: "ISFJs are nurturing and dependable individuals who prioritize the well-being of others, offering steadfast support, loyalty, and reliability with their compassion, attention to detail, and strong sense of duty.",
    },
    {
      name: "INTP",
      color: ["blue", "#81539B", "orange", "#F90"],
      title: "The Architect",
      percentage: the_architect_INTP,
      dis: "INTPs are analytical and innovative thinkers who enjoy exploring complex ideas, often delving into theoretical concepts and uncovering novel  solutions with their logical reasoning, curiosity, and independent nature.",
    },
    {
      name: "ISTP",
      color: ["blue", "green", "orange", "#F90"],
      title: "The Craftsman",
      percentage: the_craftsman_ISTP,
      dis: "ISTPs are adventurous and resourceful individuals who thrive in hands-on experiences,often mastering practical skills and problem-solving with their  adaptability, spontaneity, and keen sense of observation.",
    },
    {
      name: "INTJ",
      color: ["blue", "#81539B", "orange", "#F90"],
      title: "The Mastermind",
      percentage: the_mastermind_INTJ,
      dis: "INTJs are strategic and analytical individuals who excel in problem-solving and long-term planning, leveraging their visionary thinking, independence, and determination to achieve their goals with precision and insight.",
    },
    {
      name: "ISTJ",
      color: ["blue", "green", "orange", "#F90"],
      title: "The Inspector",
      percentage: the_inspector_ISTJ,
      dis: " ISTJs are practical and responsible individuals who value stability, order, and tradition, bringing reliability,diligence, and loyalty to every aspect of their lives with their strong sense of duty and commitment to excellence.",
    },
  ];

  const personalityTypes_sort = personalityTypes.sort((a, b) => {
    return b.percentage - a.percentage;
  });

  let greater_personality_type = personlality_types[0];
  let greater_var = "";
  for (let i = 0; i < personalityObj.length; i++) {
    if (personalityObj[i].number === greater_personality_type) {
      greater_var = personalityObj[i];
      break;
    }
  }
  //tempraments
  let tempraments = [
    the_guardians_SJ,
    the_artisans_SP,
    the_rationals_NT,
    the_idealists_NF,
  ];

  const update_booking = await Booking.findOneAndUpdate(
    { _id: booking_id },
    {
      count: 9,
      arrayscore: tempraments,
      about_type: greater_var.para,
      single_dichotomies: single_dichotomies,
      greater_var: greater_var,
    }
  );

  const book = await Booking.findOne({ _id: booking_id });

  // const date = new Date('Jan 18, 2021 08:37:00');
  // return;
  const date = new Date(book.createdAt);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: timeZone,
  };
  const formattedDate = date.toLocaleString("en-US", options);
  const pdfData = {
    user: user_name + " " + last_name,
    date: formattedDate,
    para: greater_var.para,
    personalityTypes: personalityTypes_sort,
    greater_var: greater_var.graterflag,
    single_dichotomies,
    sub_dichotomy,
    tempraments,
    the_champion_ENFP,
    the_performer_ESFP,
    the_teacher_ENFJ,
    the_provider_ESFJ,
    the_healer_INFP,
    the_inventor_ENTP,
    the_dynamo_ESTP,
    the_composer_ISFP,
    the_counselor_INFJ,
    the_commander_ENTJ,
    the_protector_ISFJ,
    the_supervisor_ESTJ,
    the_architect_INTP,
    the_craftsman_ISTP,
    the_mastermind_INTJ,
    the_inspector_ISTJ,
  };
  // pdf generater
  const pdfpath = path.join(
    __dirname,
    `../public/sixteentype_report/sixteen_type_report_${booking_id}.pdf`
  );
  const data = await GenerateSixteenTypePdf(
    "../view/sixteen_type_ques.ejs",
    pdfpath,
    pdfData
  );
  let pdfurl = `${process.env.hostPath}/sixteentype_report/sixteen_type_report_${booking_id}.pdf`;

  let createReport = await SixteenTypeReportData.create({
    user_id: user_id,
    questionnaire_id: questionnaire_id,
    booking_id: booking_id,
    user_name: user_name,
    last_name: last_name,
    email: email,
    gender: gender,
    age: age,
    country: country,
    qualification: qualification,
    reportName: "Your sixteen type personality test results",
    // invoice_number: invNum,
    reportUrl: pdfurl,
    // invoiceUrl: invoiceurl,
  });

  if (update_booking) {
    // res.send({ count: 8 },{arrayscore: pdfdata.arrayscore});
    res.status(StatusCodes.OK).json({
      count: 9,
      arrayscore: tempraments,
      about_type: greater_var.para,
      booking_id,
      user_id,
      user_name,
      pdfurl,
      pdfpath,
    });
  }
};

const userSixteenTypeReport = async (req, res) => {
  try {
    const report = await SixteenTypeReportData.find({
      user_id: req.body.user_id,
      questionnaire_id: req.body.questionnaire_id,
      report_status: true,
    });
    res.status(200).send({ reportData: report });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

const getAllBigFIveType = async (req, res) => {
  const Form = await BigFiveQuestionnaries.find({
    type: { $ne: "Personal Info" },
  }, { section: 0 });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

const getBigFIveQuestionnaire = async (req, res) => {
  const Form = await BigFiveQuestionnaries.findOne({ _id: req.params.id });

  if (Form == null) {
    throw new CustomError.NotFoundError(
      `No Question with id : ${req.params.id}`
    );
  }
  res.status(StatusCodes.OK).json({ Form });
};

// generate bigfivetype pdf
const GenerateBigFiveTypePdf = async (typeOfFile, filePath, answer) => {
  try {
    const template = fs.readFileSync(typeOfFile, "utf-8");
    const renderedTemplate = ejs.render(template, { answer });
    const compiledTemplate = handlebars.compile(renderedTemplate);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    // const browser = await puppeteer.launch();

    // const format = {
    //   width: '8.2in', // Width in inches
    //   height: '10.3in', // Height in inches
    // };

    const page = await browser.newPage();

    const htmlContent = compiledTemplate({ answer });
    await page.setContent(htmlContent);
    await page.pdf({
      path: filePath,
      printBackground: true,
      format: "A4",
      margin: {
        top: page.number == 1 ? "0mm" : "15mm",
        bottom: "15mm",
      },
    });
    await browser.close();

    // return 'PDF generated successfully!';
  } catch (error) {
    console.error(error);
  }
}

const get_bigfive_result = async (req, res) => {
  let email = req.body.email;
  let user_name = req.body.user_name;
  let last_name = req.body.last_name;
  let gender = req?.body?.gender;
  let age = req?.body?.age;
  let country = req.body.country;
  let address_one = req.body.address_one;
  let address_two = req.body.address_two;
  let postal_code = req.body.postal_code;
  let city = req.body.city;
  let state = req.body.state;
  let country_code = req.body.country_code;
  let qualification = req?.body?.qualification;
  let user_id = req?.body?.user_id;
  let booking_id = req?.body?.booking_id;
  let questionnaire_id = req?.body?.questionnaire_id;
  let answer = req?.body?.answer;
  let timeZone = req?.body?.timeZone;

  if (!user_id) {
    const exist = await User.findOne({ email: email });
    if (exist) {

      const result = await getBookingfun(exist?._id, questionnaire_id);
      booking_id = result._id;

      let questions = await BigFiveQuestionnaries.findOne({ _id: questionnaire_id });
      questions = questions.section;

      for (let i = 0; i < questions.length; i++) {
        for (let j = 0; j < questions[i].questions.length; j++) {
          const data = await Bigfiveans.create({ user_id: exist._id, booking_id, factor: questions[i].questions[j].factor, quesid: questions[i].questions[j].quesid, answer: answer[questions[i].questions[j].quesid], question_type: questions[i].section_name })
        }
      }

      res.send({ msg: "User already exist", booking_id: booking_id });
      return;
    }
    const user = await User.create({ email, name: user_name, surname: last_name, country, country_code, address_one, address_two, postal_code, city, state, qualification, })
    user_id = user._id;
    let generatePass = Math.random().toString().substr(2, 6);
    let password = bcrypt.hashSync(generatePass);

    const updateuser = await User.findOneAndUpdate({ email: email }, { password: password });

    const sendmessage = {
      username: user_name,
      surname: last_name,
      password: generatePass,
    }

    const file = "../view/enneagram_pass.ejs";
    const subject = "Login Credential";
    let attachment = '';

    sendEmailwithCertificate(email, "token", subject, file, sendmessage, attachment, res);
  }
  else {
    const updateuser = await User.updateOne({ _id: user_id },
      {
        name: user_name, surname: last_name, gender: gender, age: age, country: country, country_code: country_code, qualification: qualification,
        address_one: address_one, address_two: address_two, postal_code: postal_code, city: city, state: state
      });
  }

  if (!booking_id) {
    const result = await getBookingfun(user_id, questionnaire_id);
    booking_id = result._id;
    let questions = await BigFiveQuestionnaries.findOne({ _id: questionnaire_id });
    questions = questions.section;
    for (let i = 0; i < questions.length; i++) {
      for (let j = 0; j < questions[i].questions.length; j++) {
        const data = await Bigfiveans.create({ user_id, booking_id, factor: questions[i].questions[j].factor, quesid: questions[i].questions[j].quesid, answer: answer[questions[i].questions[j].quesid], question_type: questions[i].section_name });
      }
    }

  }

  // result code
  let factor = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreableness: 0, Neuroticism: 0 };
  const result = await Bigfiveans.aggregate([
    {
      $match: {
        booking_id: String(booking_id)
      }
    },
    {
      $group: {
        _id: "$factor",
        total: { $sum: "$answer" }
      }
    }
  ]);

  result.map((ele) => {
    if (ele?._id == "Openness") {
      factor.Openness = ele?.total;
    }
    else if (ele?._id == "Conscientiousness") {
      factor.Conscientiousness = ele?.total;
    }
    else if (ele?._id == "Agreableness") {
      factor.Agreableness = ele?.total;
    }
    else if (ele?._id == "Extraversion") {
      factor.Extraversion = ele?.total;
    }
    else if (ele?._id == "Neuroticism") {
      factor.Neuroticism = ele?.total;
    }
  })
  // percentage
  const Openness_percentage = Math.round(factor.Openness / 55 * 100);
  const Conscientiousness_percentage = Math.round(factor.Conscientiousness / 55 * 100);
  const Agreableness_percentage = Math.round(factor.Agreableness / 55 * 100);
  const Extraversion_percentage = Math.round(factor.Extraversion / 55 * 100);
  const Neuroticism_percentage = Math.round(factor.Neuroticism / 55 * 100);

  const percentage = { Openness_percentage: Openness_percentage, Conscientiousness_percentage: Conscientiousness_percentage, Agreableness_percentage: Agreableness_percentage, Extraversion_percentage: Extraversion_percentage, Neuroticism_percentage: Neuroticism_percentage }

  const factor_variant = { LO: 5, HO: 5, HC: 5, LC: 5, HE: 5, LE: 5, HA: 5, LA: 5, LN: 5, HN: 5 };
  if (Openness_percentage <= 60) {
    factor_variant.LO = factor.Openness;
  }
  else {
    factor_variant.HO = factor.Openness;
  }
  if (Conscientiousness_percentage <= 60) {
    factor_variant.LC = factor.Conscientiousness;
  }
  else {
    factor_variant.HC = factor.Conscientiousness;
  }
  if (Agreableness_percentage <= 60) {
    factor_variant.LA = factor.Agreableness;
  }
  else {
    factor_variant.HA = factor.Agreableness;
  }
  if (Extraversion_percentage <= 60) {
    factor_variant.LE = factor.Extraversion;
  }
  else {
    factor_variant.HE = factor.Extraversion;
  }
  if (Neuroticism_percentage <= 60) {
    factor_variant.LN = factor.Neuroticism;
  }
  else {
    factor_variant.HN = factor.Neuroticism;
  }
  //  combinat
  let EI = factor_variant.HO + factor_variant.LE;
  let DA = factor_variant.HC + factor_variant.LA;
  let EE = factor_variant.LC + factor_variant.LN;
  let ERFS = factor_variant.LC + factor_variant.HN;

  let SC = factor_variant.HE + factor_variant.HA;
  let IO = factor_variant.LE + factor_variant.LA;
  let AL = factor_variant.HE + factor_variant.LA;
  let EL = factor_variant.LE + factor_variant.HA;

  let EIN = factor_variant.HE + factor_variant.HO;
  let TC = factor_variant.LE + factor_variant.HC;
  let CC = factor_variant.LN + factor_variant.HO;
  let EC = factor_variant.HA + factor_variant.HN;

  let CO = factor_variant.HE + factor_variant.LN;
  let RS = factor_variant.HN + factor_variant.LA;
  let SGI = factor_variant.LO + factor_variant.LN;
  let CA = factor_variant.HC + factor_variant.LN;

  let RA = factor_variant.HC + factor_variant.HE;
  let CE = factor_variant.HO + factor_variant.LC;
  let SPC = factor_variant.HC + factor_variant.HA;
  let ERE = factor_variant.LC + factor_variant.HE;

  let DOP = factor_variant.HC + factor_variant.HN;
  let IA = factor_variant.LC + factor_variant.LE;
  let PF = factor_variant.HA + factor_variant.LN;
  let IE = factor_variant.LC + factor_variant.LA;

  let RSO = factor_variant.HE + factor_variant.HN;
  let GOT = factor_variant.LO + factor_variant.HC;
  let RSR = factor_variant.LO + factor_variant.LC;
  let IAR = factor_variant.HO + factor_variant.HC;

  let TE = factor_variant.LO + factor_variant.HN;
  let IEN = factor_variant.LA + factor_variant.LN;
  let RSC = factor_variant.LE + factor_variant.HN;
  let EINO = factor_variant.HO + factor_variant.HA;

  let GO = factor_variant.LO + factor_variant.LE;
  let SUT = factor_variant.LO + factor_variant.HA;
  let SOT = factor_variant.LO + factor_variant.HE;
  let TI = factor_variant.LE + factor_variant.LN;

  let SI = factor_variant.HO + factor_variant.HN;
  let CM = factor_variant.HO + factor_variant.LA;
  let RI = factor_variant.LO + factor_variant.LA;
  let HP = factor_variant.LC + factor_variant.HA;

  //  patterns
  const core_pattern = { EI: EI, DA: DA, EE: EE, ERFS: ERFS };
  const interpersonal_pattern = { SC: SC, IO: IO, AL: AL, EL, EL };
  const communication_pattern = { EIN: EIN, TC: TC, CC: CC, EC: EC };
  const motivation_pattern = { DA: RA, CE: CE, SC: SPC, EE: ERE };
  const productivity_pattern = { DOP: DOP, IA: IA, PF: PF, IE: IE };
  const rewards_pattern = { RSO: RSO, GOT: GOT, RSR: RSR, IA: IAR };
  const esteem_pattern = { TE: TE, IE: IEN, RSC: RSC, EI: EINO };
  const social_pattern = { GO: GO, SUT: SUT, SOT: SOT, TI: TI };
  const collaboration_innovation_pattern = { SI: SI, CM: CM, RI: RI, HP: HP };
  const emotional_pattern = { CO: CO, RS: RS, SGI: SGI, CA: CA }

  // all patterns
  const patterns = [{ core_pattern: core_pattern }, { interpersonal_pattern: interpersonal_pattern }, { communication_pattern: communication_pattern }, { motivation_pattern: motivation_pattern }, { productivity_pattern: productivity_pattern }, { rewards_pattern: rewards_pattern }, { esteem_pattern: esteem_pattern }, { social_pattern: social_pattern }, { collaboration_innovation_pattern: collaboration_innovation_pattern }, { emotional_pattern: emotional_pattern }]
  // PDF GENERATE

  const update_booking = await Booking.findOneAndUpdate(
    { _id: booking_id },
    {
      count: 7,
      arrayscore: percentage,
      // about_type: greater_var.para,
      // single_dichotomies: single_dichotomies,
      // greater_var: greater_var,
    }
  );

  const book = await Booking.findOne(
    { _id: booking_id },
  );
  // const date = new Date('Jan 18, 2021 08:37:00');
  const date = new Date(book.createdAt);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: timeZone,
  };
  const formattedDate = date.toLocaleString('en-US', options);
  let pdfdata = {
    user_name: user_name + ' ' + last_name,
    formattedDate: formattedDate,
    percentage: percentage,
    factor_variant: factor_variant,
    core_pattern: core_pattern,
    interpersonal_pattern: interpersonal_pattern,
    communication_pattern: communication_pattern,
    motivation_pattern: motivation_pattern,
    productivity_pattern: productivity_pattern,
    rewards_pattern: rewards_pattern,
    esteem_pattern: esteem_pattern,
    social_pattern: social_pattern,
    collaboration_innovation_pattern: collaboration_innovation_pattern,
    emotional_pattern: emotional_pattern
  }

  const pdfpath = path.join(
    __dirname,
    `../public/bigfivetype_report/bigfivetype_report_${booking_id}.pdf`
  );
  const data = await GenerateBigFiveTypePdf('../view/bigfivetype_report.ejs', pdfpath, pdfdata);

  let pdfurl = `${process.env.hostPath}/bigfivetype_report/bigfivetype_report_${booking_id}.pdf`;

  let createReport = await BigFiveReportData.create({
    user_id: user_id,
    questionnaire_id: questionnaire_id,
    booking_id: booking_id,
    user_name: user_name,
    last_name: last_name,
    email: email,
    gender: gender,
    age: age,
    country: country,
    qualification: qualification,
    reportName: "Your big five personality test results",
    // invoice_number: invNum,
    reportUrl: pdfurl,
    // invoiceUrl: invoiceurl,
  });

  if (update_booking) {
    // res.send({ count: 8 },{arrayscore: pdfdata.arrayscore});
    res.status(StatusCodes.OK).json({
      count: 7,
      arrayscore: percentage,
      // about_type: greater_var.para,
      booking_id,
      user_id,
      user_name,
      pdfurl,
      pdfpath,
    });
  }

}

// const testPdf = async (typeOfFile, filePath, answer, res) => {
//   try {
//     const template = fs.readFileSync(typeOfFile, "utf-8");
//     const renderedTemplate = ejs.render(template, { answer });
//     const compiledTemplate = handlebars.compile(renderedTemplate);
//     //const browser = await puppeteer.launch({
//      // headless: true,
//      // executablePath: "/snap/bin/chromium",
//      // args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     //});
//      const browser = await puppeteer.launch();

//     // const format = {
//     //   width: '8.2in', // Width in inches
//     //   height: '10.3in', // Height in inches
//     // };

//     const page = await browser.newPage();

//     const htmlContent = compiledTemplate({ answer });
//     await page.setContent(htmlContent);
//     await page.pdf({
//       path: filePath,
//       printBackground: true,
//       format: "A4",
//       margin: {
//         top: page.number == 1 ? "0mm" : "15mm",
//         bottom: "15mm",
//       },
//     });
//     await browser.close();

//     return 'PDF generated successfully!';
//   } catch (error) {
//     // console.error('error:',error);
//     return res.status(400).send(error?.message);
//   }
// }

// const testPdfCreate = async (req, res) => {
//   const pdfdata = "test"
//   const pdfpath = path.join(
//     __dirname,
//     `../public/Testpdf.pdf`
//   );
//   const data = await testPdf('../view/testing.ejs', pdfpath, pdfdata, res);


//   let pdfurl = `${process.env.hostPath}/Testpdf.pdf`;
//   return res.status(200).send(pdfurl);
// }

const testPdf = async (typeOfFile, filePath, answer, res) => {
  try {
    // 1️⃣ Convert EJS to Static HTML
    const template = fs.readFileSync(typeOfFile, "utf-8");
    const renderedHtml = ejs.render(template, { answer });

    // 2️⃣ Generate PDF from HTML
    const options = {
      format: "A4",
      border: "10mm",
      childProcessOptions: {
        env: {
          OPENSSL_CONF: "/dev/null",
        },
      },
    };

    pdf.create(renderedHtml, options).toFile(filePath, (err, resPdf) => {
      if (err) {
        return res.status(500).send("PDF generation failed");
      }

      let pdfurl = `${process.env.hostPath}/Testpdf.pdf`;
      return res.status(200).send(pdfurl);
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return res.status(400).send(error?.message);
  }
};

const testPdfCreate = async (req, res) => {
  // try {
  //   const pdfdata = "test";
  //   const pdfpath = path.join(__dirname, "../public/Testpdf.pdf");

  //   await testPdf("../view/testing.ejs", pdfpath, pdfdata, res);
  // } catch (error) {
  //   console.error("testPdfCreate Error:", error);
  //   return res.status(500).send("Internal Server Error");
  // }
  let answer = "test";

  const htmlpath = path.join(
    __dirname,
    `../public/Testpdf.html`
  );
  const pdfpath = path.join(
    __dirname,
    `../public/Testpdf.pdf`
  );
  const filePath = path.join(__dirname, "../view/testing.ejs");

  ejs.renderFile(filePath, { answer }, (err, data) => {
    if (err) {
      console.log("Error rendering template:", err);
      return res.status(500).send(err);
    }

    fs.writeFile(htmlpath, data, (err) => {
      if (err) {
        console.error("Error writing HTML file:", err);
        return res.status(500).send(err);
      }

      console.log("HTML file saved successfully!");
      pdf
        .create(data, {
          format: "A4",
          width: "1600px",
          childProcessOptions: {
            env: {
              OPENSSL_CONF: "/dev/null",
            },
          },
        })
        .toFile(pdfpath, (err) => {
          if (err) {
            console.error("Error generating PDF:", err);
            return res.status(500).send(err);
          }

          fs.unlinkSync(htmlpath);
          const pdfUrl = `${process.env.hostPath}/Testpdf.pdf`;
          res.status(200).send({
            mssg: "PDF created successfully!",
            url: pdfUrl,
            pdfpath,
          });
        });
    });
  });
};

const userBigFiveReport = async (req, res) => {
  try {
    const report = await BigFiveReportData.find({
      user_id: req.body.user_id,
      questionnaire_id: req.body.questionnaire_id,
      report_status: true,
    });
    res.status(200).send({ reportData: report });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

const get_bigfive_count = async (req, res) => {
  let booking_id = req.body.booking_id;

  const booking_data = await Booking.findOne({ _id: booking_id });

  const data = booking_data.arrayscore[0];
  const formattedData = {
    Openness_percentage: data.Openness_percentage,
    Conscientiousness_percentage: data.Conscientiousness_percentage,
    Agreableness_percentage: data.Agreableness_percentage,
    Extraversion_percentage: data.Extraversion_percentage,
    Neuroticism_percentage: data.Neuroticism_percentage
  };

  if (booking_data.count == 7) {
    res.send({
      count: 7,
      arrayscore: formattedData,
      about_type: booking_data.about_type,
    });
    return;
  }

  const Form = await BigFiveQuestionnaries.find();
  let sections = Form[0].section;
  let count = 1;
  let section_one = 0;
  let section_two = 0;
  let section_three = 0;
  let section_four = 0;
  let section_five = 0;

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].section_name == "section one") {
      section_one = sections[i].questions.length;
    }
    if (sections[i].section_name == "section two") {
      section_two = sections[i].questions.length;
    }
    if (sections[i].section_name == "section three") {
      section_three = sections[i].questions.length;
    }
    if (sections[i].section_name == "section four") {
      section_four = sections[i].questions.length;
    }
    if (sections[i].section_name == "section five") {
      section_five = sections[i].questions.length;
    }
  }

  const one = await Bigfiveans.countDocuments({
    booking_id: booking_id,
    question_type: "section one",
  });
  const two = await Bigfiveans.countDocuments({
    booking_id: booking_id,
    question_type: "section two",
  });
  const three = await Bigfiveans.countDocuments({
    booking_id: booking_id,
    question_type: "section three",
  });
  const four = await Bigfiveans.countDocuments({
    booking_id: booking_id,
    question_type: "section four",
  });
  const five = await Bigfiveans.countDocuments({
    booking_id: booking_id,
    question_type: "section five",
  });

  if (one == section_one) {
    count = count + 1;
  }
  if (two == section_two) {
    count = count + 1;
  }
  if (three == section_three) {
    count = count + 1;
  }
  if (four == section_four) {
    count = count + 1;
  }
  if (five == section_five) {
    count = count + 1;
  }

  res.send({
    count: count,
    arrayscore: formattedData,
    about_type: booking_data.about_type,
  });
};

const get_bigfive_answers = async (req, res) => {
  let booking_id = req.body.booking_id;
  const answers = await Bigfiveans.find({ booking_id: booking_id });

  let obj = {};
  for (let i = 0; i < answers.length; i++) {
    obj = { ...obj, [answers[i].quesid]: answers[i].answer };
  }
  res.send(obj);
};

// Start DISC
const getDiscQuestionnaire = async (req, res) => {
  const Form = await DiscQuestionnaries.findOne({ _id: req.params.id });
  if (Form == null) {
    throw new CustomError.NotFoundError(
      `No Question with id : ${req.params.id}`
    );
  }
  res.status(StatusCodes.OK).json({ Form });
};

const getAllDiscType = async (req, res) => {
  const Form = await DiscQuestionnaries.find({
    type: { $ne: "Personal Info" },
  }, { section: 0 });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
};

// generate disc pdf
const GenerateDiscPdf = async (typeOfFile, filePath, answer) => {
  try {
    const template = fs.readFileSync(typeOfFile, "utf-8");
    const renderedTemplate = ejs.render(template, { answer });
    const compiledTemplate = handlebars.compile(renderedTemplate);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    // const browser = await puppeteer.launch();

    const page = await browser.newPage();

    const htmlContent = compiledTemplate({ answer });
    await page.setContent(htmlContent);
    await page.pdf({
      path: filePath,
      printBackground: true,
      format: "A4",
      margin: {
        top: page.number == 1 ? "0mm" : "15mm",
        bottom: "15mm",
      },
    });
    await browser.close();
  } catch (error) {
    console.error(error);
  }
}

function compareVerticalValues(Outgoing, Reserved) {
  if (Outgoing > Reserved) {
    return "Outgoing side";
  } else if (Reserved > Outgoing) {
    return "Reserved side";
  } else {
    return "BothAreEqual, vertical.";
  }
}

function compareHorizontalValues(PeopleOriented, TaskOriented) {
  if (PeopleOriented > TaskOriented) {
    return "PeopleOriented side";
  } else if (TaskOriented > PeopleOriented) {
    return "TaskOriented side";
  } else {
    return "BothAreEqual, horizontal.";
  }
}

function compareLargestInfluenceSector(I_D, I, I_S) {
  if (I_D >= I && I_D >= I_S) {
    return { "result": I_D, "largest": "ID", "userTypeOne": "I/d", "userTypeTwo": "Influence/Dominance", "userTypeThree": "Dominance", "userTypeFour": "Conscientiousness" };
  } else if (I >= I_D && I >= I_S) {
    return { "result": I, "largest": "I", "userTypeOne": "I", "userTypeTwo": "Influence", "userTypeThree": "Dominance", "userTypeFour": "Conscientiousness" };
  } else if (I_S >= I_D && I_S >= I) {
    return { "result": I_S, "largest": "IS", "userTypeOne": "I/s", "userTypeTwo": "Influence/Steadiness", "userTypeThree": "Dominance", "userTypeFour": "Conscientiousness" };
  }
}

function compareLargestDominanceSector(D_C, D, D_I) {
  if (D_C >= D && D_C >= D_I) {
    return { "result": D_C, "largest": "DC", "userTypeOne": "D/c", "userTypeTwo": "Dominance/Conscientiousness", "userTypeThree": "Conscientiousness", "userTypeFour": "Steadiness" };
  } else if (D >= D_C && D >= D_I) {
    return { "result": D, "largest": "D", "userTypeOne": "D", "userTypeTwo": "Dominance", "userTypeThree": "Conscientiousness", "userTypeFour": "Steadiness" };
  } else if (D_I >= D_C && D_I >= D) {
    return { "result": D_I, "largest": "DI", "userTypeOne": "D/i", "userTypeTwo": "Dominance/Influence", "userTypeThree": "Conscientiousness", "userTypeFour": "Steadiness" };
  }
}

function compareLargestSteadinessSector(S_I, S, S_C) {
  if (S_I >= S && S_I >= S_C) {
    return { "result": S_I, "largest": "SI", "userTypeOne": "S/i", "userTypeTwo": "Steadiness/Influence", "userTypeThree": "Influence", "userTypeFour": "Dominance" };
  } else if (S >= S_I && S >= S_C) {
    return { "result": S, "largest": "S", "userTypeOne": "S", "userTypeTwo": "Steadiness", "userTypeThree": "Influence", "userTypeFour": "Dominance" };
  } else if (S_C >= S_I && S_C >= S) {
    return { "result": S_C, "largest": "SC", "userTypeOne": "S/c", "userTypeTwo": "Steadiness/Conscientiousness", "userTypeThree": "Influence", "userTypeFour": "Dominance" };
  }
}

function compareLargestConscientiousnessSector(C_S, C, C_D) {
  if (C_S >= C && C_S >= C_D) {
    return { "result": C_S, "largest": "CS", "userTypeOne": "C/s", "userTypeTwo": "Conscientiousness/Steadiness", "userTypeThree": "Steadiness", "userTypeFour": "Influence" };
  } else if (C >= C_S && C >= C_D) {
    return { "result": C, "largest": "C", "userTypeOne": "C", "userTypeTwo": "Conscientiousness", "userTypeThree": "Steadiness", "userTypeFour": "Influence" };
  } else if (C_D >= C_S && C_D >= C) {
    return { "result": C_D, "largest": "CD", "userTypeOne": "C/d", "userTypeTwo": "Conscientiousness/Dominance", "userTypeThree": "Steadiness", "userTypeFour": "Influence" };
  }
}

const get_disc_result = async (req, res) => {
  let email = req.body.email;
  let user_name = req.body.user_name;
  let last_name = req.body.last_name;
  let gender = req?.body?.gender;
  let age = req?.body?.age;
  let country = req.body.country;
  let address_one = req.body.address_one;
  let address_two = req.body.address_two;
  let postal_code = req.body.postal_code;
  let city = req.body.city;
  let state = req.body.state;
  let country_code = req.body.country_code;
  let qualification = req?.body?.qualification;
  let user_id = req?.body?.user_id;
  let booking_id = req?.body?.booking_id;
  let questionnaire_id = req?.body?.questionnaire_id;
  let answer = req?.body?.answer;
  let timeZone = req?.body?.timeZone;

  if (!user_id) {
    const exist = await User.findOne({ email: email });
    if (exist) {

      const result = await getBookingfun(exist?._id, questionnaire_id);
      booking_id = result._id;

      let questions = await DiscQuestionnaries.findOne({ _id: questionnaire_id });
      questions = questions.section;

      for (let i = 0; i < questions.length; i++) {
        for (let j = 0; j < questions[i].questions.length; j++) {
          const data = await Discanswers.create({ user_id: exist._id, booking_id, usertype: questions[i].questions[j].usertype, quesid: questions[i].questions[j].quesid, answer: answer[questions[i].questions[j].quesid], question_type: questions[i].section_name })
        }
      }
      res.send({ msg: "User already exist", booking_id: booking_id });
      return;
    }
    const user = await User.create({ email, name: user_name, surname: last_name, country, country_code, address_one, address_two, postal_code, city, state, qualification, })
    user_id = user._id;
    let generatePass = Math.random().toString().substr(2, 6);
    let password = bcrypt.hashSync(generatePass);

    const updateuser = await User.findOneAndUpdate({ email: email }, { password: password });

    const sendmessage = {
      username: user_name,
      surname: last_name,
      password: generatePass,
    }

    const file = "../view/enneagram_pass.ejs";
    const subject = "Login Credential";
    let attachment = '';

    sendEmailwithCertificate(email, "token", subject, file, sendmessage, attachment, res);
  }
  else {
    const updateuser = await User.updateOne({ _id: user_id },
      {
        name: user_name, surname: last_name, gender: gender, age: age, country: country, country_code: country_code, qualification: qualification,
        address_one: address_one, address_two: address_two, postal_code: postal_code, city: city, state: state
      });
  }
  if (!booking_id) {
    const result = await getBookingfun(user_id, questionnaire_id);
    booking_id = result._id;
    let questions = await DiscQuestionnaries.findOne({ _id: questionnaire_id });
    questions = questions.section;
    for (let i = 0; i < questions.length; i++) {
      for (let j = 0; j < questions[i].questions.length; j++) {
        const data = await Discanswers.create({ user_id, booking_id, usertype: questions[i].questions[j].usertype, quesid: questions[i].questions[j].quesid, answer: answer[questions[i].questions[j].quesid], question_type: questions[i].section_name });
      }
    }
  }

  // result code
  let userType = {
    InfluenceDominance: 0,
    Influence: 0,
    InfluenceSteadiness: 0,
    SteadinessInfluence: 0,
    Steadiness: 0,
    SteadinessConscientiousness: 0,
    ConscientiousnessSteadiness: 0,
    Conscientiousness: 0,
    ConscientiousnessDominance: 0,
    DominanceConscientiousness: 0,
    Dominance: 0,
    DominanceInfluence: 0
  };

  let firstHybrid = {
    fhOne: "Influence",
    fhTwo: "Steadiness",
    fhThree: "Conscientiousness",
    fhFour: "Dominance",
  }

  let secondHybrid = {
    shOne: "Dominance",
    shTwo: "Steadiness",
    shThree: "Influence",
    shFour: "Conscientiousness",
  }

  let grandTotal = 0;

  const result = await Discanswers.aggregate([
    {
      $match: {
        booking_id: String(booking_id)
      }
    },
    {
      $group: {
        _id: "$usertype",
        total: { $sum: "$answer" }
      }
    },
    {
      $group: {
        _id: null,
        totals: { $push: { _id: "$_id", total: "$total" } },
        grandTotal: { $sum: "$total" }
      }
    }
  ]);

  if (result[0]) {
    result[0].totals.map(ele => {
      if (ele._id === "Influence(I)/Dominance(D)") {
        userType.InfluenceDominance = ele.total;
      }
      else if (ele?._id == "Influence") {
        userType.Influence = ele?.total;
      }
      else if (ele?._id == "Influence(I)/Steadiness(S)") {
        userType.InfluenceSteadiness = ele?.total;
      }
      else if (ele?._id == "Steadiness(S)/Influence(I)") {
        userType.SteadinessInfluence = ele?.total;
      }
      else if (ele?._id == "Steadiness") {
        userType.Steadiness = ele?.total;
      }
      else if (ele?._id == "Steadiness(S)/Conscientiousness(C)") {
        userType.SteadinessConscientiousness = ele?.total;
      }

      else if (ele?._id == "Conscientiousness(C)/Steadiness(S)") {
        userType.ConscientiousnessSteadiness = ele?.total;
      }
      else if (ele?._id == "Conscientiousness") {
        userType.Conscientiousness = ele?.total;
      }
      else if (ele?._id == "Conscientiousness(C)/Dominance(D)") {
        userType.ConscientiousnessDominance = ele?.total;
      }

      else if (ele?._id == "Dominance(D)/Conscientiousness(C)") {
        userType.DominanceConscientiousness = ele?.total;
      }
      else if (ele?._id == "Dominance") {
        userType.Dominance = ele?.total;
      }
      else if (ele?._id == "Dominance(D)/Influence(I)") {
        userType.DominanceInfluence = ele?.total;
      }
    });

    grandTotal = result[0].grandTotal;
  }

  // Calculating sum for each side and percentages:
  let Outgoing = (userType.InfluenceDominance + userType.Influence + userType.InfluenceSteadiness + userType.DominanceConscientiousness + userType.Dominance + userType.DominanceInfluence);
  let Reserved = (userType.SteadinessInfluence + userType.Steadiness + userType.SteadinessConscientiousness + userType.ConscientiousnessSteadiness + userType.Conscientiousness + userType.ConscientiousnessDominance);
  let PeopleOriented = (userType.InfluenceDominance + userType.Influence + userType.InfluenceSteadiness + userType.SteadinessInfluence + userType.Steadiness + userType.SteadinessConscientiousness);
  let TaskOriented = (userType.ConscientiousnessSteadiness + userType.Conscientiousness + userType.ConscientiousnessDominance + userType.DominanceConscientiousness + userType.Dominance + userType.DominanceInfluence);

  // percentage
  const Outgoing_percentage = Math.round(Outgoing / grandTotal * 100);
  const Reserved_percentage = Math.round(Reserved / grandTotal * 100);
  const PeopleOriented_percentage = Math.round(PeopleOriented / grandTotal * 100);
  const TaskOriented_percentage = Math.round(TaskOriented / grandTotal * 100);

  // According to side having bigger sum results a quadrant=type for the user:
  let GreaterUpDownSide = compareVerticalValues(Outgoing, Reserved);

  let GreaterLeftRightSide = compareHorizontalValues(PeopleOriented, TaskOriented);

  let Quadrant = "";
  if (GreaterUpDownSide == "Outgoing side" && GreaterLeftRightSide == "PeopleOriented side") {
    Quadrant = "I_type";
  } else if (GreaterUpDownSide == "Outgoing side" && GreaterLeftRightSide == "TaskOriented side") {
    Quadrant = "D_type";
  } else if (GreaterUpDownSide == "Reserved side" && GreaterLeftRightSide == "PeopleOriented side") {
    Quadrant = "S_type";
  } else if (GreaterUpDownSide == "Reserved side" && GreaterLeftRightSide == "TaskOriented side") {
    Quadrant = "C_type";
  } else if (GreaterUpDownSide == "BothAreEqual, vertical." && GreaterLeftRightSide == "PeopleOriented side") {
    Quadrant = "I_type";
  } else if (GreaterUpDownSide == "BothAreEqual, vertical." && GreaterLeftRightSide == "TaskOriented side") {
    Quadrant = "C_type";
  } else if (GreaterUpDownSide == "Outgoing side" && GreaterLeftRightSide == "BothAreEqual, horizontal.") {
    Quadrant = "I_type";
  } else if (GreaterUpDownSide == "Reserved side" && GreaterLeftRightSide == "BothAreEqual, horizontal.") {
    Quadrant = "S_type";
  } else if (GreaterUpDownSide == "BothAreEqual, vertical." && GreaterLeftRightSide == "BothAreEqual, horizontal.") {
    Quadrant = "I_type";
  }
  // Till report's section 5 calculation

  let greater_var = "";
  let personalityObj = [
    {
      name: "ID",
      graterflag: "Your DISC type is Influence/Dominance !",
      para: "Individuals with a hybrid Influence/Dominance DISC style often exhibit a unique blend of traits from both the Influence and Dominance styles. They are typically outgoing, sociable, and charismatic, with a natural ability to connect with others and influence their opinions. At the same time, they possess assertiveness, confidence, and a strong desire to take charge and lead others towards their goals."
    },
    {
      name: "I",
      graterflag: "Your DISC type is Influence !",
      para: "Individuals with an Influence DISC style are characterized by their sociability, enthusiasm, and natural ability to connect with others. They are often outgoing and charismatic, with a talent for building relationships and inspiring those around them. These individuals excel in roles that require persuasion, communication, and creativity, often serving as natural leaders who can rally teams towards a shared vision."
    },
    {
      name: "IS",
      graterflag: "Your DISC type is Influence/Steadiness !",
      para: "Individuals with a hybrid Influence/Steadiness DISC style possess a unique combination of traits from both the Influence and Steadiness styles. They are often sociable, outgoing, and energetic, enjoying interactions with others and seeking to build positive relationships. At the same time, they also exhibit qualities such as patience, reliability, and a desire for stability and harmony in their environment."
    },
    {
      name: "SI",
      graterflag: "Your DISC type is  Steadiness/Influence !",
      para: "Individuals with a hybrid Steadiness/Influence DISC style combine traits from both the Steadiness and Influence styles, resulting in a distinctive blend of characteristics. They are often warm, approachable, and people-oriented, valuing relationships and harmony in their interactions with others. At the same time, they also possess qualities such as reliability, patience, and a preference for stability and consistency in their environment."
    },
    {
      name: "S",
      graterflag: "Your DISC type is  Steadiness !",
      para: "Individuals with a Steadiness DISC style are characterized by their patience, reliability, and preference for stability and harmony. They are often supportive team members who excel in roles that require building relationships, fostering cooperation, and maintaining a sense of calm in challenging situations. These individuals prioritize loyalty and consistency in their interactions with others, and they are often valued for their empathetic and compassionate nature."
    },
    {
      name: "SC",
      graterflag: "Your DISC type is  Steadiness/Conscientiousness !",
      para: "Individuals with a hybrid Steadiness/Conscientiousness DISC style blend traits from both the Steadiness and Conscientiousness styles, creating a unique combination of characteristics. They are often reliable, detail-oriented, and methodical in their approach to tasks and responsibilities, valuing accuracy and precision in their work. At the same time, they also possess qualities such as patience, empathy, and a preference for stability and harmony in their interactions with others."
    },
    {
      name: "CS",
      graterflag: "Your DISC type is Conscientiousness/Steadiness !",
      para: "Individuals with a hybrid Conscientiousness/Steadiness DISC style combine traits from both the Conscientiousness and Steadiness styles, resulting in a unique blend of characteristics. They are often meticulous, organized, and detail-oriented, valuing accuracy and precision in their work. At the same time, they also possess qualities such as patience, reliability, and a preference for stability and consistency in their environment."
    },
    {
      name: "C",
      graterflag: "Your DISC type is Conscientiousness !",
      para: "Individuals with a Conscientiousness DISC style are characterized by their attention to detail, analytical thinking, and systematic approach to tasks. They are often methodical and organized, with a strong focus on accuracy and precision in their work. These individuals excel in roles that require careful planning, thorough analysis, and adherence to established procedures."
    },
    {
      name: "CD",
      graterflag: "Your DISC type is Conscientiousness/Dominance !",
      para: "Individuals with a hybrid Conscientiousness/Dominance DISC style merge traits from both the Conscientiousness and Dominance styles, crafting a unique blend of characteristics. They are often characterized by their analytical thinking, attention to detail, and preference for structure and organization. At the same time, they also exhibit assertiveness, decisiveness, and a desire to take charge and lead others towards their goals."
    },
    {
      name: "DC",
      graterflag: "Your DISC type is Dominance/Conscientiousness !",
      para: "Individuals with a hybrid Dominance/Conscientiousness DISC style blend traits from both the Dominance and Conscientiousness styles, resulting in a distinctive combination of characteristics. They are often characterized by their assertiveness, drive for achievement, and preference for taking charge and leading others towards their goals. At the same time, they also exhibit analytical thinking, attention to detail, and a desire for structure and organization in their approach to tasks and responsibilities."
    },
    {
      name: "D",
      graterflag: "Your DISC type is Dominance !",
      para: "Individuals with a Dominance DISC style are characterized by their assertiveness, confidence, and drive for achievement. They are often natural leaders who excel in roles that require making quick decisions, taking charge, and driving results. These individuals are decisive and goal-oriented, with a strong desire to lead and influence others towards success."
    },
    {
      name: "DI",
      graterflag: "Your DISC type is Dominance/Influence !",
      para: "Individuals with a hybrid Dominance/Influence DISC style merge traits from both the Dominance and Influence styles, creating a dynamic and assertive blend of characteristics. They are often characterized by their confidence, assertiveness, and natural ability to take charge and lead others towards their goals. At the same time, they also exhibit sociability, charisma, and a talent for influencing and persuading others."
    },
  ]

  let UTypeOne = "";
  let UsersType1 = "";
  let UsersType2 = "";
  let UsersType3 = "";
  let UsersType4 = "";
  let firstHybridType = "";
  let secondHybridType = "";

  // compare largest sector  
  let LargestInfluenceSector = "";
  if (Quadrant == "I_type") {
    LargestInfluenceSector = compareLargestInfluenceSector(userType.InfluenceDominance, userType.Influence, userType.InfluenceSteadiness);
    UTypeOne = LargestInfluenceSector?.largest;
    UsersType1 = LargestInfluenceSector?.userTypeOne;
    UsersType2 = LargestInfluenceSector?.userTypeTwo;
    UsersType3 = LargestInfluenceSector?.userTypeThree;
    UsersType4 = LargestInfluenceSector?.userTypeFour;
    // update first and second hybridtype
    if (LargestInfluenceSector?.largest == "ID") {
      firstHybridType = firstHybrid.fhOne;
      secondHybridType = secondHybrid.shOne;
    } else if (LargestInfluenceSector?.largest == "IS") {
      firstHybridType = firstHybrid.fhOne;
      secondHybridType = secondHybrid.shTwo;
    }

    for (let i = 0; i < personalityObj.length; i++) {
      if (personalityObj[i].name === LargestInfluenceSector?.largest) {
        greater_var = personalityObj[i];
        break;
      }
    }

    if (userType.InfluenceDominance >= LargestInfluenceSector?.result && LargestInfluenceSector?.largest !== "ID") {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.InfluenceDominance = largeRe;
    }
    if (userType.Influence >= LargestInfluenceSector?.result && LargestInfluenceSector?.largest !== "I") {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.Influence = largeRe;
    }
    if (userType.InfluenceSteadiness >= LargestInfluenceSector?.result && LargestInfluenceSector?.largest !== "IS") {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.InfluenceSteadiness = largeRe;
    }
    if (userType.SteadinessInfluence >= LargestInfluenceSector?.result) {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.SteadinessInfluence = largeRe;
    }
    if (userType.Steadiness >= LargestInfluenceSector?.result) {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.Steadiness = largeRe;
    }
    if (userType.SteadinessConscientiousness >= LargestInfluenceSector?.result) {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.SteadinessConscientiousness = largeRe;
    }
    if (userType.ConscientiousnessSteadiness >= LargestInfluenceSector?.result) {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.ConscientiousnessSteadiness = largeRe;
    }
    if (userType.Conscientiousness >= LargestInfluenceSector?.result) {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.Conscientiousness = largeRe;
    }
    if (userType.ConscientiousnessDominance >= LargestInfluenceSector?.result) {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.ConscientiousnessDominance = largeRe;
    }
    if (userType.DominanceConscientiousness >= LargestInfluenceSector?.result) {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.DominanceConscientiousness = largeRe;
    }
    if (userType.Dominance >= LargestInfluenceSector?.result) {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.Dominance = largeRe;
    }
    if (userType.DominanceInfluence >= LargestInfluenceSector?.result) {
      let largeRe = LargestInfluenceSector.result;
      largeRe -= 2;
      userType.DominanceInfluence = largeRe;
    }
  }

  let LargestDominanceSector = "";
  if (Quadrant == "D_type") {
    LargestDominanceSector = compareLargestDominanceSector(userType.DominanceConscientiousness, userType.Dominance, userType.DominanceInfluence);
    UTypeOne = LargestDominanceSector?.largest;
    UsersType1 = LargestDominanceSector?.userTypeOne;
    UsersType2 = LargestDominanceSector?.userTypeTwo;
    UsersType3 = LargestDominanceSector?.userTypeThree;
    UsersType4 = LargestDominanceSector?.userTypeFour;
    // update first and second hybridtype
    if (LargestDominanceSector?.largest == "DC") {
      firstHybridType = firstHybrid.fhFour;
      secondHybridType = secondHybrid.shFour;
    } else if (LargestDominanceSector?.largest == "DI") {
      firstHybridType = firstHybrid.fhFour;
      secondHybridType = secondHybrid.shThree;
    }

    for (let i = 0; i < personalityObj.length; i++) {
      if (personalityObj[i].name === LargestDominanceSector?.largest) {
        greater_var = personalityObj[i];
        break;
      }
    }

    if (userType.InfluenceDominance >= LargestDominanceSector?.result) {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.InfluenceDominance = largeRe;
    }
    if (userType.Influence >= LargestDominanceSector?.result) {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.Influence = largeRe;
    }
    if (userType.InfluenceSteadiness >= LargestDominanceSector?.result) {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.InfluenceSteadiness = largeRe;
    }
    if (userType.SteadinessInfluence >= LargestDominanceSector?.result) {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.SteadinessInfluence = largeRe;
    }
    if (userType.Steadiness >= LargestDominanceSector?.result) {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.Steadiness = largeRe;
    }
    if (userType.SteadinessConscientiousness >= LargestDominanceSector?.result) {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.SteadinessConscientiousness = largeRe;
    }
    if (userType.ConscientiousnessSteadiness >= LargestDominanceSector?.result) {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.ConscientiousnessSteadiness = largeRe;
    }
    if (userType.Conscientiousness >= LargestDominanceSector?.result) {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.Conscientiousness = largeRe;
    }
    if (userType.ConscientiousnessDominance >= LargestDominanceSector?.result) {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.ConscientiousnessDominance = largeRe;
    }
    if (userType.DominanceConscientiousness >= LargestDominanceSector?.result && LargestDominanceSector?.largest !== "DC") {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.DominanceConscientiousness = largeRe;
    }
    if (userType.Dominance >= LargestDominanceSector?.result && LargestDominanceSector?.largest !== "D") {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.Dominance = largeRe;
    }
    if (userType.DominanceInfluence >= LargestDominanceSector?.result && LargestDominanceSector?.largest !== "DI") {
      let largeRe = LargestDominanceSector.result;
      largeRe -= 2;
      userType.DominanceInfluence = largeRe;
    }
  }

  let LargestSteadinessSector = "";
  if (Quadrant == "S_type") {
    LargestSteadinessSector = compareLargestSteadinessSector(userType.SteadinessInfluence, userType.Steadiness, userType.SteadinessConscientiousness);
    UTypeOne = LargestSteadinessSector?.largest;
    UsersType1 = LargestSteadinessSector?.userTypeOne;
    UsersType2 = LargestSteadinessSector?.userTypeTwo;
    UsersType3 = LargestSteadinessSector?.userTypeThree;
    UsersType4 = LargestSteadinessSector?.userTypeFour;
    // update first and second hybridtype
    if (LargestSteadinessSector?.largest == "SI") {
      firstHybridType = firstHybrid.fhTwo;
      secondHybridType = secondHybrid.shThree;
    } else if (LargestSteadinessSector?.largest == "SC") {
      firstHybridType = firstHybrid.fhTwo;
      secondHybridType = secondHybrid.shFour;
    }

    for (let i = 0; i < personalityObj.length; i++) {
      if (personalityObj[i].name === LargestSteadinessSector?.largest) {
        greater_var = personalityObj[i];
        break;
      }
    }

    if (userType.InfluenceDominance >= LargestSteadinessSector?.result) {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.InfluenceDominance = largeRe;
    }
    if (userType.Influence >= LargestSteadinessSector?.result) {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.Influence = largeRe;
    }
    if (userType.InfluenceSteadiness >= LargestSteadinessSector?.result) {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.InfluenceSteadiness = largeRe;
    }
    if (userType.SteadinessInfluence >= LargestSteadinessSector?.result && LargestSteadinessSector?.largest !== "SI") {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.SteadinessInfluence = largeRe;
    }
    if (userType.Steadiness >= LargestSteadinessSector?.result && LargestSteadinessSector?.largest !== "S") {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.Steadiness = largeRe;
    }
    if (userType.SteadinessConscientiousness >= LargestSteadinessSector?.result && LargestSteadinessSector?.largest !== "SC") {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.SteadinessConscientiousness = largeRe;
    }
    if (userType.ConscientiousnessSteadiness >= LargestSteadinessSector?.result) {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.ConscientiousnessSteadiness = largeRe;
    }
    if (userType.Conscientiousness >= LargestSteadinessSector?.result) {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.Conscientiousness = largeRe;
    }
    if (userType.ConscientiousnessDominance >= LargestSteadinessSector?.result) {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.ConscientiousnessDominance = largeRe;
    }
    if (userType.DominanceConscientiousness >= LargestSteadinessSector?.result) {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.DominanceConscientiousness = largeRe;
    }
    if (userType.Dominance >= LargestSteadinessSector?.result) {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.Dominance = largeRe;
    }
    if (userType.DominanceInfluence >= LargestSteadinessSector?.result) {
      let largeRe = LargestSteadinessSector.result;
      largeRe -= 2;
      userType.DominanceInfluence = largeRe;
    }
  }

  let LargestConscientiousnessSector = "";
  if (Quadrant == "C_type") {
    LargestConscientiousnessSector = compareLargestConscientiousnessSector(userType.ConscientiousnessSteadiness, userType.Conscientiousness, userType.ConscientiousnessDominance);
    UTypeOne = LargestConscientiousnessSector?.largest;
    UsersType1 = LargestConscientiousnessSector?.userTypeOne;
    UsersType2 = LargestConscientiousnessSector?.userTypeTwo;
    UsersType3 = LargestConscientiousnessSector?.userTypeThree;
    UsersType4 = LargestConscientiousnessSector?.userTypeFour;
    // update first and second hybridtype
    if (LargestConscientiousnessSector?.largest == "CS") {
      firstHybridType = firstHybrid.fhThree;
      secondHybridType = secondHybrid.shTwo;
    } else if (LargestConscientiousnessSector?.largest == "CD") {
      firstHybridType = firstHybrid.fhThree;
      secondHybridType = secondHybrid.shOne;
    }

    for (let i = 0; i < personalityObj.length; i++) {
      if (personalityObj[i].name === LargestConscientiousnessSector?.largest) {
        greater_var = personalityObj[i];
        break;
      }
    }

    if (userType.InfluenceDominance >= LargestConscientiousnessSector?.result) {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.InfluenceDominance = largeRe;
    }
    if (userType.Influence >= LargestConscientiousnessSector?.result) {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.Influence = largeRe;
    }
    if (userType.InfluenceSteadiness >= LargestConscientiousnessSector?.result) {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.InfluenceSteadiness = largeRe;
    }
    if (userType.SteadinessInfluence >= LargestConscientiousnessSector?.result) {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.SteadinessInfluence = largeRe;
    }
    if (userType.Steadiness >= LargestConscientiousnessSector?.result) {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.Steadiness = largeRe;
    }
    if (userType.SteadinessConscientiousness >= LargestConscientiousnessSector?.result) {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.SteadinessConscientiousness = largeRe;
    }
    if (userType.ConscientiousnessSteadiness >= LargestConscientiousnessSector?.result && LargestConscientiousnessSector?.largest !== "CS") {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.ConscientiousnessSteadiness = largeRe;
    }
    if (userType.Conscientiousness >= LargestConscientiousnessSector?.result && LargestConscientiousnessSector?.largest !== "C") {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.Conscientiousness = largeRe;
    }
    if (userType.ConscientiousnessDominance >= LargestConscientiousnessSector?.result && LargestConscientiousnessSector?.largest !== "CD") {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.ConscientiousnessDominance = largeRe;
    }
    if (userType.DominanceConscientiousness >= LargestConscientiousnessSector?.result) {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.DominanceConscientiousness = largeRe;
    }
    if (userType.Dominance >= LargestConscientiousnessSector?.result) {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.Dominance = largeRe;
    }
    if (userType.DominanceInfluence >= LargestConscientiousnessSector?.result) {
      let largeRe = LargestConscientiousnessSector.result;
      largeRe -= 2;
      userType.DominanceInfluence = largeRe;
    }
  }

  const update_booking = await Booking.findOneAndUpdate(
    { _id: booking_id },
    {
      count: 6,
      arrayscore: userType,
      greater_var: greater_var,
    }
  );
  const book = await Booking.findOne(
    { _id: booking_id },
  );
  // const date = new Date('Jan 18, 2021 08:37:00');
  const date = new Date(book.createdAt);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: timeZone,
  };
  const formattedDate = date.toLocaleString('en-US', options);
  let pdfdata = {
    user_name: user_name + ' ' + last_name,
    formattedDate: formattedDate,
    percentage: userType,
    Outgoing_percentage: Outgoing_percentage,
    Reserved_percentage: Reserved_percentage,
    PeopleOriented_percentage: PeopleOriented_percentage,
    TaskOriented_percentage: TaskOriented_percentage,
    Quadrant: Quadrant,
    UTypeOne: UTypeOne,
    UsersType1: UsersType1,
    UsersType2: UsersType2,
    UsersType3: UsersType3,
    UsersType4: UsersType4,
    firstHybridType: firstHybridType,
    secondHybridType: secondHybridType,
    disc1img: `${process.env.hostPath}/uploads/DISC1.jpg`,
    disc2img: `${process.env.hostPath}/uploads/DISC2.jpg`,
    disc3img: `${process.env.hostPath}/uploads/DISC3.jpg`,
    disc4img: `${process.env.hostPath}/uploads/DISC4.jpg`,
    disc5img: `${process.env.hostPath}/uploads/DISC5.jpg`,
  }
  const pdfpath = path.join(
    __dirname,
    `../public/disc_report/disc_report_${booking_id}.pdf`
  );
  const data = await GenerateDiscPdf('../view/disc_report.ejs', pdfpath, pdfdata);

  let pdfurl = `${process.env.hostPath}/disc_report/disc_report_${booking_id}.pdf`;

  let createReport = await DiscReportData.create({
    user_id: user_id,
    questionnaire_id: questionnaire_id,
    booking_id: booking_id,
    user_name: user_name,
    last_name: last_name,
    email: email,
    gender: gender,
    age: age,
    country: country,
    qualification: qualification,
    reportName: "Your disc test results",
    // invoice_number: invNum,
    reportUrl: pdfurl,
    // invoiceUrl: invoiceurl,
  });


  if (update_booking) {
    res.status(StatusCodes.OK).json({
      count: 6,
      arrayscore: userType,
      booking_id,
      user_id,
      user_name,
      pdfurl,
      pdfpath,
    });
  }

}

const get_disc_count = async (req, res) => {
  let booking_id = req.body.booking_id;

  const booking_data = await Booking.findOne({ _id: booking_id });

  const data = booking_data.arrayscore[0];
  const formattedData = {
    InfluenceDominance: data?.InfluenceDominance,
    Influence: data?.Influence,
    InfluenceSteadiness: data?.InfluenceSteadiness,
    SteadinessInfluence: data?.SteadinessInfluence,
    Steadiness: data?.Steadiness,
    SteadinessConscientiousness: data?.SteadinessConscientiousness,
    ConscientiousnessSteadiness: data?.ConscientiousnessSteadiness,
    Conscientiousness: data?.Conscientiousness,
    ConscientiousnessDominance: data?.ConscientiousnessDominance,
    DominanceConscientiousness: data?.DominanceConscientiousness,
    Dominance: data?.Dominance,
    DominanceInfluence: data?.DominanceInfluence
  };

  if (booking_data.count == 6) {
    res.send({
      count: 6,
      arrayscore: formattedData,
      greater_var: booking_data.greater_var,
    });
    return;
  }

  const Form = await DiscQuestionnaries.find();
  let sections = Form[0].section;
  let count = 1;
  let section_one = 0;
  let section_two = 0;
  let section_three = 0;
  let section_four = 0;

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].section_name == "section one") {
      section_one = sections[i].questions.length;
    }
    if (sections[i].section_name == "section two") {
      section_two = sections[i].questions.length;
    }
    if (sections[i].section_name == "section three") {
      section_three = sections[i].questions.length;
    }
    if (sections[i].section_name == "section four") {
      section_four = sections[i].questions.length;
    }
  }

  const one = await Discanswers.countDocuments({
    booking_id: booking_id,
    question_type: "section one",
  });
  const two = await Discanswers.countDocuments({
    booking_id: booking_id,
    question_type: "section two",
  });
  const three = await Discanswers.countDocuments({
    booking_id: booking_id,
    question_type: "section three",
  });
  const four = await Discanswers.countDocuments({
    booking_id: booking_id,
    question_type: "section four",
  });

  if (one == section_one) {
    count = count + 1;
  }
  if (two == section_two) {
    count = count + 1;
  }
  if (three == section_three) {
    count = count + 1;
  }
  if (four == section_four) {
    count = count + 1;
  }

  res.send({
    count: count,
    arrayscore: formattedData,
  });
};

const get_disc_answers = async (req, res) => {
  let booking_id = req.body.booking_id;
  const answers = await Discanswers.find({ booking_id: booking_id });

  let obj = {};
  for (let i = 0; i < answers.length; i++) {
    obj = { ...obj, [answers[i].quesid]: answers[i].answer };
  }
  res.send(obj);
};

const userDiscReport = async (req, res) => {
  try {
    const report = await DiscReportData.find({
      user_id: req.body.user_id,
      questionnaire_id: req.body.questionnaire_id,
      report_status: true,
    });
    res.status(200).send({ reportData: report });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

// Start Career Aptitude
const getAllCareerAptitude = async (req, res) => {
  const Form = await CareerAptitudeQuestionnaire.find({
    type: { $ne: "Personal Info" },
  }, { section: 0 });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question Found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
}

const getCareerAptitudeQuestionnaire = async (req, res) => {
  const Form = await CareerAptitudeQuestionnaire.findOne({ _id: req.params.id });
  if (Form == null) {
    throw new CustomError.NotFoundError(
      `No Question with id : ${req.params.id}`
    );
  }
  res.status(StatusCodes.OK).json({ Form });
};

const GenerateCareerAptitudePdf = async (typeOfFile, filePath, answer) => {
  try {
    const template = fs.readFileSync(typeOfFile, "utf-8");
    const renderedTemplate = ejs.render(template, { answer });
    const compiledTemplate = handlebars.compile(renderedTemplate);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/snap/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    // const browser = await puppeteer.launch();

    // const format = {
    //   width: '8.2in', // Width in inches
    //   height: '10.3in', // Height in inches
    // };

    const page = await browser.newPage();

    const htmlContent = compiledTemplate({ answer });
    await page.setContent(htmlContent);
    await page.pdf({
      path: filePath,
      printBackground: true,
      format: "A4",
      margin: {
        top: page.number == 1 ? "0mm" : "15mm",
        bottom: "15mm",
      },
    });
    await browser.close();

    // return 'PDF generated successfully!';
  } catch (error) {
    console.error(error);
  }
}

function compareLargesthollandPattern(Building, Thinking, Creating, Helping, Persuading, Organizing) {
  if (Building >= Thinking && Building >= Creating && Building >= Helping && Building >= Persuading && Building >= Organizing) {
    return { "result": Building, "largest": "Building" };
  } else if (Thinking >= Building && Thinking >= Creating && Thinking >= Helping && Thinking >= Persuading && Thinking >= Organizing) {
    return { "result": Thinking, "largest": "Thinking" };
  } else if (Creating >= Building && Creating >= Thinking && Creating >= Helping && Creating >= Persuading && Creating >= Organizing) {
    return { "result": Creating, "largest": "Creating" };
  } else if (Helping >= Building && Helping >= Thinking && Helping >= Creating && Helping >= Persuading && Helping >= Organizing) {
    return { "result": Helping, "largest": "Helping" };
  } else if (Persuading >= Building && Persuading >= Thinking && Persuading >= Creating && Persuading >= Helping && Persuading >= Organizing) {
    return { "result": Persuading, "largest": "Persuading" };
  } else if (Organizing >= Building && Organizing >= Thinking && Organizing >= Creating && Organizing >= Helping && Organizing >= Persuading) {
    return { "result": Organizing, "largest": "Organizing" };
  }
}

function compareLargestCorePattern(EI, DA, EE, ERFS) {
  if (EI >= DA && EI >= EE && EI >= ERFS) {
    return { "result": EI, "largest": "EI" };
  } else if (DA >= EI && DA >= EE && DA >= ERFS) {
    return { "result": DA, "largest": "DA" };
  } else if (EE >= EI && EE >= DA && EE >= ERFS) {
    return { "result": EE, "largest": "EE" };
  } else if (ERFS >= EI && ERFS >= DA && ERFS >= EE) {
    return { "result": ERFS, "largest": "ERFS" };
  }
}

function compareLargestSocialPattern(GO, SUT, SOT, TI) {
  if (GO >= SUT && GO >= SOT && GO >= TI) {
    return { "result": GO, "largest": "GO" };
  } else if (SUT >= GO && SUT >= SOT && SUT >= TI) {
    return { "result": SUT, "largest": "SUT" };
  } else if (SOT >= GO && SOT >= SUT && SOT >= TI) {
    return { "result": SOT, "largest": "SOT" };
  } else if (TI >= GO && TI >= SUT && TI >= SOT) {
    return { "result": TI, "largest": "TI" };
  }
}

function compareLargestProductivityPattern(DOP, IA, PF, IE) {
  if (DOP >= IA && DOP >= PF && DOP >= IE) {
    return { "result": DOP, "largest": "DOP" };
  } else if (IA >= DOP && IA >= PF && IA >= IE) {
    return { "result": IA, "largest": "IA" };
  } else if (PF >= DOP && PF >= IA && PF >= IE) {
    return { "result": PF, "largest": "PF" };
  } else if (IE >= DOP && IE >= IA && IE >= PF) {
    return { "result": IE, "largest": "IE" };
  }
}

const get_careeraptitude_result = async (req, res) => {
  let email = req?.body?.email;
  let user_name = req?.body?.user_name;
  let last_name = req?.body?.last_name;
  let user_id = req?.body?.user_id;
  let booking_id = req?.body?.booking_id;
  let questionnaire_id = req?.body?.questionnaire_id;
  let answer = req?.body?.answer;

  if (!user_id) {
    const exist = await User.findOne({ email: email });
    if (exist) {

      const result = await getBookingfun(exist?._id, questionnaire_id);
      booking_id = result._id;

      let questions = await CareerAptitudeQuestionnaire.findOne({ _id: questionnaire_id });
      questions = questions.section;

      for (let i = 0; i < questions.length; i++) {
        for (let j = 0; j < questions[i].questions.length; j++) {
          const data = await CareerAptitudeAnswer.create({ user_id: exist._id, booking_id, factor: questions[i].questions[j].factor, hollandCodes: questions[i].questions[j].hollandCodes, quesid: questions[i].questions[j].quesid, answer: answer[questions[i].questions[j].quesid], question_type: questions[i].section_name })
        }
      }

      res.send({ msg: "User already exist", booking_id: booking_id });
      return;
    }
    const user = await User.create({ email })
    user_id = user._id;
    let generatePass = Math.random().toString().substr(2, 6);
    let password = bcrypt.hashSync(generatePass);

    await User.findOneAndUpdate({ email: email }, { password: password });

    const sendmessage = {
      username: email,
      surname: last_name,
      password: generatePass,
    }

    const file = "../view/enneagram_pass.ejs";
    const subject = "Login Credential";
    let attachment = '';

    sendEmailwithCertificate(email, "token", subject, file, sendmessage, attachment, res);
  }

  if (!booking_id) {
    const result = await getBookingfun(user_id, questionnaire_id);
    booking_id = result._id;
    let questions = await CareerAptitudeQuestionnaire.findOne({ _id: questionnaire_id });
    questions = questions.section;
    for (let i = 0; i < questions.length; i++) {
      for (let j = 0; j < questions[i].questions.length; j++) {
        const data = await CareerAptitudeAnswer.create({ user_id, booking_id, factor: questions[i].questions[j].factor, hollandCodes: questions[i].questions[j].hollandCodes, quesid: questions[i].questions[j].quesid, answer: answer[questions[i].questions[j].quesid], question_type: questions[i].section_name });
      }
    }

  }

  // result code
  let factor = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreableness: 0, Neuroticism: 0 };
  const result = await CareerAptitudeAnswer.aggregate([
    {
      $match: {
        booking_id: String(booking_id)
      }
    },
    {
      $group: {
        _id: "$factor",
        total: { $sum: "$answer" }
      }
    }
  ]);

  result.map((ele) => {
    if (ele?._id == "Openness") {
      factor.Openness = ele?.total;
    }
    else if (ele?._id == "Conscientiousness") {
      factor.Conscientiousness = ele?.total;
    }
    else if (ele?._id == "Agreableness") {
      factor.Agreableness = ele?.total;
    }
    else if (ele?._id == "Extraversion") {
      factor.Extraversion = ele?.total;
    }
    else if (ele?._id == "Neuroticism") {
      factor.Neuroticism = ele?.total;
    }
  });

  // factors percentage
  const Openness_percentage = Math.round(factor.Openness / 55 * 100);
  const Conscientiousness_percentage = Math.round(factor.Conscientiousness / 55 * 100);
  const Agreableness_percentage = Math.round(factor.Agreableness / 55 * 100);
  const Extraversion_percentage = Math.round(factor.Extraversion / 55 * 100);
  const Neuroticism_percentage = Math.round(factor.Neuroticism / 55 * 100);

  const factor_variant = { LO: 5, HO: 5, HC: 5, LC: 5, HE: 5, LE: 5, HA: 5, LA: 5, LN: 5, HN: 5 };
  if (Openness_percentage <= 60) {
    factor_variant.LO = factor.Openness;
  }
  else {
    factor_variant.HO = factor.Openness;
  }
  if (Conscientiousness_percentage <= 60) {
    factor_variant.LC = factor.Conscientiousness;
  }
  else {
    factor_variant.HC = factor.Conscientiousness;
  }
  if (Agreableness_percentage <= 60) {
    factor_variant.LA = factor.Agreableness;
  }
  else {
    factor_variant.HA = factor.Agreableness;
  }
  if (Extraversion_percentage <= 60) {
    factor_variant.LE = factor.Extraversion;
  }
  else {
    factor_variant.HE = factor.Extraversion;
  }
  if (Neuroticism_percentage <= 60) {
    factor_variant.LN = factor.Neuroticism;
  }
  else {
    factor_variant.HN = factor.Neuroticism;
  }
  //  combinat
  let EI = factor_variant.HO + factor_variant.LE;
  let DA = factor_variant.HC + factor_variant.LA;
  let EE = factor_variant.LC + factor_variant.LN;
  let ERFS = factor_variant.LC + factor_variant.HN;

  let SC = factor_variant.HE + factor_variant.HA;
  let IO = factor_variant.LE + factor_variant.LA;
  let AL = factor_variant.HE + factor_variant.LA;
  let EL = factor_variant.LE + factor_variant.HA;

  let EIN = factor_variant.HE + factor_variant.HO;
  let TC = factor_variant.LE + factor_variant.HC;
  let CC = factor_variant.LN + factor_variant.HO;
  let EC = factor_variant.HA + factor_variant.HN;

  let RA = factor_variant.HC + factor_variant.HE;
  let CE = factor_variant.HO + factor_variant.LC;
  let SPC = factor_variant.HC + factor_variant.HA;
  let ERE = factor_variant.LC + factor_variant.HE;

  let DOP = factor_variant.HC + factor_variant.HN;
  let IA = factor_variant.LC + factor_variant.LE;
  let PF = factor_variant.HA + factor_variant.LN;
  let IE = factor_variant.LC + factor_variant.LA;

  let SI = factor_variant.HO + factor_variant.HN;
  let CM = factor_variant.HO + factor_variant.LA;
  let RI = factor_variant.LO + factor_variant.LA;
  let HP = factor_variant.LC + factor_variant.HA;

  //  patterns
  const core_pattern = { EI: EI, DA: DA, EE: EE, ERFS: ERFS };
  const interpersonal_pattern = { SC: SC, IO: IO, AL: AL, EL, EL };
  const communication_pattern = { EIN: EIN, TC: TC, CC: CC, EC: EC };
  const motivation_pattern = { RA: RA, CE: CE, SPC: SPC, ERE: ERE };
  const productivity_pattern = { DOP: DOP, IA: IA, PF: PF, IE: IE };
  const collaboration_innovation_pattern = { SI: SI, CM: CM, RI: RI, HP: HP };

  // all patterns
  const style_patterns = [{ core_pattern: core_pattern }, { interpersonal_pattern: interpersonal_pattern }, { communication_pattern: communication_pattern }, { motivation_pattern: motivation_pattern }, { productivity_pattern: productivity_pattern }, { collaboration_innovation_pattern: collaboration_innovation_pattern }]
  // Holland codes scoring
  let holland_codes = { Building: 0, Thinking: 0, Creating: 0, Helping: 0, Persuading: 0, Organizing: 0 };
  const holland_codes_result = await CareerAptitudeAnswer.aggregate([
    {
      $match: {
        booking_id: String(booking_id)
      }
    },
    {
      $group: {
        _id: "$hollandCodes",
        total: { $sum: "$answer" }
      }
    }
  ]);

  holland_codes_result.map((ele) => {
    if (ele?._id == "Building") {
      holland_codes.Building = ele?.total;
    }
    else if (ele?._id == "Thinking") {
      holland_codes.Thinking = ele?.total;
    }
    else if (ele?._id == "Creating") {
      holland_codes.Creating = ele?.total;
    }
    else if (ele?._id == "Helping") {
      holland_codes.Helping = ele?.total;
    }
    else if (ele?._id == "Persuading") {
      holland_codes.Persuading = ele?.total;
    }
    else if (ele?._id == "Organizing") {
      holland_codes.Organizing = ele?.total;
    }
  });

  // holland codes percentage
  const Building_percentage = Math.round(holland_codes.Building / 55 * 100);
  const Thinking_percentage = Math.round(holland_codes.Thinking / 55 * 100);
  const Creating_percentage = Math.round(holland_codes.Creating / 55 * 100);
  const Helping_percentage = Math.round(holland_codes.Helping / 55 * 100);
  const Persuading_percentage = Math.round(holland_codes.Persuading / 55 * 100);
  const Organizing_percentage = Math.round(holland_codes.Organizing / 55 * 100);

  let hollandPercentage = [
    Building_percentage,
    Thinking_percentage,
    Creating_percentage,
    Helping_percentage,
    Persuading_percentage,
    Organizing_percentage
  ];

  // get larget holland
  let LargesthollandPattern = compareLargesthollandPattern(holland_codes.Building, holland_codes.Thinking, holland_codes.Creating, holland_codes.Helping, holland_codes.Persuading, holland_codes.Organizing);

  const update_booking = await Booking.findOneAndUpdate(
    { _id: booking_id },
    {
      count: 8,
      // arrayscore: factorsPercentage,
      arrayscore: hollandPercentage,
      about_type: LargesthollandPattern?.largest,
      single_dichotomies: style_patterns,
      // greater_var: greater_var,
    }
  );


  if (update_booking) {
    res.status(StatusCodes.OK).json({
      count: 8,
      // arrayscore: factorsPercentage,
      arrayscore: hollandPercentage,
      single_dichotomies: style_patterns,
      holland_type: LargesthollandPattern?.largest,
      booking_id,
      user_id
    });
  }
}

const generate_careeraptitude_report = async (req, res) => {
  let email = req?.body?.email;
  let user_name = req?.body?.user_name;
  let last_name = req?.body?.last_name;
  let gender = req?.body?.gender;
  let age = req?.body?.age;
  let country = req?.body?.country;
  let address_one = req?.body?.address_one;
  let address_two = req?.body?.address_two;
  let postal_code = req?.body?.postal_code;
  let city = req?.body?.city;
  let state = req?.body?.state;
  let country_code = req?.body?.country_code;
  let qualification = req?.body?.qualification;
  let user_id = req?.body?.user_id;
  let booking_id = req?.body?.booking_id;
  let questionnaire_id = req?.body?.questionnaire_id;
  let answer = req?.body?.answer;
  let timeZone = req?.body?.timeZone;

  let userData = await User.findByIdAndUpdate(
    user_id,
    {
      name: user_name,
      surname: last_name,
      gender: gender,
      age: age,
      country: country,
      country_code: country_code,
      qualification: qualification,
      address_one: address_one,
      address_two: address_two,
      postal_code: postal_code,
      city: city,
      state: state
    },
    {
      new: true,        // returns updated document
      runValidators: true
    }
  );

  // result code
  let factor = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreableness: 0, Neuroticism: 0 };
  const result = await CareerAptitudeAnswer.aggregate([
    {
      $match: {
        booking_id: String(booking_id)
      }
    },
    {
      $group: {
        _id: "$factor",
        total: { $sum: "$answer" }
      }
    }
  ]);

  result.map((ele) => {
    if (ele?._id == "Openness") {
      factor.Openness = ele?.total;
    }
    else if (ele?._id == "Conscientiousness") {
      factor.Conscientiousness = ele?.total;
    }
    else if (ele?._id == "Agreableness") {
      factor.Agreableness = ele?.total;
    }
    else if (ele?._id == "Extraversion") {
      factor.Extraversion = ele?.total;
    }
    else if (ele?._id == "Neuroticism") {
      factor.Neuroticism = ele?.total;
    }
  });

  // factors percentage
  const Openness_percentage = Math.round(factor.Openness / 55 * 100);
  const Conscientiousness_percentage = Math.round(factor.Conscientiousness / 55 * 100);
  const Agreableness_percentage = Math.round(factor.Agreableness / 55 * 100);
  const Extraversion_percentage = Math.round(factor.Extraversion / 55 * 100);
  const Neuroticism_percentage = Math.round(factor.Neuroticism / 55 * 100);

  const factors_percentage = { Openness_percentage: Openness_percentage, Conscientiousness_percentage: Conscientiousness_percentage, Agreableness_percentage: Agreableness_percentage, Extraversion_percentage: Extraversion_percentage, Neuroticism_percentage: Neuroticism_percentage }

  let factorsPercentage = [
    Openness_percentage,
    Conscientiousness_percentage,
    Agreableness_percentage,
    Extraversion_percentage,
    Neuroticism_percentage
  ];

  const factor_variant = { LO: 5, HO: 5, HC: 5, LC: 5, HE: 5, LE: 5, HA: 5, LA: 5, LN: 5, HN: 5 };
  if (Openness_percentage <= 60) {
    factor_variant.LO = factor.Openness;
  }
  else {
    factor_variant.HO = factor.Openness;
  }
  if (Conscientiousness_percentage <= 60) {
    factor_variant.LC = factor.Conscientiousness;
  }
  else {
    factor_variant.HC = factor.Conscientiousness;
  }
  if (Agreableness_percentage <= 60) {
    factor_variant.LA = factor.Agreableness;
  }
  else {
    factor_variant.HA = factor.Agreableness;
  }
  if (Extraversion_percentage <= 60) {
    factor_variant.LE = factor.Extraversion;
  }
  else {
    factor_variant.HE = factor.Extraversion;
  }
  if (Neuroticism_percentage <= 60) {
    factor_variant.LN = factor.Neuroticism;
  }
  else {
    factor_variant.HN = factor.Neuroticism;
  }
  //  combinat
  let EI = factor_variant.HO + factor_variant.LE;
  let DA = factor_variant.HC + factor_variant.LA;
  let EE = factor_variant.LC + factor_variant.LN;
  let ERFS = factor_variant.LC + factor_variant.HN;

  let SC = factor_variant.HE + factor_variant.HA;
  let IO = factor_variant.LE + factor_variant.LA;
  let AL = factor_variant.HE + factor_variant.LA;
  let EL = factor_variant.LE + factor_variant.HA;

  let EIN = factor_variant.HE + factor_variant.HO;
  let TC = factor_variant.LE + factor_variant.HC;
  let CC = factor_variant.LN + factor_variant.HO;
  let EC = factor_variant.HA + factor_variant.HN;

  let RA = factor_variant.HC + factor_variant.HE;
  let CE = factor_variant.HO + factor_variant.LC;
  let SPC = factor_variant.HC + factor_variant.HA;
  let ERE = factor_variant.LC + factor_variant.HE;

  let DOP = factor_variant.HC + factor_variant.HN;
  let IA = factor_variant.LC + factor_variant.LE;
  let PF = factor_variant.HA + factor_variant.LN;
  let IE = factor_variant.LC + factor_variant.LA;

  let SI = factor_variant.HO + factor_variant.HN;
  let CM = factor_variant.HO + factor_variant.LA;
  let RI = factor_variant.LO + factor_variant.LA;
  let HP = factor_variant.LC + factor_variant.HA;

  // four other patters (for report only)
  let CO = factor_variant.HE + factor_variant.LN;
  let RS = factor_variant.HN + factor_variant.LA;
  let SGI = factor_variant.LO + factor_variant.LN;
  let CA = factor_variant.HC + factor_variant.LN;

  let RSO = factor_variant.HE + factor_variant.HN;
  let GOT = factor_variant.LO + factor_variant.HC;
  let RSR = factor_variant.LO + factor_variant.LC;
  let IAR = factor_variant.HO + factor_variant.HC;

  let TE = factor_variant.LO + factor_variant.HN;
  let IEN = factor_variant.LA + factor_variant.LN;
  let RSC = factor_variant.LE + factor_variant.HN;
  let EINO = factor_variant.HO + factor_variant.HA;

  let GO = factor_variant.LO + factor_variant.LE;
  let SUT = factor_variant.LO + factor_variant.HA;
  let SOT = factor_variant.LO + factor_variant.HE;
  let TI = factor_variant.LE + factor_variant.LN;

  //  patterns
  const core_pattern = { EI: EI, DA: DA, EE: EE, ERFS: ERFS };
  const interpersonal_pattern = { SC: SC, IO: IO, AL: AL, EL, EL };
  const communication_pattern = { EIN: EIN, TC: TC, CC: CC, EC: EC };
  const motivation_pattern = { RA: RA, CE: CE, SPC: SPC, ERE: ERE };
  const productivity_pattern = { DOP: DOP, IA: IA, PF: PF, IE: IE };
  const collaboration_innovation_pattern = { SI: SI, CM: CM, RI: RI, HP: HP };

  // four other patters (for report only)
  const emotional_pattern = { CO: CO, RS: RS, SGI: SGI, CA: CA }
  const rewards_pattern = { RSO: RSO, GOT: GOT, RSR: RSR, IA: IAR };
  const esteem_pattern = { TE: TE, IE: IEN, RSC: RSC, EI: EINO };
  const social_pattern = { GO: GO, SUT: SUT, SOT: SOT, TI: TI };

  // all patterns
  const style_patterns = [{ core_pattern: core_pattern }, { interpersonal_pattern: interpersonal_pattern }, { communication_pattern: communication_pattern }, { motivation_pattern: motivation_pattern }, { productivity_pattern: productivity_pattern }, { collaboration_innovation_pattern: collaboration_innovation_pattern }]
  // Holland codes scoring
  let holland_codes = { Building: 0, Thinking: 0, Creating: 0, Helping: 0, Persuading: 0, Organizing: 0 };
  const holland_codes_result = await CareerAptitudeAnswer.aggregate([
    {
      $match: {
        booking_id: String(booking_id)
      }
    },
    {
      $group: {
        _id: "$hollandCodes",
        total: { $sum: "$answer" }
      }
    }
  ]);

  holland_codes_result.map((ele) => {
    if (ele?._id == "Building") {
      holland_codes.Building = ele?.total;
    }
    else if (ele?._id == "Thinking") {
      holland_codes.Thinking = ele?.total;
    }
    else if (ele?._id == "Creating") {
      holland_codes.Creating = ele?.total;
    }
    else if (ele?._id == "Helping") {
      holland_codes.Helping = ele?.total;
    }
    else if (ele?._id == "Persuading") {
      holland_codes.Persuading = ele?.total;
    }
    else if (ele?._id == "Organizing") {
      holland_codes.Organizing = ele?.total;
    }
  });

  // holland codes percentage
  const Building_percentage = Math.round(holland_codes.Building / 55 * 100);
  const Thinking_percentage = Math.round(holland_codes.Thinking / 55 * 100);
  const Creating_percentage = Math.round(holland_codes.Creating / 55 * 100);
  const Helping_percentage = Math.round(holland_codes.Helping / 55 * 100);
  const Persuading_percentage = Math.round(holland_codes.Persuading / 55 * 100);
  const Organizing_percentage = Math.round(holland_codes.Organizing / 55 * 100);

  const holland_percentage = { Building_percentage: Building_percentage, Thinking_percentage: Thinking_percentage, Creating_percentage: Creating_percentage, Helping_percentage: Helping_percentage, Persuading_percentage: Persuading_percentage, Organizing_percentage: Organizing_percentage }

  let hollandPercentage = [
    Building_percentage,
    Thinking_percentage,
    Creating_percentage,
    Helping_percentage,
    Persuading_percentage,
    Organizing_percentage
  ];

  // get larget CorePattern
  let LargestCorePattern = compareLargestCorePattern(EI, DA, EE, ERFS);

  let LargestSocialPattern = compareLargestSocialPattern(GO, SUT, SOT, TI);

  let LargestProductivityPattern = compareLargestProductivityPattern(DOP, IA, PF, IE);

  // get larget holland
  let LargesthollandPattern = compareLargesthollandPattern(holland_codes.Building, holland_codes.Thinking, holland_codes.Creating, holland_codes.Helping, holland_codes.Persuading, holland_codes.Organizing);

  const update_booking = await Booking.findOneAndUpdate(
    { _id: booking_id },
    {
      // arrayscore: factorsPercentage,
      arrayscore: hollandPercentage,
      about_type: LargesthollandPattern?.largest,
      single_dichotomies: style_patterns,
      // greater_var: greater_var,
    }
  );

  // const date = new Date('Jan 18, 2021 08:37:00');
  const date = new Date(update_booking.createdAt);
  let formattedDate;
  try {
    formattedDate = date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      ...(timeZone && timeZone !== "null" ? { timeZone } : {})
    });
  } catch {
    formattedDate = date.toLocaleString("en-US");
  }
  let pdfdata = {
    user_name: user_name + ' ' + last_name,
    formattedDate: formattedDate,
    percentage: factors_percentage,
    holland_percentage: holland_percentage,
    factor_variant: factor_variant,
    core_pattern: core_pattern,
    interpersonal_pattern: interpersonal_pattern,
    communication_pattern: communication_pattern,
    motivation_pattern: motivation_pattern,
    productivity_pattern: productivity_pattern,
    collaboration_innovation_pattern: collaboration_innovation_pattern,
    emotional_pattern: emotional_pattern,
    rewards_pattern: rewards_pattern,
    esteem_pattern: esteem_pattern,
    social_pattern: social_pattern,
    LargestCorePattern: LargestCorePattern?.largest,
    LargestSocialPattern: LargestSocialPattern?.largest,
    LargestProductivityPattern: LargestProductivityPattern?.largest,
    LargesthollandPattern: LargesthollandPattern?.largest
  }

  const pdfpath = path.join(
    __dirname,
    `../public/careeraptitude_report/careeraptitude_report_${booking_id}.pdf`
  );
  const data = await GenerateCareerAptitudePdf('../view/careeraptitude_report.ejs', pdfpath, pdfdata);

  let pdfurl = `${process.env.hostPath}/careeraptitude_report/careeraptitude_report_${booking_id}.pdf`;

  const payment = await Payments.findOne({
    user_id: user_id,
    questionnaire_id: questionnaire_id,
  }).sort({ createdAt: -1 });

  let paymentAmount = payment.amount;
  // Generate Invoice (NEW - not done in getFinalScore)
  const invoiceData = await createUserInvoice(
    user_id,
    questionnaire_id,
    booking_id,
    res,
    paymentAmount
  );

  let createReport = await CareerAptitudeReportData.create({
    user_id: user_id,
    questionnaire_id: questionnaire_id,
    booking_id: booking_id,
    user_name: user_name,
    last_name: last_name,
    email: email,
    gender: gender,
    age: age,
    country: country,
    qualification: qualification,
    reportName: "Your career aptitude test results",
    invoice_number: invoiceData?.invoiceNumber,
    reportUrl: pdfurl,
    invoiceUrl: invoiceData?.invoiceUrl,
    report_status: true
  });

  let checkCultureTest = await Invoice.find({
    user_id: user_id,
    questionnaire_id: "6436694cf923aa5ea7ad37cc",
  });
  let cultureTestStatus = checkCultureTest.length > 0;

  let checkClassicalTest = await Invoice.find({
    user_id: user_id,
    questionnaire_id: "64366966f923aa5ea7ad37d3",
  });
  let classicalTestStatus = checkClassicalTest.length > 0;

  // let checkEnnagramTest = await Invoice.find({ user_id: userId, questionnaire_id: "65586e235046c32c7cd385cd" });
  let checkEnnagramTest = await EnneagramReportData.find({
    user_id: user_id,
    questionnaire_id: "65586e235046c32c7cd385cd",
    report_status: true,
  });
  ennagramTestStatus = checkEnnagramTest.length > 0;

  // let checkSixteenTypeTest = await Invoice.find({ user_id: user_id, questionnaire_id: "65d33b0f9bef2027f0594db2" });
  let checkSixteenTypeTest = await SixteenTypeReportData.find({
    user_id: user_id,
    questionnaire_id: "65d33b0f9bef2027f0594db2",
    report_status: true,
  });
  sixteentypeTestStatus = checkSixteenTypeTest.length > 0;

  // let checkBigFiveTest = await Invoice.find({ user_id: user_id, questionnaire_id: "65ec352edbd8850c638f33fd" });
  let checkBigFiveTest = await BigFiveReportData.find({
    user_id: user_id,
    questionnaire_id: "65ec352edbd8850c638f33fd",
    report_status: true,
  });
  bigFiveTestStatus = checkBigFiveTest.length > 0;

  // let checkDiscTest = await Invoice.find({ user_id: user_id, questionnaire_id: "662f3b21d3279b1ec0877cd0" });
  let checkDiscTest = await DiscReportData.find({
    user_id: user_id,
    questionnaire_id: "662f3b21d3279b1ec0877cd0",
    report_status: true,
  });
  discTestStatus = checkDiscTest.length > 0;

  let reportData = {
    username: user_name,
    surname: last_name,
    cultureTestStatus: cultureTestStatus,
    classicalTestStatus: classicalTestStatus,
    ennagramTestStatus: ennagramTestStatus,
    sixteentypeTestStatus: sixteentypeTestStatus,
    bigFiveTestStatus: bigFiveTestStatus,
    discTestStatus: discTestStatus,
    careerATestStatus: true,
  };

  const file = "../view/enneagram_msg.ejs";
  const subject = "Test Result";
  let reportFileName = 'CareerAptitude.pdf';
  let filesname = "invoice.pdf";
  let invoiceurl = `${process.env.hostPath}/invoice/invoice_${booking_id}.pdf`;

  let attachment = [
    { filename: reportFileName, path: pdfurl },
    { filename: filesname, path: invoiceurl },
  ];
  sendEmailwithCertificate(
    userData?.email,
    "token",
    subject,
    file,
    reportData,
    attachment,
    res
  );
  await Booking.findOneAndUpdate(
    { _id: booking_id },
    {
      status: false
    }
  );
  return res.status(200).send({ report: `/user/questionaire/careeraptitude_report?booking_id=${booking_id}` });
}

const get_careeraptitude_count = async (req, res) => {
  let booking_id = req.body.booking_id;

  const booking_data = await Booking.findOne({ _id: booking_id });

  if (booking_data.count == 8) {
    res.send({
      count: 8,
      // count: 7,
      // arrayscore: formattedData,
      arrayscore: booking_data.arrayscore,
      single_dichotomies: booking_data.single_dichotomies,
      holland_type: booking_data.about_type,
    });
    return;
  } else if (booking_data.count == 9) {
    return res.send({
      count: 9,
      arrayscore: booking_data.arrayscore,
      single_dichotomies: booking_data.single_dichotomies,
      holland_type: booking_data.about_type,
    });
  }

  const Form = await CareerAptitudeQuestionnaire.find();
  let sections = Form[0].section;
  let count = 1;
  let section_one = 0;
  let section_two = 0;
  let section_three = 0;
  let section_four = 0;
  let section_five = 0;
  let section_six = 0;

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].section_name == "section one") {
      section_one = sections[i].questions.length;
    }
    if (sections[i].section_name == "section two") {
      section_two = sections[i].questions.length;
    }
    if (sections[i].section_name == "section three") {
      section_three = sections[i].questions.length;
    }
    if (sections[i].section_name == "section four") {
      section_four = sections[i].questions.length;
    }
    if (sections[i].section_name == "section five") {
      section_five = sections[i].questions.length;
    }
    if (sections[i].section_name == "section six") {
      section_six = sections[i].questions.length;
    }
  }

  const one = await CareerAptitudeAnswer.countDocuments({
    booking_id: booking_id,
    question_type: "section one",
  });
  const two = await CareerAptitudeAnswer.countDocuments({
    booking_id: booking_id,
    question_type: "section two",
  });
  const three = await CareerAptitudeAnswer.countDocuments({
    booking_id: booking_id,
    question_type: "section three",
  });
  const four = await CareerAptitudeAnswer.countDocuments({
    booking_id: booking_id,
    question_type: "section four",
  });
  const five = await CareerAptitudeAnswer.countDocuments({
    booking_id: booking_id,
    question_type: "section five",
  });
  const six = await CareerAptitudeAnswer.countDocuments({
    booking_id: booking_id,
    question_type: "section six",
  });

  if (one == section_one) {
    count = count + 1;
  }
  if (two == section_two) {
    count = count + 1;
  }
  if (three == section_three) {
    count = count + 1;
  }
  if (four == section_four) {
    count = count + 1;
  }
  if (five == section_five) {
    count = count + 1;
  }
  if (six == section_six) {
    count = count + 1;
  }

  res.send({
    count: count,
    // arrayscore: formattedData,
    arrayscore: booking_data.arrayscore,
    single_dichotomies: booking_data.single_dichotomies,
    about_type: booking_data.about_type,
  });
}

const get_careeraptitude_answers = async (req, res) => {
  let booking_id = req.body.booking_id;
  const answers = await CareerAptitudeAnswer.find({ booking_id: booking_id });

  let obj = {};
  for (let i = 0; i < answers.length; i++) {
    obj = { ...obj, [answers[i].quesid]: answers[i].answer };
  }
  res.send(obj);
}

const userCareerAptitudeReport = async (req, res) => {
  try {
    const report = await CareerAptitudeReportData.find({
      user_id: req.body.user_id,
      questionnaire_id: req.body.questionnaire_id,
      report_status: true,
    });
    res.status(200).send({ reportData: report });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const getAllFreeCultureQuestionnaire = async (req, res) => {
  var Qid = "642c2afb3b8d5e8965b283e1";
  const Form = await Questionnaire.find({ _id: new mongoose.Types.ObjectId(Qid) });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
}

const getAllFreeClassicalQuestionnaire = async (req, res) => {
  var Qid = "642d130602c5e8c94288dc59";
  const Form = await Questionnaire.find({ _id: new mongoose.Types.ObjectId(Qid) });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
}

const getAllPaidCultureQuestionnaire = async (req, res) => {
  var Qid = "6436694cf923aa5ea7ad37cc";
  const Form = await Questionnaire.find({ _id: new mongoose.Types.ObjectId(Qid) });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
}

const getAllPaidClassicalQuestionnaire = async (req, res) => {
  var Qid = "64366966f923aa5ea7ad37d3";
  const Form = await Questionnaire.find({ _id: new mongoose.Types.ObjectId(Qid) });
  if (Form == null) {
    throw new CustomError.NotFoundError(`No Question found`);
  }
  res.status(StatusCodes.OK).json({ Form: Form });
}

const getCultureTestResult = async (req, res) => {
  try {
    let { user_id, unique_id, questionnaire_id } = req.body;
    if (!unique_id || !questionnaire_id) {
      return res.status(400).send({ message: "something went wrong !" });
    }

    // ✅ Check if the user exists
    let user = user_id ? await User.findById(user_id) : null;
    // ✅ Create a temporary user if no user found
    if (!user) {
      const tempEmail = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}@tempuser.com`;

      user = new User({
        name: "",
        surname: "",
        email: tempEmail,
        password: bcrypt.hashSync("temp_pass"),
        isTempUser: true,
      });

      await user.save();
      user_id = user._id;
    }

    // ✅ Calculate correct answers
    const correctAnswers = await QuestionnaireAnswer.countDocuments({
      unique_id,
      questionnaire_id,
      is_correct: true,
    });

    const totalQuestions = 20;

    // ✅ Prepare result message
    const finalScore =
      "You have answered <b>" +
      correctAnswers +
      "</b> of <b>" +
      totalQuestions +
      "</b> questions correctly.";

    // ✅ Send same style response
    const resData = {
      user_id: user_id || null,
      score: correctAnswers,
      finalScore: finalScore,
      isTempUser: user.isTempUser || false,  // 👈 add this
      name: user.name || "Temp User",        // optional, nice for UI
    };

    res.status(200).send(resData);
  } catch (error) {
    console.error("Error in getCultureTestResult:", error);
    return res.status(400).send({
      message: "server error",
      error: error.message,
    });
  }
};

const get30FreeClassicalTestResult = async (req, res) => {
  try {
    let { user_id, unique_id, questionnaire_id } = req.body;
    if (!unique_id || !questionnaire_id) {
      return res.status(400).send({ message: "something went wrong !" });
    }

    // ✅ Check if the user exists
    let user = user_id ? await User.findById(user_id) : null;
    // ✅ Create a temporary user if no user found
    if (!user) {
      const tempEmail = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}@tempuser.com`;

      user = new User({
        name: "",
        surname: "",
        email: tempEmail,
        password: bcrypt.hashSync("temp_pass"),
        isTempUser: true,
      });

      await user.save();
      user_id = user._id;
    }

    // ✅ Calculate correct answers
    const correctAnswers = await QuestionnaireAnswer.countDocuments({
      unique_id,
      questionnaire_id,
      is_correct: true,
    });

    const totalQuestions = 30;

    // ✅ Prepare result message
    const finalScore =
      "You have answered <b>" +
      correctAnswers +
      "</b> of <b>" +
      totalQuestions +
      "</b> questions correctly.";

    // ✅ Send same style response
    const resData = {
      user_id: user_id || null,
      score: correctAnswers,
      finalScore: finalScore,
      isTempUser: user.isTempUser || false,  // 👈 add this
      name: user.name || "Temp User",        // optional, nice for UI
    };

    res.status(200).send(resData);
  } catch (error) {
    console.error("Error in getCultureTestResult:", error);
    return res.status(400).send({
      message: "server error",
      error: error.message,
    });
  }
};
const addWindowStep = async (req, res) => {
  try {
    const { user_id, unique_id, window_step = 1, isTestEnd = false, questionnaireId } = req.body;
    const stepData = await WindowStep.create({ user_id, unique_id, window_step, isTestEnd, questionnaireId });
    res.status(200).send(stepData);
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
};

const getWindowStep = async (req, res) => {
  try {
    const { user_id, questionnaireId } = req.body;
    const stepData = await WindowStep.findOne({ user_id, questionnaireId, isTestEnd: false }).sort({ createdAt: -1 });
    if (stepData) {
      if (stepData?.window_step === 3 && stepData?.unique_id) {
        const reportRes = await ReportData.findOne({ unique_id: stepData.unique_id });
        if (reportRes && reportRes.payment_status) {
          stepData._doc.reportStatus = reportRes.payment_status;
        }
      }
      res.status(200).send(stepData);
    } else {
      res.status(200).send({ msg: 'Data not exist' });
    }
  } catch (error) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const updateWindowStep = async (req, res) => {
  try {
    const { user_id, questionnaireId, window_step, isTestEnd, unique_id } = req.body;
    const stepData = await WindowStep.findOne({ user_id, questionnaireId, isTestEnd: false }).sort({ createdAt: -1 });
    if (stepData) {
      // Prepare update object
      const updateFields = { window_step, isTestEnd };
      if (unique_id) updateFields.unique_id = unique_id; // include only if present

      // Update existing record
      const updatedStepData = await WindowStep.findOneAndUpdate(
        { _id: stepData._id },
        { $set: updateFields },
        { new: true }   // return updated doc
      );

      return res.status(200).send(updatedStepData);
    } else {
      if (unique_id) {
        const stepData = await WindowStep.create({ user_id, unique_id, window_step, isTestEnd, questionnaireId });
        return res.status(201).send(stepData);
      } else {
        // If no unique_id, send not found response
        return res.status(200).send({ msg: "window step data not found!" });
      }
    }
  } catch (error) {
    res.status(400).send({
      message: err.message,
    });
  }
}

const getFinalScore = async (req, res) => {
  try {
    const {
      email,
      unique_id,
      questionnaire_id,
      user_id,
      age: ageFromRequest,
    } = req.body;
    if (!user_id || !unique_id || !questionnaire_id) {
      return res.status(400).send({ message: "Missing required details" });
    }

    const user = await User.findById(user_id);
    if (!user && !email) {
      return res.status(400).send({ message: "User not found" });
    }

    const questionnaire = await Questionnaire.findOne({ _id: questionnaire_id });
    if (!questionnaire) {
      return res.status(400).send({ message: "Questionnaire not found" });
    }

    const answer = await QuestionnaireAnswer.countDocuments({
      unique_id,
      questionnaire_id,
      is_correct: true,
    });

    const isCultureFair =
      questionnaire.type === "Culture Fair IQ test" ||
      questionnaire.type === "Free Culture Fair IQ test";

    if (!isCultureFair) {
      return res.status(400).send({ message: "Invalid questionnaire type" });
    }

    const ageValue = user?.age || ageFromRequest;
    if (!ageValue) {
      return res.status(400).send({ message: "Age is required to calculate the score" });
    }

    const ageKey = ageValue.toString();
    const percentileTable = allscoredata.Culture_Fair_Test_Percentile[ageKey];
    if (!percentileTable) {
      return res.status(400).send({ message: "Unable to calculate percentile for the provided age" });
    }

    const questionnaireSections = questionnaire.section || [];
    const totalQuestions = Math.max((questionnaireSections.length || 1) - 1, 1);

    const percentile = percentileTable?.[answer] ?? percentileTable?.[percentileTable.length - 1] ?? 0;
    const score = allscoredata.Percentile_IQ?.[percentile] ?? 0;
    const lessScore = score - 5;
    const greaterScore = score + 5;
    const percentage = ((answer * 100) / totalQuestions).toFixed(2);
    const scoreurl1 = `${process.env.hostPath}/uploads/graph/49Graph1/${score}.png`;
    const scoreurl2 = `${process.env.hostPath}/uploads/graph/49Graph2/${score}.png`;

    const finalScore =
      "You have answered <b>" +
      answer +
      "</b> of <b>" +
      30 +
      " </b> questions correctly.";

    const finalpercentile =
      "You scored higher than <b> " +
      percentile +
      "% </b> of all people that took this test.";

    const iqscoreText =
      "Your IQ test results correspond <b> with an IQ of " + score + "</b>.";

    const intelligenceTest =
      "Depending on your level of concentration, your experience in taking IQ tests and other specific circumstances under which you took the test your result is not an absolute or fixed value. This is the reason why the report also lists a range within which your score may vary. A reliable estimate of your IQ score according to industry standards lies within a range of <b> " +
      (score - 5) +
      "</b> and <b>" +
      (score + 5) +
      "</b>.";

    const culturetestinfo = {
      noofcurrectans: answer,
      Qcountt: totalQuestions,
      percentile,
      score,
      lessScore,
      greaterScore,
      scoreurl1,
      scoreurl2,
    };

    const reportPdfPath = path.join(
      __dirname,
      `../public/certificate/cultureCertificate_${unique_id}.pdf`
    );

    await GenerateCulturePdf(
      "../view/CultureFairCertificate.ejs",
      "../view/CultureFairCertificate-style.css",
      reportPdfPath,
      culturetestinfo,
      res
    );

    const reportPdfUrl = `${process.env.hostPath}/certificate/cultureCertificate_${unique_id}.pdf`;

    await ReportData.deleteMany({ unique_id });
    const reportDocument = await ReportData.create({
      user_id,
      questionnaire_id,
      unique_id,
      reportName: "Your culture fair intelligence test results",
      noofcurrectans: culturetestinfo.noofcurrectans,
      Qcountt: culturetestinfo.Qcountt,
      percentile: culturetestinfo.percentile,
      score: culturetestinfo.score,
      lessScore: culturetestinfo.lessScore,
      greaterScore: culturetestinfo.greaterScore,
      scoreurl1: culturetestinfo.scoreurl1,
      scoreurl2: culturetestinfo.scoreurl2,
      reportUrl: reportPdfUrl,
      payment_status: {
        reportPaymentStatus: false,
        certificatePaymentStatus: false,
      },
    });

    await UserCertInfo.deleteMany({ unique_id });
    await UserCertInfo.create({
      user_id,
      email: user?.email || email,
      unique_id,
      questionnaire_id,
      score: answer,
      age: ageKey,
      percentile,
      percentage,
      iqscore: score,
      testurl: reportPdfUrl,
    });

    const population_percent = await population_count(questionnaire_id);

    const finalPageData = {
      score: answer,
      iqscore: iqscoreText,
      total_iqscore: score,
      age: ageKey,
      classicalScore: finalScore,
      finalpercentile,
      population_percent,
      intelligenceTest,
      scoreurl1,
      scoreurl2,
      category: {
        verbal: null,
        numeric: null,
        spatial: null,
        logical: null,
      },
    };

    const stepData = await WindowStep.findOne({
      user_id,
      questionnaireId: questionnaire_id,
      isTestEnd: false,
    }).sort({ createdAt: -1 });

    if (stepData) {
      await WindowStep.updateOne(
        { _id: stepData._id },
        {
          window_step: 8,
          finalPageData,
          unique_id,
        }
      );
    }

    return res.status(200).send({
      msg: "Report generated successfully",
      unique_id,
      user_id,
      reportPdfUrl,
      finalPageData,
      reportId: reportDocument?._id,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: "server error",
      error: err.message,
    });
    return;
  }
};

const getFinalClassicalScore = async (req, res) => {
  try {
    const {
      email,
      unique_id,
      questionnaire_id,
      user_id,
      age: ageFromRequest,
    } = req.body;

    if (!user_id || !unique_id || !questionnaire_id) {
      return res.status(400).send({ message: "Missing required details" });
    }

    const user = await User.findById(user_id);
    if (!user && !email) {
      return res.status(400).send({ message: "User not found" });
    }

    const questionnaire = await Questionnaire.findOne({ _id: questionnaire_id });
    if (!questionnaire) {
      return res.status(400).send({ message: "Questionnaire not found" });
    }

    const answer = await QuestionnaireAnswer.countDocuments({
      unique_id,
      questionnaire_id,
      is_correct: true,
    });

    const isCultureFair =
      questionnaire.type === "Culture Fair IQ test" ||
      questionnaire.type === "Free Culture Fair IQ test";

    const isClassicalTest =
      questionnaire.type === "Classical IQ test" ||
      questionnaire.type === "Free Classical IQ test";

    if (!isCultureFair && !isClassicalTest) {
      return res.status(400).send({ message: "Invalid questionnaire type" });
    }

    const ageValue = user?.age || ageFromRequest;
    if (!ageValue) {
      return res.status(400).send({ message: "Age is required to calculate the score" });
    }

    const ageKey = ageValue.toString();

    // Determine which percentile table to use
    let percentileTable;
    if (isCultureFair) {
      percentileTable = allscoredata.Culture_Fair_Test_Percentile[ageKey];
    } else if (isClassicalTest) {
      percentileTable = allscoredata.Classical_Test_Percentile[ageKey];
    }

    if (!percentileTable) {
      return res.status(400).send({ message: "Unable to calculate percentile for the provided age" });
    }

    const questionnaireSections = questionnaire.section || [];
    const totalQuestions = Math.max((questionnaireSections.length || 1) - 1, 1);

    const percentile = percentileTable?.[answer] ?? percentileTable?.[percentileTable.length - 1] ?? 0;
    const score = allscoredata.Percentile_IQ?.[percentile] ?? 0;
    const lessScore = score - 5;
    const greaterScore = score + 5;
    const percentage = ((answer * 100) / totalQuestions).toFixed(2);
    const scoreurl1 = `${process.env.hostPath}/uploads/graph/49Graph1/${score}.png`;
    const scoreurl2 = `${process.env.hostPath}/uploads/graph/49Graph2/${score}.png`;

    // Get category scores for Classical Test
    let category = null;
    if (isClassicalTest) {
      category = {
        verbal: null,
        numeric: null,
        spatial: null,
        logical: null,
      };
      // Calculate category scores if needed
      // Add your category calculation logic here
    }

    const finalScore =
      "You have answered <b>" +
      answer +
      "</b> of <b>" +
      (isCultureFair ? 30 : totalQuestions) +
      " </b> questions correctly.";

    const finalpercentile =
      "You scored higher than <b> " +
      percentile +
      "% </b> of all people that took this test.";

    const iqscoreText =
      "Your IQ test results correspond <b> with an IQ of " + score + "</b>.";

    const intelligenceTest =
      "Depending on your level of concentration, your experience in taking IQ tests and other specific circumstances under which you took the test your result is not an absolute or fixed value. This is the reason why the report also lists a range within which your score may vary. A reliable estimate of your IQ score according to industry standards lies within a range of <b> " +
      (score - 5) +
      "</b> and <b>" +
      (score + 5) +
      "</b>.";

    let testInfo, reportPdfPath, reportPdfUrl, ejsTemplate, cssTemplate;

    if (isCultureFair) {
      // Culture Fair Test
      testInfo = {
        noofcurrectans: answer,
        Qcountt: totalQuestions,
        percentile,
        score,
        lessScore,
        greaterScore,
        scoreurl1,
        scoreurl2,
      };

      reportPdfPath = path.join(
        __dirname,
        `../public/certificate/cultureCertificate_${unique_id}.pdf`
      );

      ejsTemplate = "../view/CultureFairCertificate.ejs";
      cssTemplate = "../view/CultureFairCertificate-style.css";

      await GenerateCulturePdf(
        ejsTemplate,
        cssTemplate,
        reportPdfPath,
        testInfo,
        res
      );

      reportPdfUrl = `${process.env.hostPath}/certificate/cultureCertificate_${unique_id}.pdf`;
    } else if (isClassicalTest) {
      // Classical Test
      testInfo = {
        noofcurrectans: answer,
        Qcountt: totalQuestions,
        percentile,
        score,
        lessScore,
        greaterScore,
        scoreurl1,
        scoreurl2,
        category,
      };

      reportPdfPath = path.join(
        __dirname,
        `../public/certificate/classicalCertificate_${unique_id}.pdf`
      );

      ejsTemplate = "../view/ClassicalFairCertificate.ejs";
      cssTemplate = "../view/ClassicalFairCertificate-style.css";

      await GenerateClassicalPdf(
        ejsTemplate,
        cssTemplate,
        reportPdfPath,
        testInfo,
        res
      );

      reportPdfUrl = `${process.env.hostPath}/certificate/classicalCertificate_${unique_id}.pdf`;
    }

    // Delete existing report data and create new one
    await ReportData.deleteMany({ unique_id });
    const reportDocument = await ReportData.create({
      user_id,
      questionnaire_id,
      unique_id,
      reportName: isCultureFair
        ? "Your culture fair intelligence test results"
        : "Your classical intelligence test results",
      noofcurrectans: testInfo.noofcurrectans,
      Qcountt: testInfo.Qcountt,
      percentile: testInfo.percentile,
      score: testInfo.score,
      lessScore: testInfo.lessScore,
      greaterScore: testInfo.greaterScore,
      scoreurl1: testInfo.scoreurl1,
      scoreurl2: testInfo.scoreurl2,
      reportUrl: reportPdfUrl,
      ...(isClassicalTest && { category: testInfo.category }),
      payment_status: {
        reportPaymentStatus: false,
        certificatePaymentStatus: false,
      },
    });

    // Delete existing cert info and create new one
    await UserCertInfo.deleteMany({ unique_id });
    await UserCertInfo.create({
      user_id,
      email: user?.email || email,
      unique_id,
      questionnaire_id,
      score: answer,
      age: ageKey,
      percentile,
      percentage,
      iqscore: score,
      testurl: reportPdfUrl,
      ...(isClassicalTest && { category }),
    });

    const population_percent = await population_count(questionnaire_id);

    const finalPageData = {
      score: answer,
      iqscore: iqscoreText,
      total_iqscore: score,
      age: ageKey,
      classicalScore: finalScore,
      finalpercentile,
      population_percent,
      intelligenceTest,
      scoreurl1,
      scoreurl2,
      ...(isClassicalTest && { category }),
    };

    // Update window step
    const stepData = await WindowStep.findOne({
      user_id,
      questionnaireId: questionnaire_id,
      isTestEnd: false,
    }).sort({ createdAt: -1 });

    if (stepData) {
      await WindowStep.updateOne(
        { _id: stepData._id },
        {
          window_step: 8,
          finalPageData,
          unique_id,
        }
      );
    }

    return res.status(200).send({
      msg: "Report generated successfully",
      unique_id,
      user_id,
      reportPdfUrl,
      finalPageData,
      reportId: reportDocument?._id,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: "server error",
      error: err.message,
    });
    return;
  }
};



// Function to generate certificate PDF, invoice, and send email after payment
// Note: Scores, report PDF, and initial data are already handled in getFinalScore

const generateCertificatesAndReports = async (req, res) => {
  try {
    const {
      user_name,
      last_name,
      country,
      address_one,
      address_two,
      postal_code,
      city,
      state,
      country_code,
      email,
      unique_id,
      questionnaire_id,
      user_id,
      booking_id,
      questionnaireType
    } = req.body;
    // Validate required fields
    if (!unique_id || !questionnaire_id || !user_id) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    // Get questionnaire
    const questionnaire = await Questionnaire.findOne({ _id: questionnaire_id });
    if (!questionnaire) {
      return res.status(400).send({ message: "Questionnaire not found" });
    }

    // Validate questionnaire type
    if (questionnaire.type !== "Culture Fair IQ test") {
      return res.status(400).send({ message: "Invalid questionnaire type" });
    }

    // Get UserCertInfo (must exist from getFinalScore)
    const usercertinfo = await UserCertInfo.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
    if (!usercertinfo) {
      return res.status(400).send({
        message: "UserCertInfo not found. Please call getFinalScore first."
      });
    }

    // Get ReportData (must exist from getFinalScore)
    const reportData = await ReportData.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
    if (!reportData) {
      return res.status(400).send({
        message: "ReportData not found. Please call getFinalScore first."
      });
    }

    // Get user data
    const userData = await User.findOne({ _id: user_id });
    if (!userData) {
      return res.status(400).send({ message: "User not found" });
    }

    // Get questionnaire amount info
    const amt = await Questionnaire.find({ _id: questionnaire_id });

    // Update UserCertInfo with complete user data (not done in getFinalScore)
    await UserCertInfo.findOneAndUpdate(
      { _id: usercertinfo?._id },
      {
        user_name,
        last_name,
        address_one,
        address_two,
        postal_code,
        city,
        state,
        country_code,
        country,
        amount: amt[0]?.amount || "",
        qtype: "Free Culture Fair IQ test",
      }
    );

    let updateFields = {
      name: user_name,
      surname: last_name,
      country,
      country_code,
      address_one,
      address_two,
      postal_code,
      city,
      state,
    };

    // 🔐 If user is a temporary user — generate password & set isTempUser false
    const generatePass = Math.random().toString().substr(2, 6);
    if (userData.isTempUser) {
      const hashedPassword = bcrypt.hashSync(generatePass, 10);

      updateFields.password = hashedPassword;
      updateFields.isTempUser = false;

      // (optional) — You might want to send this password to the user via email
    }

    // ✅ Update user
    await User.updateOne({ _id: user_id }, { $set: updateFields });

    // Get report PDF URL (already generated in getFinalScore)
    const reportPdfUrl = reportData.reportUrl;

    // Generate Certificate PDF with complete user info (NEW - not done in getFinalScore)
    const testinfo = {
      noofcurrectans: reportData.noofcurrectans,
      Qcount: reportData.Qcountt,
      iqscoreforpaid: reportData.score,
      questionnaire: questionnaire.type,
      name: user_name,
      surname: last_name,
      email: userData?.email || email,
      score: reportData.score,
    };

    const pdfpath = path.join(
      __dirname,
      `../public/certificate/certificate_${reportData?.unique_id}.pdf`
    );

    await GeneratePdf(
      "../view/certificate.ejs",
      "../view/certificate-style.css",
      pdfpath,
      testinfo,
      res
    );

    const certificatePdfUrl = `${process.env.hostPath}/certificate/certificate_${reportData?.unique_id}.pdf`;
    const payment = await Payments.findOne({
      user_id: user_id,
      questionnaire_id: questionnaire_id,
    }).sort({ createdAt: -1 });

    let paymentAmount = payment.amount;
    // Generate Invoice (NEW - not done in getFinalScore)
    const invoiceData = await createUserInvoice(
      user_id,
      questionnaire_id,
      booking_id,
      res,
      paymentAmount
    );

    // Update UserCertInfo with certificate PDF and invoice (NEW)
    await UserCertInfo.findOneAndUpdate(
      { _id: usercertinfo?._id },
      {
        pdfurl: certificatePdfUrl,
        invoiceurl: invoiceData?.invoiceUrl,
        invoice_number: invoiceData?.invoiceNumber,
        amount: paymentAmount
      }
    );

    // Update ReportData with certificate data and invoice number (NEW)
    const certificateData = {
      certificateUrl: certificatePdfUrl,
      username: user_name,
      iqscore: `Your IQ test results correspond <b>with an IQ of ${reportData.score}</b>.`,
      score: reportData.score,
    };

    const updatedReportData = await ReportData.findOneAndUpdate(
      { _id: reportData?._id },
      {
        certificateData,
        invoice_number: invoiceData?.invoiceNumber,
      },
      { new: true }
    );

    // Update WindowStep - mark test as ended (NEW)
    const stepData = await WindowStep.findOne({
      user_id,
      questionnaireId: questionnaire_id,
      isTestEnd: false,
    }).sort({ createdAt: -1 });

    if (!stepData) {
      return res.status(400).send({
        message: "Something went wrong."
      });
    }

    let WindowStepData = await WindowStep.findOneAndUpdate(
      { _id: stepData._id },
      {
        window_step: 3,
        isTestEnd: true,
      },
      { new: true } // <-- returns the updated document
    );

    await TestCount.findOneAndUpdate(
      { user_id: user_id, questionnaireType },
      { count: 0 }
    );

    // Get all test statuses for email
    const {
      cultureTestStatus,
      classicalTestStatus,
      enneagramTestStatus,
      sixteenTypeTestStatus,
      bigFiveTestStatus,
      discTestStatus,
      careerTestStatus,
    } = await getAllTestStatuses(user_id);

    // Prepare email attachments based on payment status (NEW LOGIC)
    const file = "../view/text_mssg.ejs";
    const subject = "IQ Test Result";
    let attachment = [];

    // Check payment status from ReportData (already updated in payment function)
    const certificatePaymentStatus = updatedReportData.payment_status?.certificatePaymentStatus;
    const reportPaymentStatus = updatedReportData.payment_status?.reportPaymentStatus;

    // Always include invoice
    attachment.push({
      filename: "Invoice.pdf",
      path: invoiceData?.invoiceUrl
    });

    // Add certificate if paid
    if (certificatePaymentStatus) {
      attachment.push({
        filename: "certificate.pdf",
        path: certificatePdfUrl
      });
    }

    // Add report if paid
    if (reportPaymentStatus) {
      attachment.push({
        filename: "report.pdf",
        path: reportPdfUrl
      });
    }

    const sendmessage = {
      username: user_name,
      noofcurrectans: reportData.noofcurrectans,
      Qcountt: reportData.Qcountt,
      percentile: reportData.percentile,
      score: reportData.score,
      paidTestButton: "",
      paidTestLink: "",
      isPassword: (generatePass && userData.isTempUser) ? true : false,
      password: generatePass ? generatePass.toString() : '',
      questionnaire: 'Culture Fair IQ test',
      cultureTestStatus: cultureTestStatus,
      classicalTestStatus: classicalTestStatus,
      ennagramTestStatus: enneagramTestStatus,
      sixteentypeTestStatus: sixteenTypeTestStatus,
      bigFiveTestStatus: bigFiveTestStatus,
      discTestStatus: discTestStatus,
      careerTestStatus: careerTestStatus,
    };

    // Send email with appropriate attachments
    sendEmailwithCertificate(
      userData?.email || email,
      "token",
      subject,
      file,
      sendmessage,
      attachment
    );
    WindowStepData._doc.reportStatus = reportData.payment_status;
    // Return success response
    let msg = 'Certificate and invoice generated successfully!';

    if (generatePass && userData.isTempUser) {
      msg += ' Check your email for the randomly generated password for your new account.';
    }

    return res.status(200).send({
      msg: msg,
      invoiceUrl: invoiceData?.invoiceUrl,
      invoiceNumber: invoiceData?.invoiceNumber,
      WindowStepData,
      unique_id: reportData?.unique_id,
      user_id: user_id,
    });

  } catch (err) {
    console.error("Error in generateCertificatesAndReports:", err);
    res.status(500).send({
      message: "Server error while generating certificates and reports",
      error: err.message,
    });
    return;
  }
};

const generateCertificatesAndReportsForClassical = async (req, res) => {
  try {
    const {
      user_name,
      last_name,
      country,
      address_one,
      address_two,
      postal_code,
      city,
      state,
      country_code,
      email,
      unique_id,
      questionnaire_id,
      user_id,
      booking_id,
      questionnaireType
    } = req.body;
    // Validate required fields
    if (!unique_id || !questionnaire_id || !user_id) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    // Get questionnaire
    const questionnaire = await Questionnaire.findOne({ _id: questionnaire_id });
    if (!questionnaire) {
      return res.status(400).send({ message: "Questionnaire not found" });
    }

    // Validate questionnaire type
    if (questionnaire.type !== "Classical IQ test") {
      return res.status(400).send({ message: "Invalid questionnaire type" });
    }

    // Get UserCertInfo (must exist from getFinalScore)
    const usercertinfo = await UserCertInfo.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
    if (!usercertinfo) {
      return res.status(400).send({
        message: "UserCertInfo not found. Please call getFinalScore first."
      });
    }

    // Get ReportData (must exist from getFinalScore)
    const reportData = await ReportData.findOne({ user_id: user_id, questionnaire_id: questionnaire_id }).sort({ createdAt: -1 });
    if (!reportData) {
      return res.status(400).send({
        message: "ReportData not found. Please call getFinalScore first."
      });
    }

    // Get user data
    const userData = await User.findOne({ _id: user_id });
    if (!userData) {
      return res.status(400).send({ message: "User not found" });
    }

    // Get questionnaire amount info
    const amt = await Questionnaire.find({ _id: questionnaire_id });

    // Update UserCertInfo with complete user data (not done in getFinalScore)
    await UserCertInfo.findOneAndUpdate(
      { _id: usercertinfo?._id },
      {
        user_name,
        last_name,
        address_one,
        address_two,
        postal_code,
        city,
        state,
        country_code,
        country,
        amount: amt[0]?.amount || "",
        qtype: "Free Classical IQ test",
      }
    );

    let updateFields = {
      name: user_name,
      surname: last_name,
      country,
      country_code,
      address_one,
      address_two,
      postal_code,
      city,
      state,
    };

    // 🔐 If user is a temporary user — generate password & set isTempUser false
    const generatePass = Math.random().toString().substr(2, 6);
    if (userData.isTempUser) {
      const hashedPassword = bcrypt.hashSync(generatePass, 10);

      updateFields.password = hashedPassword;
      updateFields.isTempUser = false;

      // (optional) — You might want to send this password to the user via email
    }

    // ✅ Update user
    await User.updateOne({ _id: user_id }, { $set: updateFields });

    // Get report PDF URL (already generated in getFinalScore)
    const reportPdfUrl = reportData.reportUrl;

    // Generate Certificate PDF with complete user info (NEW - not done in getFinalScore)
    const testinfo = {
      noofcurrectans: reportData.noofcurrectans,
      Qcount: reportData.Qcountt,
      iqscoreforpaid: reportData.score,
      questionnaire: questionnaire.type,
      name: user_name,
      surname: last_name,
      email: userData?.email || email,
      score: reportData.score,
    };

    const pdfpath = path.join(
      __dirname,
      `../public/certificate/certificate_${reportData?.unique_id}.pdf`
    );

    await GeneratePdf(
      "../view/certificate.ejs",
      "../view/certificate-style.css",
      pdfpath,
      testinfo,
      res
    );

    const certificatePdfUrl = `${process.env.hostPath}/certificate/certificate_${reportData?.unique_id}.pdf`;
    const payment = await Payments.findOne({
      user_id: user_id,
      questionnaire_id: questionnaire_id,
    }).sort({ createdAt: -1 });

    let paymentAmount = payment.amount;
    // Generate Invoice (NEW - not done in getFinalScore)
    const invoiceData = await createUserInvoice(
      user_id,
      questionnaire_id,
      booking_id,
      res,
      paymentAmount
    );

    // Update UserCertInfo with certificate PDF and invoice (NEW)
    await UserCertInfo.findOneAndUpdate(
      { _id: usercertinfo?._id },
      {
        pdfurl: certificatePdfUrl,
        invoiceurl: invoiceData?.invoiceUrl,
        invoice_number: invoiceData?.invoiceNumber,
        amount: paymentAmount
      }
    );

    // Update ReportData with certificate data and invoice number (NEW)
    const certificateData = {
      certificateUrl: certificatePdfUrl,
      username: user_name,
      iqscore: `Your IQ test results correspond <b>with an IQ of ${reportData.score}</b>.`,
      score: reportData.score,
    };

    const updatedReportData = await ReportData.findOneAndUpdate(
      { _id: reportData?._id },
      {
        certificateData,
        invoice_number: invoiceData?.invoiceNumber,
      },
      { new: true }
    );

    // Update WindowStep - mark test as ended (NEW)
    const stepData = await WindowStep.findOne({
      user_id,
      questionnaireId: questionnaire_id,
      isTestEnd: false,
    }).sort({ createdAt: -1 });

    if (!stepData) {
      return res.status(400).send({
        message: "Something went wrong."
      });
    }

    let WindowStepData = await WindowStep.findOneAndUpdate(
      { _id: stepData._id },
      {
        window_step: 3,
        isTestEnd: true,
      },
      { new: true } // <-- returns the updated document
    );

    await TestCount.findOneAndUpdate(
      { user_id: user_id, questionnaireType },
      { count: 0 }
    );

    // Get all test statuses for email
    const {
      cultureTestStatus,
      classicalTestStatus,
      enneagramTestStatus,
      sixteenTypeTestStatus,
      bigFiveTestStatus,
      discTestStatus,
      careerTestStatus,
    } = await getAllTestStatuses(user_id);

    // Prepare email attachments based on payment status (NEW LOGIC)
    const file = "../view/text_mssg.ejs";
    const subject = "IQ Test Result";
    let attachment = [];

    // Check payment status from ReportData (already updated in payment function)
    const certificatePaymentStatus = updatedReportData.payment_status?.certificatePaymentStatus;
    const reportPaymentStatus = updatedReportData.payment_status?.reportPaymentStatus;

    // Always include invoice
    attachment.push({
      filename: "Invoice.pdf",
      path: invoiceData?.invoiceUrl
    });

    // Add certificate if paid
    if (certificatePaymentStatus) {
      attachment.push({
        filename: "certificate.pdf",
        path: certificatePdfUrl
      });
    }

    // Add report if paid
    if (reportPaymentStatus) {
      attachment.push({
        filename: "report.pdf",
        path: reportPdfUrl
      });
    }

    const sendmessage = {
      username: user_name,
      noofcurrectans: reportData.noofcurrectans,
      Qcountt: reportData.Qcountt,
      percentile: reportData.percentile,
      score: reportData.score,
      paidTestButton: "",
      paidTestLink: "",
      isPassword: (generatePass && userData.isTempUser) ? true : false,
      password: generatePass ? generatePass.toString() : '',
      questionnaire: 'Classical IQ test',
      cultureTestStatus: cultureTestStatus,
      classicalTestStatus: classicalTestStatus,
      ennagramTestStatus: enneagramTestStatus,
      sixteentypeTestStatus: sixteenTypeTestStatus,
      bigFiveTestStatus: bigFiveTestStatus,
      discTestStatus: discTestStatus,
      careerTestStatus: careerTestStatus,
    };

    // Send email with appropriate attachments
    sendEmailwithCertificate(
      userData?.email || email,
      "token",
      subject,
      file,
      sendmessage,
      attachment
    );
    WindowStepData._doc.reportStatus = reportData.payment_status;
    // Return success response
    let msg = 'Certificate and invoice generated successfully!';

    if (generatePass && userData.isTempUser) {
      msg += ' Check your email for the randomly generated password for your new account.';
    }

    return res.status(200).send({
      msg: msg,
      invoiceUrl: invoiceData?.invoiceUrl,
      invoiceNumber: invoiceData?.invoiceNumber,
      WindowStepData,
      unique_id: reportData?.unique_id,
      user_id: user_id,
    });

  } catch (err) {
    console.error("Error in generateCertificatesAndReports:", err);
    res.status(500).send({
      message: "Server error while generating certificates and reports",
      error: err.message,
    });
    return;
  }
};


module.exports = {
  loginUser,
  registerUser,
  signUpWithProvider,
  verifyEmailAddress,
  emailVerify,
  resendVerificationEmail,
  userRegister,
  forgetPassword,
  changePassword,
  resetPassword,
  getAllUsers,
  getUserById,
  updateUser,
  userUpdate,
  updateTempUser,
  deleteUser,
  getQuestionnaire,
  getAllQuestionnaire,
  answerQuestionnaire,
  getAnswers,
  getAllAnswers,
  personalInfo,
  // correctAnswers,
  certificate,
  getiqresult,
  testcount,
  gettestcount,
  userdata,
  allUserReport,
  userReport,
  getAllEnnaQuestionnaire,
  getEnnaQuestionnaire,
  save_question,
  getBooking,
  get_answers,
  get_count,
  get_result,
  userEnneagramReport,
  getAllsixteentypequestionnaire,
  getSixteentypeQuestionnaire,
  get_sixteentype_count,
  get_sixteentype_answers,
  get_sixteentype_result,
  userSixteenTypeReport,
  getAllBigFIveType,
  getBigFIveQuestionnaire,
  get_bigfive_result,
  testPdfCreate,
  userBigFiveReport,
  get_bigfive_count,
  get_bigfive_answers,
  getDiscQuestionnaire,
  getAllDiscType,
  get_disc_result,
  get_disc_count,
  get_disc_answers,
  userDiscReport,
  getAllCareerAptitude,
  getCareerAptitudeQuestionnaire,
  get_careeraptitude_result,
  generate_careeraptitude_report,
  get_careeraptitude_count,
  get_careeraptitude_answers,
  userCareerAptitudeReport,
  getAllFreeCultureQuestionnaire,
  getAllFreeClassicalQuestionnaire,
  getAllPaidCultureQuestionnaire,
  getAllPaidClassicalQuestionnaire,
  getCultureTestResult,
  get30FreeClassicalTestResult,
  addWindowStep,
  getWindowStep,
  updateWindowStep,
  getFinalScore,
  generateCertificatesAndReports,
  getFinalClassicalScore,
  generateCertificatesAndReportsForClassical
};
