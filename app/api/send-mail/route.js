import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request) {
  try {
    const data = await request.json()
    const { name, email, subject, content, templateId, params } = data

    // Check if we have the required environment variables
    const emailUser = process.env.EMAIL_USER || "stonewaterbar@gmail.com"
    const emailPassword = process.env.EMAIL_PASSWORD

    // If no password is set, return a specific error
    if (!emailPassword) {
      console.error("EMAIL_PASSWORD environment variable is not defined")
      // If MOCK_EMAILS is true, log this but continue
      if (process.env.MOCK_EMAILS === "true") {
        console.log(
          "Running in mock mode, would have sent emails to:",
          email,
          "and",
          process.env.NOTIFICATION_EMAIL || "stonewaterbar@gmail.com",
        )
        return NextResponse.json({ success: true, mock: true })
      }
      return NextResponse.json(
        {
          success: false,
          message: "Email service not configured. Please set EMAIL_PASSWORD or enable MOCK_EMAILS mode.",
        },
        { status: 500 },
      )
    }

    // Format time to 12-hour format if it exists
    let formattedTime = ""
    if (params?.TIME) {
      try {
        const [hours, minutes] = params.TIME.split(":")
        const hour = Number.parseInt(hours, 10)
        const ampm = hour >= 12 ? "PM" : "AM"
        const hour12 = hour % 12 || 12
        formattedTime = `${hour12}:${minutes} ${ampm}`
      } catch (error) {
        console.error("Error formatting time:", error)
        formattedTime = params.TIME
      }
    }

    // Add meal type descriptor if available
    let mealTypeText = ""
    if (params?.MEAL_TYPE) {
      mealTypeText = params.MEAL_TYPE.charAt(0).toUpperCase() + params.MEAL_TYPE.slice(1)
    }

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    })

    // Update the email templates to include all requested details
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Stonewater Restaurant" <${emailUser}>`,
      to: email,
      replyTo: emailUser,
      subject: subject || "Reservation Confirmation - Stonewater Restaurant",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #6b0000;">Booking Details</h2>
      <p>Dear ${params?.FIRSTNAME || name},</p>
      <p>Thank you! Your request has been sent. Your reservation will be confirmed shortly.</p>
      <p><strong>Reservation Details:</strong></p>
      <ul style="list-style-type: none; padding-left: 0;">
        <li><strong>Name:</strong> ${params?.NAME || name}</li>
        <li><strong>Email:</strong> ${params?.EMAIL || email}</li>
        <li><strong>Phone:</strong> ${params?.PHONE || "Not provided"}</li>
        <li><strong>Date:</strong> ${params?.DATE || "As requested"}</li>
        <li><strong>Time:</strong> ${formattedTime || "As requested"}${params?.MEAL_TYPE ? ` (${params.MEAL_TYPE.charAt(0).toUpperCase() + params.MEAL_TYPE.slice(1)})` : ""}</li>
        <li><strong>Party Size:</strong> ${params?.PEOPLE || "As specified"}</li>
        <li><strong>Special Requests:</strong> ${params?.MESSAGE || "None"}</li>
      </ul>
      <p>If you need to make any changes to your reservation, please contact us at +61 8 6111 4627.</p>
      <p>We look forward to serving you!</p>
      <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        Stonewater Indian Restaurant<br />
        G4&5 893 Canning Highway Mount Pleasant<br />
        Phone: +61 8 6111 4627
      </p>
    </div>
  `,
    }

    // Also send a notification to the restaurant
    const restaurantNotification = {
      from: process.env.EMAIL_FROM || `"Stonewater Website" <${emailUser}>`,
      to: process.env.NOTIFICATION_EMAIL || emailUser,
      subject: "New Reservation Received",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6b0000;">New Reservation</h2>
      <p><strong>Reservation Details:</strong></p>
      <ul>
        <li><strong>Name:</strong> ${params?.NAME || name || "Not provided"}</li>
        <li><strong>Email:</strong> ${params?.EMAIL || email || "Not provided"}</li>
        <li><strong>Phone:</strong> ${params?.PHONE || "Not provided"}</li>
        <li><strong>Date:</strong> ${params?.DATE || "Not specified"}</li>
        <li><strong>Time:</strong> ${formattedTime || "Not specified"}${params?.MEAL_TYPE ? ` (${params.MEAL_TYPE.charAt(0).toUpperCase() + params.MEAL_TYPE.slice(1)})` : ""}</li>
        <li><strong>Party Size:</strong> ${params?.PEOPLE || "Not specified"}</li>
        <li><strong>Special Requests:</strong> ${params?.MESSAGE || "None"}</li>
      </ul>
    </div>
  `,
    }

    // Send mail
    await transporter.sendMail(mailOptions)

    await transporter.sendMail(restaurantNotification)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json({ success: false, message: "Failed to send email" }, { status: 500 })
  }
}
