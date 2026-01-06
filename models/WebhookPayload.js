const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema({
  payload: {
    type: Object,
    required: true
  },
  receivedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("WebhookPayload", webhookSchema);
