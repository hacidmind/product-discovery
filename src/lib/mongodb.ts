import { MongoClient } from "mongodb";

const globalForMongo = globalThis as unknown as {
    mongoClientPromise?: Promise<MongoClient>;
    mongoUri?: string;
    indexesEnsured?: boolean;
};

const INDEXED_COLLECTIONS = [
    "insights",
    "opportunities",
    "personas",
    "interviews",
    "features",
    "experiments",
    "assumptions",
    "research",
    "tree",
];

async function ensureIndexes(client: MongoClient) {
    const db = client.db(process.env.MONGODB_DB || "product-discovery");
    await Promise.all([
        ...INDEXED_COLLECTIONS.flatMap((name) => [
            db.collection(name).createIndex({ id: 1 }),
            db.collection(name).createIndex({ createdAt: -1 }),
            db.collection(name).createIndex({ productId: 1, createdAt: -1 }),
        ]),
        db.collection("products").createIndex({ userId: 1 }),
        db.collection("products").createIndex({ id: 1 }),
        db.collection("users").createIndex({ email: 1 }),
    ]);
}

export async function getDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI environment variable");
    if (!globalForMongo.mongoClientPromise || globalForMongo.mongoUri !== uri) {
        globalForMongo.mongoUri = uri;
        globalForMongo.mongoClientPromise = new MongoClient(uri).connect();
        globalForMongo.indexesEnsured = false;
    }
    try {
        const client = await globalForMongo.mongoClientPromise;
        if (!globalForMongo.indexesEnsured) {
            globalForMongo.indexesEnsured = true;
            try {
                await ensureIndexes(client);
            } catch (error) {
                console.error("Failed to ensure MongoDB indexes (non-fatal):", error);
            }
        }
        return client.db(process.env.MONGODB_DB || "product-discovery");
    } catch (error) {
        // Drop the cached promise so the next request retries with a fresh
        // connection (covers a corrected URI, a paused cluster waking up, or a
        // transient network failure).
        globalForMongo.mongoClientPromise = undefined;
        globalForMongo.indexesEnsured = false;
        throw error;
    }
}