require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

// ====================
// MongoDB
// ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch((err) => console.error('MongoDB error:', err));

// ====================
// Telegram Bot (POLLING MODE)
// ====================
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('Telegram bot polling started ✅');

// ====================
// Telegram Commands
// ====================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 Welcome to SilentPing

Get instant Telegram alerts when something happens in your apps.

Commands:
/subscribe – Get subscription instructions
/verify – Verify your payment`
  );
});

bot.onText(/\/subscribe/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `💳 Subscription Instructions

Send USDT (TRC20) to this address:

TMiPXEkHkXJs3yNDAJwNPJjBramhW4M6y2

After sending, reply with:
/verify`
  );
});

bot.onText(/\/verify/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `⏳ Payment received.

Your subscription is pending manual verification.
You will be activated shortly.`
  );

  // Notify admin
  bot.sendMessage(
    ADMIN_CHAT_ID,
    `🧾 New verification request\nUser: @${msg.from.username || 'no_username'}\nChat ID: ${msg.chat.id}`
  );
});

// ====================
// Secure Webhook Endpoint (GitHub, Forms, Email, etc.)
// ====================
app.post('/api/webhook', (req, res) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== process.env.MASTER_API_KEY) {
    return res.status(401).json({ success: false, message: 'Invalid API key' });
  }

  const payload = req.body;

  bot.sendMessage(
    ADMIN_CHAT_ID,
    `📡 New Webhook Received:\n\n${JSON.stringify(payload, null, 2)}`
  );

  res.json({ success: true });
});

// ====================
// Health Check
// ====================
app.get('/', (req, res) => {
  res.send('SilentPing is running ✅');
});

// ====================
// Start Server
// ====================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
