import pg from 'pg';
import { readFileSync } from 'node:fs';

const { Pool } = pg;

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
  ca: readFileSync(
    new URL('./prod-ca-2021.crt', import.meta.url),
    'utf8'
  ),
  rejectUnauthorized: true
}
    })
  : null;
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

mkdirSync('data', { recursive: true });

const db = new DatabaseSync('data/memegift.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    balance INTEGER NOT NULL DEFAULT 500,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export function getUser(telegramId) {
  return db.prepare(
    'SELECT * FROM users WHERE telegram_id = ?'
  ).get(telegramId);
}

export function createUser(telegramId, username, firstName) {
  db.prepare(`
    INSERT OR IGNORE INTO users
    (telegram_id, username, first_name)
    VALUES (?, ?, ?)
  `).run(telegramId, username, firstName);

  return getUser(telegramId);
}

export { db };
export async function testPostgresConnection() {
  if (!pool) {
    throw new Error('DATABASE_URL не настроен');
  }

  const result = await pool.query('SELECT NOW() AS server_time');
  return result.rows[0];
}
