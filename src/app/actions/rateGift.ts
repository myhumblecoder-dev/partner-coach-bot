'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function rateGift(
  id: string,
  outcome: 'hit' | 'miss'
): Promise<{ ok: boolean }> {
  if (outcome !== 'hit' && outcome !== 'miss') return { ok: false }
  await prisma.gift.update({ where: { id }, data: { howItLanded: outcome } })
  revalidatePath('/portrait')
  return { ok: true }
}
