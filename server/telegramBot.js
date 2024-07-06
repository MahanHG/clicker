const TelegramBot = require('node-telegram-bot-api');
const { User } = require('./database');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ telegramId: chatId.toString() });

  if (!user) {
    const newUser = new User({
      telegramId: chatId.toString(),
      name: msg.from.first_name,
    });
    await newUser.save();
    bot.sendMessage(chatId, 'Welcome to the game! This is your first time playing.');
  } else {
    bot.sendMessage(chatId, 'Welcome back to the game!');
  }
});

module.exports = bot;