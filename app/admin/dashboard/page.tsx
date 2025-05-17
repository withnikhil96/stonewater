"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Calendar from "react-calendar"
import { toast } from "sonner"
import {
  LogOut,
  X,
  Check,
  CalendarIcon,
  ChevronRight,
  Info,
  Clock,
  Settings,
  Shield,
  Menu,
  XIcon,
} from "lucide-react"
import "react-calendar/dist/Calendar.css"
import "@/app/globals.css"

type DisabledDate = {
  date: string
  reason: string
  lunchDisabled: boolean
  dinnerDisabled: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(true) // Mock authentication state
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [disabledDates, setDisabledDates] = useState<DisabledDate[]>([])
  const [reason, setReason] = useState("")
  const [lunchDisabled, setLunchDisabled] = useState(true)
  const [dinnerDisabled, setDinnerDisabled] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Simulate authentication check
    const checkAuth = setTimeout(() => {
      setIsLoading(false)
      // In a real app, this would check the session
    }, 1000)

    return () => clearTimeout(checkAuth)
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    async function loadDisabledDates() {
      try {
        const response = await fetch('/api/disabled-dates')
        if (response.ok) {
          const data = await response.json()
          setDisabledDates(data)
        }
      } catch (error) {
        console.error("Error loading disabled dates:", error)
        toast.error("Failed to load disabled dates")
      }
    }

    loadDisabledDates()
  }, [])

  const formatDateForApi = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Australia/Perth",
    }

    return new Intl.DateTimeFormat("en-CA", options).format(date)
  }

  const handleDateToggle = async () => {
    if (!selectedDate) return

    try {
      const dateStr = formatDateForApi(selectedDate)
      const disabledDate = disabledDates.find((d) => d.date === dateStr)
      const isDateFullyDisabled = disabledDate && disabledDate.lunchDisabled && disabledDate.dinnerDisabled

      if (isDateFullyDisabled) {
        // Enable date completely - call API
        const response = await fetch('/api/disabled-dates', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ date: dateStr }),
        })

        if (response.ok) {
          // Update local state
          setDisabledDates(disabledDates.filter((d) => d.date !== dateStr))
          toast.success(`Bookings enabled for ${dateStr}`)
        } else {
          toast.error('Failed to enable date')
        }
      } else {
        // Add or update date - call API
        const response = await fetch('/api/disabled-dates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: dateStr,
            reason,
            lunchDisabled,
            dinnerDisabled
          }),
        })

        if (response.ok) {
          // Update local state
          const existingDateIndex = disabledDates.findIndex((d) => d.date === dateStr)
          if (existingDateIndex >= 0) {
            // Update existing date
            const updatedDates = [...disabledDates]
            updatedDates[existingDateIndex] = {
              ...updatedDates[existingDateIndex],
              reason,
              lunchDisabled,
              dinnerDisabled,
            }
            setDisabledDates(updatedDates)
          } else {
            // Add new date
            setDisabledDates([...disabledDates, { date: dateStr, reason, lunchDisabled, dinnerDisabled }])
          }
          toast.success(`Bookings updated for ${dateStr}${reason ? `: ${reason}` : ""}`)
        } else {
          toast.error('Failed to update date')
        }
      }

      setReason("")
      setSelectedDate(null)
      setLunchDisabled(true)
      setDinnerDisabled(true)
    } catch (error) {
      console.error("Error toggling date:", error)
      toast.error(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        setIsAuthenticated(false)
        router.push("/admin/login")
        toast.success("Logged out successfully")
      } else {
        // Even if the API call fails, try to redirect
        router.push("/admin/login")
        toast.error("Failed to log out properly")
      }
    } catch (error) {
      console.error("Error logging out:", error)
      // Fallback logout - force navigation
      router.push("/admin/login")
    }
  }

  const handleEnableDate = async (dateStr: string) => {
    try {
      // Real API call
      const response = await fetch('/api/disabled-dates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: dateStr }),
      })

      if (response.ok) {
        // Update local state only after successful API call
        setDisabledDates(disabledDates.filter((d) => d.date !== dateStr))
        toast.success(`Bookings enabled for ${dateStr}`)
      } else {
        toast.error('Failed to enable date')
      }
    } catch (error) {
      console.error("Error enabling date:", error)
      toast.error(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleTimeSlotToggle = async (dateStr, timeSlot, disabled) => {
    try {
      // Call API
      const response = await fetch('/api/disabled-dates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateStr,
          timeSlot,
          disabled
        }),
      })

      if (response.ok) {
        // Update local state
        const updatedDates = disabledDates.map((date) => {
          if (date.date === dateStr) {
            return {
              ...date,
              lunchDisabled: timeSlot === "lunch" ? disabled : date.lunchDisabled,
              dinnerDisabled: timeSlot === "dinner" ? disabled : date.dinnerDisabled,
            }
          }
          return date
        })
        setDisabledDates(updatedDates)
        toast.success(`${timeSlot === "lunch" ? "Lunch" : "Dinner"} ${disabled ? "disabled" : "enabled"} for ${dateStr}`)
      } else {
        toast.error('Failed to update time slot')
      }
    } catch (error) {
      console.error("Error updating time slot:", error)
      toast.error(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-white">
        <div className="p-8">
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <img
                src="/images/logo.png"
                alt="Stonewater Logo"
                className="w-[100px] h-[100px] object-contain admin-logo"
              />
            </div>
            <h3 className="mt-4 text-gray-800 font-medium animate-pulse">Loading dashboard...</h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="admin-header py-4 px-4 sticky top-0 z-50 mb-8">
        <div className="max-w-[1500px] mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2 rounded-full">
                <img
                  src="/images/logo.png"
                  alt="Stonewater Logo"
                  className="w-[80px] h-[80px] object-contain admin-logo"
                />
              </div>
              <h1 className="text-base md:text-xl font-bold">
                <span>Stonewater</span>
                &nbsp;Admin
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="admin-button rounded-md flex items-center space-x-1.5 md:hidden hover:scale-105"
            >
              <LogOut size={16} />
            </button>

            <button
              onClick={handleLogout}
              className="admin-button rounded-md items-center space-x-1.5 hidden md:flex hover:scale-105"
              title="Logout"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto main-part px-4 md:px-0">
        <div className="flex md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-base md:text-2xl font-bold pb-2 text-black">
            Booking Availability Manager
          </h2>

          <div className="md:w-[14px] md:h-[14px]  text-black backdrop-blur-sm p-5 rounded-full text-[8px] md:text-sm flex items-center space-x-0.5 md:space-x-1.5 shadow-sm perth">
            <Info size={12} className="md:w-[14px] md:h-[14px]" />
            &nbsp;
            <span>Perth Timezone</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Calendar Column */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white border rounded-xl shadow-lg overflow-hidden transition-colors duration-300 admin-card">
              <div className="bg-gray-50 px-3 md:px-4 py-2 md:py-3 border-b border-[#5a0000] flex items-center justify-between admin-card-header">
                <h3 className="font-medium flex items-center text-black text-sm md:text-base">
                  <CalendarIcon size={14} className="mr-2 md:w-4 md:h-4" />
                  Select Date
                </h3>
              </div>

              {/* Calendar */}
              <div className="p-2 md:p-4">
                <div className="calendar-light rounded-lg overflow-hidden shadow-sm">
                  <Calendar
                    onChange={(value) => {
                      if (value instanceof Date) {
                        setSelectedDate(value)

                        // Reset time slot options when selecting a date
                        const dateStr = formatDateForApi(value)
                        const disabledDate = disabledDates.find((d) => d.date === dateStr)
                        if (disabledDate) {
                          setLunchDisabled(disabledDate.lunchDisabled)
                          setDinnerDisabled(disabledDate.dinnerDisabled)
                        } else {
                          setLunchDisabled(true)
                          setDinnerDisabled(true)
                        }
                      }
                    }}
                    value={selectedDate}
                    tileClassName={({ date }) => {
                      const dateStr = formatDateForApi(date)
                      const disabledDate = disabledDates.find((d) => d.date === dateStr)

                      if (disabledDate) {
                        if (disabledDate.lunchDisabled && disabledDate.dinnerDisabled) {
                          return "fully-disabled"
                        } else {
                          return "partially-disabled"
                        }
                      }

                      return null
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white border border-[#5a0000] rounded-xl p-3 md:p-4 shadow-lg transition-colors duration-300 admin-card">
              <h3 className="text-xs md:text-sm font-medium mb-3 text-black">
                Time Slot Legend
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                <div className="flex items-center text-black">
                  <div
                    className={`w-3 h-3 md:w-4 md:h-4 rounded legend-fully-available mr-2`}
                  ></div>
                  <span className="text-xs md:text-sm">Fully Available</span>
                </div>
                <div className="flex items-center text-black">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded legend-partially-disabled mr-2"></div>
                  <span className="text-xs md:text-sm">Partially Disabled</span>
                </div>
                <div className="flex items-center text-black">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded legend-fully-disabled mr-2"></div>
                  <span className="text-xs md:text-sm">Fully Disabled</span>
                </div>
              </div>
            </div>

            {/* Disabled Dates Card */}
            <div className="bg-white border rounded-xl shadow-lg overflow-hidden transition-colors duration-300 admin-card">
              <div className="bg-gray-50 px-3 md:px-4 py-2 md:py-3 border-b border-[#5a0000] flex items-center justify-between admin-card-header">
                <h3 className="font-medium flex items-center text-black text-sm md:text-base">
                  <X size={14} className="mr-2 text-red-600 md:w-4 md:h-4" />
                  Disabled Dates
                </h3>
                <span className="admin-badge text-xs">
                  {disabledDates.length} {disabledDates.length === 1 ? "date" : "dates"}
                </span>
              </div>

              <div className="p-3 md:p-4">
                {disabledDates.length > 0 ? (
                  <div className="space-y-2 md:space-y-3 max-h-[300px] overflow-y-auto pr-1 styled-scrollbar">
                    {disabledDates.map((date) => (
                      <div
                        key={date.date}
                        className="bg-gray-50 hover:bg-gray-100 rounded-lg overflow-hidden transition-colors duration-200 border border-[#5a0000] admin-card"
                      >
                        <div className="p-2 md:p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="font-medium text-black text-sm md:text-base">
                                {new Date(date.date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  timeZone: "Australia/Perth",
                                })}
                              </p>
                              {date.reason && <p className="text-[10px] md:text-xs text-red-600 mt-0.5">{date.reason}</p>}
                            </div>
                            <button
                              onClick={() => handleEnableDate(date.date)}
                              className="admin-button admin-button-sm rounded-md flex items-center space-x-1 text-xs"
                            >
                              <Check size={10} className="md:w-3 md:h-3" />
                              <span>Enable All</span>
                            </button>
                          </div>

                          {/* Time slots control */}
                          <div className="grid grid-cols-2 gap-2 md:gap-3 mt-2 md:mt-3 time-slots">
                            {/* Lunch Slot */}
                            <div className="time-slots-one flex items-center justify-between text-xs md:text-sm bg-white p-1.5 md:p-2 rounded-md border">
                              <div className="flex items-center">
                                <span className="text-black">Lunch</span>
                              </div>
                              <button
                                onClick={() => handleTimeSlotToggle(date.date, "lunch", !date.lunchDisabled)}
                                className={date.lunchDisabled ? "btn-enable rounded-md text-xs" : "btn-disable rounded-md text-xs"}
                              >
                                {date.lunchDisabled ? "Enable" : "Disable"}
                              </button>
                            </div>

                            {/* Dinner Slot */}
                            <div className="time-slots-one flex items-center justify-between text-xs md:text-sm bg-white p-1.5 md:p-2 rounded-md border border-[#5a0000]">
                              <div className="flex items-center">
                                <span className="text-black">Dinner</span>
                              </div>
                              <button
                                onClick={() => handleTimeSlotToggle(date.date, "dinner", !date.dinnerDisabled)}
                                className={date.dinnerDisabled ? "btn-enable rounded-md text-xs" : "btn-disable rounded-md text-xs"}
                              >
                                {date.dinnerDisabled ? "Enable" : "Disable"}
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 md:py-8 text-center rounded-lg">
                    <p className="text-xs md:text-sm text-black">
                      No dates are currently disabled
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selection Column */}
          <div>
            {selectedDate ? (
              <div className="bg-white border rounded-xl shadow-lg overflow-hidden transition-colors duration-300 h-full admin-card">
                <div className="admin-header px-3 md:px-4 py-2 md:py-3 flex items-center  justify-between">
                  <h3 className="text-sm md:text-base font-medium flex items-center">
                    <Clock size={14} className="mr-2 md:w-4 md:h-4" />
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      timeZone: "Australia/Perth",
                    })}
                  </h3>
                  {(() => {
                    const dateStr = formatDateForApi(selectedDate)
                    const disabledDate = disabledDates.find((d) => d.date === dateStr)

                    if (!disabledDate) {
                      return (
                        <span className="admin-badge text-xs">
                          <Check size={10} className="mr-1 md:w-3 md:h-3" />
                          Fully Open
                        </span>
                      )
                    } else if (disabledDate.lunchDisabled && disabledDate.dinnerDisabled) {
                      return (
                        <span className="admin-badge text-xs">
                          <X size={10} className="mr-1 md:w-3 md:h-3" />
                          Fully Closed
                        </span>
                      )
                    } else {
                      return (
                        <span className="admin-badge text-xs">
                          <Check size={10} className="mr-1 md:w-3 md:h-3" />
                          Partially Open
                        </span>
                      )
                    }
                  })()}
                </div>

                <div className="p-4 md:p-5">
                  <div className="mb-4 md:mb-5">
                    <label className="block text-xs md:text-sm font-medium mb-2 md:mb-3 text-black">
                      Time Slots
                    </label>
                    <div className="flex justify-evenly m-4  mb-4 md:mb-5">
                      <div className="border rounded-lg p-3 md:p-4 bg-white flex flex-col items-center w-full md:w-1/2">
                        <span className="font-medium text-black text-sm md:text-base mb-2 md:mb-3">Lunch</span>
                        <label className="flex items-center cursor-pointer">
                          <div className="admin-toggle">
                            <input
                              type="checkbox"
                              checked={!lunchDisabled}
                              onChange={() => setLunchDisabled(!lunchDisabled)}
                            />
                            <span className="admin-toggle-slider"></span>
                          </div>
                          <span className={`ms-3 text-xs md:text-sm font-medium ${lunchDisabled ? "toggle-status-disabled" : "toggle-status-enabled"
                            }`}>
                            {lunchDisabled ? "Disabled" : "Enabled"}
                          </span>
                        </label>
                      </div>
                      <div className="border rounded-lg p-3 md:p-4 bg-white flex flex-col items-center w-full md:w-1/2">
                        <span className="font-medium text-black text-sm md:text-base mb-2 md:mb-3">Dinner</span>
                        <label className="flex items-center cursor-pointer">
                          <div className="admin-toggle">
                            <input
                              type="checkbox"
                              checked={!dinnerDisabled}
                              onChange={() => setDinnerDisabled(!dinnerDisabled)}
                            />
                            <span className="admin-toggle-slider"></span>
                          </div>
                          <span className={`ms-3 text-xs md:text-sm font-medium ${dinnerDisabled ? "toggle-status-disabled" : "toggle-status-enabled"
                            }`}>
                            {dinnerDisabled ? "Disabled" : "Enabled"}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="reason-wrapper">
                      <label className="reason-label">
                        Reason for disabling <span className="optional">(optional)</span>
                      </label>
                      <input
                        type="text"
                        className="reason-input"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Private event, Holiday, etc."
                      />
                      <p className="reason-note">
                        This will be shown to customers when they try to book this date.
                      </p>
                    </div>

                    <p className="mt-1 md:mt-1.5 text-[10px] md:text-xs text-black">
                      This will be shown to customers when they try to book this date.
                    </p>
                  </div>

                  <button
                    onClick={handleDateToggle}
                    className="admin-button w-full py-2 md:py-3 px-3 md:px-4 rounded-lg font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-2 group text-xs md:text-sm"
                  >
                    {(() => {
                      const dateStr = formatDateForApi(selectedDate)
                      const disabledDate = disabledDates.find((d) => d.date === dateStr)

                      if (disabledDate && disabledDate.lunchDisabled && disabledDate.dinnerDisabled) {
                        return (
                          <>
                            <Check size={14} className="md:w-[18px] md:h-[18px]" />
                            <span>Enable All Bookings</span>
                            <ChevronRight
                              size={12}
                              className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 md:w-4 md:h-4"
                            />
                          </>
                        )
                      } else if (!lunchDisabled && !dinnerDisabled) {
                        return (
                          <>
                            <Check size={14} className="md:w-[18px] md:h-[18px]" />
                            <span>Enable All Bookings</span>
                            <ChevronRight
                              size={12}
                              className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 md:w-4 md:h-4"
                            />
                          </>
                        )
                      } else {
                        return (
                          <>
                            <Settings size={14} className="md:w-[18px] md:h-[18px]" />
                            <span>Update Availability</span>
                            <ChevronRight
                              size={12}
                              className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 md:w-4 md:h-4"
                            />
                          </>
                        )
                      }
                    })()}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#5a0000] rounded-xl shadow-lg p-6 md:p-8 flex flex-col items-center justify-center text-center h-full transition-colors duration-300 admin-card">
                <div className="bg-blue-50 p-4 md:p-5 rounded-full mb-4 md:mb-5 border border-[#5a0000]">
                  <CalendarIcon size={28} className="text-black md:w-9 md:h-9" />
                </div>
                <h3 className="text-base md:text-lg font-medium mb-2 text-black">
                  Select a Date
                </h3>
                <p className="text-xs md:text-sm max-w-xs text-black">
                  Click on any date in the calendar to view its current status or change its availability.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-[10px] md:text-xs text-black mt-6 md:mt-8">
          © {new Date().getFullYear()} Stonewater Admin System • All rights reserved
        </div>
      </div>
    </div>
  )
}
