"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { submitEmail } from "../actions"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("email", email)

      const result = await submitEmail(formData)

      if (result.success) {
        // Store email in sessionStorage for later use
        sessionStorage.setItem("resetEmail", email)
        router.push("/client/forgot-password/verify")
      } else {
        setError(result.message || "Failed to send verification code")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between p-4 md:p-6">
        <Link href="/client" className="flex items-center gap-2">
          <div className="text-[#2e3139] text-xl font-semibold">QueryPDF</div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/client/log-in" className="text-[#4045ef] hover:text-[#2d336b] transition-colors">
            Log in
          </Link>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-4 mt-20">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f1f6ff] mb-6">
              <Lock className="w-6 h-6 text-[#4045ef]" />
            </div>
            <h1 className="text-2xl font-semibold text-[#2e3139] mb-2">Forgot Password?</h1>
            <p className="text-[#425583] mb-8">Enter your email to reset your password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-[#2e3139]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="domat@example.com"
                className="w-full rounded-full border border-[#a9b5df] px-4 py-2 focus:border-[#4045ef] focus:ring-2 focus:ring-[#4045ef]/20"
                required
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#2D336B] hover:bg-[#2d336b] text-white rounded-full py-6"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Submit"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
