import { prisma } from "@/lib/db";

export type EntryRow = { id: string; text: string; source: string };

export type GiftRow = {
  id: string;
  description: string;
  givenAt: Date | null;
  howItLanded: string | null;
  source: string;
};

export type PortraitEntries = {
  likes: EntryRow[];
  dislikes: EntryRow[];
  jokes: EntryRow[];
  dreams: EntryRow[];
  trips: EntryRow[];
  gifts: GiftRow[];
};

export type FacetView = {
  id: string;
  section: string;
  label: string;
  status: string;
  evidenceCount: number;
};

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
    kind: string;
    label: string;
    month: number;
    day: number;
  }[];
  // Optional by design (two-phase migration): consumers and fixtures that
  // predate CRUD stay valid; the loader always fills it.
  entries?: PortraitEntries;
  summary?: string | null;
  facets?: FacetView[];
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
      facets: { where: { status: { not: 'rejected' } } },
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

  const entryRow = (row: { id: string; source: string }, text: string) => ({
    id: row.id,
    text,
    source: row.source,
  });

  return {
    summary: profile.portraitSummary,
    facets: (profile.facets ?? []).map((f) => ({
      id: f.id,
      section: f.section,
      label: f.label,
      status: f.status,
      evidenceCount: f.evidenceCount,
    })),
    entries: {
      likes: profile.likes.map((l) => entryRow(l, l.text)),
      dislikes: profile.dislikes.map((d) => entryRow(d, d.text)),
      jokes: profile.jokes.map((j) => entryRow(j, j.text)),
      dreams: profile.dreams.map((d) => entryRow(d, d.description)),
      trips: profile.trips.map((t) => entryRow(t, t.destination)),
      gifts: profile.gifts.map((g) => ({
        id: g.id,
        description: g.description,
        givenAt: g.givenAt,
        howItLanded: g.howItLanded,
        source: g.source,
      })),
    },
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
    occasions: profile.occasions.map((o) => ({ kind: o.kind, label: o.label, month: o.month, day: o.day }))
  };
}