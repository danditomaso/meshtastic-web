export function evictOldestEntries<K, V extends { date?: number }>(
  map: Map<K, V>,
  maxSize: number,
): void {
  if (map.size <= maxSize) {
    return;
  }

  const entries = Array.from(map.entries());

  // Sort by date if available, otherwise by insertion order
  entries.sort((a, b) => {
    const dateA = a[1].date ?? 0;
    const dateB = b[1].date ?? 0;
    return dateA - dateB;
  });

  const toRemove = entries.length - maxSize;
  for (let i = 0; i < toRemove; i++) {
    map.delete(entries[i][0]);
  }
}
