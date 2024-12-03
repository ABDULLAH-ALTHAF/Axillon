const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items:[{
    variant_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Variants",
        required:true,
    },
    quantity:{
        type:Number,
        default:0,
    },
  }]
});

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
