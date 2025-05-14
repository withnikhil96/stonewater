import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth.config"
import clientPromise from "@/lib/mongodb"

// Collection name for disabled dates
const COLLECTION_NAME = "disabledDates"

// Get MongoDB collection
async function getCollection() {
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB || "stonewater")
  return db.collection(COLLECTION_NAME)
}

// Get disabled dates from MongoDB
async function getDisabledDates() {
  try {
    const collection = await getCollection()
    const dates = await collection.find({}).toArray()
    return dates.map(({ date, reason }) => ({ date, reason }))
  } catch (error) {
    console.error("Error reading disabled dates from MongoDB:", error)
    return []
  }
}

// Save a disabled date to MongoDB
async function saveDisabledDate(date: string, reason: string) {
  try {
    const collection = await getCollection()
    await collection.insertOne({ 
      date, 
      reason, 
      createdAt: new Date() 
    })
    return true
  } catch (error) {
    console.error("Error saving disabled date to MongoDB:", error)
    return false
  }
}

// Remove a disabled date from MongoDB
async function removeDisabledDate(date: string) {
  try {
    const collection = await getCollection()
    const result = await collection.deleteOne({ date })
    return result.deletedCount > 0
  } catch (error) {
    console.error("Error removing disabled date from MongoDB:", error)
    return false
  }
}

// Helper function to format date consistently
function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    // If it's already a string, make sure it's in YYYY-MM-DD format
    if (date.includes('T')) {
      // If it has time component, strip it off
      return date.split('T')[0];
    }
    return date;
  }
  
  // For Date objects, convert to YYYY-MM-DD in Australia/Perth timezone
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Australia/Perth'
  };
  
  const formattedDate = new Intl.DateTimeFormat('en-CA', options).format(date);
  return formattedDate; // This will be in YYYY-MM-DD format
}

export async function GET() {
  try {
    const dates = await getDisabledDates()
    return NextResponse.json(dates)
  } catch (error) {
    console.error("Error in GET /api/disabled-dates:", error)
    return NextResponse.json({ error: "Failed to fetch disabled dates" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log("Unauthorized attempt to disable date")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("POST request body:", body)
    
    const { date, reason } = body
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Check if date already exists
    const dates = await getDisabledDates()
    if (dates.some(d => d.date === date)) {
      return NextResponse.json({ error: "Date already disabled" }, { status: 400 })
    }

    const success = await saveDisabledDate(date, reason || '')
    
    if (success) {
      console.log(`Date ${date} disabled successfully`)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to disable date" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in POST /api/disabled-dates:", error)
    return NextResponse.json({ 
      error: "Failed to disable date", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log("Unauthorized attempt to enable date")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("DELETE request body:", body)
    
    const { date } = body
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }
    
    const success = await removeDisabledDate(date)
    
    if (success) {
      console.log(`Date ${date} enabled successfully`)
      return NextResponse.json({ success: true })
    } else {
      // Date might not exist, but don't treat as error
      console.log(`Date ${date} was not found in disabled dates`)
      return NextResponse.json({ success: true, notFound: true })
    }
  } catch (error) {
    console.error("Error in DELETE /api/disabled-dates:", error)
    return NextResponse.json({ 
      error: "Failed to enable date", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
} 