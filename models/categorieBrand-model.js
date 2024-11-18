const mongoose = require("mongoose");

const BrandsSchema = new mongoose.Schema({
  brandName: {
    type: String,
  },
  status: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Brands = mongoose.model("Brands", BrandsSchema);
module.exports = Brands;
