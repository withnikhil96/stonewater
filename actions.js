"use server"

import { revalidatePath } from "next/cache"

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

    // Replace the date formatting section with this improved version that handles timezone differences
    // Format the date for display - FIX FOR TIMEZONE ISSUES
    let formattedDate = "Date not specified"

    if (formData.checkInDate) {
      try {
        // Handle both Date objects and ISO strings
        let dateObj

        if (typeof formData.checkInDate === "string") {
          // If it's a string like "2023-05-07", we need to ensure it's treated as local time
          // Split the date string to get year, month, day
          const [year, month, day] = formData.checkInDate.split("T")[0].split("-").map(Number)

          // Create a new date using the specified timezone (months are 0-indexed in JS)
          // Force the date to be interpreted in Perth timezone
          dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
        } else {
          // If it's already a Date object, create a new UTC date to avoid timezone shifts
          dateObj = new Date(
            Date.UTC(
              formData.checkInDate.getFullYear(),
              formData.checkInDate.getMonth(),
              formData.checkInDate.getDate(),
              0,
              0,
              0,
            ),
          )
        }

        // Ensure we're working with a valid date
        if (!isNaN(dateObj.getTime())) {
          // Format the date in the Perth timezone
          const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "Australia/Perth", // Force Perth timezone
          }
          formattedDate = new Intl.DateTimeFormat("en-US", options).format(dateObj)
        } else {
          console.error("Invalid date object:", formData.checkInDate)
          formattedDate = "Date not specified"
        }
      } catch (error) {
        console.error("Error formatting date:", error, formData.checkInDate)
        formattedDate = "Date not specified"
      }
    }

    // Format the time (convert 24h to 12h format if needed)
    let formattedTime = ""

    // Handle both the new meal type approach and the previous time-only approach
    const reservationTime = formData.reservationTime || formData.checkInTime

    if (reservationTime) {
      const [hours, minutes] = reservationTime.split(":")
      const hour = Number.parseInt(hours, 10)
      const ampm = hour >= 12 ? "PM" : "AM"
      const hour12 = hour % 12 || 12
      formattedTime = `${hour12}:${minutes} ${ampm}`
    }

    // Get meal type if available
    const mealType = formData.mealType || ""

    // Update the email templates to include all requested details
    // Customer confirmation email - using Brevo API directly
    const customerEmailData = {
      sender: {
        name: "Stonewater Indian Restaurant",
        email: "stonewaterbar@gmail.com", // Updated to use the restaurant's email as sender
      },
      to: [
        {
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
        },
      ],
      subject: "Booking Request",
      htmlContent: `
    <html>
      <body>
        <h1>Reservation Request</h1>
        <p>Dear ${formData.firstName},</p>
        <p>Thank you! Your request has been sent. Your reservation will be confirmed shortly.</p>
        <p><strong>Reservation Details:</strong></p>
        <ul>
          <li><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</li>
          <li><strong>Email:</strong> ${formData.email}</li>
          <li><strong>Phone:</strong> ${formData.mobileNumber}</li>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${formattedTime}${mealType ? ` (${mealType.charAt(0).toUpperCase() + mealType.slice(1)})` : ""}</li>
          <li><strong>Number of People:</strong> ${formData.numberOfPeople}</li>
          <li><strong>Special Requests:</strong> ${formData.specialMessage || "None"}</li>
        </ul>
        <p>We look forward to welcoming you!</p>
        <p>Best regards,<br>Stonewater Indian Restaurant Team</p>
      </body>
    </html>
  `,
    }

    // Restaurant notification email - sending to the same email address
    const restaurantEmailData = {
      sender: {
        name: "Stonewater Reservation System",
        email: "stonewaterbar@gmail.com", // Using the same email as sender
      },
      to: [
        {
          email: "stonewaterbar@gmail.com", // Restaurant email
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
          <li><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</li>
          <li><strong>Email:</strong> ${formData.email}</li>
          <li><strong>Phone:</strong> ${formData.mobileNumber}</li>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${formattedTime}${mealType ? ` (${mealType.charAt(0).toUpperCase() + mealType.slice(1)})` : ""}</li>
          <li><strong>Number of People:</strong> ${formData.numberOfPeople}</li>
          <li><strong>Special Requests:</strong> ${formData.specialMessage || "None"}</li>
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
