'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { isSignedIn } from '@/lib/auth/session'

export async function addMood(
  profileId: string,
  label: string,
  note: string | null
): Promise<{ ok: boolean }> {
  // Public POST endpoint: authorize before touching anything.
  if (!(await isSignedIn())) return { ok: false }

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