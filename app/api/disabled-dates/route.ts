import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth.config"
import fs from "fs/promises"
import path from "path"

const DISABLED_DATES_FILE = path.join(process.cwd(), "disabled-dates.json")

// Helper function to ensure the file exists
async function ensureFileExists() {
  try {
    await fs.access(DISABLED_DATES_FILE)
  } catch {
    await fs.writeFile(DISABLED_DATES_FILE, "[]")
  }
}

async function getDisabledDates() {
  await ensureFileExists()
  try {
    const data = await fs.readFile(DISABLED_DATES_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading disabled dates:", error)
    return []
  }
}

async function saveDisabledDates(dates: any[]) {
  await fs.writeFile(DISABLED_DATES_FILE, JSON.stringify(dates, null, 2))
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date, reason } = await request.json()
    const formattedDate = formatDate(date) // Format the date consistently
    
    const dates = await getDisabledDates()
    
    // Check if date already exists
    if (!dates.some((d: any) => d.date === formattedDate)) {
      dates.push({ 
        date: formattedDate, 
        reason, 
        createdAt: new Date().toISOString() 
      })
      await saveDisabledDates(dates)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/disabled-dates:", error)
    return NextResponse.json({ error: "Failed to disable date" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date } = await request.json()
    const formattedDate = formatDate(date) // Format the date consistently
    
    let dates = await getDisabledDates()
    
    dates = dates.filter((d: any) => d.date !== formattedDate)
    await saveDisabledDates(dates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/disabled-dates:", error)
    return NextResponse.json({ error: "Failed to enable date" }, { status: 500 })
  }
} 