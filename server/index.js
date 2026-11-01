import 'dotenv/config';
import express from 'express';
import { Telegraf, Markup } from 'telegraf';

const app = express();
app.use(express.json());
const port = Number(process.env.PORT || 3000);
const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;

app.get('/health', (_req, res) => res.json({ ok: true, app: 'MEMEGIFT' }));

if (token && token !== 'PASTE_NEW_BOT_TOKEN_HERE') {
  const bot = new Telegraf(token);
  bot.start(async ctx => {
    const keyboard = webAppUrl && webAppUrl.startsWith('https://')
      ? Markup.inlineKeyboard([Markup.button.webApp('🎁 Открыть MEMEGIFT', webAppUrl)])
      : Markup.inlineKeyboard([Markup.button.url('Инструкция по запуску', 'https://core.telegram.org/bots/webapps')]);
    await ctx.reply('Добро пожаловать в MEMEGIFT! Здесь скоро появятся кейсы, апгрейды и игры.', keyboard);
  });
  bot.help(ctx => ctx.reply('MEMEGIFT — стартовая версия. По вопросам поддержки напишите администратору проекта.'));
  bot.launch().then(() => console.log('MEMEGIFT bot started')).catch(err => console.error('Bot launch error:', err.message));
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
  console.log('BOT_TOKEN не задан. Сервер запустится без Telegram-бота.');
}

app.listen(port, () => console.log(`MEMEGIFT server listening on ${port}`));
