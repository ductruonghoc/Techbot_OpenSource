"use client"

import type React from "react"
import Link from "next/link"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Lock, UserIcon, Eye, EyeOff } from "lucide-react"
import zxcvbn from "zxcvbn"
import BASEURL from "../../api/backend/dmc_api_gateway/baseurl"

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("")
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState("")

  const passwordStrength = zxcvbn(password)
  const passwordScore = passwordStrength.score

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordErrorMessage("")
    setConfirmPasswordErrorMessage("")

    if (passwordScore < 3) {
      setPasswordErrorMessage(
        passwordStrength.feedback.suggestions.join(" ") || "Password is too weak!"
      )
      return
    }

    if (password !== confirmPassword) {
      setConfirmPasswordErrorMessage("Confirm password does not match!")
      return
    }

    const form = e.currentTarget
    const emailInput = form.elements.namedItem("email") as HTMLInputElement
    const email = emailInput?.value

    try {
      const response = await fetch(`${BASEURL}/auth/unverified_register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`Registration failed: ${errorData.message || response.statusText}`)
        return
      }

      localStorage.setItem("pendingEmail", email)
      router.push("/client/sign-up/verify")
    } catch (error) {
      alert("Something went wrong during registration.")
      console.error(error)
    }
  }

  const strengthColors = [
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-500",
    "bg-green-700",
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 md:p-6">
        <Link href="/client" className="flex items-center gap-2">
          <div className="text-[#2e3139] text-xl font-semibold">DMC</div>
        </Link>
        <Link href="/client/log-in" className="text-[#4045ef] hover:text-[#2d336b] transition-colors">
          Log in
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Sign Up</h1>
            <p className="text-gray-600 mt-2">Let's create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10 rounded-full border-2 border-gray-300 w-full placeholder:text-gray-300 py-[22px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  className="pl-10 rounded-full border-2 border-gray-300 w-full placeholder:text-gray-300 py-[22px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-[#2e3139]">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#425583]">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pl-10 pr-10 py-2 w-full border-[#a9b5df] focus:border-[#4045ef] focus:ring-2 focus:ring-[#4045ef]/20 rounded-full text-black placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#425583]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Strength Meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${strengthColors[passwordScore]}`}
                      style={{ width: `${(passwordScore + 1) * 20}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {passwordStrength.feedback.suggestions.join(" ") || "Looking good!"}
                  </div>
                </div>
              )}

              {passwordErrorMessage && (
                <div className="text-sm text-red-600">{passwordErrorMessage}</div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm text-[#2e3139]">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#425583]">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10 py-2 w-full border-[#a9b5df] focus:border-[#4045ef] focus:ring-2 focus:ring-[#4045ef]/20 rounded-full text-black placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#425583]"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPasswordErrorMessage && (
                <div className="text-sm text-red-600">{confirmPasswordErrorMessage}</div>
              )}
            </div>

            <Button type="submit" className="w-full bg-[#2e3470] text-white hover:bg-[#232759] rounded-full py-[22px]">
              Submit
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}