import { prisma } from '@/lib/db'
import { getPortrait } from '@/lib/portrait/load'
import { coverage } from '@/lib/metrics/coverage'
import { daysSinceLastTouch } from '@/lib/metrics/recency'
import { giftStats } from '@/lib/metrics/gifts'
import { moodBuckets } from '@/lib/metrics/moodBuckets'
import PortraitView from '@/components/PortraitView'

export const dynamic = 'force-dynamic'

export default async function PortraitPage() {
  // Single-user app: the first profile is the profile.
  const profile = await prisma.profile.findFirst()
  const portrait = profile ? await getPortrait(profile.id) : null
  if (!profile || !portrait) {
    return <p>No profile yet — start the questionnaire in Telegram.</p>
  }

  const cov = coverage({
    likes: portrait.likes.length,
    dislikes: portrait.dislikes.length,
    jokes: portrait.jokes.length,
    dreams: portrait.dreams.length,
    moods: portrait.moods.length,
    events: portrait.events.length,
    gifts: portrait.gifts.length,
    trips: portrait.trips.length,
  })
  // The page is the I/O shell, so the clock read belongs here, not in the
  // metric.
  const touches = [
    ...portrait.moods.map((m) => m.recordedAt),
    ...portrait.events.map((e) => e.occurredAt),
  ]
  const daysSinceTouch = daysSinceLastTouch(touches, new Date())

  return (
    <PortraitView
      portrait={portrait}
      profileId={profile.id}
      coverage={cov}
      daysSinceTouch={daysSinceTouch}
      giftStats={giftStats(portrait.gifts)}
      buckets={moodBuckets(portrait.moods)}
    />
  )
}
