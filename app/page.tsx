"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { Auth } from "@/components/Auth"
import { Dashboard } from "@/components/Dashboard"

export default function Home() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return <div className="w-full">{!session ? <Auth /> : <Dashboard user={session.user} />}</div>
}

