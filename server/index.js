import 'dotenv/config';
import express from 'express';
import { Telegraf, Markup } from 'telegraf';

import { createUser, getUser } from './database.js';
import { verifyTelegramInitData } from './telegramAuth.js';


const app = express();
app.use(express.json());
const port = Number(process.env.PORT || 3000);
const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;

app.get('/health', (_req, res) => res.json({ ok: true, app: 'MEMEGIFT' }));

app.post('/api/me', (req, res) => {
  const initData = req.body?.initData;

  const telegramUser = verifyTelegramInitData(
    initData,
    process.env.BOT_TOKEN
  );

  if (!telegramUser) {
    return res.status(401).json({
      error: 'Telegram authentication failed'
    });
  }

  try {
    const user = createUser(
      telegramUser.id,
      telegramUser.username || null,
      telegramUser.first_name || 'Игрок'
    );

    return res.json({
      id: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      balance: user.balance
    });
  } catch (error) {
    console.error('API /api/me error:', error.message);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});


if (token && token !== 'PASTE_NEW_BOT_TOKEN_HERE') {
  const bot = new Telegraf(token);
  bot.start(async ctx => {
    const user = createUser(
      ctx.from.id,
      ctx.from.username || null,
      ctx.from.first_name || 'Игрок'
    );

    console.log(
      `MEMEGIFT user: ${user.telegram_id}, balance: ${user.balance}`
    );

    const keyboard = webAppUrl && webAppUrl.startsWith('https://')
      ? Markup.inlineKeyboard([Markup.button.webApp('🎁 Открыть MEMEGIFT', webAppUrl)])
      : Markup.inlineKeyboard([Markup.button.url('Инструкция по запуску', 'https://core.telegram.org/bots/webapps')]);
    await ctx.reply('Добро пожаловать в MEMEGIFT! Здесь скоро появятся кейсы, апгрейды и игры.', keyboard);
  });
  bot.help(ctx => ctx.reply('MEMEGIFT — стартовая версия. По вопросам поддержки напишите администратору проекта.'));

  bot.command('support', async ctx => {
    await ctx.reply(
      '💬 Поддержка MEMEGIFT\n\n' +
      'Нажмите кнопку ниже, чтобы написать в поддержку.',
      Markup.inlineKeyboard([
        [Markup.button.callback('✉️ Написать в поддержку', 'support_new')]
      ])
    );
  });


bot.action('support_new', async ctx => {
  supportWaiting.add(ctx.from.id);
  await ctx.answerCbQuery();
  await ctx.reply('✍️ Отправьте ваше сообщение в поддержку.');
});

  // Пользователи, которые начали писать в поддержку
  const supportWaiting = new Set();
const adminReplyWaiting = new Map();

  bot.action('support_new', async ctx => {
    supportWaiting.add(ctx.from.id);
    await ctx.answerCbQuery();
    await ctx.reply('✍️ Отправьте ваше сообщение в поддержку.');
  });

  bot.on('text', async ctx => {
    // Ответ администратора пользователю
    if (isAdmin(ctx) && adminReplyWaiting.has(ctx.from.id)) {
      const userId = adminReplyWaiting.get(ctx.from.id);

      if (ctx.message.text.startsWith('/')) {
        return ctx.reply(
          '⚠️ Для ответа отправьте обычный текст или используйте /cancel.'
        );
      }

      try {
        await ctx.telegram.sendMessage(
          userId,
          '💬 Ответ поддержки MEMEGIFT:\n\n' + ctx.message.text
        );

        adminReplyWaiting.delete(ctx.from.id);
        return ctx.reply('✅ Ответ успешно отправлен пользователю!');
      } catch (error) {
        console.error('Admin reply error:', error.message);
        return ctx.reply('❌ Не удалось отправить ответ.');
      }
    }

    if (!supportWaiting.has(ctx.from.id)) return;

    supportWaiting.delete(ctx.from.id);

    const adminId = process.env.ADMIN_ID;
    if (!adminId) {
      return ctx.reply('⚠️ Поддержка временно недоступна.');
    }

    try {
      await ctx.telegram.sendMessage(
        adminId,
        `📩 Новое обращение MEMEGIFT\n\n` +
        `👤 Пользователь: ${ctx.from.first_name || 'Без имени'}\n` +
        `🆔 ID: ${ctx.from.id}\n\n` +
        `💬 Сообщение:\n${ctx.message.text}`,
        Markup.inlineKeyboard([
          [Markup.button.callback('↩️ Ответить', `reply_${ctx.from.id}`)]
        ])
      );

      await ctx.reply('✅ Ваше сообщение отправлено в поддержку!');
    } catch (error) {
      console.error('Support error:', error.message);
      await ctx.reply('❌ Не удалось отправить сообщение. Попробуйте позже.');
    }
  });

  const adminId = String(process.env.ADMIN_ID || '');

  bot.action(/^reply_(\d+)$/, async ctx => {
    if (!isAdmin(ctx)) {
      return ctx.answerCbQuery('⛔ Нет доступа', {
        show_alert: true
      });
    }

    const userId = ctx.match[1];

    adminReplyWaiting.set(ctx.from.id, userId);

    await ctx.answerCbQuery();

    await ctx.reply(
      `✍️ Напишите ответ пользователю ${userId}.\n\n` +
      'Ваше следующее текстовое сообщение будет отправлено ему.'
    );
  });


  const isAdmin = ctx =>
    adminId !== '' && String(ctx.from?.id) === adminId;

  bot.command('admin', async ctx => {
    if (!isAdmin(ctx)) {
      return ctx.reply('⛔ У вас нет доступа к админ-панели.');
    }

    await ctx.reply(
      '👑 MEMEGIFT — Панель администратора\n\nВыберите раздел:',
      Markup.inlineKeyboard([
        [Markup.button.callback('📊 Статистика', 'admin_stats')],
        [Markup.button.callback('👥 Пользователи', 'admin_users')],
        [Markup.button.callback('💬 Поддержка', 'admin_support')]
      ])
    );
  });

  bot.action(/^admin_(stats|users|support)$/, async ctx => {
    if (!isAdmin(ctx)) {
      return ctx.answerCbQuery('⛔ Нет доступа', { show_alert: true });
    }

    const messages = {
      stats: '📊 Статистика MEMEGIFT\n\nСкоро здесь появится статистика проекта.',
      users: '👥 Пользователи\n\nСкоро здесь появится управление пользователями.',
      support: '💬 Поддержка\n\nСкоро здесь появятся обращения пользователей.'
    };

    await ctx.answerCbQuery();
    await ctx.reply(messages[ctx.match[1]]);
  });

  bot.launch().then(() => console.log('MEMEGIFT bot started')).catch(err => console.error('Bot launch error:', err.message));
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
  console.log('BOT_TOKEN не задан. Сервер запустится без Telegram-бота.');
}

app.listen(port, '0.0.0.0', () => console.log(`MEMEGIFT server listening on ${port}`));
