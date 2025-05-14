import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("Testing MongoDB connection...")
    const client = await clientPromise
    console.log("MongoDB client connected")
    
    const db = client.db(process.env.MONGODB_DB || "stonewater")
    console.log(`Connected to database: ${process.env.MONGODB_DB || "stonewater"}`)
    
    const collections = await db.listCollections().toArray()
    console.log("Collections:", collections.map(c => c.name))
    
    return NextResponse.json({ 
      success: true, 
      message: "MongoDB connection successful",
      collections: collections.map(c => c.name)
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