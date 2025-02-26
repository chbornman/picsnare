"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface CreateEventProps {
  onEventCreated: (event: { id: string; title: string }) => void
}

export function CreateEvent({ onEventCreated }: CreateEventProps) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Attempting to create event with title:", title)

      const { data, error } = await supabase.from("events").insert([{ title }]).select().single()

      if (error) {
        throw error
      }

      if (data) {
        console.log("Event created successfully:", data)
        onEventCreated({ id: data.id, title: data.title })
        toast({
          title: "Success",
          description: "Event created successfully!",
        })
      }
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: `Failed to create event: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Event</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter event title"
            required
            className="mb-4"
            minLength={3}
            maxLength={100}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

