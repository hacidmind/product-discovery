import { getDatabase } from "@/lib/mongodb";

function collectionName(filename: string) {
  return filename.replace(/\.json$/, "");
}

export async function getRecords<T extends { id: string }>(filename: string): Promise<T[]> {
  const db = await getDatabase();
  return (await db.collection<T>(collectionName(filename)).find({}).sort({ createdAt: -1 }).toArray()) as T[];
}

export function filterByProduct<T extends { productId?: string }>(
  records: T[],
  productId: string | null
): T[] {
  if (!productId) return [];
  return records.filter((item) => item.productId === productId);
}

export async function getRecord<T extends { id: string }>(filename: string, id: string): Promise<T | undefined> {
  const db = await getDatabase();
  return (await db.collection<T>(collectionName(filename)).findOne({ id } as never)) as T | null ?? undefined;
}

export async function createRecord<T extends { id: string }>(filename: string, record: T): Promise<T> {
  const db = await getDatabase();
  await db.collection<T>(collectionName(filename)).insertOne(record as never);
  return record;
}

export async function updateRecord<T extends { id: string }>(filename: string, id: string, updates: Partial<T>): Promise<T | null> {
  const db = await getDatabase();
  const result = await db.collection<T>(collectionName(filename)).findOneAndUpdate(
    { id } as never,
    { $set: { ...updates, id } },
    { returnDocument: "after" }
  );
  return result as T | null;
}

export async function deleteRecord(filename: string, id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection(collectionName(filename)).deleteOne({ id } as never);
  return result.deletedCount === 1;
}

// ─── ID Generator ───────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}