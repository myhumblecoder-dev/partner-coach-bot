import { timingSafeEqual } from 'node:crypto';

/**
 * Verifies the Telegram webhook secret token.
 * Telegram sends the secret_token in the X-Telegram-Bot-Api-Secret-Token header.
 * This function compares that header value against the configured secret.
 */
export function verifyTelegramSecret(headerValue: string | null, secret: string | undefined): boolean {
  if (!secret || secret === '') {
    return false;
  }

  if (headerValue === null) {
    return false;
  }

  const headerBuffer = Buffer.from(headerValue);
  const secretBuffer = Buffer.from(secret);

  if (headerBuffer.length !== secretBuffer.length) {
    return false;
  }

  return timingSafeEqual(headerBuffer, secretBuffer);
}