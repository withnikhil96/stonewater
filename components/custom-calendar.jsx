"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"

export default function CustomCalendar({ onSelectDate, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState([])

  // Generate calendar days for the current month
  useEffect(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const startDay = monthStart.getDay()

    // Add empty days at the beginning to align with the correct day of the week
    const emptyDaysAtStart = Array(startDay).fill(null)

    // Calculate how many days to add at the end to make a complete grid
    const totalDaysWithEmpty = emptyDaysAtStart.length + daysInMonth.length
    const rowsNeeded = Math.ceil(totalDaysWithEmpty / 7)
    const totalCells = rowsNeeded * 7
    const emptyDaysAtEnd = Array(totalCells - totalDaysWithEmpty).fill(null)

    setCalendarDays([...emptyDaysAtStart, ...daysInMonth, ...emptyDaysAtEnd])
  }, [currentMonth])

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  // Check if date is April 26 of any year
  const isApril26 = (date) => {
    return date.getDate() === 26 && date.getMonth() === 3
  }

  // Handle date selection
  const handleDateClick = (day) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of today
    
    if (day && day >= today && !isApril26(day)) {
      onSelectDate(day)
    }
  }

  // Day names for the header
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm">
      {/* Calendar header with month navigation */}
      <div className="flex items-center justify-between p-3 border-b">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-700">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="text-gray-500 hover:text-gray-700">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 p-2 text-center text-xs font-medium text-gray-500">
        {dayNames.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {calendarDays.map((day, i) => {
          // For empty cells
          if (!day) {
            return <div key={`empty-${i}`} className="h-9 w-full" />
          }

          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
          const isTodayDate = isToday(day)
          const isClosedDate = isApril26(day)

          return (
            <Button
              key={day.toString()}
              variant="ghost"
              size="sm"
              disabled={isPast || isClosedDate}
              onClick={() => handleDateClick(day)}
              className={`h-9 w-full rounded-md text-sm font-medium ${
                !isCurrentMonth
                  ? "text-gray-300"
                  : isPast
                    ? "text-gray-300 cursor-not-allowed"
                    : isClosedDate
                      ? "text-gray-300 cursor-not-allowed"
                      : isSelected
                        ? "bg-[#6b0000] text-white hover:bg-[#8a0000]"
                        : isTodayDate
                          ? "bg-gray-100 text-[#6b0000] font-bold"
                          : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {format(day, "d")}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
