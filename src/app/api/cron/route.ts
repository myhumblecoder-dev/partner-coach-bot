import { prisma } from '@/lib/db'
import { respond } from '@/lib/coach/respond'
import { sendMessage } from '@/lib/telegram/send'
import { dueCadences, type CadenceKind } from '@/lib/cadence/due'
import { dueOccasions } from '@/lib/cadence/occasions'

const OPENERS: Record<CadenceKind, string> = {
  daily: 'Daily check-in: how are things going today, and what did you notice?',
  weekly: 'Weekly session: looking back over the week, what stood out?',
  monthly: 'Monthly session: how has this month been for the two of you?',
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 })
  }

  const today = new Date()
  // UTC midnight, so the once-per-day guard keys on the date, not the moment.
  const ranOn = new Date(Date.UTC(
    today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const kinds = dueCadences(today)

  let sent = 0
  const chats = await prisma.telegramChat.findMany()
  for (const chat of chats) {
    for (const kind of kinds) {
      const already = await prisma.cadenceRun.findFirst({
        where: { profileId: chat.profileId, kind, ranOn },
      })
      if (already) continue
      const reply = await respond(chat.profileId, OPENERS[kind])
      await sendMessage(chat.chatId, reply)
      await prisma.cadenceRun.create({
        data: { profileId: chat.profileId, kind, ranOn },
      })
      sent += 1
    }

    const occasions = await prisma.occasion.findMany({
      where: { profileId: chat.profileId },
    })
    for (const occasion of dueOccasions(occasions, today)) {
      const days = Math.ceil(
        (Date.UTC(
          occasion.month - 1 < today.getUTCMonth()
          || (occasion.month - 1 === today.getUTCMonth()
              && occasion.day < today.getUTCDate())
            ? today.getUTCFullYear() + 1 : today.getUTCFullYear(),
          occasion.month - 1, occasion.day) - ranOn.getTime())
        / (24 * 60 * 60 * 1000))
      await sendMessage(
        chat.chatId,
        `Heads up: ${occasion.label} is ${days <= 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}.`)
      sent += 1
    }
  }

  return Response.json({ ok: true, sent })
}
