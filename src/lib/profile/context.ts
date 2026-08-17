import { prisma } from "@/lib/db";

export type ProfileContext = {
  name: string;
  likes: string[];
  dislikes: string[];
  jokes: string[];
  dreams: string[];
  recentMoods: { label: string; note: string | null }[];
  recentEvents: { title: string; note: string | null }[];
  pastGifts: string[];
  pastTrips: string[];
};

export async function getProfileContext(profileId: string): Promise<ProfileContext | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      likes: true,
      dislikes: true,
      jokes: true,
      dreams: true,
      gifts: true,
      trips: true,
      moods: {
        orderBy: { recordedAt: "desc" },
        take: 10,
      },
      events: {
        orderBy: { occurredAt: "desc" },
        take: 10,
      },
    },
  });

  if (!profile) {
    return null;
  }

  return {
    name: profile.name,
    likes: profile.likes.map((l) => l.text),
    dislikes: profile.dislikes.map((d) => d.text),
    jokes: profile.jokes.map((j) => j.text),
    dreams: profile.dreams.map((dr) => dr.description),
    recentMoods: profile.moods.map((m) => ({
      label: m.label,
      note: m.note,
    })),
    recentEvents: profile.events.map((e) => ({
      title: e.title,
      note: e.note,
    })),
    pastGifts: profile.gifts.map((g) => g.description),
    pastTrips: profile.trips.map((t) => t.destination),
  };
}