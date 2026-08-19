'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type EditableField = 'likes' | 'dislikes' | 'jokes' | 'dreams' | 'trips'

// Each model's own text column — they are not interchangeable.
const TABLE = {
  likes: (id: string, text: string) =>
    prisma.likesEntry.update({ where: { id }, data: { text } }),
  dislikes: (id: string, text: string) =>
    prisma.dislikesEntry.update({ where: { id }, data: { text } }),
  jokes: (id: string, text: string) =>
    prisma.joke.update({ where: { id }, data: { text } }),
  dreams: (id: string, text: string) =>
    prisma.dream.update({ where: { id }, data: { description: text } }),
  trips: (id: string, text: string) =>
    prisma.trip.update({ where: { id }, data: { destination: text } }),
} as const

const DELETE = {
  likes: (id: string) => prisma.likesEntry.delete({ where: { id } }),
  dislikes: (id: string) => prisma.dislikesEntry.delete({ where: { id } }),
  jokes: (id: string) => prisma.joke.delete({ where: { id } }),
  dreams: (id: string) => prisma.dream.delete({ where: { id } }),
  trips: (id: string) => prisma.trip.delete({ where: { id } }),
} as const

function known(field: string): field is EditableField {
  return field in TABLE
}

export async function updateEntry(
  field: EditableField,
  id: string,
  text: string
): Promise<{ ok: boolean }> {
  const trimmed = text.trim()
  if (!known(field) || !trimmed) return { ok: false }
  await TABLE[field](id, trimmed)
  revalidatePath('/portrait')
  return { ok: true }
}

export async function deleteEntry(
  field: EditableField,
  id: string
): Promise<{ ok: boolean }> {
  if (!known(field)) return { ok: false }
  try {
    await DELETE[field](id)
  } catch {
    return { ok: false }
  }
  revalidatePath('/portrait')
  return { ok: true }
}
