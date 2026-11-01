
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyTelegramInitData(initData, botToken) {
  if (typeof initData !== 'string' || !initData || !botToken) {
    return null;
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const authDate = Number(params.get('auth_date'));

    if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) return null;
    if (!Number.isSafeInteger(authDate)) return null;

    const now = Math.floor(Date.now() / 1000);

    // Данные действительны 1 час
    if (authDate > now + 60 || now - authDate > 3600) {
      return null;
    }

    params.delete('hash');
    params.delete('signature');

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest();

    const receivedHash = Buffer.from(hash, 'hex');

    if (!timingSafeEqual(calculatedHash, receivedHash)) {
      return null;
    }

    const user = JSON.parse(params.get('user') || 'null');

    if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
