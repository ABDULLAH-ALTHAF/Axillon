const express = require("express");
const router = express.Router();
const passport = require('passport')
const {
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
  resendSignupOtp,
  postSignupOtp,
  myProfile,
  myAddress,
  userLogout,
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
} = require("../controllers/user-controller");

router.get("/home", home);
router.get("/shop", shop);
router.get("/product/:variantId", product);
router.get("/cart", cart);
router.get("/checkout", checkout);
router.get("/signin", signin);
router.get("/signup", signup);
router.get("/signupOtp", signupOtp);
router.post("/postSignupOtp", postSignupOtp)
router.post("/postSignup", postSignup);
router.post("/postSignin", postSignin);
router.get("/resendSignupOtp", resendSignupOtp)
router.get("/resendPasswordOtp", resendPasswordOtp)
router.get('/myProfile', myProfile)
router.get('/userLogout',userLogout)
router.get('/myAddress',myAddress)
router.post('/postmyAddress',postmyAddress)
router.post('/postmyAddressCheckout',postmyAddressCheckout)
router.get('/deleteAddress/:addressId',deleteAddress)
router.post('/editProfile',editProfile)
router.get('/editAddress/:addressId',editAddress)
router.post('/postEditAddress/:addressId',postEditAddress)
router.get('/orders',orders)
router.get('/addToCart/:productVariantId',addToCart)
router.put('/updateCart',updateCart)
router.put('/goToCheckout',goToCheckout)
router.post('/placeOrder',placeOrder)
router.get('/success',success)
router.get('/singleOrderDetails/:singleOrderId',singleOrderDetails)
router.post('/cancelOrder/:orderId', cancelOrder)
router.get('/forgotPassword',forgotPassword)
router.post('/postEmailVerification',postEmailVerification)
router.get('/newPassword',newPassword)
router.post('/postNewPassword',postNewPassword)
router.get('/otpForEmail',otpForEmail)
router.post('/postPasswordOtp',postPasswordOtp)
router.post('/verifyRazorpayPayment',verifyRazorpayPayment)
router.get('/wishList',wishList)
router.post('/addToWishList',addToWishList)
router.post('/removeFromWishList',removeFromWishList)
router.get('/wallet',wallet)
router.get('/coupons',coupons)
router.post('/returnOrder',returnOrder)
router.get('/downloadInvoice/:orderId', downloadInvoice)

router.get('/auth/google', passport.authenticate('google',{scope:['profile','email']}))
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
  req.session.user = true
  req.session.userDetails = req.user
  console.log("User In Through Google");
  res.redirect('/home')
})

module.exports = router;
