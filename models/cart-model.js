const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  quantity: {
    type: Number,
  },
});

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
