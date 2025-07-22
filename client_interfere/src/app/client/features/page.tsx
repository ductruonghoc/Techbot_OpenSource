import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Tech<span className="text-blue-600">Bot</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your intelligent PDF assistant. Seamlessly upload, manage, and interact with your documents.
          </p>
        </div>

        {/* Feature Card - Centered */}
        <div className="flex justify-center">
          <div className="w-full max-w-lg">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="flex items-center space-x-6">
                  {/* Icon Section */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                      <MessageSquare className="h-7 w-7 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">New Conversation</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
                      Start a new conversation with our intelligent PDF assistant.
                    </p>
                    <Link href="/client/features/conversation" className="inline-block">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-6 font-medium transition-all duration-300 hover:shadow-lg">
                        Start Conversation
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
