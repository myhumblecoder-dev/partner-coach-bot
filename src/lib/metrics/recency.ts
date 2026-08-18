export function daysSinceLastTouch(dates: Date[], today: Date): number | null {
  if (dates.length === 0) {
    return null;
  }

  const latestDate = dates.reduce((latest, current) => {
    return current > latest ? current : latest;
  }, dates[0]);

  if (latestDate >= today) {
    return 0;
  }

  const msPerDay = 86400000;
  const diffInMs = today.getTime() - latestDate.getTime();
  return Math.floor(diffInMs / msPerDay);
}