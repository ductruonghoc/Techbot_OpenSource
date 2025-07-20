"use client"

import { FileText, Calendar, Clock, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface PDFDetailProps {
  pdfDetail: {
    filename: string
    pages: number
    finished: string
    uploadAt: string
    lastAccess: string
    device: {
      brand: string
      type: string
      model: string
    }
  }
}

export default function PDFDetail({ pdfDetail }: PDFDetailProps) {
  const router = useRouter()

  const handleProcessPDF = () => {
    router.push("/home/track-progress/finish")
  }

  return (
    <div className="w-72 bg-white rounded-[10px] border border-gray-200 overflow-hidden shadow-sm flex flex-col">
      <div className="p-3 bg-[#4045ef] text-white rounded-t-[10px]">
        <h2 className="text-sm font-medium text-center uppercase tracking-wide">PDF Detail</h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
        {/* Filename section */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <FileText className="h-4 w-4 text-[#4045ef] mr-2" />
            <h3 className="text-xs font-semibold uppercase text-gray-500">Filename</h3>
          </div>
          <p className="text-xs font-medium text-[#2e3139] pl-6 break-words">{pdfDetail.filename}</p>
        </div>

        {/* Key metrics in a grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#f9f9f9] p-3 rounded-[10px]">
            <p className="text-xs text-gray-500 mb-1">Pages</p>
            <p className="text-sm font-semibold">{pdfDetail.pages}</p>
          </div>

          <div className="bg-[#f9f9f9] p-3 rounded-[10px]">
            <p className="text-xs text-gray-500 mb-1">Finished</p>
            <p className="text-sm font-semibold text-green-600">{pdfDetail.finished}</p>
          </div>

          <div className="bg-[#f9f9f9] p-3 rounded-[10px] flex items-start">
            <Calendar className="h-3.5 w-3.5 text-[#4045ef] mt-0.5 mr-1" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Upload at</p>
              <p className="text-xs font-medium">{pdfDetail.uploadAt}</p>
            </div>
          </div>

          <div className="bg-[#f9f9f9] p-3 rounded-[10px] flex items-start">
            <Clock className="h-3.5 w-3.5 text-[#4045ef] mt-0.5 mr-1" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Last access</p>
              <p className="text-xs font-medium">{pdfDetail.lastAccess}</p>
            </div>
          </div>
        </div>

        {/* Device details */}
        <div className="bg-[#f1f6ff] p-4 rounded-[10px] mb-4">
          <div className="flex items-center mb-3">
            <Laptop className="h-4 w-4 text-[#4045ef] mr-2" />
            <h3 className="text-xs font-semibold uppercase text-[#4045ef]">Device detail</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white p-2 rounded-[10px]">
              <p className="text-xs text-gray-500 mb-1">Brand</p>
              <p className="text-xs font-medium">{pdfDetail.device.brand}</p>
            </div>

            <div className="bg-white p-2 rounded-[10px]">
              <p className="text-xs text-gray-500 mb-1">Type</p>
              <p className="text-xs font-medium">{pdfDetail.device.type}</p>
            </div>

            <div className="bg-white p-2 rounded-[10px]">
              <p className="text-xs text-gray-500 mb-1">Model</p>
              <p className="text-xs font-medium">{pdfDetail.device.model}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 mt-auto">
        <Button
          className="w-full bg-[#4045ef] hover:bg-[#2d336b] text-white rounded-[10px] py-2 text-sm font-medium transition-colors"
          onClick={handleProcessPDF}
        >
          Process PDF
        </Button>
      </div>
    </div>
  )
}
