const mongoose = require("mongoose");
const { type } = require("os");


const POfferSchema = new mongoose.Schema({
  productOffer:[{
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
    },
    PofferPrice:{
        type:Number,
        default:0
    }
  }]
});

const POffer = mongoose.model("POffer", POfferSchema);
module.exports = POffer;
