import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth.config"
import clientPromise from "@/lib/mongodb"
import { 
  getAllDisabledDates, 
  disableDate, 
  enableDate 
} from '@/lib/disabled-dates'

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
    console.log(`Attempting to save disabled date: ${date}`)
    const client = await clientPromise
    console.log('MongoDB client connected')
    
    const db = client.db(process.env.MONGODB_DB || "stonewater")
    console.log(`Using database: ${process.env.MONGODB_DB || "stonewater"}`)
    
    const collection = db.collection(COLLECTION_NAME)
    console.log(`Using collection: ${COLLECTION_NAME}`)
    
    const result = await collection.insertOne({ 
      date, 
      reason, 
      createdAt: new Date() 
    })
    
    console.log(`MongoDB insertOne result:`, result)
    return result.acknowledged
  } catch (error) {
    console.error("Detailed error saving disabled date to MongoDB:", error)
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}, stack: ${error.stack}`)
    }
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
    const dates = await getAllDisabledDates()
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date, reason } = await request.json()
    
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const success = await disableDate(date, reason || '')
    
    if (success) {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date } = await request.json()
    
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }
    
    const success = await enableDate(date)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      // Date might not exist, but don't treat as error
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