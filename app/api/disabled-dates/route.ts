import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth.config"
import fs from "fs/promises"
import path from "path"

// File to store disabled dates
const DATA_FILE = path.join(process.cwd(), "data", "disabled-dates.json")

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    return true
  } catch (error) {
    console.error("Error creating data directory:", error)
    return false
  }
}

// Read disabled dates from file
async function getDisabledDates() {
  try {
    await ensureDataDirectory()
    
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8")
      return JSON.parse(data)
    } catch (error) {
      // If file doesn't exist or can't be parsed, create empty file
      await fs.writeFile(DATA_FILE, "[]")
      return []
    }
  } catch (error) {
    console.error("Error reading disabled dates:", error)
    return []
  }
}

// Write disabled dates to file
async function saveDisabledDates(dates: { date: string, reason: string, createdAt?: string, updatedAt?: string }[]) {
  try {
    await ensureDataDirectory()
    await fs.writeFile(DATA_FILE, JSON.stringify(dates, null, 2))
    return true
  } catch (error) {
    console.error("Error saving disabled dates:", error)
    return false
  }
}

export async function GET() {
  try {
    const dates = await getDisabledDates()
    return NextResponse.json(dates)
  } catch (error) {
    console.error("Error getting disabled dates:", error)
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

    const dates = await getDisabledDates()
    
    // Check if date already exists
    const existingIndex = dates.findIndex((item: { date: string }) => item.date === date)
    
    if (existingIndex !== -1) {
      // Update existing date
      dates[existingIndex].reason = reason || ''
      dates[existingIndex].updatedAt = new Date().toISOString()
    } else {
      // Add new date
      dates.push({
        date,
        reason: reason || '',
        createdAt: new Date().toISOString()
      })
    }
    
    const success = await saveDisabledDates(dates)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to save disabled dates" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error disabling date:", error)
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
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const dates = await getDisabledDates()
    const filteredDates = dates.filter((item: { date: string }) => item.date !== date)
    
    if (filteredDates.length !== dates.length) {
      const success = await saveDisabledDates(filteredDates)
      
      if (success) {
        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json({ error: "Failed to save changes" }, { status: 500 })
      }
    } else {
      return NextResponse.json({ success: true, notFound: true })
    }
  } catch (error) {
    console.error("Error enabling date:", error)
    return NextResponse.json({ error: "Failed to enable date" }, { status: 500 })
  }
} 