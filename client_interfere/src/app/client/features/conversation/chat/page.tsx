"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

interface Note {
  id: string
  title: string
  content: string
}

export default function ChatPage() {
  const router = useRouter()

  // Add a useEffect to redirect to the dynamic route
  useEffect(() => {
    // Redirect to the dynamic route
    router.push("/client/features/conversation/chat/new-conversation")
  }, [router])

  // Return a loading state while redirecting
  return <div className="flex items-center justify-center h-full">Redirecting...</div>
}
