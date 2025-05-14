import mongoose from 'mongoose'

declare global {
  var mongoose: { conn: any; promise: any } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || ""

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (!cached || !cached.promise) {
    throw new Error('MongoDB connection not initialized')
  }
  
  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect 