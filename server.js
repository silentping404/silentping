require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");

const WebhookPayload = require("./models/WebhookPayload");

const app = express();
app.use(express.json());

// Telegram bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB error ❌", err));

// Health check
app.get("/", (req, res) => {
  res.send("SilentPing is running ✅");
});

// Webhook endpoint
app.post("/api/webhook", async (req, res) => {
  try {
    const payload = req.body;

    // Save raw payload to MongoDB
    await WebhookPayload.create({
      payload,
      receivedAt: new Date(),
    });

    // Default message
    let message = "📡 New webhook received";

    // GitHub push formatting
    if (payload.repository && payload.head_commit) {
      const repo = payload.repository.name;
      const author = payload.head_commit.author?.name || "Unknown";
      const commitMessage = payload.head_commit.message;
      const time = payload.head_commit.timestamp;

      message =
`🚀 GitHub Push Detected

📦 Repo: ${repo}
👤 Author: ${author}
📝 Commit: ${commitMessage}
🕒 Time: ${time}`;
    }

    // Send Telegram alert
    await bot.sendMessage(process.env.CHAT_ID, message);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ success: false });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
