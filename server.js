require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

const Subscriber = require('./models/Subscriber');

const app = express();
app.use(express.json());

// =======================
// MongoDB
// =======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch(err => console.error('MongoDB error:', err));

// =======================
// Telegram Bot (POLLING ONLY)
// =======================
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true
  }
});

console.log('Telegram bot polling started ✅');

// =======================
// Helper
// =======================
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// =======================
// Telegram Commands
// =======================
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  const username = msg.from.username || 'unknown';

  if (!text) return;

  // /start
  if (text === '/start') {
    return bot.sendMessage(
      chatId,
      `👋 Welcome to SilentPing

You’ll receive instant alerts when something happens.

Commands:
/subscribe — get payment instructions
/verify — activate your subscription`
    );
  }

  // /subscribe
  if (text === '/subscribe') {
    return bot.sendMessage(
      chatId,
      `💳 Subscription: 30 days

Send *USDT (TRC20)* to this address:

\`TMiPXEkHkXJs3yNDAJwNPJjBramhW4M6y2\`

After sending payment, type:
/verify`,
      { parse_mode: 'Markdown' }
    );
  }

  // /verify (MANUAL for now)
  if (text === '/verify') {
    let user = await Subscriber.findOne({ chatId });

    const expiresAt = addDays(new Date(), 30);

    if (!user) {
      user = new Subscriber({
        chatId,
        username,
        subscriptionActive: true,
        expiresAt
      });
    } else {
      user.subscriptionActive = true;
      user.expiresAt = expiresAt;
    }

    await user.save();

    return bot.sendMessage(
      chatId,
      `✅ Subscription activated!

Valid until:
📅 ${expiresAt.toDateString()}`
    );
  }

  // Unknown command
  bot.sendMessage(chatId, '❓ Unknown command. Use /start');
});

// =======================
// Protected Webhook Endpoint
// =======================
app.post('/api/webhook', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.MASTER_API_KEY) {
    return res.status(401).json({ success: false });
  }

  const now = new Date();

  const activeSubscribers = await Subscriber.find({
    subscriptionActive: true,
    expiresAt: { $gt: now }
  });

  for (const sub of activeSubscribers) {
    bot.sendMessage(
      sub.chatId,
      `🚨 New Event Received:\n\n${JSON.stringify(req.body, null, 2)}`
    );
  }

  res.json({ success: true });
});

// =======================
// Server
// =======================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
