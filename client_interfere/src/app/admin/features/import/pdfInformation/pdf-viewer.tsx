"use client"

import { useState, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "@/node_modules/react-pdf/dist/esm/Page/AnnotationLayer.css"
import "@/node_modules/react-pdf/dist/esm/Page/TextLayer.css"

// Set workerSrc for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`

interface PDFViewerProps {
  pdfUrl: string
  currentPage: number
  onLoadSuccess: (data: { numPages: number }) => void
}

export default function PDFViewer({ pdfUrl, currentPage, onLoadSuccess }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  // Mock PDF with 10 pages
  const totalPages = 10

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
      onLoadSuccess({ numPages: totalPages })
    }, 1000)

    return () => clearTimeout(timer)
  }, [onLoadSuccess, totalPages])

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
    onLoadSuccess({ numPages })
  }

  const handleLoadError = (err: any) => {
    setError("Failed to load PDF file.")
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#4045ef] border-t-transparent rounded-full mx-auto mb-4"></div>
          <div>Loading PDF viewer...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Failed to load PDF file.</p>
        <p className="text-sm">Please make sure the file is a valid PDF document.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
      <div
        className="bg-white shadow-md border border-gray-200 rounded-lg max-w-2xl w-full h-full overflow-y-auto"
        style={{ maxHeight: "55vh" }}
      >
        {/* Mock PDF Page */}
        <Document
          file={pdfUrl}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin h-8 w-8 border-4 border-[#4045ef] border-t-transparent rounded-full mx-auto mb-4"></div>
              <div>Loading PDF...</div>
            </div>
          }
          error={
            <div className="text-center text-red-500 p-4">
              <p>Failed to load PDF file.</p>
              <p className="text-sm">Please make sure the file is a valid PDF document.</p>
            </div>
          }
        >
          <Page pageNumber={currentPage} width={600} />
        </Document> 
        <div className="text-center text-xs text-gray-400 mt-6 pt-4 border-t border-gray-200">
          Page {currentPage} of {numPages}
        </div>
      </div>
    </div>
  )
}
