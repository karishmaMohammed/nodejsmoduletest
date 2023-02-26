const validator = require("validator");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const cleanUpAndValidate = ({ name, email,phonenumber, password, username }) =>{
    return new Promise((resolve, reject) => {
        if(!email || !username || !name || !password || !phonenumber) {
            reject("Missing credentials, please check all the fields");
        }
        if (typeof email !== "string") reject("Invalid Email");
        if (typeof username !== "string") reject("Invalid Username");
        if (typeof password !== "string") reject("Invalid Password");

        if(!validator.isEmail(email)) reject("Invalid Email Format");

        if(username.length <= 2 || username.length > 25)
        reject("Username should be 2 to 25 char");

        if(password.length <= 2 || password.length > 25)
        reject("password should be 3 to 25 char");

        if(phonenumber.length !== 10)
        reject("Enter valid 10 digit Phone number");

        if(name.length < 3 || name.length > 20)
        reject("name should be greater than 3 and less than 20 characters")

        resolve();
    });
};

const generateJWTToken = (email) => {
    const JWT_TOKEN = jwt.sign({ email: email }, "nodejsmoduletest", {
      expiresIn: "15d",
    });
    return JWT_TOKEN;
  };
  
  const sendVerificationEmail = (email, verificationToken) => {
    console.log(email, verificationToken);
  
    let mailer = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      service: "Gmail",
      auth: {
        user: "karishmamohammed43@gmail.com",
        pass: "eurdaivlvdndhodd",
      },
    });
    let sender = "nodemodule"
  
    let mailOptions = {
      from: sender,
      to: email,
      subject: "Email verification for Profile",
      html: `click <a href="http://localhost:8000/verify/${verificationToken}">Here</a>`,
    };
  
    mailer.sendMail(mailOptions, function (err, response) {
      if (err) console.log(err);
      else console.log("Mail has been sent successfully");
    });
  };
  
  module.exports = {
    cleanUpAndValidate,
    generateJWTToken,
    sendVerificationEmail,
  }