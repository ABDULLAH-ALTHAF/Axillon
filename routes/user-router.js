const express = require("express");
const router = express.Router();
const passport = require('passport')
const {
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
  resendSignupOtp,
  postSignupOtp,
  myProfile,
  myAddress,
  userLogout,
  postmyAddress,
  deleteAddress,
  editProfile
} = require("../controllers/user-controller");

router.get("/home", home);
router.get("/shop", shop);
router.get("/product/:variantId", product);
router.get("/cart", cart);
router.get("/checkoutAddress", checkoutAddress);
router.get("/checkoutPayment", checkoutPayment);
router.get("/signin", signin);
router.get("/signup", signup);
router.get("/signupOtp", signupOtp);
router.post("/postSignupOtp", postSignupOtp)
router.post("/postSignup", postSignup);
router.post("/postSignin", postSignin);
router.get("/resendSignupOtp", resendSignupOtp)
router.get('/myProfile', myProfile)
router.get('/userLogout',userLogout)
router.get('/myAddress',myAddress)
router.post('/postmyAddress',postmyAddress)
router.get('/deleteAddress/:addressId',deleteAddress)
router.post('/editProfile',editProfile)

router.get('/auth/google', passport.authenticate('google',{scope:['profile','email']}))
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
  req.session.user = true
  req.session.userDetails = req.user
  console.log(req.us,"routesssssssssssss");
  res.redirect('/home')
})

module.exports = router;
