"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, ChevronRight } from "lucide-react"
import Loader from "@/components/loader/loader"
import Link from "next/link"
import { useRouter } from "next/navigation"
import BASEURL from "@/src/app/api/backend/dmc_api_gateway/baseurl"

interface PageStatus {
  id: number
  status: "completed" | "error"
}

export default function FinishPage() {
  const [pages, setPages] = useState<PageStatus[]>([])
  const [loading, setLoading] = useState(true)
  const pdfId = sessionStorage.getItem("pdf_id")
  const router = useRouter()

  useEffect(() => {
    if (!pdfId) {
      setPages([])
      setLoading(false)
      return
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${BASEURL}/pdf_process/pdf_pages_embedding_status?pdf_id=${pdfId}`)
        const json = await res.json()

        if (json.status && json.data && Array.isArray(json.data.embedded_statuses)) {
          setPages(
            json.data.embedded_statuses.map((p: any) => ({
              id: p.page_number,
              status: p.done ? "completed" : "error",
            }))
          )
        } else {
          setPages([])
        }
      } catch (e) {
        setPages([])
      }
      setLoading(false)
    }
    fetchStatus()
  }, [pdfId])

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-50">
      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center max-w-3xl w-full">
          <div className="flex flex-col items-center flex-1">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-md">
              <Check className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-700">Device Info</span>
          </div>
          <div className="h-1 bg-indigo-600 flex-1 mx-2"></div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-md">
              <Check className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-700">Data Preprocessing</span>
          </div>
          <div className="h-1 bg-gray-300 flex-1 mx-2"></div>
          <div className="flex flex-col items-center flex-1">
            <div className={
              pages.length > 0 && pages.every(p => p.status === "completed")
                ? "w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-md"
                : "w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2"
            }>
              {pages.length > 0 && pages.every(p => p.status === "completed") ? (
                <Check className="w-5 h-5" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-500">Confirmation</span>
          </div>
        </div>
      </div>

      {/* Page List */}
      <div className="max-w-4xl mx-auto w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 text-white p-4 text-center text-lg font-semibold">Page Processing Results</div>
        <div className="max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50">
          {loading ? (
            <div className="flex justify-center items-center p-10">
              <Loader />
            </div>
          ) : pages.length === 0 ? (
            <div className="p-10 text-center text-gray-500 font-medium">No PDF selected or no page data.</div>
          ) : (
            pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center mr-4 ${
                      page.status === "completed" ? "bg-green-500" : "bg-red-500"
                    } shadow-sm`}
                  >
                    {page.status === "completed" ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <X className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-800">Page {page.id}</span>
                </div>
                <button
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    if (pdfId && page.id) {
                      sessionStorage.setItem("pdf_id", String(pdfId));
                      router.push(`/admin/features/import/pdfInformation?page_number=${page.id}`);
                    }
                  }}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Finish Button */}
      <div className="flex justify-center mt-8">
        <Link href="/admin/features">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-16 py-3 rounded-xl text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
            FINISH
          </Button>
        </Link>
      </div>
    </div>
  )
}