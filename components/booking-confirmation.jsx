"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, Phone, AlertTriangle, Clock, X } from "lucide-react"
import confetti from "canvas-confetti"

export default function BookingConfirmation({ isOpen, onClose, bookingDetails, ipRestricted = false }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      if (bookingDetails) {
        // Trigger confetti animation when the dialog opens
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })

        // Debug log
        console.log("Booking confirmation opened with details:", bookingDetails)
      }
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, bookingDetails])

  // Safety check - if no booking details, don't render
  if (!bookingDetails) {
    console.log("No booking details provided to confirmation dialog")
    return null
  }

  // Format the date safely
  let formattedDate = "Date not specified"
  try {
    if (bookingDetails.date) {
      // Handle both Date objects and ISO strings
      const dateObj = bookingDetails.date instanceof Date ? bookingDetails.date : new Date(bookingDetails.date)

      // Check if date is valid before formatting
      if (!isNaN(dateObj.getTime())) {
        formattedDate = format(dateObj, "EEEE, MMMM d, yyyy")
      } else {
        console.error("Invalid date object:", bookingDetails.date)
      }
    }
  } catch (error) {
    console.error("Error formatting date:", error, bookingDetails.date)
  }

  if (!isOpen && !isVisible) return null

  return (
    <div
      className={`fixed top-24 right-6 z-50 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ease-out ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
      }`}
    >
      <div className="p-4 bg-[#6b0000] text-white relative">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 text-white hover:bg-white/20 rounded-full p-1"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="flex items-center mb-1">
          <CheckCircle className="h-6 w-6 mr-2" />
          <h3 className="text-lg font-semibold">Booking Confirmed!</h3>
        </div>
        <p className="text-sm text-white/90">Your reservation has been successfully submitted.</p>
      </div>

      <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Name:</span>
            <span className="text-gray-800">{bookingDetails.name || "Not provided"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Date:</span>
            <span className="text-gray-800">{formattedDate}</span>
          </div>
          {bookingDetails.time && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Time:</span>
              <span className="flex items-center text-gray-800">
                <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                {bookingDetails.time}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Party Size:</span>
            <span className="text-gray-800">
              {bookingDetails.people} {bookingDetails.people > 1 ? "people" : "person"}
            </span>
          </div>
          {bookingDetails.email && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Email:</span>
              <span className="flex items-center text-gray-800 truncate max-w-[140px]" title={bookingDetails.email}>
                <Mail className="h-3.5 w-3.5 mr-1 text-gray-500 flex-shrink-0" />
                {bookingDetails.email}
              </span>
            </div>
          )}
          {bookingDetails.phone && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Phone:</span>
              <span className="flex items-center text-gray-800">
                <Phone className="h-3.5 w-3.5 mr-1 text-gray-500" />
                {bookingDetails.phone}
              </span>
            </div>
          )}
        </div>

        {ipRestricted ? (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs">
            <div className="flex items-start">
              <AlertTriangle className="text-amber-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
              <p className="text-amber-700">
                Due to security settings, email confirmations could not be sent. Your reservation has been recorded.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600 text-xs">
            We've sent a confirmation email with all the details to your email address.
          </p>
        )}

        <div className="flex justify-center mt-2">
          <Button onClick={onClose} size="sm" className="bg-[#6b0000] hover:bg-[#8a0000] text-sm text-white">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
