"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/form/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/form/select"
import { useRouter } from "next/navigation"
import BASEURL from "../../../../api/backend/dmc_api_gateway/baseurl"

interface PDFFile {
  id: string
  filename: string
  lastAccess: string
  progress: {
    current: number
    total: number
    status: "need-ocr" | "not-full-embeded" | "complete"
  }
  uploadAt: string
  device: {
    brand: string
    category: string
    model: string
  }
}

export default function TrackProgressPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([])
  const [loading, setLoading] = useState(false)
  const [brandFilter, setBrandFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [hasPrev, setHasPrev] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [page, setPage] = useState(1)
  const [allBrands, setAllBrands] = useState<string[]>([])
  const [allCategories, setAllCategories] = useState<string[]>([])

  useEffect(() => {
    const fetchPDFs = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append("offset", String(page))
        if (searchQuery) params.append("nameQuery", searchQuery)
        if (brandFilter) params.append("brand", brandFilter === "*" ? "" : brandFilter)
        if (categoryFilter) params.append("category", categoryFilter === "*" ? "" : categoryFilter)
        params.append("sort", "scoring")
        if (statusFilter === "in-progress") {
          params.append("min_scoring", "1")
          params.append("max_scoring", "2")
        } else if (statusFilter === "complete") {
          params.append("min_scoring", "3")
          params.append("max_scoring", "3")
        } else {
          params.append("min_scoring", "1")
          params.append("max_scoring", "3")
        }

        const res = await fetch(`${BASEURL}/pdf_process/list_pdfs_states?${params.toString()}`)
        const json = await res.json()
        if (json.status && json.data && Array.isArray(json.data.pdfs)) {
          const mapped: PDFFile[] = json.data.pdfs.map((item: any) => ({
            id: String(item.pdf_id),
            filename: item.pdf_label || `Device_${item.device_id}.pdf`,
            lastAccess: item.pdf_lastModified
              ? new Date(item.pdf_lastModified).toLocaleString()
              : "N/A",
            progress: {
              current: item.pdf_scoring || 0,
              total: 3,
              status:
                item.pdf_scoring === 1
                  ? "need-ocr"
                  : item.pdf_scoring === 2
                    ? "not-full-embeded"
                    : item.pdf_scoring === 3
                      ? "complete"
                      : "need-ocr",
            },
            uploadAt: item.pdf_lastModified
              ? new Date(item.pdf_lastModified).toLocaleString()
              : "N/A",
            device: {
              brand: item.brand || "Unknown",
              category: item.category || "Unknown",
              model: `Device ${item.device_id}`,
            },
          }))
          setPdfFiles(mapped)
          setHasPrev(!!json.data.prevPage)
          setHasNext(!!json.data.nextPage)
        } else {
          setPdfFiles([])
          setHasPrev(false)
          setHasNext(false)
        }
      } catch (e) {
        setPdfFiles([])
        setHasPrev(false)
        setHasNext(false)
      }
      setLoading(false)
    }
    fetchPDFs()
  }, [searchQuery, statusFilter, brandFilter, categoryFilter, page])

  useEffect(() => {
    const fetchBrandsAndTypes = async () => {
      try {
        const res = await fetch(`${BASEURL}/pdf_process/get_brands_and_device_types`)
        const json = await res.json()
        if (json.success && json.data) {
          setAllBrands((json.data.brands || []).map((b: any) => b.label))
          setAllCategories((json.data.deviceTypes || json.data.devices || []).map((d: any) => d.label))
        }
      } catch (e) {
        setAllBrands([])
        setAllCategories([])
      }
    }
    fetchBrandsAndTypes()
  }, [])

  const handleRowClick = (file: PDFFile) => {
    setSelectedFile(file)
  }

  const handleProcessPDF = () => {
    if (selectedFile && selectedFile.progress.current >= 2) {
      sessionStorage.setItem("pdf_id", selectedFile.id)
      router.push("/admin/features/track-progress/finish")
    } else if (selectedFile?.progress.current === 1) {
      sessionStorage.setItem("pdf_id", selectedFile.id)
      router.push("/admin/features/import?scoring=1")
    } else {
      alert("PDF must be at least OCR processed before importing information.")
    }
  }

  const handleCloseSidebar = () => {
    setSelectedFile(null)
  }

  return (
    <div className="flex min-h-screen font-sans antialiased" onClick={handleCloseSidebar}>
      <div 
        className={`flex-1 p-4 transition-all duration-300 ${selectedFile ? "mr-80" : ""}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-medium text-gray-800">PDF Progress</h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search PDFs"
                  className="pl-8 pr-3 py-1.5 w-64 rounded-md border border-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all bg-white shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-32 rounded-md border-gray-200 focus:ring-1 focus:ring-blue-500 text-sm bg-white shadow-sm">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent className="rounded-md bg-white shadow-lg">
                  <SelectItem value="*">All Brands</SelectItem>
                  {allBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32 rounded-md border-gray-200 focus:ring-1 focus:ring-blue-500 text-sm bg-white shadow-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-md bg-white shadow-lg">
                  <SelectItem value="*">All Categories</SelectItem>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 rounded-md border-gray-200 focus:ring-1 focus:ring-blue-500 text-sm bg-white shadow-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-md bg-white shadow-lg">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-blue-700">
                    <th className="px-4 py-3">Filename</th>
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pdfFiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500 text-sm">
                        No PDFs found
                      </td>
                    </tr>
                  ) : (
                    pdfFiles.map((file) => {
                      const barColor =
                        file.progress.status === "not-full-embeded"
                          ? "bg-amber-500"
                          : file.progress.status === "need-ocr"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      const percent = Math.round((file.progress.current / file.progress.total) * 100)

                      return (
                        <tr
                          key={file.id}
                          className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(file)
                          }}
                        >
                          <td className="px-4 py-3 text-sm text-gray-800">{file.filename}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{file.device.brand}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{file.device.category}</td>
                          <td className="px-4 py-3 w-36">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${barColor} transition-all duration-300`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                            {file.progress.status.replace("-", " ")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{file.lastAccess}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              disabled={!hasPrev || loading}
              onClick={(e) => {
                e.stopPropagation()
                setPage((p) => Math.max(1, p - 1))
              }}
              className="rounded-md border-gray-200 text-sm hover:bg-blue-100 transition-all"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!hasNext || loading}
              onClick={(e) => {
                e.stopPropagation()
                setPage((p) => p + 1)
              }}
              className="rounded-md border-gray-200 text-sm hover:bg-blue-100 transition-all"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {selectedFile && (
        <div 
          className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-100 shadow-lg z-50 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCloseSidebar()
              }}
              className="absolute left-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
            <h2 className="text-base font-medium text-gray-800 mb-4 mt-8">PDF Details</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Filename</label>
                <p className="text-sm text-gray-800 break-words">{selectedFile.filename}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Pages</label>
                  <p className="text-sm text-gray-800">{selectedFile.progress.total}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Progress</label>
                  <p className="text-sm text-gray-800">
                    {Math.round((selectedFile.progress.current / selectedFile.progress.total) * 100)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Uploaded</label>
                  <p className="text-sm text-gray-800">{selectedFile.uploadAt}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Last Accessed</label>
                  <p className="text-sm text-gray-800">{selectedFile.lastAccess}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-800 mb-2">Device Details</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Brand</label>
                    <p className="text-sm text-gray-800">{selectedFile.device.brand}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
                    <p className="text-sm text-gray-800">{selectedFile.device.category}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Model</label>
                    <p className="text-sm text-gray-800">{selectedFile.device.model}</p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleProcessPDF()
              }}
              className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 rounded-md font-medium transition-all"
            >
              Process PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}