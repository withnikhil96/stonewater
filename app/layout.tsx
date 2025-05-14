"use client"

import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { SessionProvider } from "next-auth/react"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster position="top-center" />
        </SessionProvider>
      </body>
    </html>
  )
} 