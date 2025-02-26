"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import EventUploader from "@/components/EventUploader";
import EventGallery from "@/components/EventGallery";
import { Toaster } from "@/components/ui/toaster";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Define a proper type for the event
interface Event {
  id: string;
  title: string;
  // Add other properties your event has
}

export default function EventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);

  // Use useCallback to memoize the fetchEvent function
  const fetchEvent = useCallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) console.log("error", error);
    else setEvent(data as Event);
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]); // Now fetchEvent is stable between renders

  if (!event) return <div className="text-center">Loading...</div>;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">{event.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <EventUploader eventId={eventId as string} onUploadSuccess={() => {}} />
        <EventGallery eventId={eventId as string} />
      </CardContent>
      <Toaster />
    </Card>
  );
}
