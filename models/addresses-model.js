const mongoose = require("mongoose");

const addressesSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  addresses:[{
    _id:{
      type:mongoose.Schema.Types.ObjectId,
      default:()=> new mongoose.Types.ObjectId()
    },
    street: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    label: {
      type: String,
    }
  }]
  

  
});

const Addresses = mongoose.model("Addresses", addressesSchema);

module.exports = Addresses;
