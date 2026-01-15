require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const axios = require('axios');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ---------------- BOT ----------------
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🚀 AI Writing Bot is running...');

// ---------------- DB ----------------
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  balance: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// ---------------- HELPERS ----------------
async function getUser(telegramId) {
  let user = await User.findOne({ telegramId });
  if (!user) {
    try {
      user = await User.create({ telegramId });
    } catch {
      user = await User.findOne({ telegramId });
    }
  }
  return user;
}

const PLANS = {
  short: { credits: 5, words: 300 },
  medium: { credits: 9, words: 600 },
  long: { credits: 16, words: 1200 },
  verylong: { credits: 25, words: 2000 }
};

async function generateAI(prompt, maxTokens) {
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return res.data.choices[0].message.content;
}

// ---------------- COMMANDS ----------------

// START
bot.onText(/\/start/, async (msg) => {
  await getUser(msg.from.id.toString());

  bot.sendMessage(
    msg.chat.id,
`✨ *AI Writing Assistant*

High-quality content delivered instantly.

📌 *Commands*
/order – Generate content
/buy – Buy credits
/balance – Check balance

💡 Example:
\`/order short Write about AI in business\``,
    { parse_mode: 'Markdown' }
  );
});

// BALANCE
bot.onText(/\/balance/, async (msg) => {
  const user = await getUser(msg.from.id.toString());
  bot.sendMessage(
    msg.chat.id,
    `💰 *Your Balance*: ${user.balance} credits`,
    { parse_mode: 'Markdown' }
  );
});

// BUY
bot.onText(/\/buy/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
`💳 *Buy Credits*

📦 *Plans*
• Short (300 words) – 5 credits  
• Medium (600 words) – 9 credits  
• Long (1200 words) – 16 credits  
• Very Long (2000 words) – 25 credits  

💰 *Payment (TRC20)*
\`TMiPXEkHkXJs3yNDAJwNPJjBramhW4M6y2\`

After payment, contact admin.`,
    { parse_mode: 'Markdown' }
  );
});

// ORDER
bot.onText(/\/order (\w+)\s+([\s\S]+)/, async (msg, match) => {
  const planName = match[1].toLowerCase();
  const prompt = match[2];
  const user = await getUser(msg.from.id.toString());

  if (!PLANS[planName]) {
    return bot.sendMessage(
      msg.chat.id,
      '❌ Invalid plan. Use: short, medium, long, verylong'
    );
  }

  const plan = PLANS[planName];

  if (user.balance < plan.credits) {
    return bot.sendMessage(
      msg.chat.id,
      `❌ Not enough credits. Required: ${plan.credits}`
    );
  }

  const statusMsg = await bot.sendMessage(
    msg.chat.id,
    '⏳ *Generating your content...*',
    { parse_mode: 'Markdown' }
  );

  try {
    const content = await generateAI(
      `${prompt}\n\nWrite approximately ${plan.words} words.`,
      plan.words * 2
    );

    user.balance -= plan.credits;
    await user.save();

    await bot.editMessageText(
      `✅ *Content Ready*\n\n${content}`,
      {
        chat_id: msg.chat.id,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown'
      }
    );
  } catch (e) {
    console.error(e.message);
    bot.sendMessage(msg.chat.id, '⚠️ Error generating content.');
  }
});

// ADMIN: ADD BALANCE
bot.onText(/\/addbalance (\d+) (\d+)/, async (msg, match) => {
  if (msg.from.id.toString() !== ADMIN_CHAT_ID) {
    return bot.sendMessage(msg.chat.id, '❌ Unauthorized');
  }

  const targetId = match[1];
  const amount = parseInt(match[2]);

  const user = await getUser(targetId);
  user.balance += amount;
  await user.save();

  bot.sendMessage(
    msg.chat.id,
    `✅ Added ${amount} credits to ${targetId}`
  );
});
