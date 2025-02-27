"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import EventUploader from "@/components/EventUploader";
import EventGallery, { EventGalleryRefType } from "@/components/EventGallery";
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
}

export default function EventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventUrl, setEventUrl] = useState("");
  const galleryRef = useRef<EventGalleryRefType>(null);

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

  const handleUploadSuccess = async (newPhotoUrls: string[]) => {
    // Use the ref to call refreshPhotos method
    if (galleryRef.current) {
      galleryRef.current.refreshPhotos();
    }
  };

  if (!event) return <div className="text-center">Loading...</div>;

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto px-4">
      {/* Event Details Card */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">{event.title}</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock size={16} />
            <span>
              Created {new Date(event.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Event Link</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-secondary rounded-md text-sm break-all">
                    {eventUrl}
                  </div>
                  <Button size="sm" variant="outline" onClick={copyToClipboard} className="w-full mt-2">
                    <Share2 className="h-4 w-4 mr-2" /> Copy Link
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold mb-3">QR Code</h3>
              <div className="bg-white p-3 rounded-md border">
                <EventQRCode eventId={eventId as string} />
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Scan to access this event
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <EventUploader
        eventId={eventId as string}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Gallery */}
      <EventGallery ref={galleryRef} eventId={eventId as string} />

      <Toaster />
    </div>
  );
}
