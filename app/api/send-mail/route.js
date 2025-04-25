import { NextResponse } from "next/server"
import SibApiV3Sdk from "sib-api-v3-sdk"

export async function POST(request) {
  try {
    const data = await request.json()

    // Initialize the Brevo SDK
    const defaultClient = SibApiV3Sdk.ApiClient.instance
    const apiKey = defaultClient.authentications["api-key"]
    apiKey.apiKey = process.env.BREVO_API_KEY

    if (!apiKey.apiKey) {
      console.error("BREVO_API_KEY is not defined")
      return NextResponse.json({ success: false, message: "Email service configuration error" }, { status: 500 })
    }

    // Send email using Brevo
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
    await apiInstance.sendTransacEmail(data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json({ success: false, message: "Failed to send email" }, { status: 500 })
  }
}
