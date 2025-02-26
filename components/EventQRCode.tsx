"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

export default function EventQRCode({ eventId }: { eventId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, `${window.location.origin}/event/${eventId}`, { width: 200 }, (error) => {
        if (error) console.error(error)
      })
    }
  }, [eventId])

  return <canvas ref={canvasRef} />
}

