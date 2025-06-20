"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertTriangle, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import ReCAPTCHA from "react-google-recaptcha"
import { toast } from "sonner"
import { submitReservation } from "../actions"
import BookingConfirmation from "./booking-confirmation"
import PageTitle from "./page-title"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import CustomCalendar from "./custom-calendar"

// Update the DisabledDateAlert component
const DisabledDateAlert = ({ disabledDates }) => {
  // Use Perth timezone for consistent date comparison
  const today = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Australia/Perth'
  }).format(new Date())
  
  const upcomingDisabledDates = disabledDates
    .filter(d => d.date >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)
  
  if (upcomingDisabledDates.length === 0) return null
  
  return (
    <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-md mb-6 animate-pulse">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">Booking Unavailable on the Following Dates:</h3>
          <div className="mt-2 text-sm">
            <ul className="list-disc pl-5 space-y-1">
              {upcomingDisabledDates.map(date => (
                <li key={date.date}>
                  {new Date(date.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  {date.lunchDisabled && date.dinnerDisabled ? (
                    <span className="text-red-600 font-medium"> - All day</span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      {date.lunchDisabled ? ' - Lunch' : ''}
                      {date.dinnerDisabled ? ' - Dinner' : ''}
                    </span>
                  )}
                  {date.reason && <span className="text-red-600 font-medium"> ({date.reason})</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReservationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState(null)
  const [recaptchaValue, setRecaptchaValue] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [bookingDetails, setBookingDetails] = useState(null)
  const [ipRestricted, setIpRestricted] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [mealType, setMealType] = useState("")
  const [lunchTime, setLunchTime] = useState("")
  const [dinnerTime, setDinnerTime] = useState("")
  const [disabledDates, setDisabledDates] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm()

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
      }
    }
    
    loadDisabledDates()
  }, [])

  const formatDateForApi = (date) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Australia/Perth'
    };
    
    return new Intl.DateTimeFormat('en-CA', options).format(date); // This will be in YYYY-MM-DD format
  }

  const isDateDisabled = ({ date }) => {
    const dateStr = formatDateForApi(date)
    return disabledDates.some(d => d.date === dateStr)
  }

  const checkDateAvailability = async (selectedDate, mealType) => {
    try {
      const dateStr = formatDateForApi(selectedDate)
      const response = await fetch(`/api/check-date?date=${dateStr}&timeSlot=${mealType}`)
      
      if (!response.ok) {
        console.error("Error checking date availability:", response.statusText)
        return false // Assume available if API fails
      }
      
      const data = await response.json()
      return !data.disabled // Return true if date is available
    } catch (error) {
      console.error("Error checking date availability:", error)
      return false // Assume available if check fails
    }
  }

  const isMealTypeDisabled = (selectedDate, type) => {
    if (!selectedDate) return false;
    
    const dateStr = formatDateForApi(selectedDate);
    const disabledDate = disabledDates.find(d => d.date === dateStr);
    
    if (!disabledDate) return false;
    return type === 'lunch' ? disabledDate.lunchDisabled : disabledDate.dinnerDisabled;
  };

  const onSubmit = async (data) => {
    if (!recaptchaValue) {
      toast.error("Please complete the reCAPTCHA verification")
      return
    }

    if (!date) {
      toast.error("Please select a date")
      return
    }

    if (!mealType || (mealType === "lunch" && !lunchTime) || (mealType === "dinner" && !dinnerTime)) {
      toast.error("Please select a meal and time")
      return
    }

    // Check if the selected time slot is available
    const isAvailable = await checkDateAvailability(date, mealType)
    if (!isAvailable) {
      toast.error(`${mealType === 'lunch' ? 'Lunch' : 'Dinner'} bookings are not available on this date`)
      return
    }

    const selectedTime = mealType === "lunch" ? lunchTime : dinnerTime

    setIsSubmitting(true)

    try {
      const safeDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0))

      const formData = {
        ...data,
        checkInDate: safeDate.toISOString(),
        checkInTime: selectedTime,
        mealType,
        recaptchaToken: recaptchaValue,
      }

      console.log("Submitting reservation with data:", formData)

      const result = await submitReservation(formData)

      if (result.success) {
        if (result.ipRestricted) {
          setIpRestricted(true)
          toast.success(result.message, { duration: 6000 })
        } else {
          toast.success("Reservation submitted successfully! A confirmation email has been sent to your email address.")
        }

        const details = {
          name: `${data.firstName} ${data.lastName}`,
          date: safeDate,
          time: selectedTime,
          mealType,
          people: data.numberOfPeople,
          email: data.email,
          phone: data.mobileNumber,
          specialRequests: data.specialMessage || "None",
        }

        console.log("Setting booking details:", details)

        setBookingDetails(details)
        setShowConfirmation(true)

        reset()
        setDate(null)
        setRecaptchaValue(null)
        setLunchTime("")
        setDinnerTime("")
        setMealType("")
      } else {
        toast.error(result.message || "Failed to submit reservation. Please try again.")
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("Due to some technical issue please try again. Thank you.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmationClose = () => {
    console.log("Closing confirmation dialog")
    setShowConfirmation(false)
  }

  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate)
    setCalendarOpen(false)
    
    // If meal type is already selected but it's disabled for the new date, reset it
    if (mealType === 'lunch' && isMealTypeDisabled(selectedDate, 'lunch')) {
      setMealType("")
      setLunchTime("")
    } else if (mealType === 'dinner' && isMealTypeDisabled(selectedDate, 'dinner')) {
      setMealType("")
      setDinnerTime("")
    }
  }

  return (
    <div className="w-full pt-16 px-4 relative">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/cocktails-background.webp')" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"></div>
      </div>

      <div className="max-w-3xl mx-auto bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-lg shadow-xl animate-fade-in p-8 border-t-4 border-t-[#6b0000] relative z-10">
        <PageTitle title="Reservation Form" />

        {ipRestricted && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
            <AlertTriangle className="text-amber-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="text-amber-800 font-medium">Email Delivery Notice</p>
              <p className="text-amber-700 text-sm mt-1">
                Your reservation has been recorded, but email confirmations are currently unavailable due to security
                settings. The restaurant has been notified of your booking through alternative means.
              </p>
            </div>
          </div>
        )}

        <DisabledDateAlert disabledDates={disabledDates} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-700 font-medium">
                First Name
              </Label>
              <Input
                id="firstName"
                placeholder="Enter your first name"
                className={cn(
                  "border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white py-2 px-3",
                  errors.firstName && "border-red-500",
                )}
                {...register("firstName", { required: true })}
              />
              {errors.firstName && <p className="text-red-500 text-sm">First name is required</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-700 font-medium">
                Last Name
              </Label>
              <Input
                id="lastName"
                placeholder="Enter your last name"
                className={cn(
                  "border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white py-2 px-3",
                  errors.lastName && "border-red-500",
                )}
                {...register("lastName", { required: true })}
              />
              {errors.lastName && <p className="text-red-500 text-sm">Last name is required</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="mobileNumber" className="text-gray-700 font-medium">
                Mobile Number
              </Label>
              <Input
                id="mobileNumber"
                placeholder="Enter your mobile number"
                className={cn(
                  "border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white py-2 px-3",
                  errors.mobileNumber && "border-red-500",
                )}
                {...register("mobileNumber", {
                  required: true,
                  pattern: /^[0-9]{10,15}$/,
                })}
              />
              {errors.mobileNumber?.type === "required" && (
                <p className="text-red-500 text-sm">Mobile number is required</p>
              )}
              {errors.mobileNumber?.type === "pattern" && (
                <p className="text-red-500 text-sm">Please enter a valid mobile number</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className={cn(
                  "border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white py-2 px-3",
                  errors.email && "border-red-500",
                )}
                {...register("email", {
                  required: true,
                  pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                })}
              />
              {errors.email?.type === "required" && <p className="text-red-500 text-sm">Email is required</p>}
              {errors.email?.type === "pattern" && (
                <p className="text-red-500 text-sm">Please enter a valid email address</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="reservationDate" className="text-gray-700 font-medium">
                Reservation Date
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="reservationDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-300 bg-white text-gray-700 hover:bg-gray-50 py-2 px-3",
                      !date && "text-gray-500",
                      !date && errors.checkInDate && "border-red-500",
                    )}
                    onClick={() => setCalendarOpen(true)}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="truncate">
                        {date ? format(new Date(date), "EEEE, MMMM d, yyyy") : "Select a date"}
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-2">
                    <CustomCalendar
                      onSelectDate={handleDateSelect}
                      selectedDate={date}
                      disabledDates={disabledDates}
                      tileClassName={({ date }) => {
                        const dateStr = formatDateForApi(date)
                        return disabledDates.some(d => d.date === dateStr) ? 'disabled-date' : null
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              {!date && errors.checkInDate && <p className="text-red-500 text-sm">Reservation date is required</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Booking Time</Label>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={mealType === "lunch" ? "default" : "outline"}
                  onClick={() => {
                    if (!isMealTypeDisabled(date, 'lunch')) {
                      setMealType("lunch");
                    } else {
                      toast.error("Lunch bookings are not available on this date");
                    }
                  }}
                  disabled={isMealTypeDisabled(date, 'lunch')}
                  className={`${mealType === "lunch" ? "bg-[#6b0000] text-white" : ""} 
                             ${isMealTypeDisabled(date, 'lunch') ? "opacity-50 cursor-not-allowed line-through" : ""}`}
                >
                  {isMealTypeDisabled(date, 'lunch') ? "Lunch (Unavailable)" : "Lunch"}
                </Button>
                <Button
                  type="button"
                  variant={mealType === "dinner" ? "default" : "outline"}
                  onClick={() => {
                    if (!isMealTypeDisabled(date, 'dinner')) {
                      setMealType("dinner");
                    } else {
                      toast.error("Dinner bookings are not available on this date");
                    }
                  }}
                  disabled={isMealTypeDisabled(date, 'dinner')}
                  className={`${mealType === "dinner" ? "bg-[#6b0000] text-white" : ""} 
                             ${isMealTypeDisabled(date, 'dinner') ? "opacity-50 cursor-not-allowed line-through" : ""}`}
                >
                  {isMealTypeDisabled(date, 'dinner') ? "Dinner (Unavailable)" : "Dinner"}
                </Button>
              </div>

              {mealType === "lunch" && (
                <select
                  className="mt-2 border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white py-2 px-3 w-full rounded-md"
                  value={lunchTime}
                  onChange={(e) => setLunchTime(e.target.value)}
                >
                  <option value="">Select Lunch Time</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="12:30">12:30 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="13:30">1:30 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="14:30">2:30 PM</option>
                </select>
              )}

              {mealType === "dinner" && (
                <select
                  className="mt-2 border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white py-2 px-3 w-full rounded-md"
                  value={dinnerTime}
                  onChange={(e) => setDinnerTime(e.target.value)}
                >
                  <option value="">Select Dinner Time</option>
                  <option value="17:30">5:30 PM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="18:30">6:30 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="19:30">7:30 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="20:30">8:30 PM</option>
                  <option value="21:00">9:00 PM</option>
                  <option value="21:30">9:30 PM</option>
                </select>
              )}

              {!((mealType === "lunch" && lunchTime) || (mealType === "dinner" && dinnerTime)) && (
                <p className="text-red-500 text-sm mt-1">Please select a meal and time</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfPeople" className="text-gray-700 font-medium">
              Number of People
            </Label>
            <Input
              id="numberOfPeople"
              type="number"
              min="1"
              placeholder="Enter number of guests"
              className={cn(
                "border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white py-2 px-3",
                errors.numberOfPeople && "border-red-500",
              )}
              {...register("numberOfPeople", {
                required: true,
                min: 1,
                max: 20,
              })}
            />
            {errors.numberOfPeople?.type === "required" && (
              <p className="text-red-500 text-sm">Number of people is required</p>
            )}
            {errors.numberOfPeople?.type === "min" && <p className="text-red-500 text-sm">Minimum 1 person required</p>}
            {errors.numberOfPeople?.type === "max" && <p className="text-red-500 text-sm">Maximum 20 people allowed</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialMessage" className="text-gray-700 font-medium">
              Special Requests
            </Label>
            <Textarea
              id="specialMessage"
              placeholder="Any special requests or requirements?"
              className="min-h-[100px] border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white py-2 px-3"
              {...register("specialMessage")}
            />
          </div>

          <div className="flex justify-center my-6">
            <ReCAPTCHA
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              onChange={setRecaptchaValue}
              theme="light"
            />
          </div>

          <Button
            type="submit"
            className="w-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-[#6b0000] to-[#8a0000] hover:from-[#8a0000] hover:to-[#6b0000] text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              "Book Your Table"
            )}
          </Button>
        </form>

        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-4">
            <div className="h-px w-16 bg-gray-300"></div>
            <span className="text-2xl text-[#6b0000] font-script italic">Experience Authentic Indian Cuisine</span>
            <div className="h-px w-16 bg-gray-300"></div>
          </div>
          <p className="mt-4 text-gray-600 max-w-lg mx-auto">
            Join us at Stonewater for an unforgettable dining experience featuring the finest authentic Indian flavors
            in Perth.
          </p>
        </div>
      </div>

      <div className="hidden">
        Show Confirmation: {showConfirmation ? "Yes" : "No"}
        Booking Details: {bookingDetails ? "Set" : "Not Set"}
      </div>

      {showConfirmation && bookingDetails && (
        <BookingConfirmation
          isOpen={showConfirmation}
          onClose={handleConfirmationClose}
          bookingDetails={bookingDetails}
          ipRestricted={ipRestricted}
        />
      )}
    </div>
  )
}
