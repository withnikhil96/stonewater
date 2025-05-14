"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Calendar from "react-calendar"
import { toast } from "sonner"
import { LogOut, X, Check, Calendar as CalendarIcon } from "lucide-react"
import 'react-calendar/dist/Calendar.css'

type DisabledDate = {
  date: string
  reason: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [disabledDates, setDisabledDates] = useState<DisabledDate[]>([])
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login")
    }
    // Load disabled dates from API
    loadDisabledDates()
  }, [status, router])

  const loadDisabledDates = async () => {
    try {
      const response = await fetch("/api/disabled-dates")
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Failed to load disabled dates:", response.status, errorData)
        toast.error(`Failed to load dates: ${response.statusText}`)
        return
      }
      
      const data = await response.json()
      console.log("Loaded disabled dates:", data)
      setDisabledDates(data)
    } catch (error) {
      console.error("Error loading disabled dates:", error)
      toast.error("Error loading dates")
    }
  }

  const formatDateForApi = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Australia/Perth'
    };
    
    return new Intl.DateTimeFormat('en-CA', options).format(date);
  }

  const handleDateToggle = async () => {
    if (!selectedDate) return

    try {
      const dateStr = formatDateForApi(selectedDate)
      const isDateDisabled = disabledDates.some(d => d.date === dateStr)
      
      console.log(`Toggling date: ${dateStr}, currently disabled: ${isDateDisabled}`)

      if (isDateDisabled) {
        // Enable date
        const response = await fetch("/api/disabled-dates", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ date: dateStr }),
        })

        const data = await response.json()
        
        if (response.ok) {
          toast.success(`Bookings enabled for ${dateStr}`)
          await loadDisabledDates() // Reload the dates immediately
        } else {
          console.error("Failed to enable date:", data)
          toast.error(`Failed to enable date: ${data.error || response.statusText}`)
        }
      } else {
        // Disable date
        console.log(`Sending POST request to disable date: ${dateStr}`)
        
        const response = await fetch("/api/disabled-dates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ date: dateStr, reason }),
        })

        let data
        try {
          data = await response.json()
        } catch (e) {
          console.error("Error parsing response:", e)
          data = {}
        }
        
        if (response.ok) {
          toast.success(`Bookings disabled for ${dateStr}${reason ? `: ${reason}` : ''}`)
          await loadDisabledDates() // Reload the dates immediately
        } else {
          console.error("Failed to disable date:", data)
          toast.error(`Failed to disable date: ${data?.error || response.statusText}`)
        }
      }

      setReason("")
      setSelectedDate(null)
    } catch (error) {
      console.error("Error toggling date:", error)
      toast.error(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleLogout = async () => {
    const { signOut } = await import("next-auth/react")
    await signOut({ callbackUrl: "/admin/login" })
  }

  const handleEnableDate = async (dateStr: string) => {
    try {
      console.log("Enabling date directly:", dateStr)
      const response = await fetch("/api/disabled-dates", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: dateStr }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Failed to enable date:", response.status, errorData)
        toast.error(`Failed to enable date: ${errorData.error || response.statusText}`)
        return
      }

      toast.success(`Bookings enabled for ${dateStr}`)
      await loadDisabledDates()
    } catch (error) {
      console.error("Error enabling date:", error)
      toast.error(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-4 bg-white rounded-lg shadow-lg">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#6b0000] text-white py-3 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CalendarIcon size={20} />
            <h1 className="text-xl font-semibold">Stonewater Admin</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-[#6b0000] hover:bg-[#590000] text-white rounded border border-white/30 px-3 py-1"
          >
            <div className="flex items-center">
              <LogOut size={16} className="mr-1.5" />
              <span>Logout</span>
            </div>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-4 px-4">
        <h2 className="text-xl font-semibold mb-4">
          Booking Availability Manager
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Calendar Column */}
          <div>
            <div className="bg-white border rounded-md shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-medium">
                  Select Date
                </h3>
                <div className="text-xs text-blue-600">
                  Perth Timezone
                </div>
              </div>
              
              {/* Calendar */}
              <div className="react-calendar-wrapper">
                <Calendar
                  onChange={(value) => {
                    if (value instanceof Date) {
                      setSelectedDate(value)
                    }
                  }}
                  value={selectedDate}
                  tileClassName={({ date }) => {
                    const dateStr = formatDateForApi(date)
                    return disabledDates.some(d => d.date === dateStr) 
                      ? 'bg-red-100 text-red-800 line-through' 
                      : null
                  }}
                />
              </div>
            </div>

            {/* Disabled Dates Card */}
            <div className="bg-white border rounded-md shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-medium flex items-center">
                  <X size={16} className="mr-1.5 text-red-500" />
                  Disabled Dates
                </h3>
                <span className="text-xs text-gray-500">
                  {disabledDates.length} dates
                </span>
              </div>

              {disabledDates.length > 0 ? (
                <div className="space-y-2">
                  {disabledDates.map((date) => (
                    <div key={date.date} className="border-t pt-3 pb-2 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{new Date(date.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          timeZone: 'Australia/Perth'
                        })}</p>
                        {date.reason && (
                          <p className="text-xs text-red-600">
                            {date.reason}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => handleEnableDate(date.date)}
                        className="text-xs text-white bg-[#6b0000] px-3 py-1 rounded flex items-center"
                      >
                        <Check size={12} className="mr-1" />
                        Enable
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-gray-500 text-sm">
                    No dates are currently disabled
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Selection Column */}
          <div>
            {selectedDate ? (
              <div className="bg-white border rounded-md shadow-sm">
                <div className="bg-white px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        timeZone: 'Australia/Perth'
                      })}
                    </h3>
                    {(() => {
                      const dateStr = formatDateForApi(selectedDate)
                      const isDisabled = disabledDates.some(d => d.date === dateStr)
                      return isDisabled ? (
                        <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded-full flex items-center text-xs font-medium">
                          <X size={12} className="mr-1" />
                          Closed
                        </span>
                      ) : (
                        <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center text-xs font-medium">
                          <Check size={12} className="mr-1" />
                          Open
                        </span>
                      )
                    })()}
                  </div>
                </div>
                
                <div className="p-4">
                  {(() => {
                    const dateStr = formatDateForApi(selectedDate)
                    const isDisabled = disabledDates.some(d => d.date === dateStr)
                    
                    if (isDisabled) {
                      // For disabled dates
                      const disabledDate = disabledDates.find(d => d.date === dateStr)
                      return (
                        <>
                          {disabledDate?.reason && (
                            <div className="mb-4">
                              <p className="text-sm">
                                <span className="font-medium">Reason:</span> {disabledDate.reason}
                              </p>
                            </div>
                          )}
                          <button
                            onClick={handleDateToggle}
                            className="w-full py-2 px-4 rounded text-white bg-[#6b0000] hover:bg-[#590000]"
                          >
                            Enable Booking
                          </button>
                        </>
                      )
                    } else {
                      // For enabled dates
                      return (
                        <>
                          <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">
                              Reason for disabling (optional)
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="e.g., Private event, Holiday, etc."
                            />
                          </div>
                          <button
                            onClick={handleDateToggle}
                            className="w-full py-2 px-4 rounded text-white bg-[#6b0000] hover:bg-[#590000]"
                          >
                            Disable Booking
                          </button>
                        </>
                      )
                    }
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-white border rounded-md shadow-sm p-8 flex flex-col items-center justify-center text-center h-full">
                <div className="text-blue-600 mb-4">
                  <CalendarIcon size={32} />
                </div>
                <h3 className="text-base font-medium mb-2">Select a Date</h3>
                <p className="text-sm text-gray-500">
                  Click on any date in the calendar to view its current status or change its availability.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} Stonewater Admin System
        </div>
      </div>
      
      <style jsx global>{`
        .react-calendar {
          width: 100%;
          border: none;
        }
        .react-calendar__navigation {
          margin-bottom: 0;
        }
        .react-calendar__month-view__weekdays {
          font-weight: bold;
          font-size: 0.8em;
          text-transform: uppercase;
        }
        .react-calendar__month-view__days__day--weekend {
          color: #d10000;
        }
        .react-calendar__tile--now {
          background: #f8f8f8;
        }
        .react-calendar__tile--active {
          background: #ffcc00;
          color: black;
        }
        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background: #e6b800;
        }
        .bg-red-100 {
          position: relative;
        }
      `}</style>
    </div>
  )
} 