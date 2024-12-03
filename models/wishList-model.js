const mongoose = require("mongoose");

const WishListSchema = new mongoose.Schema({
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
  }]
});

const WishList = mongoose.model("WishList", WishListSchema);
module.exports = WishList;
