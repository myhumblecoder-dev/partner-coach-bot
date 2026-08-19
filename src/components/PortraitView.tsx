import type { Portrait } from '@/lib/portrait/load';
import type { Coverage } from '@/lib/metrics/coverage';
import type { GiftStats } from '@/lib/metrics/gifts';
import type { MoodBucket } from '@/lib/metrics/moodBuckets';
import PortraitSection from '@/components/PortraitSection';
import MoodTimeline from '@/components/MoodTimeline';
import StudyMetrics from '@/components/StudyMetrics';
import GiftHistory from '@/components/GiftHistory';
import MoodForm from '@/components/MoodForm';
import EntryForm from '@/components/EntryForm';

interface PortraitViewProps {
  portrait: Portrait;
  profileId: string;
  coverage: Coverage;
  daysSinceTouch: number | null;
  giftStats: GiftStats;
  buckets: MoodBucket[];
}

function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-[0_1px_2px_rgba(43,34,38,0.06)]">
      {title && (
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export default function PortraitView({
  portrait,
  profileId,
  coverage,
  daysSinceTouch,
  giftStats,
  buckets,
}: PortraitViewProps) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
      <header className="mb-10">
        <p className="mb-6 font-display text-sm italic text-ink-soft">
          cherish<span className="text-accent">.ai</span>
        </p>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          A study of
        </p>
        <h1 className="font-display text-5xl tracking-tight sm:text-6xl">
          {portrait.name}
        </h1>
        <div className="mt-6 h-px w-24 bg-accent/60" />
      </header>

      <div className="mb-8">
        <StudyMetrics
          coverage={coverage}
          daysSinceTouch={daysSinceTouch}
          gifts={giftStats}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <div className="space-y-7">
              <PortraitSection title="Likes" items={portrait.likes} />
              <PortraitSection title="Dislikes" items={portrait.dislikes} />
              <PortraitSection title="Jokes" items={portrait.jokes} />
              <PortraitSection
                title="Dreams & Wishes"
                items={portrait.dreams}
              />
              <PortraitSection title="Trips" items={portrait.trips} />
            </div>
          </Card>
          <Card title="Gift ledger">
            <GiftHistory gifts={portrait.gifts} />
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Moods, lately">
            <MoodTimeline buckets={buckets} />
          </Card>
          <Card title="Add to the study">
            <div className="space-y-8">
              <MoodForm profileId={profileId} />
              <div className="h-px bg-line" />
              <EntryForm profileId={profileId} />
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
