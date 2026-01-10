// models/Subscriber.js
const mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true }, // Telegram chat ID
  username: { type: String },                               // Telegram username
  subscriptionActive: { type: Boolean, default: false },    // true if subscription is active
  expiresAt: { type: Date },                                // subscription expiry date
  paymentTxId: { type: String },                            // optional: store USDT transaction ID
  createdAt: { type: Date, default: Date.now }             // when the subscriber was added
});

module.exports = mongoose.model('Subscriber', SubscriberSchema);
