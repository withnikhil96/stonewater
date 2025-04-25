import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request) {
  try {
    const data = await request.json()
    const { name, email, subject, content, templateId, params } = data

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || "stonewaterbar@gmail.com",
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Setup email data
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Stonewater Restaurant" <stonewaterbar@gmail.com>',
      to: email, 
      replyTo: "stonewaterbar@gmail.com",
      subject: subject || "Reservation Confirmation - Stonewater Restaurant",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #6b0000;">Reservation Confirmation</h2>
          <p>Dear ${params?.FIRSTNAME || name},</p>
          <p>Thank you for your reservation at Stonewater Indian Restaurant.</p>
          <p><strong>Reservation Details:</strong></p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>Date:</strong> ${params?.DATE || "As requested"}</li>
            <li><strong>Party Size:</strong> ${params?.PEOPLE || "As specified"}</li>
            <li><strong>Name:</strong> ${params?.NAME || name}</li>
            <li><strong>Contact:</strong> ${params?.EMAIL || email}</li>
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

    // Send mail
    await transporter.sendMail(mailOptions)

    // Also send a notification to the restaurant
    const restaurantNotification = {
      from: process.env.EMAIL_FROM || '"Stonewater Website" <stonewaterbar@gmail.com>',
      to: process.env.NOTIFICATION_EMAIL || "stonewaterbar@gmail.com",
      subject: "New Reservation Received",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6b0000;">New Reservation</h2>
          <p><strong>Reservation Details:</strong></p>
          <ul>
            <li><strong>Date:</strong> ${params?.DATE || "Not specified"}</li>
            <li><strong>Party Size:</strong> ${params?.PEOPLE || "Not specified"}</li>
            <li><strong>Name:</strong> ${params?.NAME || name || "Not provided"}</li>
            <li><strong>Email:</strong> ${params?.EMAIL || email || "Not provided"}</li>
            <li><strong>Phone:</strong> ${params?.PHONE || "Not provided"}</li>
          </ul>
          ${params?.MESSAGE ? `<p><strong>Special Requests:</strong> ${params.MESSAGE}</p>` : ""}
        </div>
      `,
    }

    await transporter.sendMail(restaurantNotification)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json({ success: false, message: "Failed to send email" }, { status: 500 })
  }
}
