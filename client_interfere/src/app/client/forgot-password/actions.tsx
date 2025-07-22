"use client"
import BASEURL from "@/src/app/api/backend/dmc_api_gateway/baseurl";

// Email submission action
export async function submitEmail(formData: FormData) {
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const email = formData.get("email")

    if (!email) {
      return { success: false, message: "Email is required" }
    }

    // Here you would typically:
    // 1. Validate the email format
    // 2. Check if the email exists in your database
    // 3. Generate and send an OTP code

    // Return success response
    return {
      success: true,
      message: "Verification code sent successfully",
      email: email,
    }
  } catch (error) {
    console.error("Error submitting email:", error)
    return {
      success: false,
      message: "Failed to send verification code. Please try again.",
    }
  }
}

// OTP verification action
export async function verifyOTP(formData: FormData) {
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const otp = formData.get("otp")

    if (!otp) {
      return { success: false, message: "OTP is required" }
    }

    // Here you would typically:
    // 1. Validate the OTP format
    // 2. Check if the OTP matches what was sent
    // 3. Check if the OTP is still valid (not expired)


    // Return success response
    return {
      success: true,
      message: "OTP verified successfully",
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return {
      success: false,
      message: "Failed to verify OTP. Please try again.",
    }
  }
}

// Reset password action
export async function resetPassword(formData: FormData) {
  const email = sessionStorage.getItem("resetEmail")
  const otp_code = sessionStorage.getItem("otpCode")
  const password = formData.get("password")

  if (!email || !otp_code || !password) {
    return { success: false, message: "Missing required information." }
  }

  try {
    const response = await fetch(`${BASEURL}/auth/reset_password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        otp_code,
        password,
      }),
    })
    const data = await response.json()
    if (response.ok) {
      return { success: true, message: data.message }
    } else {
      return { success: false, message: data.message || "Failed to reset password." }
    }
  } catch (err) {
    return { success: false, message: "An unexpected error occurred." }
  }
}