import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth.config"
import clientPromise from "@/lib/mongodb"

// Collection and DB names
const DB_NAME = process.env.MONGODB_DB || "stonewater"
const COLLECTION_NAME = "disabledDates"

export async function GET() {
  console.log("GET /api/disabled-dates called")
  
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)
    
    const dates = await collection.find({}).toArray()
    console.log(`Found ${dates.length} disabled dates`)
    
    return NextResponse.json(dates)
  } catch (error) {
    console.error("Error fetching disabled dates:", error)
    return NextResponse.json({ error: "Failed to fetch disabled dates" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log("POST /api/disabled-dates called")
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("Unauthorized attempt to disable date")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get date and reason from request
    const body = await request.json()
    const { date, reason } = body
    
    console.log("Received request to disable date:", { date, reason })
    
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)
    
    // Check if date already exists
    const existingDate = await collection.findOne({ date })
    
    if (existingDate) {
      console.log(`Date ${date} already disabled, updating reason`)
      await collection.updateOne(
        { date },
        { $set: { reason, updatedAt: new Date() } }
      )
    } else {
      console.log(`Disabling new date: ${date}`)
      await collection.insertOne({
        date,
        reason: reason || '',
        createdAt: new Date()
      })
    }
    
    console.log(`Successfully disabled date: ${date}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error disabling date:", error)
    return NextResponse.json({ 
      error: "Failed to disable date", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  console.log("DELETE /api/disabled-dates called")
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("Unauthorized attempt to enable date")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get date from request
    const body = await request.json()
    const { date } = body
    
    console.log("Received request to enable date:", { date })
    
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)
    
    // Delete the date
    const result = await collection.deleteOne({ date })
    
    if (result.deletedCount > 0) {
      console.log(`Successfully enabled date: ${date}`)
      return NextResponse.json({ success: true })
    } else {
      console.log(`Date not found: ${date}`)
      return NextResponse.json({ success: true, notFound: true })
    }
  } catch (error) {
    console.error("Error enabling date:", error)
    return NextResponse.json({ 
      error: "Failed to enable date", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
} 