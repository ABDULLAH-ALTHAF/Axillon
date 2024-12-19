const express = require("express");
const User = require("../models/user-model");
const Product = require("../models/product-model");
const Brands = require("../models/categorieBrand-model");
const Types = require("../models/categorieType-model");
const Variants = require("../models/variants-model");
const Orders = require("../models/orders-model");
const Coupons = require("../models/coupons-model");
const Boffer = require("../models/Boffer-model");
const Poffer = require("../models/Poffer-model");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
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

const dashboard = async (req, res) => {
  if (req.session.admin) {
    const orders = await Orders.find();
    let totalSalesCount = await Orders.find({
      status: {
        $in: ["Cancelled", "Pending", "Delivered", "Return Cancelled"],
      },
    }).countDocuments();
    let totalSalesAmount = await Orders.aggregate([
      {
        $match: {
          status: {
            $in: ["Cancelled", "Pending", "Delivered", "Return Cancelled"],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$finalAmount" },
        },
      },
    ]);

    let mostSellingProducts = await Orders.aggregate([
      {
        $match: {
          status: {
            $in: ["Cancelled", "Pending", "Delivered", "Return Cancelled"],
          },
        },
      },

      { $unwind: "$orderedItems" },
      {
        $group: {
          _id: "$orderedItems.variantId",
          totalQuantity: { $sum: "$orderedItems.quantity" },
          productName: { $first: "$orderedItems.productName" },
          image: { $first: "$orderedItems.image" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    if (mostSellingProducts.length > 0) {
      console.log("Top Selling Products:", mostSellingProducts);
    } else {
      console.log("No products found.");
    }

    let mostSellingBrand = await Orders.aggregate([
      {
        $match: {
          status: {
            $in: ["Cancelled", "Pending", "Delivered", "Return Cancelled"],
          },
        },
      },
      { $unwind: "$orderedItems" },
      {
        $lookup: {
          from: "variants",
          localField: "orderedItems.variantId",
          foreignField: "_id",
          as: "variantDetails",
        },
      },
      { $unwind: "$variantDetails" },
      {
        $lookup: {
          from: "products",
          localField: "variantDetails.product_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "brands",
          localField: "productDetails.brand_id",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      { $unwind: "$brandDetails" },
      {
        $group: {
          _id: "$brandDetails._id",
          brandName: { $first: "$brandDetails.brandName" },
          totalQuantity: { $sum: "$orderedItems.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    if (mostSellingBrand.length > 0) {
      console.log("Top Selling Brands:", mostSellingBrand);
    } else {
      console.log("No brands found in the selected criteria.");
    }

    let totalDiscountAmount = await Orders.aggregate([
      {
        $match: {
          status: {
            $in: ["Cancelled", "Pending", "Delivered", "Return Cancelled"],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: "$discount" },
          totalOffer: { $sum: "$offer" },
        },
      },
    ]);

    let totalDiscount =
      totalDiscountAmount.length > 0 ? totalDiscountAmount[0].totalDiscount : 0;
    let totalSales =
      totalSalesAmount.length > 0 ? totalSalesAmount[0].totalAmount : 0;

    res.render("adminPages/dashboard", {
      totalDiscount,
      totalSales,
      totalSalesCount,
      orders,
      mostSellingProducts,
      mostSellingBrand,
      url: req.originalUrl,
    });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const users = async (req, res) => {
  if (req.session.admin) {
    const users = await User.find({ isAdmin: false });
    res.render("adminPages/users", { users, url: req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const products = async (req, res) => {
  if (req.session.admin) {
    try {
      const brand = await Brands.find({ status: true });
      const type = await Types.find({ status: true });
      const products = await Product.find().populate("brand_id");
      res.render("adminPages/products", {
        products,
        brand,
        type,
        url: req.originalUrl,
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postProducts = async (req, res) => {
  if (req.session.admin) {
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
      res.redirect("/admin/products");
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const categories = (req, res) => {
  if (req.session.admin) {
    res.render("adminPages/categories", { url: req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const categorieBrand = async (req, res) => {
  if (req.session.admin) {
    try {
      let error = req.query.error;
      const brands = await Brands.find();
      res.render("adminPages/categorieBrand", {
        brands,
        url: req.originalUrl,
        error: error ? error : null,
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postCategorieBrand = async (req, res) => {
  if (req.session.admin) {
    try {
      const { brandName } = req.body;
      const already = await Brands.findOne({
        brandName: new RegExp(`^${brandName}$`, "i"),
      });
      if (!already) {
        await Brands.create({ brandName, status: true });
        res.redirect("/admin/categorieBrand");
      } else {
        res.redirect(
          "/admin/categorieBrand?error=You Cant Create Brand With Same Name"
        );
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const categorieType = async (req, res) => {
  if (req.session.admin) {
    try {
      let error = req.query.error;
      const types = await Types.find({});
      res.render("adminPages/categorieType", {
        types,
        url: req.originalUrl,
        error: error ? error : null,
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postCategorieType = async (req, res) => {
  if (req.session.admin) {
    try {
      const { typeName } = req.body;
      const already = await Types.findOne({
        typeName: new RegExp(`^${typeName}$`, "i"),
      });
      if (!already) {
        await Types.create({ typeName, status: true });
        res.redirect("/admin/categorieType");
      } else {
        res.redirect(
          "/admin/categorieType?error=You Cant Create Type With Same Name"
        );
      }
    } catch (error) {
      console.log(error, "from postCategoritype");
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const variants = async (req, res) => {
  if (req.session.admin) {
    const productId = req.params.productId;
    req.session.productId = productId;
    const variants = await Variants.find({ product_id: productId });
    res.render("adminPages/variants", { variants, url: req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postVariants = async (req, res) => {
  if (req.session.admin) {
    const { size, price, stock } = req.body;
    const productId = req.session.productId;
    await Variants.create({ product_id: productId, size, price, stock });
    res.redirect("/admin/products");
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const editVariants = async (req, res) => {
  if (req.session.admin) {
    const variantId = req.params.variantId;
    const variant = await Variants.find({ _id: variantId });
    res.render("adminPages/editVariants", { variant, url: req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postEditVariants = async (req, res) => {
  if (req.session.admin) {
    const variantId = req.params.variantId;
    const { size, price, stock } = req.body;
    const product = await Variants.findById(variantId).populate("product_id");
    const productVariant = product.product_id._id;
    await Variants.findByIdAndUpdate(variantId, {
      size,
      price,
      stock,
    });
    res.redirect(`/admin/variants/${productVariant}`);
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const orders = async (req, res) => {
  if (req.session.admin) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit;

      const totalOrders = await Orders.countDocuments();

      const order = await Orders.find()
        .populate("userId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalOrders / limit);

      res.render("adminPages/orders", {
        order,
        url: req.originalUrl,
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error(error);
      res.redirect("/admin/adminSignin");
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const cancelOrder = async (req, res) => {
  if (req.session.admin) {
    try {
      const { orderId } = req.params;

      const order = await Orders.findOne({ orderId: orderId });
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Order not Found" });

      if (order.status === "Cancelled")
        return res
          .status(400)
          .json({ success: false, message: "Order already Cancelled" });

      if (order.paymentMethod !== "COD") {
        order.paymentStatus = "Refunded";
      } else {
        order.paymentStatus = "Payment Cancelled";
      }

      order.status = "Cancelled";
      await order.save();

      for (let item of order.orderedItems) {
        await Variants.findByIdAndUpdate(item.variantId, {
          $inc: { stock: item.quantity },
        });
      }
      res.redirect("/admin/orders");
    } catch (error) {
      console.log("Error in cancelling order: ", error);
      res.status(500).json({ success: false, message: "server" });
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const deliverOrder = async (req, res) => {
  if (req.session.admin) {
    try {
      const { orderId } = req.params;
      const order = await Orders.findOne({ orderId: orderId });
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Order not Found" });
      if (order.status === "Cancelled")
        return res
          .status(400)
          .json({ success: false, message: "Order already Cancelled" });
      if (order.paymentMethod == "COD") {
        order.paymentStatus = "Payment Success";
      } else if (order.paymentMethod == "RZP") {
        order.paymentStatus = "Payment Success";
      }
      order.status = "Delivered";
      await order.save();
      res.redirect("/admin/orders");
    } catch (error) {
      console.log("error from deliverOrder", error);
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const editTypes = async (req, res) => {
  if (req.session.admin) {
    const typeId = req.params.typeId;
    const type = await Types.find({ _id: typeId });
    res.render("adminPages/editTypes", { type, url: req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postEditTypes = async (req, res) => {
  if (req.session.admin) {
    const typeId = req.params.typeId;
    const { typeName } = req.body;
    await Types.findByIdAndUpdate(typeId, {
      typeName,
    });
    res.redirect("/admin/categorieType");
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const editBrands = async (req, res) => {
  if (req.session.admin) {
    const brandId = req.params.brandId;
    const brand = await Brands.find({ _id: brandId });
    res.render("adminPages/editBrands", { brand, url: req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postEditBrands = async (req, res) => {
  if (req.session.admin) {
    const brandId = req.params.brandId;
    const { brandName } = req.body;
    await Brands.findByIdAndUpdate(brandId, {
      brandName,
    });
    res.redirect("/admin/categorieBrand");
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const editProduct = async (req, res) => {
  if (req.session.admin) {
    const productId = req.params.productId;
    const product = await Product.findOne({ _id: productId });
    const brand = await Brands.find();
    const type = await Types.find();

    res.render("adminPages/editProduct", {
      product,
      brand,
      type,
      url: req.originalUrl,
    });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postEditProduct = async (req, res) => {
  if (req.session.admin) {
    const productId = req.params.productId;
    const { productName, colour, brand_id, type_id, boltPattern, description } =
      req.body;

    await Product.findByIdAndUpdate(productId, {
      brand_id,
      productName,
      type_id,
      description,
      colour,
      boltPattern,
    });

    res.redirect("/admin/products");
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const editImages = async (req, res) => {
  if (req.session.admin) {
    const productId = req.params.productId;
    const product = await Product.findOne({ _id: productId });
    const brand = await Brands.find();
    const type = await Types.find();

    res.render("adminPages/editImages", {
      product,
      brand,
      type,
      url: req.originalUrl,
    });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postEditImages = async (req, res) => {
  if (req.session.admin) {
    const productId = req.params.productId;
    let images = [];
    if (req.files && Array.isArray(req.files)) {
      images = req.files.map((file) => file.path);
    }
    await Product.findByIdAndUpdate(productId, {
      images: images,
    });

    res.redirect("/admin/products");
  } else {
    res.redirect("/admin/adminSignin");
  }
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
      if (user) {
        req.session.user = false;
      }

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

const changeStatusCoupon = async (req, res) => {
  if (req.session.admin) {
    const { couponId } = req.params;
    const newStatus = req.body.status === "true";

    try {
      const coupon = await Coupons.findByIdAndUpdate(couponId, {
        status: newStatus,
      });

      if (!coupon) {
        return res.status(404).send("Coupon not found");
      }

      res.redirect("/admin/coupons");
    } catch (error) {
      console.error("Error updating coupon status:", error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const logout = (req, res) => {
  if (req.session.admin) {
    res.render("adminPages/logout", { url: req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const coupons = async (req, res) => {
  let error = req.query.error;
  if (req.session.admin) {
    const coupons = await Coupons.find({});
    res.render("adminPages/coupons", {
      url: req.originalUrl,
      coupons,
      error: error ? error : null,
    });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postCoupon = async (req, res) => {
  if (req.session.admin) {
    const { couponName, expiredAt, from, percentage, minimum } = req.body;
    const today = new Date();

    if (expiredAt < today) {
      return res.redirect(
        "/admin/coupons?error=Expire Date Must Be greater than Todays"
      );
    } else if (from > expiredAt) {
      return res.redirect(
        "/admin/coupons?error=Cant Give Coupon From Given Date"
      );
    }
    const already = await Coupons.findOne({
      couponName: new RegExp(`^${couponName}$`, "i"),
    });
    if (!already) {
      await Coupons.create({
        couponName: couponName,
        status: true,
        expiredAt: expiredAt,
        fromAt: from,
        percentage: percentage,
        minimum: minimum,
      });
      return res.redirect("/admin/coupons");
    } else {
      return res.redirect("/admin/coupons?error=Coupon Already exist");
    }
  } else {
    return res.redirect("/admin/adminSignin");
  }
};

const postLogout = (req, res) => {
  req.session.admin = null;
  res.redirect("/admin/adminSignin");
};

const search = async (req, res) => {
  if (req.session.admin) {
    const searchFor = req.query.searchFor;
    const users = await User.find({
      username: { $regex: searchFor, $options: "i" },
      isAdmin: false,
    });
    res.render("adminPages/users", { users, url: req.originalUrl });
  } else {
    return res.redirect("/admin/adminSignin");
  }
};

const acceptReturn = async (req, res) => {
  if (req.session.admin) {
    const { orderId } = req.params;
    const order = await Orders.findOne({ orderId: orderId }).populate("userId");

    if (order) {
      await User.updateOne(
        { _id: order.userId },
        {
          $inc: { wallet: +order.totalAmount },
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
    if (order) {
      order.status = "Returned";
      order.save();
      res.redirect("/admin/orders");
    } else {
      return res.status(400).json({ message: "Order Not Found" });
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const rejectReturn = async (req, res) => {
  if (req.session.admin) {
    const { orderId } = req.params;
    const order = await Orders.findOne({ orderId: orderId });
    if (order) {
      order.status = "Return Cancelled";
      order.save();
      res.redirect("/admin/orders");
    } else {
      return res.status(400).json({ message: "Order Not Found" });
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const singleOrder = async (req, res) => {
  if (req.session.admin) {
    const { orderId } = req.params;
    const order = await Orders.findOne({ orderId: orderId });
    if (order) {
      res.render("adminPages/singleOrder", { order, url: req.originalUrl });
    } else {
      return res.status(400).json({ message: "order not found" });
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const offers = async (req, res) => {
  if (req.session.admin) {
    res.render("adminPages/offers", { url: req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const productOffer = async (req, res) => {
  if (req.session.admin) {
    const products = await Product.find();
    const offers = await Poffer.find().populate("productOffer.productId");
    res.render("adminPages/productOffer", {
      offers,
      products,
      url: req.originalUrl,
    });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const brandOffer = async (req, res) => {
  if (req.session.admin) {
    const brands = await Brands.find();
    const offers = await Boffer.find().populate("brandOffer.brandId");

    res.render("adminPages/brandOffer", {
      offers,
      brands,
      url: req.originalUrl,
    });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postBrandOffer = async (req, res) => {
  if (req.session.admin) {
    const { brandId, offerPrice } = req.body;

    await Boffer.create({
      brandOffer: [
        {
          brandId: brandId,
          BofferPrice: offerPrice,
        },
      ],
    });
    res.redirect("/admin/brandOffer");
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const postProductOffer = async (req, res) => {
  if (req.session.admin) {
    const { productId, offerPrice } = req.body;

    await Poffer.create({
      productOffer: [
        {
          productId: productId,
          PofferPrice: offerPrice,
        },
      ],
    });
    res.redirect("/admin/productOffer");
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const deleteBrandOffer = async (req, res) => {
  if (req.session.admin) {
    const { BofferId } = req.params;
    if (BofferId) {
      await Boffer.deleteOne({ _id: BofferId });
    } else {
      return res.status(400).json({ message: "offer not found" });
    }
    res.redirect("/admin/brandOffer");
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const deleteProductOffer = async (req, res) => {
  if (req.session.admin) {
    const { PofferId } = req.params;
    if (PofferId) {
      await Poffer.deleteOne({ _id: PofferId });
    } else {
      return res.status(400).json({ message: "offer not found" });
    }
    res.redirect("/admin/productOffer");
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const editBrandOffer = async (req, res) => {
  if (req.session.admin) {
    const { BofferId } = req.params;
    const { BofferPrice } = req.body;
    if (BofferId) {
      await Boffer.updateOne(
        { _id: BofferId },
        { $set: { "brandOffer.0.BofferPrice": BofferPrice } }
      );
    }
    res.redirect("/admin/brandOffer");
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const editProductOffer = async (req, res) => {
  if (req.session.admin) {
    const { PofferId } = req.params;
    const { PofferPrice } = req.body;
    if (PofferId) {
      await Poffer.updateOne(
        { _id: PofferId },
        { $set: { "productOffer.0.PofferPrice": PofferPrice } }
      );
    }
    res.redirect("/admin/productOffer");
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const editCoupon = async (req, res) => {
  const { couponId } = req.params;
  const { couponName, expiredAt, percentage, minimum } = req.body;
  const coupon = await Coupons.findOne({ _id: couponId });
  if (coupon) {
    coupon.couponName = couponName;
    coupon.expiredAt = expiredAt;
    coupon.percentage = percentage;
    coupon.minimum = minimum;
    coupon.save();
  }
  res.redirect("/admin/coupons");
};

const generateSalesReport = async (req, res) => {
  if (req.session.admin) {
    const { startDate, endDate, format } = req.body;

    try {
      if (!startDate || !endDate) {
        return res.status(400).send("Start date and end date are required.");
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).send("Invalid date format.");
      }

      if (start.getTime() > Date.now()) {
        return res.status(400).send("Starting Date Cant be Future Date");
      }

      if (end.getTime() > Date.now()) {
        return res.status(400).send("End Date Cant be Future Date");
      }

      end.setHours(23, 59, 59, 999);

      const orders = await Orders.find({
        createdAt: { $gte: start, $lte: end },
      }).populate("userId");

      const totalSales = orders.reduce(
        (sum, order) => sum + order.finalAmount,
        0
      );
      const totalDiscount = orders.reduce(
        (sum, order) => sum + (order.discount || 0),
        0
      );
      const totalOrders = orders.length;

      const reportData = orders.map((order) => ({
        orderId: order.orderId,
        date: new Date(order.createdAt).toLocaleDateString(),
        customer: order.userId?.username || "Unknown",
        amount: order.finalAmount,
        discount: order.discount || 0,
        status: order.status,
      }));

      if (format === "pdf") {
        const doc = new PDFDocument();
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="sales_report.pdf"'
        );
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        doc
          .fontSize(24)
          .font("Helvetica-Bold")
          .text("Sales Report", { align: "center", underline: true });
        doc.moveDown(1);

        doc
          .fontSize(14)
          .font("Helvetica")
          .text(`Date Range: ${startDate} - ${endDate}`, { align: "center" });
        doc.moveDown(1);

        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Summary", { underline: true });
        doc.moveDown(0.5);

        doc
          .fontSize(12)
          .font("Helvetica")
          .text(`Total Sales: INR ${totalSales}`, { indent: 20 })
          .text(`Total Discount: INR ${totalDiscount}`, { indent: 20 })
          .text(`Total Orders: ${totalOrders}`, { indent: 20 });
        doc.moveDown(1.5);

        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Order Details", { underline: true });
        doc.moveDown(0.5);

        reportData.forEach((data, index) => {
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text(`Order ${index + 1}:`, { continued: true })
            .font("Helvetica")
            .text(` Order ID: ${data.orderId}`, { continued: true })
            .text(` | Date: ${data.date}`);

          doc.moveDown(0.5);

          doc
            .fontSize(12)
            .font("Helvetica")
            .text(`Customer: ${data.customer}`)
            .text(`Amount: INR ${data.amount}`)
            .text(`Discount: INR ${data.discount}`)
            .text(`Status: ${data.status}`);
          doc.moveDown(0.5);

          const y = doc.y;
          doc
            .moveTo(50, y)
            .lineTo(550, y)
            .strokeColor("#cccccc")
            .lineWidth(0.5)
            .stroke();

          doc.moveDown(1);
        });

        doc
          .fontSize(10)
          .fillColor("gray")
          .text(
            "Generated by Sales Reporting System",
            50,
            doc.page.height - 50,
            {
              align: "center",
            }
          );

        doc.end();
      } else if (format === "excel") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sales Report");

        worksheet.columns = [
          { header: "Order ID", key: "orderId", width: 20 },
          { header: "Date", key: "date", width: 15 },
          { header: "Customer", key: "customer", width: 25 },
          { header: "Amount", key: "amount", width: 15 },
          { header: "Discount", key: "discount", width: 15 },
          { header: "Status", key: "status", width: 20 },
        ];

        worksheet.addRows(reportData);

        res.setHeader(
          "Content-Disposition",
          'attachment; filename="sales_report.xlsx";'
        );
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        await workbook.xlsx.write(res);
        res.end();
      } else {
        const graphData = orders.map((order) => ({
          date: new Date(order.createdAt).toLocaleDateString(),
          amount: order.finalAmount,
        }));

        let dailySalesData = await Orders.aggregate([
          {
            $match: {
              status: {
                $in: ["Cancelled", "Pending", "Delivered", "Return Cancelled"],
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              totalSales: { $sum: "$finalAmount" },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        return res.json({
          graphData,
          dailySalesData,
          totalSales,
          totalDiscount,
          totalOrders,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("An error occurred while generating the report.");
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

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
  changeStatusCoupon,
  editTypes,
  postEditTypes,
  postEditBrands,
  editBrands,
  logout,
  postLogout,
  search,
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
  deleteProductOffer,
  editBrandOffer,
  editProductOffer,
  generateSalesReport,
  editCoupon,
};
