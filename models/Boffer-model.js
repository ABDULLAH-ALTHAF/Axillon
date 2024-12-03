const mongoose = require("mongoose");
const { type } = require("os");


const BofferSchema = new mongoose.Schema({
  brandOffer:[{
    brandId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Brands'
    },
    BofferPrice:{
        type:Number,
        default:0
    }
  }]
});

const Boffer = mongoose.model("Boffer", BofferSchema);
module.exports = Boffer;
