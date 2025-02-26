"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EventQRCode from "./EventQRCode";

interface EventDetailsProps {
  event: {
    id: string;
    title: string;
  };
}

export function EventDetails({ event }: EventDetailsProps) {
  const [eventUrl, setEventUrl] = useState("");

  useEffect(() => {
    setEventUrl(`${window.location.origin}/event/${event.id}`);
  }, [event.id]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(eventUrl);
    alert("Event link copied to clipboard!");
  };

  const goToEventLink = () => {
    window.open(eventUrl, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Event Link:</h3>
          <p className="text-sm break-all">{eventUrl}</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={copyToClipboard}>Copy Link</Button>
            <Button onClick={goToEventLink}>Go to Link</Button>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Event QR Code:</h3>
          <EventQRCode eventId={event.id} />
        </div>
      </CardContent>
    </Card>
  );
}
