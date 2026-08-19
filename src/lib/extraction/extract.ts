import { prisma } from "@/lib/db";
import { generate } from "@/lib/ai";
import { getProfileContext } from "@/lib/profile/context";
import { buildExtractionPrompt } from "@/lib/extraction/prompt";
import { parseExtraction } from "@/lib/extraction/parse";

export async function extractFacts(profileId: string, text: string): Promise<number> {
  const context = await getProfileContext(profileId);
  if (!context) {
    return 0;
  }

  const prompt = buildExtractionPrompt(context, text);
  const rawOutput = await generate(prompt);
  const extraction = parseExtraction(rawOutput);

  let count = 0;

  if (extraction.likes) {
    for (const item of extraction.likes) {
      await prisma.likesEntry.create({
        data: { profileId, text: item, source: "extracted" },
      });
      count++;
    }
  }

  if (extraction.dislikes) {
    for (const item of extraction.dislikes) {
      await prisma.dislikesEntry.create({
        data: { profileId, text: item, source: "extracted" },
      });
      count++;
    }
  }

  if (extraction.jokes) {
    for (const item of extraction.jokes) {
      await prisma.joke.create({
        data: { profileId, text: item, source: "extracted" },
      });
      count++;
    }
  }

  if (extraction.moods) {
    for (const item of extraction.moods) {
      await prisma.mood.create({
        data: { profileId, label: item, source: "extracted" },
      });
      count++;
    }
  }

  if (extraction.dreams) {
    for (const item of extraction.dreams) {
      await prisma.dream.create({
        data: { profileId, description: item, source: "extracted" },
      });
      count++;
    }
  }

  if (extraction.events) {
    for (const item of extraction.events) {
      await prisma.event.create({
        data: { profileId, title: item, occurredAt: new Date(), source: "extracted" },
      });
      count++;
    }
  }

  if (extraction.gifts) {
    for (const item of extraction.gifts) {
      await prisma.gift.create({
        data: { profileId, description: item, source: "extracted" },
      });
      count++;
    }
  }

  if (extraction.trips) {
    for (const item of extraction.trips) {
      await prisma.trip.create({
        data: { profileId, destination: item, source: "extracted" },
      });
      count++;
    }
  }

  return count;
}
