"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import BASEURL from "@/src/app/api/backend/dmc_api_gateway/baseurl"

export default function OTPVerificationPage() {
  const router = useRouter()
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""))
  const [activeInput, setActiveInput] = useState(0)
  const [timeLeft, setTimeLeft] = useState(59)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail")
    if (storedEmail) {
      setEmail(storedEmail)
    }
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d?$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      setActiveInput(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        setActiveInput(index - 1)
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits.")
      setIsLoading(false)
      return
    }

    try {
      // Gửi OTP và email đến API để kiểm tra
      const response = await fetch(`${BASEURL}/auth/verify_otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otpString }),
      })

      const data = await response.json()
      console.log("API data:", data)

      if (!response.ok || !data.success) {
        setError(data.message || "OTP verification failed.")
        setIsLoading(false)
        return
      }

      console.log("OTP valid, navigating...")
      sessionStorage.setItem("otpCode", otpString)
      sessionStorage.setItem("resetEmail", email)
      router.push("/client/forgot-password/reset-password")
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  const handleResend = async () => {
    setTimeLeft(59)
    setError("")
    try {
      const response = await fetch("/user/resend_otp_reset_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.message || "Failed to resend OTP.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between p-4 md:p-6">
        <Link href="/" className="flex items-center gap-2">
        </Link>
        <Link href="/log-in" className="text-[#4045ef] hover:text-[#2d336b] transition-colors">
          Log in
          <div className="text-[#2e3139] text-xl font-semibold">Techbot</div>
        </Link>
      </header>

      <main className="flex flex-col items-center justify-center px-4 mt-20">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f1f6ff] mb-6">
              <Mail className="w-6 h-6 text-[#4045ef]" />
            </div>
            <h1 className="text-2xl font-semibold text-[#2e3139] mb-2">OTP Verification</h1>
            <p className="text-[#425583] mb-8">
              Enter the 6-digit verification code sent to <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {Array(6)
                .fill(null)
                .map((_, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete="one-time-code"
                    aria-label={`OTP digit ${index + 1}`}
                    value={otp[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-12 text-center text-lg font-semibold border rounded-full text-black
                      ${index === activeInput ? "border-[#4045ef] ring-2 ring-[#4045ef]/20" : "border-[#a9b5df]"}
                      focus:outline-none focus:border-[#4045ef] focus:ring-2 focus:ring-[#4045ef]/20`}
                  />
                ))}
            </div>

            {error && <p className="text-center text-red-500">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-[#2D336B] hover:bg-[#2d336b]/90 text-white rounded-full py-2"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </form>

          <div className="text-center mt-4">
            {timeLeft > 0 ? (
              <p className="text-[#425583]">Resend OTP in {timeLeft}s</p>
            ) : (
              <button onClick={handleResend} className="text-[#4045ef] hover:text-[#2d336b] transition-colors">
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
