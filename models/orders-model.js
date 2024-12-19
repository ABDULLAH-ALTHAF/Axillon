const mongoose = require("mongoose");
const { Schema } = mongoose;
const Product = require("../models/product-model");

const orderSchema = new Schema(
  {
    orderId: {
        type:mongoose.Schema.Types.ObjectId,
        default:()=> new mongoose.Types.ObjectId()
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Return Request",
        "Returned",
        "Return Cancelled",
        "Cancelled",
        "Failed",
      ],
      default:"Pending"
    },
    discount:{
      type:Number,
    },
    paymentStatus: {
      type: String,
      default: 'Pending',
      required: true,
    },
    address: {
      label: {
        type: String,
      },
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zip: {
        type: String,
      },
      country: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    orderedItems: [
      {
        variantId: {
          type: Schema.Types.ObjectId,
          ref: "Variants",
          required: true,
        },
        productName:{
            type:String
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        image:{
            type:String
        },
        createdOn: {
          type: Date,
          default: Date.now,
          required: true,
        },
      },
    ],
    discount: {
      type: Number,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    razorpayOrderId: {
      type:String
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
