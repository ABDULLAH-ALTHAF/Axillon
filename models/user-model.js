const mongoose = require("mongoose");
const { type } = require("os");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: true,
  },
  referral: {
    type: String,
  },
  phone: {
    type: String,
    required: false,
    sparse: true,
    default: null,
  },
  googleId: {
    type: String,
    uinique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  status: {
    type: Boolean,
  },
  image: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  transactions: [
    {
      type: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      order_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Order',
      },
      createdOn: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
