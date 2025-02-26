"use client";

import { useState, useEffect } from "react";
import { CreateEvent } from "@/components/CreateEvent";
import { supabase } from "@/utils/supabase";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  created_at: string;
}

export default function Home() {
  const [supabaseInitialized, setSupabaseInitialized] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setEvents(data as Event[]);
        setSupabaseInitialized(true);
      } catch (error) {
        console.error("Supabase initialization error:", error);
        toast({
          title: "Error",
          description:
            "Failed to connect to the database. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchEvents();
  }, [toast]);

  const handleDelete = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!supabaseInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="w-full max-w-md mx-auto">
        <CreateEvent />
      </div>

      <div className="w-full">
        <h2 className="text-2xl font-bold mb-4">Recent Events</h2>
        <div className="grid gap-4">
          {events.length === 0 ? (
            <p className="text-center text-gray-500">No events created yet</p>
          ) : (
            events.map((event) => (
              <Link href={`/event/${event.id}`} key={event.id}>
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, event.id)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-500" />
                    </button>
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
