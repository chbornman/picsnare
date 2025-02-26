"use client";

import { useState, useEffect } from "react";
import { CreateEvent } from "@/components/CreateEvent";
import { EventDetails } from "@/components/EventDetails";
import { supabase } from "@/utils/supabase";
import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  const [createdEvent, setCreatedEvent] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [supabaseInitialized, setSupabaseInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        // Use underscore to indicate intentionally unused variable
        const { error } = await supabase
          .from("events")
          .select("count")
          .limit(1);
        if (error) throw error;
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

    testSupabaseConnection();
  }, [toast]);

  if (!supabaseInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {!createdEvent ? (
        <CreateEvent onEventCreated={setCreatedEvent} />
      ) : (
        <EventDetails event={createdEvent} />
      )}
    </div>
  );
}
