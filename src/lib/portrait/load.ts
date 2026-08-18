import { prisma } from "@/lib/db";

export type Portrait = {
  name: string;
  likes: string[];
  dislikes: string[];
  jokes: string[];
  dreams: string[];
  moods: {
    label: string;
    note: string | null;
    recordedAt: Date;
  }[];
  events: {
    title: string;
    note: string | null;
    occurredAt: Date;
  }[];
  gifts: {
    description: string;
    givenAt: Date | null;
    howItLanded: string | null;
  }[];
  trips: string[];
  occasions: {
    label: string;
    month: number;
    day: number;
  }[];
};

export async function getPortrait(profileId: string): Promise<Portrait | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      likes: true,
      dislikes: true,
      jokes: true,
      dreams: true,
      gifts: true,
      trips: true,
      occasions: true,
      moods: {
        orderBy: { recordedAt: "asc" }
      },
      events: {
        orderBy: { occurredAt: "desc" },
        take: 20
      }
    }
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
    moods: profile.moods.map((m) => ({
      label: m.label,
      note: m.note,
      recordedAt: m.recordedAt
    })),
    events: profile.events.map((e) => ({
      title: e.title,
      note: e.note,
      occurredAt: e.occurredAt
    })),
    gifts: profile.gifts.map((g) => ({
      description: g.description,
      givenAt: g.givenAt,
      howItLanded: g.howItLanded
    })),
    trips: profile.trips.map((t) => t.destination),
    occasions: profile.occasions.map((o) => ({
      label: o.label,
      month: o.month,
      day: o.day
    }))
  };
}