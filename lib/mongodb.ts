import { MongoClient } from 'mongodb'

// Get MongoDB URI from environment variable
const uri = process.env.MONGODB_URI || ""

// Configure MongoDB client options
const options = {
  // Add these options to handle TLS issues
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  // Improve connection handling with longer timeouts
  connectTimeoutMS: 60000,
  serverSelectionTimeoutMS: 60000,
  maxIdleTimeMS: 10000, // Sync with Vercel plan (10s hobby, 300s pro, 900s enterprise)
  maxPoolSize: 10,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// For development, use a global variable so that connection is reused
if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    // Key change: Wrap in a promise instead of calling connect()
    globalWithMongo._mongoClientPromise = new Promise<MongoClient>((resolve) => {
      resolve(client)
    })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri, options)
  // Key change: Wrap in a promise instead of calling connect()
  clientPromise = new Promise<MongoClient>((resolve) => {
    resolve(client)
  })
}

// Export a module-scoped MongoClient promise
export default clientPromise 