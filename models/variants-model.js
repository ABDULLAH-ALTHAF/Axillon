const mongoose = require("mongoose");

const VariantsSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  size: {
    type: String,
  },
  price: {
    type: String,
  },
  stock: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Variants = mongoose.model("Variants", VariantsSchema);
module.exports = Variants;
