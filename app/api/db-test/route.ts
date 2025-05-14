import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("Testing MongoDB connection...")
    const client = await clientPromise
    console.log("Successfully connected to MongoDB")
    
    const dbName = process.env.MONGODB_DB || "stonewater"
    const db = client.db(dbName)
    console.log(`Using database: ${dbName}`)
    
    // List collections
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    console.log(`Collections in database: ${collectionNames.join(', ')}`)
    
    // Try to access our collection
    const disabledDatesCollection = db.collection("disabledDates")
    const count = await disabledDatesCollection.countDocuments()
    console.log(`Found ${count} documents in disabledDates collection`)
    
    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
      database: dbName,
      collections: collectionNames,
      disabledDatesCount: count
    })
  } catch (error) {
    console.error("MongoDB connection test failed:", error)
    return NextResponse.json({
      success: false,
      error: "MongoDB connection failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 