"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Mail, HelpCircle, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/form/select"
import { Input } from "@/components/form/input"
import { useRouter, useSearchParams } from "next/navigation"
import { toast, ToastContainer } from "react-toastify"
import BASEURL from "@/src/app/api/backend/dmc_api_gateway/baseurl"
import "react-toastify/dist/ReactToastify.css"
import LoaderWithTimer from "@/components/loader/loaderWithTimer"

export default function ImportPDFPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [pdfName, setPdfName] = useState("")
  const [deviceName, setDeviceName] = useState("")
  const [showOCRButton, setShowOCRButton] = useState(false)
  const [deviceBrand, setDeviceBrand] = useState<number | null>(null)
  const [deviceType, setDeviceType] = useState<number | null>(null)
  const [showAddBrandModal, setShowAddBrandModal] = useState(false)
  const [showAddTypeModal, setShowAddTypeModal] = useState(false)
  const [brands, setBrands] = useState<{ id: number; label: string }[]>([])
  const [deviceTypes, setDeviceTypes] = useState<{ id: number; label: string }[]>([])
  const [newBrandName, setNewBrandName] = useState("")
  const [newTypeName, setNewTypeName] = useState("")
  const [isAgentExtracting, setIsAgentExtracting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const checkAgentStatus = useCallback(() => {
    let interval: NodeJS.Timeout | null = null
    const fetchAgentStatus = async () => {
      try {
        const response = await fetch(`${BASEURL}/pdf_process/agent_is_extracting_status`, { method: "GET" })
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setIsAgentExtracting(result.agent_is_extracting)
            if (!result.agent_is_extracting && interval) clearInterval(interval)
          } else {
            toast.error(result.message || "Failed to fetch agent status")
          }
        } else {
          toast.error("Failed to fetch agent status")
        }
      } catch (error) {
        console.error("Error fetching agent status:", error)
        toast.error("An error occurred while checking agent status")
      }
    }
    interval = setInterval(fetchAgentStatus, 5000)
    fetchAgentStatus()
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [setIsAgentExtracting])

  useEffect(() => {
    const fetchBrandsAndDeviceTypes = async () => {
      try {
        const response = await fetch(`${BASEURL}/pdf_process/get_brands_and_device_types`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setBrands(result.data.brands)
            setDeviceTypes(result.data.deviceTypes)
          } else {
            toast.error(result.message || "Failed to fetch data")
          }
        } else {
          toast.error("Failed to fetch brands and device types")
        }
      } catch (error) {
        console.error("Error fetching brands and device types:", error)
        toast.error("An error occurred while fetching data")
      }
    }
    fetchBrandsAndDeviceTypes()
  }, [setBrands, setDeviceTypes])

  useEffect(() => {
    if (showOCRButton) checkAgentStatus()
  }, [setIsAgentExtracting, showOCRButton, checkAgentStatus])

  useEffect(() => {
    const scoring = searchParams.get("scoring")
    if (scoring === "1") {
      const pdfId = sessionStorage.getItem("pdf_id")
      if (pdfId) {
        setStep(2)
        setShowOCRButton(true)
      } else {
        setStep(1)
      }
    } else {
      setStep(1)
    }
  }, [searchParams])

  const handleNextStep = async () => {
    if (!deviceName.trim() || !deviceBrand || !deviceType) {
      toast.error("Please fill in all required device information")
      return
    }
    try {
      const response = await fetch(
        `${BASEURL}/pdf_process/new_device?label=${encodeURIComponent(deviceName)}&brand_id=${deviceBrand}&device_type_id=${deviceType}`
      )
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          sessionStorage.setItem("device_id", String(result.data.device_id))
          sessionStorage.removeItem("pdf_id")
          setStep(2)
          toast.success("Device information saved. Please upload PDF file.")
        } else {
          toast.error(result.message || "Failed to insert device")
        }
      } else {
        toast.error("Failed to insert device")
      }
    } catch (error) {
      console.error("Error inserting device:", error)
      toast.error("An error occurred while inserting the device")
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type === "application/pdf") {
        setSelectedFile(file)
        setPdfName(file.name.replace(/\.pdf$/, ""))
      } else {
        toast.error("Please upload a PDF file")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type === "application/pdf") {
        setSelectedFile(file)
        setPdfName(file.name.replace(/\.pdf$/, ""))
      } else {
        toast.error("Please upload a PDF file")
      }
    }
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("No file selected for upload")
      return
    }
    setIsUploading(true)
    try {
      const deviceId = sessionStorage.getItem("device_id")
      if (!deviceId) {
        toast.error("Device ID not found in session storage")
        setIsUploading(false)
        return
      }
      const response = await fetch(`${BASEURL}/pdf_process/pdf_upload?device_id=${deviceId}&pdf_name=${encodeURIComponent(pdfName)}`, {
        method: "GET",
      })
      if (!response.ok) {
        toast.error("Failed to fetch signed URL for PDF upload")
        setIsUploading(false)
        return
      }
      const result = await response.json()
      if (!result.success) {
        toast.error(result.message || "Failed to generate signed URL")
        setIsUploading(false)
        return
      }
      const { pdf_id, signed_url } = result.data
      const uploadResponse = await fetch(signed_url, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: selectedFile,
      })
      if (!uploadResponse.ok) {
        toast.error("Failed to upload PDF to GCS")
        setIsUploading(false)
        return
      }
      sessionStorage.setItem("pdf_id", String(pdf_id))
      toast.success("PDF uploaded successfully!")
      setIsUploading(false)
      setShowOCRButton(true)
    } catch (error) {
      console.error("Error during PDF upload:", error)
      toast.error("An error occurred while uploading the PDF")
      setIsUploading(false)
    }
  }

  const handleOCR = async () => {
    setIsProcessingOCR(true)
    const timeout = 60 * 60 * 1000
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
      const pdfId = sessionStorage.getItem("pdf_id")
      if (!pdfId) {
        toast.error("PDF ID not found in session storage")
        setIsProcessingOCR(false)
        clearTimeout(id)
        return
      }
      const response = await fetch(`${BASEURL}/pdf_process/extract_pdf?pdf_id=${pdfId}`, {
        method: "GET",
        signal: controller.signal,
      })
      if (!response.ok) {
        toast.error("Failed to process OCR")
        setIsProcessingOCR(false)
        checkAgentStatus()
        return
      }
      const result = await response.json()
      if (!result.success) {
        toast.error(result.message || "OCR processing failed")
        setIsProcessingOCR(false)
        return
      }
      toast.success("PDF extraction and database update successful!")
      router.push("/admin/features/import/pdfInformation")
    } catch (error) {
      console.error("Error during OCR processing:", error)
      toast.error("An error occurred while processing OCR")
      setIsProcessingOCR(false)
    }
  }

  const handleAddBrand = () => {
    if (newBrandName.trim()) {
      toast.success(`Brand "${newBrandName}" added successfully`)
      setShowAddBrandModal(false)
      setNewBrandName("")
    } else {
      toast.error("Brand name cannot be empty")
    }
  }

  const handleAddType = () => {
    if (newTypeName.trim()) {
      toast.success(`Device type "${newTypeName}" added successfully`)
      setShowAddTypeModal(false)
      setNewTypeName("")
    } else {
      toast.error("Device type cannot be empty")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-start p-4">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover theme="light" />

      {/* Progress Steps */}
      <div className="flex justify-center w-full max-w-2xl my-6">
        <div className="flex items-center w-full gap-4">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${step >= 1 ? "bg-indigo-600 text-white" : "border-2 border-gray-300 text-gray-400"}`}>
              {step > 1 ? "✓" : "1"}
            </div>
            <span className={`mt-2 text-sm font-medium ${step >= 1 ? "text-gray-900" : "text-gray-500"}`}>Device Info</span>
          </div>
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? "bg-indigo-600" : "bg-gray-200"}`}></div>
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${step >= 2 ? "bg-indigo-600 text-white" : "border-2 border-gray-300 text-gray-400"}`}>
              {step > 2 ? "✓" : "2"}
            </div>
            <span className={`mt-2 text-sm font-medium ${step >= 2 ? "text-gray-900" : "text-gray-500"}`}>PDF Upload</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        {step === 1 ? (
          <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Device Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Brand <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <Select onValueChange={(value) => setDeviceBrand(Number(value))} value={deviceBrand?.toString() || ""}>
                    <SelectTrigger className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200">
                      <SelectValue placeholder="Select brand..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()} className="hover:bg-indigo-50">
                          {brand.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setShowAddBrandModal(true)}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Type <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <Select onValueChange={(value) => setDeviceType(Number(value))} value={deviceType?.toString() || ""}>
                    <SelectTrigger className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                      {deviceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()} className="hover:bg-indigo-50">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setShowAddTypeModal(true)}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </Button>
                </div>
                <div className="flex items-center mt-2 text-xs text-indigo-600">
                  <HelpCircle className="w-4 h-4 mr-1" />
                  <span>Select or add a type</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g., ThinkPad T570"
                    className="w-full pl-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
                <div className="flex items-center mt-2 text-xs text-indigo-600">
                  <HelpCircle className="w-4 h-4 mr-1" />
                  <span>Enter a unique device name</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleNextStep}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 text-base font-medium transition-all duration-200"
            >
              Continue to PDF Upload
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-7 w-7"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <path d="M9  veder13h6" />
                      <path d="M9 17h3" />
                    </svg>
                  </div>
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                    <Upload className="h-3 w-3" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Upload Device Manual</h2>
              <p className="text-sm text-gray-600 mt-1">Upload PDF for {deviceName}</p>
            </div>
            {!showOCRButton && (
              <div>
                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mb-6 cursor-pointer rounded-lg border-2 border-dashed p-8 transition-all duration-200 ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"}`}
                    onClick={handleUploadClick}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                    <div className="text-center">
                      <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-sm font-medium text-gray-700">Drag and drop PDF or click to browse</p>
                      <p className="text-xs text-gray-500 mt-1">PDF up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 space-y-4">
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 flex items-center">
                      <svg className="h-7 w-7 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="pdfName" className="block text-sm font-medium text-gray-700 mb-2">
                        PDF Name (Optional)
                      </label>
                      <Input
                        type="text"
                        id="pdfName"
                        value={pdfName}
                        onChange={(e) => setPdfName(e.target.value)}
                        placeholder="Enter custom PDF name"
                        className="w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                      <p className="mt-2 text-xs text-gray-500">Default: {selectedFile.name}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!showOCRButton && (
              <div className="flex gap-4">
                <Button
                  onClick={selectedFile ? handleUpload : handleUploadClick}
                  className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-3 text-base font-medium text-white transition-all duration-200"
                  disabled={isUploading}
                >
                  {isUploading ? "Processing..." : selectedFile ? "Process PDF" : "Select PDF"}
                </Button>
              </div>
            )}

            {showOCRButton && (
              <div className="mt-6">
                {isProcessingOCR ? (
                  <div className="flex justify-center">
                    <LoaderWithTimer />
                  </div>
                ) : (
                  <Button
                    onClick={handleOCR}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 text-base font-medium transition-all duration-200"
                    disabled={isAgentExtracting}
                  >
                    {isAgentExtracting ? "Agent is Extracting..." : "Run OCR"}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddBrandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transition-all duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Brand</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
              <Input
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Enter brand name"
                className="w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowAddBrandModal(false)
                  setNewBrandName("")
                  toast.info("Action cancelled")
                }}
                variant="outline"
                className="rounded-lg border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBrand}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
              >
                Add Brand
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transition-all duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Device Type</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Type Name</label>
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Enter device type"
                className="w-full rounded-lg border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowAddTypeModal(false)
                  setNewTypeName("")
                  toast.info("Action cancelled")
                }}
                variant="outline"
                className="rounded-lg border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddType}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
              >
                Add Type
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}