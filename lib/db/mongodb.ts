import { MongoClient, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the client across hot-reloads
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

let isSeeded = false;

export async function getDatabase() {
  const client = await clientPromise;
  const db = client.db('bufunfa');

  // Seed default categories on first connection (only once)
  if (!isSeeded && process.env.NODE_ENV !== 'test') {
    isSeeded = true;
    // Dynamic import to avoid circular dependency
    const { seedDefaultCategories } = await import('./categories');
    await seedDefaultCategories().catch((err) => {
      console.error('Error seeding categories:', err);
      isSeeded = false; // Allow retry on next call
    });
  }

  return db;
}
