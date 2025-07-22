"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Menu,
  Upload,
  Plus,
  FileText,
  ChevronDown,
  LogOut,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import BASEURL from "../../api/backend/dmc_api_gateway/baseurl"
import Loader from "@/components/loader/loader"
import { useConversations } from "@/context/conversation"

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [activeConversationMenu, setActiveConversationMenu] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const { conversations, setConversations } = useConversations()

  const pathname = usePathname()
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const conversationMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const handleNewConversation = () => {
    router.push("/client/features/conversation")
  }

  const handleSignOut = () => {
    localStorage.removeItem("dmc_api_gateway_token");
    router.push("/client/log-in");
  };


  const handleDeleteConversation = (conversationId: string) => {
    setConversationToDelete(conversationId)
    setShowDeleteModal(true)
    setActiveConversationMenu(null)
  }

  const confirmDeleteConversation = () => {
    if (conversationToDelete) {
      setConversations(conversations.filter((conv: any) => conv.id !== conversationToDelete))
      setShowDeleteModal(false)
      setConversationToDelete(null)
      if (pathname.includes(`/client/features/conversation/chat/${conversationToDelete}`)) {
        router.push("/client/features/conversation")
      }
    }
  }

  const cancelDeleteConversation = () => {
    setShowDeleteModal(false)
    setConversationToDelete(null)
  }

  const toggleConversationMenu = (conversationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveConversationMenu(activeConversationMenu === conversationId ? null : conversationId)
  }

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  useEffect(() => {
    const checkAuthorization = async () => {
      const token = localStorage.getItem("dmc_api_gateway_token")
      if (!token) {
        setIsAuthorized(false)
        return
      }

      try {
        const response = await fetch(`${BASEURL}/auth/client_authorize`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
        }
      } catch (error) {
        console.error("Authorization check failed:", error)
        setIsAuthorized(false)
      }
    }

    checkAuthorization()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (
        activeConversationMenu &&
        !conversationMenuRefs.current[activeConversationMenu]?.contains(event.target as Node)
      ) {
        setActiveConversationMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeConversationMenu])

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem("dmc_api_gateway_token")
      if (!token) return

      try {
        const res = await fetch(`${BASEURL}/conversation/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const json = await res.json()
        if (json.status && json.data && Array.isArray(json.data.conversations)) {
          setConversations(
            json.data.conversations.map((conv: any) => ({
              id: conv.conversation_id,
              title: conv.conversation_title || "Untitled",
              lastMessage: "",
              timestamp: new Date(conv.conversation_updated_time),
              deviceName: conv.device_name,
            }))
          )
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error)
      }
    }
    fetchConversations()
  }, [setConversations])

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader />
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">403 - Forbidden</h1>
          <p className="mt-4 text-gray-600">You do not have permission to access this page.</p>
          <Button
            onClick={() => router.push("/client/log-in")}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#fff2f2] shadow-md transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-gray-200 transition-all duration-300 ease-in-out",
            sidebarOpen ? "justify-between px-4" : "justify-center px-2"
          )}
        >
          {sidebarOpen ? (
            <Link href="/client/features" className="flex items-center gap-3 transition-all duration-200 hover:scale-105 active:scale-95">
              <img src="/favicon.ico" alt="TechBot Icon" className="h-10 w-10" />
              <span className="text-2xl font-bold text-[#2d336b]">TechBot</span>
            </Link>
          ) : (
            <button
              onClick={handleMenuClick}
              className="flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 text-[#2d336b]" />
            </button>
          )}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 text-[#2d336b]" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className={cn("px-2", sidebarOpen ? "" : "flex justify-center")}>
            <button
              onClick={handleNewConversation}
              className={cn(
                "flex items-center gap-2 rounded-md bg-white shadow-sm hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95",
                sidebarOpen ? "w-full px-4 py-2 text-sm text-[#2d336b]" : "h-10 w-10 justify-center"
              )}
            >
              <Plus className="h-4 w-4" />
              {sidebarOpen && <span>New conversation</span>}
            </button>
          </div>

          <nav className={cn("mt-6", sidebarOpen ? "px-2" : "flex flex-col items-center")}>
            {/* <Link
              href="/client/features/import"
              className={cn(
                "flex items-center gap-3 rounded-md hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 relative",
                sidebarOpen ? "px-3 py-2 text-[#2d336b]" : "h-10 w-10 justify-center my-2",
                pathname.includes("/client/features/import")
                  ? "bg-white/20 before:absolute before:left-0 before:h-full before:w-1 before:bg-[#2d336b]"
                  : ""
              )}
            >
              <Upload className="h-5 w-5 text-[#2d336b]" />
              {sidebarOpen && <span>Upload PDF</span>}
            </Link> */}
            {/* <Link
              href="/client/features/track-progress/tracking"
              className={cn(
                "flex items-center gap-3 rounded-md hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 relative",
                sidebarOpen ? "px-3 py-2 text-[#2d336b]" : "h-10 w-10 justify-center my-2",
                pathname.includes("/client/features/track-progress")
                  ? "bg-white/20 before:absolute before:left-0 before:h-full before:w-1 before:bg-[#2d336b]"
                  : ""
              )}
            >
              <FileText className="h-5 w-5 text-[#2d336b]" />
              {sidebarOpen && <span>Track Progress</span>}
            </Link> */}
          </nav>

          {sidebarOpen && (
            <div className="mt-8 px-2">
              <h3 className="px-3 text-xs font-semibold uppercase text-[#2d336b] mb-3">Your conversations</h3>
              <div className="space-y-1">
                {conversations.map((conversation: any) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95",
                      pathname.includes(`/client/features/conversation/chat/${conversation.id}`)
                        ? "bg-white/20"
                        : ""
                    )}
                  >
                    <Link href={`/client/features/conversation/chat/${conversation.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className="font-medium text-sm truncate text-[#2d336b]">
                          {conversation.deviceName || "Untitled"}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-[#2d336b]/70 mt-1">
                        <span className="truncate">{conversation.title}</span>
                      </div>
                    </Link>
                    <div className="flex items-center">
                      <span className="text-xs text-[#2d336b]/70 mr-2">{formatRelativeTime(conversation.timestamp)}</span>
                      <div className="relative">
                        <button
                          onClick={() => handleDeleteConversation(conversation.id)}
                          className="text-[#2d336b] hover:text-red-600 p-1 transition-all duration-200 hover:scale-110 active:scale-90"
                          aria-label="Delete conversation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out h-full",
          sidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        <div className="h-16 bg-white flex items-center justify-end px-6 sticky top-0 z-40 border-b border-gray-200">
          <div className="flex items-center gap-2 relative" ref={userMenuRef}>
            <button
              onClick={toggleUserMenu}
              className="flex items-center gap-2 text-[#2d336b] hover:text-[#4045ef] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <span>Client</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 transition-all duration-200 hover:scale-110 active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-gray-700"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-white border border-gray-200 z-50 transition-all duration-200 transform scale-100 hover:scale-105">
                <div className="py-1">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left transition-all duration-200 hover:scale-105 active:scale-95">
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <main className="flex-1 overflow-auto bg-gray-50 p-4">{children}</main>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200 opacity-100">
          <div className="bg-white rounded-md shadow-lg p-6 w-full max-w-md transition-all duration-200 transform scale-100 hover:scale-105">
            <h2 className="text-lg font-medium mb-4 text-[#2e3139]">Delete Conversation</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteConversation}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteConversation}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}