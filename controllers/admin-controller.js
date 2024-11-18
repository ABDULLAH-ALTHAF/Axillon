const express = require("express");
const User = require("../models/user-model");
const Product = require("../models/product-model");
const Brands = require("../models/categorieBrand-model");
const Types = require("../models/categorieType-model");
const Variants = require("../models/variants-model");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { render } = require("ejs");
const multerMiddleware = require("../middlewares/multer").multerMiddleware;

const pageNotFound = (req, res) => {
  res.render("404");
};

const adminSignin = (req, res) => {
  if (req.session.admin) {
    res.redirect("/dashboard");
  } else {
    let invalid = req.query.invalid;
    res.render("adminPages/adminSignin", { invalid });
  }
};

const postAdminSignin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email, password: password });
  console.log(user, "user details");
  if (!user || user.isAdmin == false) {
    res.redirect("/admin/adminSignin?invalid=Invalid Inputs");
  }
  if (user && user.isAdmin == true) {
    if (password == user.password) {
      req.session.admin = true;
      res.redirect("/admin/dashboard");
    }
  }
};

const dashboard = (req, res) => {
  if (req.session.admin) {
    res.render("adminPages/dashboard",{url:req.originalUrl});
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const users = async (req, res) => {
  if (req.session.admin) {
    const users = await User.find({ isAdmin: false });
    res.render("adminPages/users", { users ,url:req.originalUrl});
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const products = async (req, res) => {
  if (req.session.admin) {
    try {
      const brand = await Brands.find({ status: true });
      const type = await Types.find({ status: true });
      const products = await Product.find();
      res.render("adminPages/products", { products, brand, type ,url:req.originalUrl});
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postProducts = async (req, res) => {
  console.log("1");
  try {
    const {
      brand_id,
      productName,
      type_id,
      description,
      colour,
      boltPattern,
      createdAt,
    } = req.body;
    let images = [];
    if (req.files && Array.isArray(req.files)) {
      images = req.files.map((file) => file.path);
    }
    console.log(images);
    await Product.create({
      brand_id,
      productName,
      type_id,
      images,
      description,
      colour,
      boltPattern,
      status: true,
      createdAt,
    });
    console.log(productName, "productname from postProducts");
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};

const categories = (req, res) => {
  if (req.session.admin) {
    res.render("adminPages/categories",{url:req.originalUrl});
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const categorieBrand = async (req, res) => {
  if (req.session.admin) {
    try {
      const brands = await Brands.find();
      res.render("adminPages/categorieBrand", { brands , url:req.originalUrl});
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postCategorieBrand = async (req, res) => {
  try {
    const { brandName } = req.body;
    await Brands.create({ brandName, status: true });
    console.log("postCategorieBrand");
    res.redirect("/admin/categorieBrand");
  } catch (error) {
    console.log(error);
  }
};

const categorieType = async (req, res) => {
  if (req.session.admin) {
    try {
      const types = await Types.find({});
      res.render("adminPages/categorieType", { types,url:req.originalUrl });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postCategorieType = async (req, res) => {
  try {
    const { typeName } = req.body;
    await Types.create({ typeName, status: true });
    console.log("postCategorieType");
    res.redirect("/admin/categorieType");
  } catch (error) {
    console.log(error);
  }
};

const variants = async (req, res) => {
  if (req.session.admin) {
    const productId = req.params.productId;
    req.session.productId = productId;
    const variants = await Variants.find({ product_id: productId });
    res.render("adminPages/variants", { variants ,url:req.originalUrl});
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postVariants = async (req, res) => {
  const { size, price, stock } = req.body;
  const productId = req.session.productId;
  await Variants.create({ product_id: productId, size, price, stock });
  res.redirect("/admin/products");
};

const editVariants = async (req, res) => {
  if (req.session.admin) {
    const variantId = req.params.variantId;
    const variant = await Variants.find({ _id: variantId });
    console.log(variant, "variant full extracted");
    console.log(variant);
    res.render("adminPages/editVariants", { variant,url:req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postEditVariants = async (req, res) => {
  const variantId = req.params.variantId;
  const { size, price, stock } = req.body;
  const product = await Variants.findById(variantId).populate("product_id");
  const productVariant = product.product_id._id;
  console.log(product.product_id._id, "neww");
  await Variants.findByIdAndUpdate(variantId, {
    size,
    price,
    stock,
  });
  console.log("ivdend mone");
  res.redirect(`/admin/variants/${productVariant}`);
};

const editTypes = async (req, res) => {
  if (req.session.admin) {
    const typeId = req.params.typeId;
    const type = await Types.find({ _id: typeId });
    res.render("adminPages/editTypes", { type ,url:req.originalUrl});
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postEditTypes = async (req, res) => {
  const typeId = req.params.typeId;
  const { typeName } = req.body;
  await Types.findByIdAndUpdate(typeId, {
    typeName,
  });
  console.log("ivdend mone");
  res.redirect("/admin/categorieType");
};

const editBrands = async (req, res) => {
  if (req.session.admin) {
    const brandId = req.params.brandId;
    const brand = await Brands.find({ _id: brandId });
    res.render("adminPages/editBrands", { brand ,url:req.originalUrl});
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postEditBrands = async (req, res) => {
  const brandId = req.params.brandId;
  const { brandName } = req.body;
  await Brands.findByIdAndUpdate(brandId, {
    brandName,
  });
  console.log("ivdend mone");
  res.redirect("/admin/categorieBrand");
};

const editProduct = async (req, res) => {
  if (req.session.admin) {
    const productId = req.params.productId;
    const product = await Product.findOne({ _id: productId });
    const brand = await Brands.find();
    const type = await Types.find();

    res.render("adminPages/editProduct", { product, brand, type, url:req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postEditProduct = async (req, res) => {
  const productId = req.params.productId;
  console.log(req.body);
  const { productName, colour, brand_id, type_id, boltPattern, description } =
    req.body;
  console.log("edited");

  await Product.findByIdAndUpdate(productId, {
    brand_id,
    productName,
    type_id,
    description,
    colour,
    boltPattern,
  });

  res.redirect("/admin/products");
};

const editImages = async (req, res) => {
  if (req.session.admin) {
    const productId = req.params.productId;
    const product = await Product.findOne({ _id: productId });
    const brand = await Brands.find();
    const type = await Types.find();

    res.render("adminPages/editImages", { product, brand, type, url:req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postEditImages = async (req, res) => {
  const productId = req.params.productId;
  let images = [];
  if (req.files && Array.isArray(req.files)) {
    images = req.files.map((file) => file.path);
  }
  console.log(images);
  await Product.findByIdAndUpdate(productId, {
    images: images,
  });

  res.redirect("/admin/products");
};

const changeStatusProduct = async (req, res) => {
  if (req.session.admin) {
    const { productId } = req.params;
    const newStatus = req.body.status === "true";

    try {
      const product = await Product.findByIdAndUpdate(productId, {
        status: newStatus,
      });

      if (!product) {
        return res.status(404).send("Product not found");
      }

      res.redirect("/admin/products");
    } catch (error) {
      console.error("Error updating product status:", error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const changeStatusUser = async (req, res) => {
  if (req.session.admin) {
    const { userId } = req.params;
    const newStatus = req.body.status === "true";

    try {
      const user = await User.findByIdAndUpdate(userId, { status: newStatus });
      if(user){
        req.session.user = false
      }
      console.log(user);

      if (!user) {
        return res.status(404).send("User not found");
      }

      res.redirect("/admin/users");
    } catch (error) {
      console.error("Error updating product status:", error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const changeStatusBrand = async (req, res) => {
  if (req.session.admin) {
    const { brandId } = req.params;
    const newStatus = req.body.status === "true";

    try {
      const brand = await Brands.findByIdAndUpdate(brandId, {
        status: newStatus,
      });
      console.log(brand);

      if (!brand) {
        return res.status(404).send("User not found");
      }

      res.redirect("/admin/categorieBrand");
    } catch (error) {
      console.error("Error updating product status:", error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const changeStatusType = async (req, res) => {
  if (req.session.admin) {
    const { typeId } = req.params;
    const newStatus = req.body.status === "true";

    try {
      const type = await Types.findByIdAndUpdate(typeId, { status: newStatus });
      console.log(type);

      if (!type) {
        return res.status(404).send("Type not found");
      }

      res.redirect("/admin/categorieType");
    } catch (error) {
      console.error("Error updating product status:", error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const logout = (req, res) => {
  if (req.session.admin) {
    res.render("adminPages/logout",{url:req.originalUrl});
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postLogout = (req, res) => {
  req.session.admin = null;
  res.redirect("/admin/adminSignin");
};

const search = async (req, res) => {
  if (req.session.admin) {
    const searchFor = req.query.searchFor;
    console.log(searchFor);
    const users = await User.find({
      username: { $regex: searchFor, $options: "i" },
      isAdmin: false,
    });
    console.log(users,"from search")
    res.render("adminPages/users", { users ,url:req.originalUrl});
  } else {
    return res.redirect("/admin/adminSignin");
  }
};

const part = (req,res)=>{
  res.render('adminPages/partialHead')
}

module.exports = {
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
  postEditBrands,
  editBrands,
  logout,
  postLogout,
  search,
  part
};
