const mongoose = require("mongoose");
const { type } = require("os");

const CouponsSchema = new mongoose.Schema({
  couponName: {
    type: String,
  },
  status: {
    type: Boolean,
  },
  expiredAt: {
    type: Date,
  },
  percentage: {
    type: Number,
  },
  minimum: {
    type: Number,
  },
  users: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  fromAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Coupons = mongoose.model("Coupons", CouponsSchema);
module.exports = Coupons;
