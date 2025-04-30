"use server"

import { revalidatePath } from "next/cache"
import { format } from "date-fns"

export async function submitReservation(formData) {
  try {
    // Simulate a delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if API key is available
    const apiKey = process.env.BREVO_API_KEY
    const mockEmails = process.env.MOCK_EMAILS === "true"

    if (!apiKey && !mockEmails) {
      console.error("BREVO_API_KEY environment variable is not defined")
      return {
        success: false,
        message: "Email service configuration error. Please contact the administrator.",
      }
    }

    // Format the date for display
    const date = new Date(formData.checkInDate)
    const formattedDate = format(date, "EEEE, MMMM d, yyyy")

    // Get the selected time and meal type
    const selectedTime = formData.reservationTime || formData.checkInTime || ""
    const mealType = formData.mealType || ""

    // Format the time (convert 24h to 12h format if needed)
    let formattedTime = selectedTime
    if (selectedTime && selectedTime.includes(":")) {
      try {
        const [hours, minutes] = selectedTime.split(":")
        const hour = Number.parseInt(hours, 10)
        const ampm = hour >= 12 ? "PM" : "AM"
        const hour12 = hour % 12 || 12
        formattedTime = `${hour12}:${minutes} ${ampm}`
      } catch (error) {
        console.error("Error formatting time:", error)
      }
    }

    // Customer confirmation email - using Brevo API directly
    const customerEmailData = {
      sender: {
        name: "Stonewater Indian Restaurant",
        email: "stonewaterbar@gmail.com",
      },
      to: [
        {
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
        },
      ],
      subject: "Your Reservation Confirmation",
      htmlContent: `
        <html>
          <body>
            <h1>Booking Request Received</h1>
            <p>Dear ${formData.firstName},</p>
            <p>We have received your booking request at Stonewater Indian Restaurant. We will review your request and send a confirmation email shortly.</p>
            <p><strong>Booking Details:</strong></p>
            <ul>
              <li>Name: ${formData.firstName} ${formData.lastName}</li>
              <li>Email: ${formData.email}</li>
              <li>Phone: ${formData.mobileNumber}</li>
              <li>Date: ${formattedDate}</li>
              <li>Time: ${formattedTime || "Not specified"}</li>
              ${mealType ? `<li>Meal: ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</li>` : ""}
              <li>Number of People: ${formData.numberOfPeople}</li>
              <li>Special Requests: ${formData.specialMessage || "None"}</li>
            </ul>
            <p>Please note that this is not a confirmation. You will receive a separate confirmation email once your booking has been reviewed.</p>
            <p>Best regards,<br>Stonewater Indian Restaurant Team</p>
          </body>
        </html>
      `,
    }

    // Restaurant notification email
    const restaurantEmailData = {
      sender: {
        name: "Stonewater Reservation System",
        email: "stonewaterbar@gmail.com",
      },
      to: [
        {
          email: "stonewaterbar@gmail.com",
          name: "Stonewater Restaurant",
        },
      ],
      subject: "New Reservation",
      htmlContent: `
        <html>
          <body>
            <h1>New Reservation</h1>
            <p><strong>Customer Details:</strong></p>
            <ul>
              <li>Name: ${formData.firstName} ${formData.lastName}</li>
              <li>Email: ${formData.email}</li>
              <li>Phone: ${formData.mobileNumber}</li>
              <li>Date: ${formattedDate}</li>
              <li>Time: ${formattedTime || "Not specified"}</li>
              ${mealType ? `<li>Meal: ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</li>` : ""}
              <li>Number of People: ${formData.numberOfPeople}</li>
              <li>Special Requests: ${formData.specialMessage || "None"}</li>
            </ul>
          </body>
        </html>
      `,
    }

    // For development/testing or when IP restrictions are in place
    if (mockEmails) {
      console.log("MOCK MODE: Emails would be sent to:", {
        customer: formData.email,
        restaurant: "stonewaterbar@gmail.com",
      })
      console.log("Customer email data:", customerEmailData)
      console.log("Restaurant email data:", restaurantEmailData)

      // Save reservation data to a database or file here if needed

      // Return success without actually sending emails
      return {
        success: true,
        message: "Reservation submitted successfully! (Email sending simulated in mock mode)",
      }
    }

    // Send emails using Brevo API directly
    const sendEmail = async (emailData) => {
      try {
        console.log("Sending email to:", emailData.to[0].email)

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
            Accept: "application/json",
          },
          body: JSON.stringify(emailData),
        })

        const responseText = await response.text()
        console.log("API Response status:", response.status)

        let responseData
        try {
          responseData = JSON.parse(responseText)
        } catch (e) {
          console.log("Raw response (not JSON):", responseText)
          responseData = { text: responseText }
        }

        if (!response.ok) {
          console.error("Email API error details:", responseData)

          // Check for IP restriction error
          if (responseText.includes("unrecognised IP address") || responseText.includes("authorised_ips")) {
            throw new Error("IP_RESTRICTION")
          }

          throw new Error(`Email sending failed: ${response.statusText}`)
        }

        return responseData
      } catch (error) {
        console.error("Error in sendEmail function:", error)
        throw error
      }
    }

    // Try to send both emails
    try {
      await Promise.all([sendEmail(customerEmailData), sendEmail(restaurantEmailData)])
    } catch (error) {
      console.error("Failed to send one or more emails:", error)

      // Handle IP restriction error specifically
      if (error.message === "IP_RESTRICTION") {
        console.log("IP restriction detected - switching to mock mode")

        // Save reservation data to a database or file here if needed

        return {
          success: true,
          message:
            "Reservation submitted successfully! (Note: Email delivery is currently unavailable due to security restrictions)",
          ipRestricted: true,
        }
      }

      throw error
    }

    revalidatePath("/")

    return {
      success: true,
      message: "Reservation submitted successfully!",
    }
  } catch (error) {
    console.error("Reservation submission error:", error)

    // Check if this is an IP restriction error
    if (error.message === "IP_RESTRICTION") {
      return {
        success: true, // Still mark as success for user experience
        message:
          "Reservation submitted successfully! (Note: Email delivery is currently unavailable due to security restrictions)",
        ipRestricted: true,
      }
    }

    return {
      success: false,
      message: "Due to some technical issue please try again. Thank you.",
    }
  }
}
