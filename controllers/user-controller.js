const express = require("express");
const User = require("../models/user-model");
const Product = require("../models/product-model");
const Variants = require("../models/variants-model");
const Addresses = require("../models/addresses-model");
const nodemailer = require("nodemailer");
require("dotenv").config();

const otpGenerator = require("otp-generator");

function generateOtp() {
  return otpGenerator.generate(4, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    expiry: "1m", // 1 minutes
  });
}

function sendOtpEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // or 'STARTTLS'
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS,
    },
  });
  const mailOptions = {
    from: "AXILLON Team < " + process.env.NODEMAILER_EMAIL + " >",
    to: email,
    subject: "AXILLON Email Verification Code",
    html: `
          <body style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="font-size: 36px; color: grey;">AXILLON Email Verification</h1>
          <h2 class="secondary-color">Welcome to AXILLON!</h2>
          <p class="secondary-color">Thank you for registering with AXILLON, the ultimate collection of luxury Alloy Wheels.</p>
          <p class="secondary-color">Your One-Time Password (OTP) for verifying your email is:</p>
          <h3 style="font-size: 34px; color: yellow;">${otp}</h3>
          <p class="secondary-color">This OTP is valid for 5 minutes. Please do not share this code with anyone.</p>
          <p class="secondary-color">Looking forward to seeing you on AXILLON!</p>
          <p class="secondary-color">Best regards, <br> AXILLON Team</p>
        `,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

const home = (req, res) => {
  if (req.session.user) {
    res.render("userPages/home");
  } else {
    res.render("userPages/home");
  }
};

const shop = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("brand_id")
      .populate("type_id");

    const productsWithDefaultVariant = await Promise.all(
      products.map(async (product) => {
        const defaultVariant = await Variants.findOne({
          product_id: product._id,
        }).sort({ price: 1 });
        return { ...product.toObject(), defaultVariant };
      })
    );

    res.render("userPages/shop", { products: productsWithDefaultVariant });
  } catch (error) {
    console.error(error);
  }
};

const product = async (req, res) => {
  const variantId = req.params.variantId;
  const variantDetails = await Variants.findOne({ _id: variantId }).populate({
    path: "product_id",
    populate: {
      path: "brand_id",
    },
  });

  const sizes = await Variants.find({ product_id: variantDetails.product_id });

  console.log(variantDetails, "from product controller");
  console.log(sizes, "sizes from product controller");
  res.render("userPages/product", { variantDetails, sizes });
};

const cart = (req, res) => {
  if (req.session.user) {
    res.render("userPages/cart");
  } else {
    res.redirect("/signup");
  }
};

const checkoutAddress = (req, res) => {
  if (req.session.user) {
    res.render("userPages/checkoutAddress");
  }
};

const checkoutPayment = (req, res) => {
  if (req.session.user) {
    res.render("userPages/checkoutPayment");
  }
};

const signin = (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    let invalid = req.query.invalid;
    res.render("userPages/signin", { invalid });
  }
};

const postSignin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email, password: password });
  req.session.userDetails = user;

  if (!user || user.isAdmin == true) {
    return res.redirect("/signin?invalid=Invalid Inputs");
  }

  if (user.status === false) {
    return res.redirect("/signin?invalid=You were blocked by Admin");
  }

  if (user.isAdmin === false) {
    if (password === user.password) {
      req.session.user = true;
      return res.redirect("/home");
    } else {
      return res.redirect("/signin?invalid=Invalid Inputs");
    }
  }
};

const signup = (req, res) => {
  res.render("userPages/signup.ejs");
};

const postSignup = async (req, res) => {
  // console.log(req.body)
  try {
    const { email, password, confirmPassword, username, referralCode } =
      req.body;
    req.session.details = {
      email,
      password,
      confirmPassword,
      username,
      referralCode,
    };
    // console.log(req.session.details.username)
    // req.session.email = email;
    // console.log(email);

    const finduser = await User.find({ email });
    console.log(finduser);
    if (!finduser || []) {
      const otp = generateOtp();
      req.session.otp = otp;

      console.log(otp);

      const emailSent = await sendOtpEmail(email, otp);
      return res.redirect("/signupOTP");
    } else {
      return res.render("signup", {
        message: "user already exist with this email",
      });
    }
  } catch (error) {
    if (error.code == 11000) {
      res.redirect("/signup?err=User Already Exist With This Email");
    }
    console.log(error, "error creating from postsignup");
  }
};

const signupOtp = (req, res) => {
  // console.log(process.env.NODEMAILER_EMAIL, process.env.NODEMAILER_PASS);

  res.render("userPages/signupOtp", { message: " " });
};

const resendSignupOtp = async (req, res) => {
  try {
    const otp = generateOtp();
    req.session.otp = otp;
    const email = req.session.details.email;
    const emailSent = await sendOtpEmail(email, otp);
    res.render("userPages/signupOtp", { message: "OTP Resent successfully" });
    console.log(req.session.otp);
  } catch (error) {
    console.log(error, "from resendOtp");
  }
};

const postSignupOtp = async (req, res) => {
  const { otp1, otp2, otp3, otp4 } = req.body;
  let fieldInputs = otp1 + otp2 + otp3 + otp4;
  if (req.session.otp == fieldInputs) {
    console.log(req.session.details);

    console.log(req.session.details.username);
    await User.create({
      email: req.session.details.email,
      password: req.session.details.password,
      username: req.session.details.username,
      refferalCode: req.session.details.referralCode,
      isAdmin: false,
      status: true,
    });
    // req.session.user = true;
    res.redirect("/signin");
  } else {
    console.log("not match");
  }
};

const myProfile = async (req, res) => {
  if (req.session.user) {
    console.log(req.session.userDetails, "form myprofile route");
    const user = await User.findOne({_id:req.session.userDetails._id});
    console.log(user,"myProfile for sadh");
    res.render("userPages/myProfile", { user ,url:req.originalUrl});
  } else {
    res.redirect("/signup");
  }
};

const editProfile = async (req,res)=>{
  console.log("from edit profile");
  if(req.session.user){
    const {username,phone} = req.body
    console.log(username,phone);
    const userId = req.session.userDetails._id;
    console.log(userId,"from editprofile");
     await User.updateOne({_id:userId},{
      username:username,
      phone:phone
    })
    res.redirect('/myProfile')
  }else{
    res.redirect('/signin')
  }
  

    
}

const myAddress = async (req, res) => {
  if(req.session.user){
    const userId = req.session.userDetails;
    console.log(userId, "user id from my address page ");
    const addresses = await Addresses.find({ user_id: userId._id });
    console.log(addresses, "new address");
    const user = req.session.userDetails;
    res.render("userPages/myAddress", { user, addresses ,url:req.originalUrl});
  }else{
    res.redirect("/signup");

  }
 
};

const postmyAddress = async (req, res) => {
  try {
    const userId = req.session.userDetails;
    console.log(userId._id, "form post");
    const { street, country, zip, phone, city, state, label } = req.body;
    console.log(street, country, zip, phone, city, state, label);
    await Addresses.create({
      street,
      user_id: userId._id,
      country,
      zip,
      phone,
      city,
      state,
      label,
    });
    return res.redirect("/myAddress");
  } catch (error) {
    console.log(error);
  }
};

const deleteAddress = async (req,res)=>{
  console.log("hello from delete address");
  const addressId = req.params.addressId
  await Addresses.deleteOne({_id:addressId})
  console.log(addressId,"haaaapppyy fromdeleteAddress");
  res.redirect('/myAddress')

}

const userLogout = (req, res) => {
  req.session.user = null;
  res.redirect("/signin");
};

module.exports = {
  home,
  shop,
  product,
  cart,
  checkoutAddress,
  checkoutPayment,
  signin,
  signup,
  signupOtp,
  postSignup,
  postSignin,
  postSignupOtp,
  resendSignupOtp,
  myProfile,
  userLogout,
  myAddress,
  postmyAddress,
  deleteAddress,
  editProfile
};
