const express = require("express");
const User = require("../models/user-model");
const Product = require("../models/product-model");
const Variants = require("../models/variants-model");
const Addresses = require("../models/addresses-model");
const Cart = require("../models/cart-model");
const Order = require("../models/orders-model");
const nodemailer = require("nodemailer");
const Coupons = require("../models/coupons-model");
const WishList = require("../models/wishList-model");
const Boffer = require("../models/Boffer-model")
const Poffer = require("../models/Poffer-model")
const fs = require('fs');
const PDFDocument = require('pdfkit');
require("dotenv").config();


const otpGenerator = require("otp-generator");
const { variants } = require("./admin-controller");
const { timeStamp } = require("console");

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
  if (req.session.user) {
    res.redirect("/home");
  } else {
    res.render("userPages/signup.ejs");
  }
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
    // console.log(finduser);
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

const resendPasswordOtp = async (req, res) => {
  if (req.session.otp) {
    try {
      const otp = generateOtp();
      req.session.otp = otp;
      const email = req.session.changePass;
      const emailSent = await sendOtpEmail(email, otp);
      res.render("userPages/otpForEmail", {
        message: "OTP Resent successfully",
      });
      console.log(req.session.otp);
    } catch (error) {
      console.log(error, "from resendOtp");
    }
  } else {
    res.redirect("/admin/forgotPassword");
  }
};

const postPasswordOtp = async (req, res) => {
  const { otp1, otp2, otp3, otp4 } = req.body;
  let fieldInputs = otp1 + otp2 + otp3 + otp4;
  if (req.session.otp == fieldInputs) {
    res.redirect("/newPassword");
  } else {
    req.session.messaged = "otp not same as we sent";
    res.redirect("/otpForEmail");
  }
};

const postSignupOtp = async (req, res) => {
  const { otp1, otp2, otp3, otp4 } = req.body;
  let fieldInputs = otp1 + otp2 + otp3 + otp4;
  if (req.session.otp == fieldInputs) {
    // console.log(req.session.details);

    // console.log(req.session.details.username);
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

const forgotPassword = async (req, res) => {
  if (!req.session.user) {
    const message = req.session.message;
    req.session.message = null;
    res.render("userPages/emailVerification", { message });
  } else {
    res.redirect("/home");
  }
};

const otpForEmail = async (req, res) => {
  if (req.session.changePass && !req.session.user) {
    messaged = req.session.messaged;
    req.session.messaged = null;

    res.render("userPages/otpForEmail", { messaged });
  } else {
    res.redirect("/forgotPassword");
  }
};

const postEmailVerification = async (req, res) => {
  const { email } = req.body;
  req.session.changePass = email;

  try {
    const finduser = await User.findOne({ email });
    // console.log(finduser);
    if (finduser) {
      const otp = generateOtp();
      req.session.otp = otp;
      console.log(otp);
      const emailSent = await sendOtpEmail(email, otp);
      return res.redirect("/otpForEmail");
    } else {
      req.session.message = "Email Not Exist";

      return res.redirect("/forgotPassword");
    }
  } catch (error) {
    if (error.code == 11000) {
      res.redirect("/signup?err=User Already Exist With This Email");
    }
    console.log(error, "error creating from postsignup");
  }
};

const newPassword = async (req, res) => {
  if (req.session.changePass) {
    res.render("userPages/newPassword");
  } else {
    res.redirect("/forgotPassword");
  }
};

const postNewPassword = async (req, res) => {
  const { pass, confPass } = req.body;

  email = req.session.changePass;
  await User.updateOne(
    { email: email },
    {
      password: pass,
    }
  );
  res.redirect("/signin");
};

const home = (req, res) => {
  if (req.session.user) {
    res.render("userPages/home");
  } else {
    res.render("userPages/home");
  }
};

const shop = async (req, res) => {
  try {
    const sortOptions = {
      popularity: {},
      priceLowToHigh: { "defaultVariant.price": 1 },
      priceHighToLow: { "defaultVariant.price": -1 },
      averageRatings: {},
      featured: {},
      newArrivals: { createdAt: -1 },
      nameAZ: { productName: 1 },
      nameZA: { productName: -1 },
    };

    const sortKey = req.query.sort || "popularity";
    const sortOrder = sortOptions[sortKey] || sortOptions.popularity;

    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();
    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .populate("brand_id")
      .populate("type_id");

    const productsWithDefaultVariant = await Promise.all(
      products.map(async (product) => {
        // Get the default variant (lowest price) for this product
        const defaultVariant = await Variants.findOne({
          product_id: product._id,
        }).sort({ price: 1 });

        // Check for brand and product offers
        const boffer = await Boffer.findOne({
          "brandOffer.brandId": product.brand_id._id,
        });
        const poffer = await Poffer.findOne({
          "productOffer.productId": product._id,
        });

        // Determine the best offer
        let offer = null;
        if (poffer && boffer) {
          offer =
            poffer.productOffer[0].PofferPrice >
            boffer.brandOffer[0].BofferPrice
              ? poffer
              : boffer;
        } else if (boffer) {
          offer = boffer;
        } else if (poffer) {
          offer = poffer;
        }

        // Extract offer price
        let offerPrice = 0;
        if (offer?.brandOffer) {
          offerPrice = offer.brandOffer[0].BofferPrice;
        } else if (offer?.productOffer) {
          offerPrice = offer.productOffer[0].PofferPrice;
        }

        // Attach the offer to the product
        product.offer = offerPrice;
        await product.save();

        return { ...product.toObject(), defaultVariant, offerPrice, offer };
      })
    );

    // Sort products (additional sorting logic for names, etc.)
    productsWithDefaultVariant.sort((a, b) => {
      if (sortKey === "priceLowToHigh" || sortKey === "priceHighToLow") {
        return (
          sortOrder["defaultVariant.price"] *
          (a.defaultVariant.price - b.defaultVariant.price)
        );
      } else if (sortKey === "nameAZ" || sortKey === "nameZA") {
        return (
          sortOrder.productName * a.productName.localeCompare(b.productName)
        );
      }
    });

    // Render the shop page with sorted products
    res.render("userPages/shop", {
      products: productsWithDefaultVariant,
      currentSort: sortKey,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
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

  console.log(variantDetails,"checking in product controller to variant details");
  let brandId = variantDetails.product_id.brand_id._id
  let productId = variantDetails.product_id._id

  const offers = await Boffer.find({})
  const Poffers = await Poffer.find({})
  console.log(offers,"offerssss");
  let offer
  let boffer
  for (const elem of offers) {
    if (elem.brandOffer.some((el) => el.brandId.equals(brandId))) {
      boffer = elem
      break
    }
  }
  let poffer
  for (const elem of Poffers) {
    if (elem.productOffer.some((el) => el.productId.equals(productId))) {
      poffer = elem
      break
    }
  }
  if(poffer&&boffer){
    if(poffer.productOffer[0].PofferPrice>boffer.brandOffer[0].BofferPrice){
      offer = poffer
    }else if(poffer.productOffer[0].PofferPrice<boffer.brandOffer[0].BofferPrice){
      offer = boffer
    }
  }else if(boffer && !poffer){
    offer = boffer
  }else if(poffer && !boffer){
    offer = poffer
  }
  console.log(offer,"checking poffer from productController");
  var offerPrice = 0 
  //  if(offer===undefined || !offer.brandOffer || !offer.productOffer){
  //   offerPrice = []
  // }
  if(offer !== undefined){
    if(offer.brandOffer){
      offerPrice = offer.brandOffer[0].BofferPrice
    }else if(offer.productOffer){
      offerPrice = offer.productOffer[0].PofferPrice
    }
  }
  const product = await Product.findOne({_id:variantDetails.product_id._id})
  if(product && offer){
    // console.log(product,"variant");
    product.offer = offerPrice
    product.save()
  }else{
    product.offer = 0
    product.save()
  }
  
  // console.log(offerPrice);

  let alreadyInCart = []
  if(req.session.user){
    const user = req.session.userDetails
    const userId = user._id
   
    const isCart = await Cart.findOne({user_id:userId,'items.variant_id':variantId});
    if(isCart){
      alreadyInCart = isCart
    }
  }

  const related = await Variants.find({ size: variantDetails.size }).populate(
    "product_id"
  );

  const sizes = await Variants.find({ product_id: variantDetails.product_id });

  // console.log(related, "from product controller");
  // console.log(sizes, "sizes from product controller");
  res.render("userPages/product", { offer, offerPrice, alreadyInCart, variantDetails, sizes, related });
};

const cart = async (req, res) => {
  if (req.session.user) {
    const userId = req.session.userDetails;
    const cart = await Cart.findOne({ user_id: userId._id }).populate({
      path: "items.variant_id",
      populate: {
        path: "product_id",
      },
    });
    const docCart = cart?.items || [];
    // const subTotal = docCart.map((item,index) =>({
    //   ...item.toObject(),
    //   variant_id: item.variant_id
    // }))
    let subTotal;
    if (cart) {
      console.log(cart,"checking cart");
      subTotal = cart.items.reduce((acc, item) => {
        console.log(item.variant_id.product_id.offer, item.quantity);
        return acc + (item.variant_id.price-item.variant_id.product_id.offer) * item.quantity;
      }, 0);
    }

    // console.log(subTotal, "subtotalllllllllllllllllllllll");
    // console.log(docCart);
    // console.log(docCart[0].variant_id.product_id,"cart from cart");
    // console.log(docCart,subTotal,"olakkaaakakkakaka");
    res.render("userPages/cart", { docCart, subTotal });
    console.log(docCart, "from cart");
  } else {
    res.redirect("/signup");
  }
};

const addToCart = async (req, res) => {
  if (req.session.user) {
    console.log("hello");
    const { defualtVariantId, u } = req.body;
    let userId = req.session.userDetails;
    const productVariantId = req.params.productVariantId;
    const product = await Variants.findOne({ _id: productVariantId });
    const isCart = await Cart.findOne({ user_id: userId });
    const isProductAdded = await Cart.findOne({
      "items.variant_id": productVariantId,
    }).populate("items.variant_id");

    if (!isCart) {
      await Cart.create({
        user_id: userId._id,
        items: [
          {
            variant_id: productVariantId,
            quantity: 1,
          },
        ],
      });
    }

    if (isProductAdded) {
      isProductAdded.items.forEach(async (element) => {
        console.log(element,"checking cart two");
        // console.log(element.variant_id._id, "usuityuweryut");
        if (element.variant_id._id.equals(product._id)) {
          const countStock = await Variants.findOne({ _id: product._id });
          const countQuantity = element.quantity;
          console.log(countStock.stock, "stock count");
          console.log(countQuantity, "quantity count");

          if (countQuantity < countStock.stock) {
            console.log("added to cart");
            await Cart.updateOne(
              { "items.variant_id": productVariantId },
              { $inc: { "items.$.quantity": 1 } }
            );
          } else {
            console.log("stock out");
          }
        }
      });
    }

    if (!isProductAdded && isCart) {
      await Cart.updateOne(
        { user_id: userId._id },
        {
          $push: {
            items: [{ variant_id: productVariantId, quantity: 1 }],
          },
        }
      );
    }

    // res.redirect(`/product/${productVariantId}`);
    res.redirect("/cart");
  } else {
    res.redirect("/signin");
  }
};

const updateCart = async (req, res) => {
  const { variant_id, action, currentQuantity } = req.body;
  const userId = req.session.userDetails?._id;
  // let cart = await Cart.findOne({ user_id: userId });
  const variant = await Variants.findById(variant_id);

  switch (action) {
    case "increase":
      if (currentQuantity >= 5) {
        return res.status(400).json({
          message: "Minimum Quantity Exceed",
        });
      }
      if (currentQuantity >= variant.stock) {
        console.log("quntity is over");
        return res.status(400).json({ message: `Stock Limit Exceed` });
      }
      await Cart.updateOne(
        { "items.variant_id": variant_id },
        { $inc: { "items.$.quantity": 1 } }
      );
      return res.status(200).json({ message: "Cart Updated Successfully" });
    case "decrease":
      if (currentQuantity <= 1) {
        console.log("quntity is below 0");
        return res
          .status(400)
          .json({ message: `Atleast One Product Need Or You Can Delete` });
      }
      await Cart.updateOne(
        { "items.variant_id": variant_id },
        { $inc: { "items.$.quantity": -1 } }
      );
      return res.status(200).json({ message: "Cart Updated Successfully" });
    case "remove":
      await Cart.updateOne(
        { user_id: userId },
        { $pull: { items: { variant_id: variant_id } } }
      );
      return res.status(200).json({ message: "Item Removed From Cart" });
    default:
  }
};

const goToCheckout = async (req, res) => {
  if (req.session.user) {
    try {
      const user = req.session.userDetails;
      const userId = user?._id;
      const cart = await Cart.findOne({ user_id: userId }).populate({
        path: "items.variant_id",
        populate: {
          path: "product_id",
        },
      });

      // console.log(cart.items[1].variant_id,"goToCheckout function");

      let outOfStockItems = [];
      let inStockItems = [];

      cart.items.forEach((element) => {
        if (element.quantity > element.variant_id.stock) {
          outOfStockItems.push({
            productName: element.variant_id.product_id.productName,
            stock: element.variant_id.stock,
            requested: element.quantity,
          });
        } else {
          inStockItems.push({
            productName: element.variant_id.product_id.productName,
            stock: element.variant_id.stock,
            requested: element.quantity,
          });
        }
      });

      if (outOfStockItems.length > 0) {
        return res.status(400).json({
          message: "Some items in your cart exceed stock limits.",
          outOfStockItems,
        });
      }

      res.status(200).json({
        message: "All items are within stock limits. Proceeding to checkout.",
        inStockItems,
      });
    } catch (error) {
      console.log(error, "error in gotoCheckout backend");
    }

    // console.log(cart.items);
    // if (cart) {
    //   return res.status(200).json({ message: "hgsddgshgdhg" });
    // }else{
    //   return res.status(400).json({message:"errorrrrrrrrr"})
    // }
  } else {
    res.redirect("/signin");
  }
};

const checkout = async (req, res) => {
  if (req.session.user) {
    const userId = req.session.userDetails;

    const coupons = await Coupons.find({
      status: true,
      "users.user": { $ne: userId },
    });

    const userAddressData = await Addresses.findOne({ user_id: userId });
    if (userAddressData) {
      const { addresses } = userAddressData;
      res.render("userPages/checkout", { addresses, coupons });
    } else {
      res.render("userPages/checkout", { addresses: [], coupons });
    }
  } else {
    res.redirect("/signin");
  }
};

const Razorpay = require("razorpay");
const razorpayInstance = new Razorpay({
  key_id: "rzp_test_o8NbEzmS8geUeF",
  key_secret: "sbSQz7iwthgFPcwFUg3J6UXw",
});

const placeOrder = async (req, res) => {
  if (req.session.user) {
    try {
      const userId = req.session.userDetails?._id;

      let total = 0;

      let orderAddress = [];
      const { selectedAddressId, selectedPaymentMethod, selectedCouponId } =
        req.body;

      const coupon = await Coupons.findOne({ _id: selectedCouponId });

      const address = await Addresses.findOne({
        "addresses._id": selectedAddressId,
      });
      address.addresses.forEach((element) => {
        if (element._id == selectedAddressId) {
          orderAddress = element;
        }
      });

      const cart = await Cart.findOne({ user_id: userId }).populate({
        path: "items.variant_id",
        populate: {
          path: "product_id",
        },
      });

      let outOfStockItems = [];
      let inStockItems = [];
      let orderedItems = [];

      for (const element of cart.items) {
        console.log(element,"check for place");
        if (element.quantity > element.variant_id.stock) {
          outOfStockItems.push({
            productName: element.variant_id.product_id.productName,
            stock: element.variant_id.stock,
            requested: element.quantity,
          });
        } else {
          inStockItems.push({
            productName: element.variant_id.product_id.productName,
            stock: element.variant_id.stock,
            requested: element.quantity,
          });
          total += (element.variant_id.price-element.variant_id.product_id.offer) * element.quantity;
          orderedItems.push({
            variantId: element.variant_id._id,
            productName: element.variant_id.product_id.productName,
            quantity: element.quantity,
            price: element.variant_id.price,
            image: element.variant_id.product_id.images[0],
          });
        }
      }

      if (outOfStockItems.length > 0) {
        return res.status(400).json({
          message: "Some items in your cart exceed stock limits.",
          outOfStockItems,
        });
      }
      let fin = total;
      let discount = 0;
      if (coupon) {
        discount = (coupon.percentage / 100) * total;
        total = total - discount;
        coupon.users = [
          {
            user: userId,
          },
        ];
        coupon.save();
      }

      // Handle WLT

      if (selectedPaymentMethod === "WLT") {
        const user = await User.findOne({ _id: userId });
        if (user.wallet > total) {
          const order = await Order.create({
            userId: userId,
            orderedItems: orderedItems,
            address: {
              label: orderAddress.label,
              street: orderAddress.street,
              city: orderAddress.city,
              zip: orderAddress.zip,
              country: orderAddress.country,
              phone: orderAddress.phone,
              state: orderAddress.state,
            },
            discount: discount,
            paymentMethod: "COD",
            totalAmount: total,
            finalAmount: fin,
            paymentStatus: "Pending",
          });

        

          for (const element of cart.items) {
            const variants = await Variants.findByIdAndUpdate(
              element.variant_id.id,
              { $inc: { stock: -element.quantity } }
            );
            variants.save();
          }

          cart.items = [];
          cart.save();

          // await User.updateOne({ _id: userId }, { $inc: { wallet: -total } });

     
      await User.updateOne(
        { _id: userId },
        {
          $inc: { wallet: -total },
          $push: {
            transactions: {
              type: "Debit",
              amount: total,
              description: `Amount Debited For Ordering ${order._id} Order`,
              order_id: order._id,
            },
          },
        }
      );

          return res.status(200).json({ message: "Order placed successfully" });
        } else {
          return res.status(400).json({ message: "Enough Balance In Wallet" });
        }
      }

      // Handle COD

      if (selectedPaymentMethod === "COD") {
        await Order.create({
          userId: userId,
          orderedItems: orderedItems,
          address: {
            label: orderAddress.label,
            street: orderAddress.street,
            city: orderAddress.city,
            zip: orderAddress.zip,
            country: orderAddress.country,
            phone: orderAddress.phone,
            state: orderAddress.state,
          },
          discount: discount,
          paymentMethod: "COD",
          totalAmount: total,
          finalAmount: fin,
          paymentStatus: "Pending",
        });

        for (const element of cart.items) {
          const variants = await Variants.findByIdAndUpdate(
            element.variant_id.id,
            { $inc: { stock: -element.quantity } }
          );
          variants.save();
        }

        cart.items = [];
        cart.save();

        return res.status(200).json({ message: "Order placed successfully" });
      }

      // Handle Razorpay Payment
      if (selectedPaymentMethod === "RZP") {
        const razorpayOrder = await razorpayInstance.orders.create({
          amount: total * 100, // Amount in paise
          currency: "INR",
          receipt: `order_${Date.now()}`,
          payment_capture: 1,
        });
        const userId = req.session.userDetails?._id;

        await Order.create({
          userId: userId,
          orderedItems: orderedItems,
          address: {
            label: orderAddress.label,
            street: orderAddress.street,
            city: orderAddress.city,
            zip: orderAddress.zip,
            country: orderAddress.country,
            phone: orderAddress.phone,
            state: orderAddress.state,
          },
          discount: discount,
          paymentMethod: "RZP",
          totalAmount: total,
          finalAmount: total,
          paymentStatus: "Success",
          razorpayOrderId: razorpayOrder.id,
        });
        for (const element of cart.items) {
          const variants = await Variants.findByIdAndUpdate(
            element.variant_id.id,
            { $inc: { stock: -element.quantity } }
          );
          variants.save();
        }
        cart.items = [];
        cart.save();
        return res.status(200).json({
          message: "Order created successfully with Razorpay.",
          order_id: razorpayOrder.id,
          amount: total,
        });
      }
    } catch (error) {
      console.log(error, "Error in placeOrder controller");
      res.status(500).send("Server Error");
    }
  } else {
    res.redirect("/signin");
  }
};

const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", "sbSQz7iwthgFPcwFUg3J6UXw")
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // Update order status to success
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { paymentStatus: "Success" },
      { new: true }
    );
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
};

const success = async (req, res) => {
  if (req.session.user) {
    res.render("userPages/success");
  } else {
    res.redirect("/signin");
  }
};

const myProfile = async (req, res) => {
  if (req.session.user) {
    // console.log(req.session.userDetails, "form myprofile route");
    const user = await User.findOne({ _id: req.session.userDetails._id });
    // console.log(user, "myProfile for sadh");
    res.render("userPages/myProfile", { user, url: req.originalUrl });
  } else {
    res.redirect("/signup");
  }
};

const editProfile = async (req, res) => {
  // console.log("from edit profile");
  if (req.session.user) {
    const { username, phone } = req.body;
    // console.log(username, phone);
    const userId = req.session.userDetails._id;
    // console.log(userId, "from editprofile");
    await User.updateOne(
      { _id: userId },
      {
        username: username,
        phone: phone,
      }
    );
    res.redirect("/myProfile");
  } else {
    res.redirect("/signin");
  }
};

const myAddress = async (req, res) => {
  if (req.session.user) {
    const userId = req.session.userDetails;
    // console.log(userId, "user id from my address page ");
    const addresses = await Addresses.findOne({ user_id: userId._id });
    const docAddresses = addresses?.addresses || [];
    // console.log(docAddresses,"docAddresses");
    // console.log(addresses, "new address");
    const user = req.session.userDetails;
    res.render("userPages/myAddress", {
      user,
      docAddresses,
      url: req.originalUrl,
    });
  } else {
    res.redirect("/signup");
  }
};

const postmyAddress = async (req, res) => {
  try {
    const userId = req.session.userDetails;
    // console.log(userId._id, "form post");
    const { street, country, zip, phone, city, state, label } = req.body;
    // console.log(street, country, zip, phone, city, state, label);
    const isAddress = await Addresses.findOne({ user_id: userId._id });
    if (!isAddress) {
      await Addresses.create({
        user_id: userId._id,
        addresses: [
          {
            street,
            country,
            zip,
            phone,
            city,
            state,
            label,
          },
        ],
      });

      return res.redirect("/myAddress");
    } else {
      await Addresses.updateOne(
        { user_id: userId._id },
        {
          $push: {
            addresses: {
              street,
              country,
              zip,
              phone,
              city,
              state,
              label,
            },
          },
        }
      );
      return res.redirect("/myAddress");
    }
  } catch (error) {
    console.log(error);
  }
};

const postmyAddressCheckout = async (req, res) => {
  try {
    const userId = req.session.userDetails;
    // console.log(userId._id, "form post");
    const { street, country, zip, phone, city, state, label } = req.body;
    // console.log(street, country, zip, phone, city, state, label);
    const isAddress = await Addresses.findOne({ user_id: userId._id });
    if (!isAddress) {
      await Addresses.create({
        user_id: userId._id,
        addresses: [
          {
            street,
            country,
            zip,
            phone,
            city,
            state,
            label,
          },
        ],
      });

      return res.redirect("/checkout");
    } else {
      await Addresses.updateOne(
        { user_id: userId._id },
        {
          $push: {
            addresses: {
              street,
              country,
              zip,
              phone,
              city,
              state,
              label,
            },
          },
        }
      );
      return res.redirect("/checkout");
    }
  } catch (error) {
    console.log(error);
  }
};

const deleteAddress = async (req, res) => {
  if (req.session.user) {
    const userId = req.session.userDetails;
    // console.log("hello from delete address");
    const addressId = req.params.addressId;

    await Addresses.updateOne(
      { user_id: userId._id },
      { $pull: { addresses: { _id: addressId } } }
    );

    // console.log(addressId, "Address deleted successfully.");
    res.redirect("/myAddress");
  } else {
    res.redirect("/signin");
  }
};

const editAddress = async (req, res) => {
  if (req.session.user) {
    const addressId = req.params.addressId;
    const user = req.session.userDetails;
    // console.log(addressId, "edit address");
    const allAddress = await Addresses.findOne({ "addresses._id": addressId });
    // console.log(allAddress.addresses,"deeeeeeeeeeeeeeeeeeee");
    var address = [];
    allAddress.addresses.forEach((e) => {
      if (e._id == addressId) {
        address = e;
      }
    });

    // console.log(address,'daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    res.render("userPages/editAddress", {
      user,
      address,
      url: req.originalUrl,
    });
  } else {
    res.redirect("/signin");
  }
};

const postEditAddress = async (req, res) => {
  // console.log("kainjitt vere pani nd");
  if (req.session.user) {
    const addressId = req.params.addressId;
    // console.log(addressId, "from post edit address");
    const { street, country, zip, phone, city, state, label } = req.body;

    const addressDoc = await Addresses.findOne({ "addresses._id": addressId });
    const addressToUpdate = addressDoc.addresses.id(addressId);

    if (addressToUpdate) {
      addressToUpdate.street = street;
      addressToUpdate.country = country;
      addressToUpdate.zip = zip;
      addressToUpdate.phone = phone;
      addressToUpdate.city = city;
      addressToUpdate.state = state;
      addressToUpdate.label = label;
      addressToUpdate.updatedAt = new Date();
    }
    await addressDoc.save();

    res.redirect("/myAddress");
  } else {
    res.redirect("/signin");
  }
};

const orders = async (req, res) => {
  if (req.session.user) {
    const user = req.session.userDetails?._id;
    const orders = await Order.find({ userId: user }).sort({ createdAt: -1 });
    res.render("userPages/orders", { user, url: req.originalUrl, orders });
  } else {
    res.redirect("/signin");
  }
};

const singleOrderDetails = async (req, res) => {
  if (req.session.user) {
    const singleOrderId = req.params.singleOrderId;
    const order = await Order.findOne({ _id: singleOrderId });
    console.log(order, "lastMoment");
    const user = req.session.userDetails?._id;
    res.render("userPages/singleOrderDetails", {
      user,
      url: req.originalUrl,
      order,
    });
  } else {
    res.redirect("/signin");
  }
};

const cancelOrder = async (req, res) => {
  if (req.session.user) {
    try {
      const user = req.session.userDetails;
      const userId = user._id;
      const { orderId } = req.params;
      console.log(orderId, "is the orderId in cancel order");

      const order = await Order.findOne({ orderId: orderId });
      console.log(order, "is the order found in the mongodb for cancel");
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Order not Found" });

      if (order.status === "Cancelled")
        return res
          .status(400)
          .json({ success: false, message: "Order already Cancelled" });

      if (order.paymentMethod !== "COD") {
        order.paymentStatus = "Payment Cancelled";
      } else {
        order.paymentStatus = "Refunded";
      }

      order.status = "Cancelled";
      await order.save();

      for (let item of order.orderedItems) {
        await Variants.findByIdAndUpdate(item.variantId, {
          $inc: { stock: item.quantity },
        });
      }
      const totalAmount = order.totalAmount
      console.log(totalAmount, "available on WLT");
      console.log(order,"to check Wallet problem");
      if(order.paymentMethod !== 'COD'){
        await User.updateOne(
          { _id: userId },
          {
            $inc: { wallet: +totalAmount },
            $push: {
              transactions: {
                type: "Credit",
                amount: order.totalAmount,
                description: `Amount Credited For Cancelling ${order._id} Order`,
                order_id: order._id,
              },
            },
          }
        );
      }

      res.redirect("/orders");
      // res.status(200).json({ success: true, message: '' })
    } catch (error) {
      console.log("Error in cancelling order: ", error);
      res.status(500).json({ success: false, message: "server" });
    }
  } else {
    res.redirect("/signin");
  }
};

const wishList = async (req, res) => {
  if (req.session.user) {
    const user = req.session.userDetails;
    const userId = user._id;
    console.log(userId);
    const products = await WishList.findOne({ user_id: userId }).populate({
      path: "items.variant_id",
      populate: {
        path: "product_id",
      },
    });
    res.render("userPages/wishList", { products });
  } else {
    res.redirect("/signin");
  }
};

const addToWishList = async (req, res) => {
  if(req.session.user){
    try {
      const { defualtVariantId } = req.body;
      const user = req.session.userDetails;
      const userId = user._id;
      const isWishList = await WishList.findOne({ user_id: userId });
      console.log(isWishList, "isWishlist");
      const isWish = await WishList.findOne({
        user_id: userId,
        "items.variant_id": defualtVariantId,
      });
      console.log(isWish, "isWish");
      if (!isWish && isWishList) {
        await WishList.updateOne(
          { user_id: userId },
          {
            $push: {
              items: {
                variant_id: defualtVariantId,
              },
            },
          }
        );
        return res.status(200).json({ message: "product added successfully" });
      } else if (isWish) {
        return res
          .status(400)
          .json({ message: "product is already in wish list" });
      } else if (isWishList && !isWish) {
        await WishList.updateOne(
          { user_id: userId },
          {
            items: [
              {
                variant_id: defualtVariantId,
              },
            ],
          }
        );
        return res.status(200).json({ message: "product added successfully" });
      } else if (!isWishList && !isWish) {
        await WishList.create({
          user_id: userId,
          items: [
            {
              variant_id: defualtVariantId,
            },
          ],
        });
        return res.status(200).json({ message: "product added successfully" });
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/signin");
  }
};

const removeFromWishList = async (req, res) => {
  const { defualtVariantId } = req.body;
  const user = req.session.userDetails;
  const userId = user._id;
  await WishList.updateOne(
    { user_id: userId },
    {
      $pull: {
        items: {
          variant_id: defualtVariantId,
        },
      },
    }
  );
  return res.status(200).json({ message: "removed" });
};

const wallet = async (req, res) => {
  if (req.session.user) {
    const user = req.session.userDetails;
    const userId = user._id;
    const userInfo = await User.findOne({ _id: userId })
    res.render("userPages/wallet", { user, url: req.originalUrl, userInfo });
  } else {
    res.redirect("/signin");
  }
};

const coupons = async (req, res) => {
  const user = req.session.userDetails;
  const userId = user._id;
  const coupons = await Coupons.find({});
  res.render("userPages/coupons", { user, url: req.originalUrl, coupons });
};

const returnOrder = async (req, res) => {
  const userId = req.session.userDetails?._id;
  const { orderId } = req.body;
  console.log(orderId, "checking the return order");
  const order = await Order.findOne({ orderId: orderId });
  console.log(order);
  if (order) {
    order.status = "Return Request";
    order.save();
    return res
      .status(200)
      .json({ message: "Requested for return the product" });
  } else {
    return res.status(400).json({ message: "Order Not Found" });
  }
};

const userLogout = (req, res) => {
  req.session.user = null;
  res.redirect("/signin");
};

const downloadInvoice = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Fetch the order details
    const order = await Order.findOne({orderId:orderId}).populate('orderedItems.variantId').populate('userId');

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set the response headers to indicate a file download
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${order.orderId}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe the PDF document directly to the response
    doc.pipe(res);

    // Design the invoice
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();

    // Order details
    doc.fontSize(12).text(`Order ID: ${order.orderId}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.moveDown();

    // Shipping address
    doc.text('Shipping Address:');
    const address = order.address;
    doc.text(`${address.label}`);
    doc.text(`${address.street}, ${address.city}, ${address.state}`);
    doc.text(`${address.zip}, ${address.country}`);
    doc.text(`Phone: ${address.phone}`);
    doc.moveDown();

    // Ordered Items
    doc.text('Ordered Items:');
    order.orderedItems.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.productName} - ${item.quantity} x $${item.price} = $${item.quantity * item.price}`
      );
    });
    doc.moveDown();

    // Total amounts
    doc.text(`Subtotal: $${order.totalAmount}`);
    doc.text(`Discount: $${order.discount || 0}`);
    doc.text(`Final Amount: #${order.finalAmount}`);
    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};




module.exports = {
  home,
  shop,
  product,
  cart,
  checkout,
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
  postmyAddressCheckout,
  deleteAddress,
  editProfile,
  editAddress,
  postEditAddress,
  orders,
  singleOrderDetails,
  cancelOrder,
  addToCart,
  updateCart,
  goToCheckout,
  placeOrder,
  success,
  forgotPassword,
  postEmailVerification,
  newPassword,
  postNewPassword,
  otpForEmail,
  postPasswordOtp,
  resendPasswordOtp,
  verifyRazorpayPayment,
  addToWishList,
  wishList,
  removeFromWishList,
  wallet,
  coupons,
  returnOrder,
  downloadInvoice,
};
