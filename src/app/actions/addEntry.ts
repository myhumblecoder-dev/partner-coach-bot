'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

const FIELDS = ['likes', 'dislikes', 'jokes', 'dreams', 'gifts'] as const
export type EntryField = typeof FIELDS[number]

export async function addEntry(
  profileId: string,
  field: EntryField,
  text: string
): Promise<{ ok: boolean }> {
  const trimmedText = text.trim()

  if (!trimmedText || !FIELDS.includes(field)) {
    return { ok: false }
  }

  if (field === 'likes') {
    await prisma.likesEntry.create({ data: { profileId, text: trimmedText } })
  } else if (field === 'dislikes') {
    await prisma.dislikesEntry.create({ data: { profileId, text: trimmedText } })
  } else if (field === 'jokes') {
    await prisma.joke.create({ data: { profileId, text: trimmedText } })
  } else if (field === 'dreams') {
    await prisma.dream.create({ data: { profileId, description: trimmedText } })
  } else if (field === 'gifts') {
    await prisma.gift.create({ data: { profileId, description: trimmedText } })
  }

  revalidatePath('/portrait')
  return { ok: true }
}