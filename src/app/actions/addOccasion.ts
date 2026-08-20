'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export async function addOccasion(
  profileId: string,
  kind: string,
  label: string,
  month: number,
  day: number
): Promise<{ ok: boolean }> {
  const trimmed = label.trim()
  if (!trimmed) return { ok: false }
  if (!Number.isInteger(month) || month < 1 || month > 12) return { ok: false }
  if (!Number.isInteger(day) || day < 1 || day > DAYS_IN_MONTH[month - 1]) {
    return { ok: false }
  }
  await prisma.occasion.create({
    data: { profileId, kind, label: trimmed, month, day },
  })
  revalidatePath('/portrait')
  return { ok: true }
}
