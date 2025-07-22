import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Upload, FileText, MessageSquare } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Tech<span className="text-blue-600">Bot</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your intelligent PDF assistant. Seamlessly upload, manage, and interact with your documents.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Upload PDF Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                  <Upload className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload PDF</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Upload PDF and start querying with our assistant.
                </p>
                <Link href="/admin/features/import" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-6 font-medium transition-all duration-300 hover:shadow-lg">
                    Upload a PDF
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* New Conversation Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                  <MessageSquare className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">New Conversation</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Start a new conversation with our intelligent PDF assistant.
                </p>
                <Link href="/admin/features/conversation" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-6 font-medium transition-all duration-300 hover:shadow-lg">
                    Start Conversation
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Track Progress Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                  <FileText className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Track Progress</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Monitor the processing status of PDF in real-time.
                </p>
                <Link href="/admin/features/track-progress/tracking" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-6 font-medium transition-all duration-300 hover:shadow-lg">
                    View Progress
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
