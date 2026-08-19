import { verifyTelegramSecret } from '@/lib/telegram/verify';
import { parseUpdate } from '@/lib/telegram/parse';
import { sendMessage } from '@/lib/telegram/send';
import { respond } from '@/lib/coach/respond';
import { ensureLinkedProfile } from '@/lib/onboarding/link';
import { onboardingStep } from '@/lib/onboarding/step';

export async function POST(request: Request): Promise<Response> {
  const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
  if (!verifyTelegramSecret(secretToken, process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return new Response(JSON.stringify({ ok: false }), { status: 401 });
  }

  const update = await request.json();
  const parsed = parseUpdate(update);
  // Telegram retries any non-2xx forever; unhandled update kinds are
  // acknowledged, not refused.
  if (!parsed) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const { chatId, text } = parsed;

  // First contact begins onboarding — nobody is told to "link an account".
  const { profileId } = await ensureLinkedProfile(chatId);

  const onboarding = await onboardingStep(profileId, text);
  if (onboarding !== null) {
    await sendMessage(chatId, onboarding);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const replyText = await respond(profileId, text);
  await sendMessage(chatId, replyText);

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
