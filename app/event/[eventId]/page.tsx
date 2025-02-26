"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import EventUploader from "@/components/EventUploader";
import EventGallery from "@/components/EventGallery";
import EventQRCode from "@/components/EventQRCode";
import { Toaster } from "@/components/ui/toaster";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Share2 } from "lucide-react";

// Define a proper type for the event
interface Event {
  id: string;
  title: string;
  created_at: string;
  // Add other properties your event has
}

export default function EventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventUrl, setEventUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setEventUrl(`${window.location.origin}/event/${eventId}`);
    }
  }, [eventId]);

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(eventUrl);
    // You could add a toast notification here
  };

  if (!event) return <div className="text-center">Loading...</div>;

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto">
      {/* Event Details Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock size={16} />
                <span>
                  Created {new Date(event.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Event Link</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="p-2 bg-secondary rounded-md text-sm break-all flex-grow">
                    {eventUrl}
                  </div>
                  <Button size="sm" variant="outline" onClick={copyToClipboard}>
                    <Share2 className="h-4 w-4 mr-2" /> Copy
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold mb-2">Event QR Code</h3>
              <div className="bg-white p-2 rounded-md">
                <EventQRCode eventId={eventId as string} />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Scan to access this event
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Add Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <EventUploader
            eventId={eventId as string}
            onUploadSuccess={() => {}}
          />
        </CardContent>
      </Card>

      {/* Gallery */}
      <EventGallery eventId={eventId as string} />

      <Toaster />
    </div>
  );
}
