'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { isSignedIn } from '@/lib/auth/session'

export async function rateGift(
  id: string,
  outcome: 'hit' | 'miss'
): Promise<{ ok: boolean }> {
  // Public POST endpoint: authorize before touching anything.
  if (!(await isSignedIn())) return { ok: false }

  if (outcome !== 'hit' && outcome !== 'miss') return { ok: false }
  await prisma.gift.update({ where: { id }, data: { howItLanded: outcome } })
  revalidatePath('/portrait')
  return { ok: true }
}
