import { verifyTelegramSecret } from '@/lib/telegram/verify';
import { parseUpdate } from '@/lib/telegram/parse';
import { sendMessage } from '@/lib/telegram/send';
import { respond } from '@/lib/coach/respond';
import { prisma } from '@/lib/db';

export async function POST(request: Request): Promise<Response> {
  const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!secretToken || !webhookSecret || !(await verifyTelegramSecret(secretToken, webhookSecret))) {
    return new Response(null, { status: 401 });
  }

  let update;
  try {
    update = await request.json();
  } catch (err) {
    return new Response(null, { status: 400 });
  }

  const parsed = parseUpdate(update);
  if (!parsed) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const { chatId, text } = parsed;

  if (!text) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const chat = await prisma.telegramChat.findUnique({
    where: { chatId },
  });

  if (!chat) {
    await sendMessage(chatId, "Please link your Telegram account to use this bot.");
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const replyText = await respond(chat.profileId, text);
  await sendMessage(chatId, replyText);

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}