export type ChartItem = { label: string; value: number };

export function countBy<T>(records: readonly T[], key: (record: T) => string, labels: readonly string[]): ChartItem[] {
  const totals = new Map(labels.map(label => [label, 0]));
  for (const record of records) {
    const label = key(record);
    if (totals.has(label)) totals.set(label, (totals.get(label) ?? 0) + 1);
  }
  return labels.map(label => ({ label, value: totals.get(label) ?? 0 }));
}

export function monthlyCounts(dates: readonly string[], months = 6, now = new Date()): ChartItem[] {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - months + index + 1, 1));
    return { key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`, label: date.toLocaleString("en", { month: "short", year: "2-digit", timeZone: "UTC" }), value: 0 };
  });
  const byKey = new Map(buckets.map(bucket => [bucket.key, bucket]));
  for (const value of dates) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || date.getTime() > now.getTime()) continue;
    const bucket = byKey.get(`${date.getUTCFullYear()}-${date.getUTCMonth()}`);
    if (bucket) bucket.value++;
  }
  return buckets.map(({ label, value }) => ({ label, value }));
}
