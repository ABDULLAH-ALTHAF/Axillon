const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  brand_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brands",
    required: true,
  },
  productName: {
    type: String,
    // required: true,
  },
  type_id: {
    type: mongoose.Schema.Types.ObjectId,
    // required: true,
  },
  images: {
    type: [String],
    // required: true,
  },
  description: {
    type: String,
  },
  colour: {
    type: String,
  },
  boltPattern: {
    type: String,
  },
  variants: {
    type: [String],
  },
  status: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
