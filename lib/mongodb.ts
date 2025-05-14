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
  // Other options
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
}

let client
let clientPromise: Promise<MongoClient>

// For development, use a global variable so that connection is reused
if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise
export default clientPromise 