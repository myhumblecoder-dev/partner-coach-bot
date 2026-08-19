'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function addMood(
  profileId: string,
  label: string,
  note: string | null
): Promise<{ ok: boolean }> {
  const trimmedLabel = label.trim()

  if (!trimmedLabel) {
    return { ok: false }
  }

  await prisma.mood.create({
    data: {
      profileId,
      label: trimmedLabel,
      note,
    },
  })

  revalidatePath('/portrait')

  return { ok: true }
}