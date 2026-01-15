// models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  username: { type: String },
  orderText: { type: String },
  paid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
