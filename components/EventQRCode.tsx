"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EventQRCode({ eventId }: { eventId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, `${window.location.origin}/event/${eventId}`, { width: 200 }, (error) => {
        if (error) console.error(error)
      })
    }
  }, [eventId])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Event QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  )
}

