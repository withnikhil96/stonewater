"use client"

import { useState } from "react"
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

export default function ReservationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState(null)
  const [recaptchaValue, setRecaptchaValue] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [bookingDetails, setBookingDetails] = useState(null)
  const [ipRestricted, setIpRestricted] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm()

  const onSubmit = async (data) => {
    if (!recaptchaValue) {
      toast.error("Please complete the reCAPTCHA verification")
      return
    }

    if (!date) {
      toast.error("Please select a reservation date")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = {
        ...data,
        checkInDate: date,
        recaptchaToken: recaptchaValue,
      }

      // For debugging
      console.log("Submitting reservation with data:", formData)

      const result = await submitReservation(formData)

      if (result.success) {
        // Check if there was an IP restriction
        if (result.ipRestricted) {
          setIpRestricted(true)
          toast.success(result.message, { duration: 6000 })
        } else {
          toast.success("Reservation submitted successfully! A confirmation email has been sent to your email address.")
        }

        // Create booking details object
        const details = {
          name: `${data.firstName} ${data.lastName}`,
          date: date,
          people: data.numberOfPeople,
          email: data.email,
          phone: data.mobileNumber,
        }

        console.log("Setting booking details:", details)

        // Set booking details and show confirmation
        setBookingDetails(details)
        setShowConfirmation(true)

        // Reset form
        reset()
        setDate(null)
        setRecaptchaValue(null)
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

  // Function to handle dialog close
  const handleConfirmationClose = () => {
    console.log("Closing confirmation dialog")
    setShowConfirmation(false)
  }

  // Function to handle date selection
  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate)
    setCalendarOpen(false)
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
                  "border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white",
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
                  "border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white",
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
                  "border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white",
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
                  "border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white",
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
                      "w-full justify-start text-left font-normal border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
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
                    <CustomCalendar onSelectDate={handleDateSelect} selectedDate={date} />
                  </div>
                </PopoverContent>
              </Popover>
              {!date && errors.checkInDate && <p className="text-red-500 text-sm">Reservation date is required</p>}
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
                  "border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white",
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
              {errors.numberOfPeople?.type === "min" && (
                <p className="text-red-500 text-sm">Minimum 1 person required</p>
              )}
              {errors.numberOfPeople?.type === "max" && (
                <p className="text-red-500 text-sm">Maximum 20 people allowed</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialMessage" className="text-gray-700 font-medium">
              Special Requests
            </Label>
            <Textarea
              id="specialMessage"
              placeholder="Any special requests or requirements?"
              className="min-h-[100px] border-gray-300 focus:border-[#6b0000] focus:ring-[#6b0000] bg-white"
              {...register("specialMessage")}
            />
          </div>

          <div className="flex justify-center my-6">
            <ReCAPTCHA
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // This is a test key, replace with your actual key
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

      {/* Debug information */}
      <div className="hidden">
        Show Confirmation: {showConfirmation ? "Yes" : "No"}
        Booking Details: {bookingDetails ? "Set" : "Not Set"}
      </div>

      {/* Ensure the dialog is rendered conditionally */}
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
