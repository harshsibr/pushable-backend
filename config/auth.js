require('dotenv').config();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');
const ejs = require('ejs');
const fs = require("fs");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");

const signInToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      phone: user.phone,
      image: user.image,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '2d',
    }
  );
};

const tokenForVerify = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
      surname: user.surname
    },
    process.env.JWT_SECRET_FOR_VERIFY,
    { expiresIn: '15m' }
  );
};

const isAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  try {
    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({
      message: err.message,
    });
  }
};

const isAdmin = async (req, res, next) => {
  const admin = await Admin.findOne({ role: 'Admin' });
  if (admin) {
    next();
  } else {
    res.status(401).send({
      message: 'User is not Admin',
    });
  }
};

const sendEmail = (email, token, subject, file, message) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE, //comment this line if you use custom server/domain
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    ejs.renderFile(file, message, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        var mainOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: subject,
          html: data
        };

        transporter.sendMail(mainOptions, function (err, info) {
          if (err) {
            console.log(err);
          } else {
            console.log('Message %s sent: %s', info.messageId, info.response);
          }
        });
      }

    })
  } catch (error) {
    console.log(error);
  }
}

const sendEmailwithCertificate = (email, token, subject, file, message, attachments) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE, //comment this line if you use custom server/domain
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    ejs.renderFile(file, message, function (err, data) {
      if (err) {
        console.log(err);
        throw new Error("EJS template rendering failed");
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html: data,
        attachments
      };

      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          console.log(err);
          throw new Error("Email sending failed: " + err.message);
        }

        console.log("Message %s sent: %s", info.messageId, info.response);
      });
    });
  } catch (error) {
    console.log(error);
    throw error; // ⬅️ IMPORTANT
  }
}

const sendEmailToAdmin = (email, token, subject, file, message, attachments, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE, //comment this line if you use custom server/domain
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    ejs.renderFile(file, message, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        var mainOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: subject,
          html: data,
          attachments: attachments
        };

        transporter.sendMail(mainOptions, function (err, info) {
          if (err) {
            res.send({ error: err.message });
            return
            console.log(err);
          } else {
            console.log('Message %s sent: %s', info.messageId, info.response);
          }
        });
      }

    })
  } catch (error) {
    res.send({ error: error.message });
    return
    console.log(error);
  }
}

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
    return res.send({ error: error.message });
    console.error(error);
  }
};

const sendEmailContactForm = (email, token, subject, file, message, attachments, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE, //comment this line if you use custom server/domain
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    ejs.renderFile(file, message, function (err, data) {
      if (err) {
        console.error("EJS render error:", err);
        res.status(500).send({ error: "Error rendering email template" });
        return;
      }

      const mainOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        html: data,
        attachments: attachments,
      };

      transporter.sendMail(mainOptions, function (err, info) {
        if (err) {
          console.error("Error sending email:", err);
          res.status(500).send({ error: "Error sending email" });
          return;
        }

        console.log('Message %s sent: %s', info.messageId, info.response);
        res.status(200).send({ message: 'Your mail has been sent!' });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).send({ error: "Unexpected error occurred" });
  }
};

module.exports = {
  signInToken,
  tokenForVerify,
  isAuth,
  isAdmin,
  sendEmail,
  sendEmailwithCertificate,
  sendEmailToAdmin,
  GenerateInvoice,
  sendEmailContactForm
};
