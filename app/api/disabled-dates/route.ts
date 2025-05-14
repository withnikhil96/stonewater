import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth.config"
import { cookies } from "next/headers"

// Cookie name constant
const DISABLED_DATES_COOKIE = 'stonewater-disabled-dates'

// Get disabled dates from cookies
async function getDisabledDates() {
  try {
    const cookieStore = await cookies()
    const disabledDatesCookie = cookieStore.get(DISABLED_DATES_COOKIE)
    if (disabledDatesCookie?.value) {
      return JSON.parse(disabledDatesCookie.value)
    }
    return []
  } catch (error) {
    console.error("Error reading disabled dates from cookies:", error)
    return []
  }
}

// Save disabled dates to cookies
async function saveDisabledDates(dates: any[]) {
  // Limit cookie size by only storing essential data
  const simplifiedDates = dates.map(({ date, reason }) => ({ date, reason }))
  const cookieStore = await cookies()
  cookieStore.set({
    name: DISABLED_DATES_COOKIE,
    value: JSON.stringify(simplifiedDates),
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'strict',
  })
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

    const dates = await getDisabledDates()
    
    // Check if date already exists
    if (!dates.some((d: any) => d.date === date)) {
      dates.push({ 
        date, 
        reason: reason || '', 
      })
      await saveDisabledDates(dates)
      console.log(`Date ${date} disabled successfully`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/disabled-dates:", error)
    return NextResponse.json({ error: "Failed to disable date", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
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
    
    let dates = await getDisabledDates()
    const originalCount = dates.length
    
    dates = dates.filter((d: any) => d.date !== date)
    
    if (dates.length !== originalCount) {
      await saveDisabledDates(dates)
      console.log(`Date ${date} enabled successfully`)
    } else {
      console.log(`Date ${date} was not found in disabled dates`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/disabled-dates:", error)
    return NextResponse.json({ error: "Failed to enable date", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
} 