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
  editTypes,
  postEditTypes,
  editBrands,
  postEditBrands,
  logout,
  postLogout,
  search,
  part

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
router.get('/editTypes/:typeId', editTypes)
router.post('/postEditTypes/:typeId', postEditTypes)
router.get('/editBrands/:brandId', editBrands)
router.post('/postEditBrands/:brandId', postEditBrands)
router.get('/logout',logout)
router.get('/postLogout', postLogout)
router.get('/search',search)
router.get('/part',part)

module.exports = router;
