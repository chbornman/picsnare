"use client";

import { useState, useEffect } from "react";
import { CreateEvent } from "@/components/CreateEvent";
import { supabase } from "@/utils/supabase";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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


  if (!supabaseInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full space-y-8">
      <header className="w-full text-center mb-8">
        <h1 className="text-4xl font-bold">PicSnare</h1>
        <p className="text-xl mt-2">Capture and share event moments</p>
      </header>
    
      <div className="w-full max-w-md mx-auto">
        <CreateEvent />
      </div>

      <div className="w-full">
        <h2 className="text-2xl font-bold mb-4">Recent Events</h2>
        <div className="grid gap-4">
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground">No events created yet</p>
          ) : (
            events.map((event) => (
              <Link href={`/event/${event.id}`} key={event.id} className="block group">
                <Card className="hover:bg-accent/40 dark:hover:bg-accent/20 transition-all cursor-pointer border-2 border-transparent hover:border-primary/10 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">{event.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
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