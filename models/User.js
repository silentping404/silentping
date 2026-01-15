const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  chatId: { type: String, unique: true },
  username: String,
  credits: { type: Number, default: 1 }, // 1 free credit
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
