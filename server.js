// server.js

// ===== Imports =====
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ===== Initialize app =====
const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(bodyParser.json());

// ===== Telegram Bot =====
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
const chatId = process.env.CHAT_ID;

// ===== MongoDB Connection =====
const mongoURI = process.env.MONGO_URI; // Make sure you set MONGO_URI in .env
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("MongoDB connection error ❌:", err));

// ===== Models =====
const WebhookPayload = require("./models/WebhookPayload");

// ===== Routes =====
app.post('/api/webhook', async (req, res) => {
  try {
    // Save payload to MongoDB
    const payload = new WebhookPayload({ payload: req.body });
    await payload.save();

    // Send Telegram notification
    bot.sendMessage(chatId, `New webhook received: ${JSON.stringify(req.body)}`);

    // Response
    res.json({ status: "received" });
  } catch (err) {
    console.error("Webhook error ❌:", err);
    res.status(500).json({ status: "error", error: err.message });
  }
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
