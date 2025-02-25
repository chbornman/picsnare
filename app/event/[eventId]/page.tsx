"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/utils/supabase"
import EventUploader from "@/components/EventUploader"
import EventQRCode from "@/components/EventQRCode"
import EventGallery from "@/components/EventGallery"
import { Toaster } from "@/components/ui/toaster"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function EventPage() {
  const { eventId } = useParams()
  const [event, setEvent] = useState<any>(null)

  useEffect(() => {
    fetchEvent()
  }, [])

  const fetchEvent = async () => {
    const { data, error } = await supabase.from("events").select("*").eq("id", eventId).single()

    if (error) console.log("error", error)
    else setEvent(data)
  }

  if (!event) return <div className="text-center">Loading...</div>

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">{event.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-around items-center gap-8 mb-8">
          <EventUploader eventId={eventId as string} onUploadSuccess={() => {}} />
          <EventQRCode eventId={eventId as string} />
        </div>
        <EventGallery eventId={eventId as string} />
      </CardContent>
      <Toaster />
    </Card>
  )
}

