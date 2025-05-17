import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth.config"
import { getAllDisabledDates, disableDate, enableDate, updateTimeSlot } from "@/lib/disabled-dates"

export async function GET() {
  try {
    const dates = await getAllDisabledDates()
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

    const { date, reason, lunchDisabled, dinnerDisabled } = await request.json()
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }
    
    // Increase timeout for Vercel's serverless function
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000) // Set close to Vercel's limit
    
    try {
      const success = await disableDate(date, reason || '', { 
        lunchDisabled: lunchDisabled !== undefined ? lunchDisabled : true,
        dinnerDisabled: dinnerDisabled !== undefined ? dinnerDisabled : true
      })
      clearTimeout(timeoutId)
      
      if (success) {
        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json({ error: "Failed to save disabled dates" }, { status: 500 })
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error("MongoDB operation error:", error)
      return NextResponse.json({ error: "Database operation failed", details: error.message }, { status: 500 })
    }
  } catch (error) {
    console.error("Error disabling date:", error)
    return NextResponse.json({ error: "Failed to disable date", details: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date, timeSlot, disabled } = await request.json()
    if (!date || !timeSlot || disabled === undefined) {
      return NextResponse.json({ error: "Date, timeSlot, and disabled status are required" }, { status: 400 })
    }
    
    if (timeSlot !== 'lunch' && timeSlot !== 'dinner') {
      return NextResponse.json({ error: "TimeSlot must be 'lunch' or 'dinner'" }, { status: 400 })
    }
    
    const success = await updateTimeSlot(date, timeSlot, disabled)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to update time slot" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating time slot:", error)
    return NextResponse.json({ error: "Failed to update time slot" }, { status: 500 })
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
      return NextResponse.json({ error: "Failed to save changes" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error enabling date:", error)
    return NextResponse.json({ error: "Failed to enable date" }, { status: 500 })
  }
} 