import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

export default function PasswordResetSuccessPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between p-4 md:p-6">
        <Link href="/client" className="flex items-center gap-2">
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
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#17a31a] mb-6">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[#2e3139] mb-2">
              Your Password
              <br />
              Successfully Changed
            </h1>
            <p className="text-[#425583] mb-8">Sign in to your account with your new password</p>
          </div>
          <Link href="/client/log-in">
            <Button className="w-full bg-[#2D336B] hover:bg-[#2d336b]/90 text-white rounded-full py-6">Sign in</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
