// MongoDB Atlas Data API client.
//
// Talks directly to a MongoDB Atlas cluster via the Data API REST endpoint,
// so the Vite frontend can CRUD documents without a separate Express server.
//
// To use: enable the Data API in your Atlas App Services dashboard, generate
// an API key, and set these env vars in .env:
//   VITE_MONGODB_DATA_API_URL  — e.g. https://data.mongodb-api.com/app/data-xxxx/endpoint/data/v1
//   VITE_MONGODB_DATA_API_KEY  — your generated API key
//   VITE_MONGODB_DATA_SOURCE   — your cluster name, e.g. "Cluster0"
//   VITE_MONGODB_DATABASE      — e.g. "mplads_sentinel"
//   VITE_MONGODB_COLLECTION    — e.g. "works"
//
// When these are absent the app falls back to localStorage so it still works
// in the demo environment.

const API_URL = import.meta.env.VITE_MONGODB_DATA_API_URL as string | undefined;
const API_KEY = import.meta.env.VITE_MONGODB_DATA_API_KEY as string | undefined;
const DATA_SOURCE = import.meta.env.VITE_MONGODB_DATA_SOURCE as string | undefined;
const DATABASE = import.meta.env.VITE_MONGODB_DATABASE as string | undefined;
const COLLECTION = import.meta.env.VITE_MONGODB_COLLECTION as string | undefined;

export const mongoConfigured = Boolean(API_URL && API_KEY && DATA_SOURCE && DATABASE && COLLECTION);

interface MongoEnvelope {
  dataSource: string;
  database: string;
  collection: string;
}

function envelope(): MongoEnvelope {
  return {
    dataSource: DATA_SOURCE!,
    database: DATABASE!,
    collection: COLLECTION!,
  };
}

async function call<T>(action: string, body: Record<string, unknown>): Promise<T> {
  if (!mongoConfigured) throw new Error("MongoDB Atlas Data API is not configured");
  const res = await fetch(`${API_URL}/action/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*",
      api_key: API_KEY!,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`MongoDB Data API ${action} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

// ---- CRUD operations ----

export async function findAllWorks(limit = 1000): Promise<Record<string, unknown>[]> {
  const res = await call<{ documents: Record<string, unknown>[] }>("find", {
    ...envelope(),
    filter: {},
    sort: { sanction_date: 1 },
    limit,
  });
  return res.documents ?? [];
}

export async function insertManyWorks(docs: Record<string, unknown>[]): Promise<number> {
  // Data API insertMany has a max document count; batch in chunks of 100
  let total = 0;
  for (let i = 0; i < docs.length; i += 100) {
    const chunk = docs.slice(i, i + 100);
    const res = await call<{ insertedIds: string[] }>("insertMany", {
      ...envelope(),
      documents: chunk,
    });
    total += res.insertedIds?.length ?? 0;
  }
  return total;
}

export async function deleteAllWorks(): Promise<number> {
  const res = await call<{ deletedCount: number }>("deleteMany", {
    ...envelope(),
    filter: {},
  });
  return res.deletedCount ?? 0;
}

export async function updateWorkField(id: string, field: string, value: unknown): Promise<void> {
  await call("updateOne", {
    ...envelope(),
    filter: { id },
    update: { $set: { [field]: value } },
  });
}
