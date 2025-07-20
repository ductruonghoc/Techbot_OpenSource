"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import zxcvbn from "zxcvbn"
import { resetPassword } from "../actions"

export default function SetNewPasswordPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordMatch, setPasswordMatch] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (password) {
      const result = zxcvbn(password)
      setPasswordStrength(result.score) // 0-4 (0: very weak, 4: very strong)
    } else {
      setPasswordStrength(0)
    }
  }, [password])

  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(password === confirmPassword)
    } else {
      setPasswordMatch(true) // Don't show error when confirm field is empty
    }
  }, [password, confirmPassword])

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
        return { label: "Too weak", color: "text-red-600" }
      case 1:
        return { label: "Weak", color: "text-orange-500" }
      case 2:
        return { label: "Fair", color: "text-yellow-500" }
      case 3:
        return { label: "Good", color: "text-green-500" }
      case 4:
        return { label: "Strong", color: "text-green-600" }
      default:
        return { label: "", color: "" }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Check if password is strong enough (score >= 2)
      if (passwordStrength < 2) {
        setError("Please choose a stronger password")
        setIsLoading(false)
        return
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setIsLoading(false)
        return
      }

      const formData = new FormData()
      formData.append("password", password)
      formData.append("confirmPassword", confirmPassword)

      const result = await resetPassword(formData)

      if (result.success) {
        router.push("/client/forgot-password/reset-success")
      } else {
        setError(result.message || "Failed to reset password")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const strengthInfo = getStrengthLabel(passwordStrength)

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between p-4 md:p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-[#2e3139] text-xl font-semibold">Techbot</div>
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
            <h1 className="text-2xl font-semibold text-[#2e3139] mb-2">Set New Password</h1>
            <p className="text-[#425583] mb-8">Enter your new password to complete the reset process</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm text-[#2e3139]">
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#425583]">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 py-2 w-full border-[#a9b5df] rounded-full focus:border-[#4045ef] focus:ring-2 focus:ring-[#4045ef]/20"
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

              {password && (
                <div className="flex items-center mt-1 text-sm">
                  <div className={`${strengthInfo.color} flex items-center gap-1`}>
                    {passwordStrength >= 2 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>Password strength: {strengthInfo.label}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm text-[#2e3139]">
                Confirm New Password
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
                  className={`pl-10 pr-10 py-2 w-full border-[#a9b5df] rounded-full focus:border-[#4045ef] focus:ring-2 focus:ring-[#4045ef]/20 ${
                    !passwordMatch && confirmPassword ? "border-red-500" : ""
                  }`}
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

              {!passwordMatch && confirmPassword && <p className="text-red-600 text-sm mt-1">Passwords do not match</p>}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-[#2D336B] hover:bg-[#2d336b]/90 text-white rounded-full py-6"
              disabled={!password || !confirmPassword || !passwordMatch || passwordStrength < 2 || isLoading}
            >
              {isLoading ? "Saving..." : "Save New Password"}
            </Button>
          </form>

          <div className="text-center text-[#425583]">
            Remember old password?{" "}
            <Link href="/sign-in" className="text-[#4045ef] hover:text-[#2d336b]">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
