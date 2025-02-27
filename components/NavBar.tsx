"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function NavBar() {
  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-semibold text-lg flex items-center">
          <span className="text-primary">Pic</span>Snare
        </Link>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}