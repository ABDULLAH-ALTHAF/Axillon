const express = require("express");
const User = require("../models/user-model");
const Product = require("../models/product-model");
const Brands = require("../models/categorieBrand-model");
const Types = require("../models/categorieType-model");
const Variants = require("../models/variants-model");
const Orders = require("../models/orders-model");
const Coupons = require("../models/coupons-model")
// const Offers = require("../models/offer-model")
const Boffer = require('../models/Boffer-model')
const Poffer = require('../models/Poffer-model')
const fs = require("fs");
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
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

const dashboard = async (req, res) => {
  if (req.session.admin) {
    const orders = await Orders.find()
    let totalSalesCount = await Orders.find({ status: { $in: ["Cancelled", "Pending"] } }).countDocuments();
    console.log(totalSalesCount,"total Sales Count");
    let totalSalesAmount = await Orders.aggregate([
      {
        $match: {
          status: { $in: ["Cancelled", "Pending"] },
        },
      },
      {
        $group: {
          _id: null, 
          totalAmount: { $sum: "$finalAmount" }, 
        },
      },
    ]);

    let totalDiscountAmount = await Orders.aggregate([
      {
        $match: {
          status: { $in: ["Cancelled", "Pending"] },
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
    
  
    let totalDiscount = totalDiscountAmount.length > 0 ? totalDiscountAmount[0].totalDiscount : 0;
    let totalSales = totalSalesAmount.length > 0 ? totalSalesAmount[0].totalAmount : 0;
    
    res.render("adminPages/dashboard", { totalDiscount, totalSales, totalSalesCount, orders, url: req.originalUrl });
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
      const products = await Product.find();
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
    res.render("adminPages/categories", { url: req.originalUrl });
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const categorieBrand = async (req, res) => {
  if (req.session.admin) {
    try {
      const brands = await Brands.find();
      res.render("adminPages/categorieBrand", { brands, url: req.originalUrl });
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
      res.render("adminPages/categorieType", { types, url: req.originalUrl });
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
    res.render("adminPages/variants", { variants, url: req.originalUrl });
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
    res.render("adminPages/editVariants", { variant, url: req.originalUrl });
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
        totalPages 
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
      console.log(orderId, "is the orderId in cancel order");

      const order = await Orders.findOne({ orderId: orderId });
      console.log(order, "is the order found in the mongodb");
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
      // res.status(200).json({ success: true, message: '' })
    } catch (error) {
      console.log("Error in cancelling order: ", error);
      res.status(500).json({ success: false, message: "server" });
    }
  } else {
    res.redirect("/admin/adminSignin");
  }
};

const deliverOrder = async (req, res) => {
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
    } else if(order.paymentMethod == "RZP") {
      order.paymentStatus = "Payment Success";
    }
    order.status = "Delivered";
    await order.save();
    res.redirect("/admin/orders");
  } catch (error) {
    console.log("error from deliverOrder", error);
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
    res.render("adminPages/editBrands", { brand, url: req.originalUrl });
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
      if (user) {
        req.session.user = false;
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

const changeStatusCoupon = async (req, res) => {
  if (req.session.admin) {
    const { couponId } = req.params;
    const newStatus = req.body.status === "true";

    try {
      const coupon = await Coupons.findByIdAndUpdate(couponId, { status: newStatus });
      console.log(coupon);

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

const coupons = async (req,res) =>{
  if(req.session.admin){

    const coupons = await Coupons.find({})
    res.render('adminPages/coupons',{url: req.originalUrl,coupons})
  }else{
    res.redirect('/admin/adminSignin')
  }
}

const postCoupon = async (req,res)=>{
  const {couponName,expiredAt,from,percentage,minimum} = req.body
  await Coupons.create({
    couponName:couponName,
      status:true,
      expiredAt:expiredAt,
      fromAt:from,
      percentage:percentage,
      minimum:minimum
  })
  res.redirect('/admin/coupons')
}

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
    console.log(users, "from search");
    res.render("adminPages/users", { users, url: req.originalUrl });
  } else {
    return res.redirect("/admin/adminSignin");
  }
};

const acceptReturn = async(req,res)=>{
  const {orderId}=req.params
  const order = await Orders.findOne({orderId:orderId})
  if(order){
    order.status = 'Returned'
    order.save()
    res.redirect("/admin/orders");
  }else{
    return res.status(400).json({message:"Order Not Found"})
  }
}

const rejectReturn = async(req,res)=>{
  const {orderId}=req.params
  const order = await Orders.findOne({orderId:orderId})
  if(order){
    order.status = 'Return Cancelled'
    order.save()
    res.redirect("/admin/orders");
  }else{
    return res.status(400).json({message:"Order Not Found"})
  }
}

const singleOrder = async (req,res)=>{
  const {orderId}=req.params
  const order = await Orders.findOne({orderId:orderId})
  if(order){
    res.render('adminPages/singleOrder',{order,url: req.originalUrl})
  }else{
    return res.status(400).json({message:'order not found'})
  }
}

const offers = async (req,res)=>{
  res.render('adminPages/offers',{ url: req.originalUrl})
}

const productOffer = async (req,res)=>{
  const products = await Product.find()
  const offers = await Poffer.find().populate('productOffer.productId')
  console.log(offers,"from productOffer");
  res.render('adminPages/productOffer',{offers,products,url: req.originalUrl})
}

const brandOffer = async (req,res)=>{
  const brands = await Brands.find()
  const offers = await Boffer.find().populate('brandOffer.brandId')
  console.log(offers[0],"from brandOffer");

  res.render('adminPages/brandOffer',{offers,brands,url: req.originalUrl})
}

const postBrandOffer = async (req,res)=>{
  const {brandId,offerPrice}=req.body
 
  await Boffer.create({
    brandOffer:[{
      brandId:brandId,
      BofferPrice:offerPrice
    }]
  })
  res.redirect('/admin/brandOffer')
}

const postProductOffer = async (req,res)=>{
  const {productId,offerPrice}=req.body
  
  await Poffer.create({
    productOffer:[{
      productId:productId,
      PofferPrice:offerPrice
    }]
  })
  res.redirect('/admin/productOffer')
}

const deleteBrandOffer = async (req,res)=>{
  const {BofferId} = req.params
  if(BofferId){
    await Boffer.deleteOne({_id:BofferId})
  }else{
    return res.status(400).json({message:"offer not found"})
  }
  res.redirect('/admin/brandOffer')

}

const deleteProductOffer = async (req,res)=>{
  const {PofferId} = req.params
  if(PofferId){
    await Poffer.deleteOne({_id:PofferId})
  }else{
    return res.status(400).json({message:"offer not found"})
  }
  res.redirect('/admin/productOffer')

}

const editBrandOffer = async (req,res)=>{
  const {BofferId} = req.params
  const {BofferPrice} = req.body
  console.log(BofferPrice,"to check edit of brand offer");
  if(BofferId){
    await Boffer.updateOne({_id:BofferId},
      { $set: { "brandOffer.0.BofferPrice": BofferPrice } }
    )
  }
  res.redirect('/admin/brandOffer')
}

const editProductOffer = async (req,res)=>{
  const {PofferId} = req.params
  const {PofferPrice} = req.body
  console.log(PofferPrice,"to check edit of product offer");
  if(PofferId){
    await Poffer.updateOne({_id:PofferId},
      { $set: { "productOffer.0.PofferPrice": PofferPrice } }
    )
  }
  res.redirect('/admin/productOffer')
}

// const part = (req, res) => {
//   res.render("adminPages/partialHead");
// };

const generateSalesReport = async (req, res) => {
  const { startDate, endDate, format } = req.body;

  console.log('Start Date:', startDate);
  console.log('End Date:', endDate);

  try {
    // Parse date range
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).send('Start date and end date are required.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).send('Invalid date format.');
    }

    end.setHours(23, 59, 59, 999); // Include the end of the day

    // Fetch relevant orders within the date range
    const orders = await Orders.find({
      createdAt: { $gte: start, $lte: end },
    });

    if (!orders || orders.length === 0) {
      return res.status(404).send('No orders found for the selected period.');
    }

    // Compute overall metrics
    const totalSales = orders.reduce((sum, order) => sum + order.finalAmount, 0);
    const totalDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
    const totalOrders = orders.length;

    // Prepare data for the report
    const reportData = orders.map((order) => ({
      orderId: order.orderId,
      date: new Date(order.createdAt).toLocaleDateString(),
      customer: order.userId.toString(), // Replace with user details if needed
      amount: order.finalAmount,
      discount: order.discount || 0,
      status: order.status,
    }));

    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(res);

      // PDF Design
      doc.fontSize(20).text('Sales Report', { align: 'center' });
      doc.text(`Date Range: ${startDate} - ${endDate}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Total Sales: $${totalSales}`);
      doc.text(`Total Discount: $${totalDiscount}`);
      doc.text(`Total Orders: ${totalOrders}`);
      doc.moveDown();

      doc.text('Order Details:', { underline: true });
      reportData.forEach((data, index) => {
        doc.text(
          `${index + 1}. Order ID: ${data.orderId} | Date: ${data.date} | Customer: ${data.customer} | Amount: $${data.amount} | Discount: $${data.discount} | Status: ${data.status}`
        );
      });

      doc.end();
    } else if (format === 'excel') {
      // Generate Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      // Excel Header
      worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Customer', key: 'customer', width: 25 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Discount', key: 'discount', width: 15 },
        { header: 'Status', key: 'status', width: 20 },
      ];

      // Add rows
      worksheet.addRows(reportData);

      // Write Excel to response
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      await workbook.xlsx.write(res);
      res.end();
    } else {
      return res.status(400).send('Invalid format specified.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while generating the report.');
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
  deleteProductOffer,
  editBrandOffer,
  editProductOffer,
  generateSalesReport
};
