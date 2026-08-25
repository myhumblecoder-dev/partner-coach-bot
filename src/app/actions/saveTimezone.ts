'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function saveTimezone(profileId: string, timezone: string): Promise<{ ok: boolean }> {
  if (!timezone) {
    return { ok: false }
  }

  try {
    new Intl.DateTimeFormat(undefined, { timeZone: timezone })
  } catch (err) {
    return { ok: false }
  }

  try {
    await prisma.profile.update({
      where: { id: profileId },
      data: { timezone }
    })
    revalidatePath('/portrait')
    return { ok: true }
  } catch (err) {
    return { ok: false }
  }
}