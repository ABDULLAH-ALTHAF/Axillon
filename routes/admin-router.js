const express = require("express");
const router = express.Router();
const {
  adminSignin,
  dashboard,
  users,
  products,
  postProducts,
  categories,
  categorieBrand,
  postCategorieBrand,
  categorieType,
  postCategorieType,
  variants,
  postAdminSignin,
  postVariants,
  editProduct,
  postEditProduct,
  editImages,
  postEditImages,
  postEditVariants,
  editVariants,
  changeStatusProduct,
  pageNotFound,
  changeStatusUser,
  changeStatusBrand,
  changeStatusType,
  changeStatusCoupon,
  editTypes,
  postEditTypes,
  editBrands,
  postEditBrands,
  logout,
  postLogout,
  search,
  // part,
  orders,
  cancelOrder,
  deliverOrder,
  coupons,
  postCoupon,
  acceptReturn,
  rejectReturn,
  singleOrder,
  offers,
  productOffer,
  brandOffer,
  postBrandOffer,
  postProductOffer,
  deleteBrandOffer,
  editBrandOffer,
  editProductOffer,
  deleteProductOffer,
  generateSalesReport,
  editCoupon

} = require("../controllers/admin-controller");
const multerMiddleware = require("../middlewares/multer").multerMiddleware;

  
router.get("/pageNotFound", pageNotFound)
router.get("/adminSignin", adminSignin);
router.get("/dashboard", dashboard);
router.get("/users", users);
router.get("/products", products);
router.post("/postProducts", multerMiddleware.array("image", 3), postProducts);
router.get("/categories", categories);
router.get("/categorieBrand", categorieBrand);
router.post("/postCategorieBrand", postCategorieBrand);
router.get("/categorieType", categorieType);
router.post("/postCategorieType", postCategorieType);
router.get("/variants/:productId", variants)
router.post('/postAdminSignin', postAdminSignin)
router.post('/postVariants', postVariants)
router.get('/editVariants/:variantId', editVariants)
router.post("/postEditVariants/:variantId", postEditVariants )
router.get('/editProduct/:productId', editProduct)
router.post('/postEditProduct/:productId', postEditProduct)
router.get('/editImages/:productId', editImages)
router.post('/postEditImages/:productId', multerMiddleware.array("images", 3), postEditImages)
router.post('/changeStatusProduct/:productId', changeStatusProduct)
router.post('/changeStatusUser/:userId', changeStatusUser)
router.post('/changeStatusBrand/:brandId' ,changeStatusBrand)
router.post('/changeStatusType/:typeId' ,changeStatusType)
router.post('/changeStatusCoupon/:couponId' ,changeStatusCoupon)
router.get('/editTypes/:typeId', editTypes)
router.post('/postEditTypes/:typeId', postEditTypes)
router.get('/editBrands/:brandId', editBrands)
router.post('/postEditBrands/:brandId', postEditBrands)
router.get('/logout',logout)
router.get('/postLogout', postLogout)
router.get('/search',search)
// router.get('/part',part)
router.get('/orders',orders)
router.post('/cancelOrder/:orderId', cancelOrder)
router.post('/deliverOrder/:orderId', deliverOrder)
router.post('/acceptReturn/:orderId',acceptReturn)
router.post('/rejectReturn/:orderId',rejectReturn)
router.get('/coupons',coupons)
router.post('/postCoupon',postCoupon)
router.get('/singleOrder/:orderId',singleOrder)
router.get('/offers',offers)
router.get('/productOffer',productOffer)
router.get('/brandOffer',brandOffer)
router.post('/postBrandOffer',postBrandOffer)
router.post('/postProductOffer',postProductOffer)
router.post('/deleteBrandOffer/:BofferId',deleteBrandOffer)
router.post('/deleteProductOffer/:PofferId',deleteProductOffer)
router.post('/editBrandOffer/:BofferId',editBrandOffer)
router.post('/editProductOffer/:PofferId',editProductOffer)
router.post('/sales-report', generateSalesReport);
router.post('/editCoupon/:couponId',editCoupon)



module.exports = router;
  