"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

interface Event {
  id: string;
  title: string;
  created_at: string;
}

interface User {
  id: string;
  // Add other user properties you need
}

export function Dashboard({ user }: { user: User }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.log("error", error);
      else setEvents(data || []);
    };

    fetchEvents();
  }, []);

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("events")
      .insert([{ title: newEventTitle, user_id: user.id }]);

    if (error) console.log("error", error);
    else {
      setNewEventTitle("");
      // Fetch events again to update the list
      const { data, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) console.log("error", fetchError);
      else setEvents(data || []);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Events</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={createEvent} className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="New event title"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" className="flex-shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Event
          </Button>
        </form>
        {events.length === 0 ? (
          <p className="text-center text-gray-500">
            You haven&apos;t created any events yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="border rounded-md p-3 hover:bg-gray-50 transition-colors"
              >
                <Link
                  href={`/event/${event.id}`}
                  className="flex justify-between items-center"
                >
                  <span className="font-medium">{event.title}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  );
}
