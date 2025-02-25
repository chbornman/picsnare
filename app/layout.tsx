import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "PicSnare",
  description: "Capture and share event moments",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-black`}>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <header className="w-full max-w-3xl text-center mb-8">
            <h1 className="text-4xl font-bold">PicSnare</h1>
            <p className="text-xl mt-2">Capture and share event moments</p>
          </header>
          <main className="w-full max-w-3xl">{children}</main>
        </div>
      </body>
    </html>
  )
}

