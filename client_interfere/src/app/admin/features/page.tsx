import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Upload, FileText, MessageSquare } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-800 tracking-tight animate-fade-in">
          TechBot
        </h1>
        <p className="mb-10 text-center text-gray-500 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed transition-all duration-500 hover:opacity-80 hover:text-gray-600">
          Your intelligent PDF assistant. Seamlessly upload, manage, and interact with your documents.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Upload PDF Card */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-w-0 group">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3 group-hover:bg-indigo-200 transition-colors duration-200">
                <Upload className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Upload PDF</h2>
            </div>
            <p className="text-gray-500 mb-6 text-sm flex-grow transition-opacity duration-300 group-hover:opacity-80">Upload PDF documents and start querying instantly.</p>
            <Link href="/admin/features/import">
              <Button className="w-full rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 text-sm py-2 group-hover:shadow-lg">
                Upload a PDF
              </Button>
            </Link>
          </div>

          {/* New Conversation Card */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-w-0 group">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3 group-hover:bg-indigo-200 transition-colors duration-200">
                <MessageSquare className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">New Conversation</h2>
            </div>
            <p className="text-gray-500 mb-6 text-sm flex-grow transition-opacity duration-300 group-hover:opacity-80">Start a new conversation with PDF assistant.</p>
            <Link href="/admin/features/conversation">
              <Button className="w-full rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 text-sm py-2 group-hover:shadow-lg">
                Start Conversation
              </Button>
            </Link>
          </div>

          {/* Track Progress Card */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-w-0 group">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3 group-hover:bg-indigo-200 transition-colors duration-200">
                <FileText className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Track Progress</h2>
            </div>
            <p className="text-gray-500 mb-6 text-sm flex-grow transition-opacity duration-300 group-hover:opacity-80">Monitor the processing status of your PDF documents.</p>
            <Link href="/admin/features/track-progress/tracking">
              <Button className="w-full rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 text-sm py-2 group-hover:shadow-lg">
                View Progress
              </Button>
            </Link>
          </div>

          {/* Device Management Card */}
          {/* <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-w-0 group">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3 group-hover:bg-indigo-200 transition-colors duration-200">
                <Settings className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Device Management</h2>
            </div>
            <p className="text-gray-500 mb-6 text-sm flex-grow transition-opacity duration-300 group-hover:opacity-80">Manage your connected devices and settings.</p>
            <Link href="/admin/features/device-management">
              <Button className="w-full rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 text-sm py-2 group-hover:shadow-lg">
                Manage Devices
              </Button>
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  )
}