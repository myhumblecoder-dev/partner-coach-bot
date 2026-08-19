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

export default function PortraitView({
  portrait,
  profileId,
  coverage,
  daysSinceTouch,
  giftStats,
  buckets,
}: PortraitViewProps) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">{portrait.name}</h1>

      <StudyMetrics
        coverage={coverage}
        daysSinceTouch={daysSinceTouch}
        gifts={giftStats}
      />

      <div className="space-y-4">
        <PortraitSection title="Likes" items={portrait.likes} />
        <PortraitSection title="Dislikes" items={portrait.dislikes} />
        <PortraitSection title="Jokes" items={portrait.jokes} />
        <PortraitSection title="Dreams & Wishes" items={portrait.dreams} />
        <PortraitSection title="Trips" items={portrait.trips} />
      </div>

      <GiftHistory gifts={portrait.gifts} />

      <MoodTimeline buckets={buckets} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <MoodForm profileId={profileId} />
        <EntryForm profileId={profileId} />
      </div>
    </div>
  );
}