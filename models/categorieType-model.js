const mongoose = require("mongoose");

const TypesSchema = new mongoose.Schema({
  typeName: {
    type: String,
  },
  status: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Types = mongoose.model("Types", TypesSchema);
module.exports = Types;
