import { NextResponse } from "next/server"
import { isDateDisabled } from '@/lib/disabled-dates'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const timeSlot = searchParams.get('timeSlot') as 'lunch' | 'dinner' | null
    
    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
    }

    const disabled = await isDateDisabled(date, timeSlot)
    
    return NextResponse.json({ disabled })
  } catch (error) {
    console.error("Error checking date availability:", error)
    return NextResponse.json({ error: "Failed to check date" }, { status: 500 })
  }
} 