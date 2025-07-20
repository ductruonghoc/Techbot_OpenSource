"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/form/input"
import { useRouter } from "next/navigation"
import Pagination from "../../pagination"
import { Button } from "@/components/ui/button"
import CategoryFilter from "../../category-filter"
import BrandFilter from "../../brand-filter"

interface Device {
  id: string
  name: string
  category: string
  brand: string
}

export default function DeviceManagementPageNumber({ params }: { params: { page: string } }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [showBrandFilter, setShowBrandFilter] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)

  // Parse page number from params
  const pageNumber = Number.parseInt(params.page)

  // Validate page number and redirect if invalid
  useEffect(() => {
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 10) {
      router.push("/home/device-management")
    }
  }, [pageNumber, router])

  // Mock devices data based on page number
  const getDevicesForPage = (page: number): Device[] => {
    const baseDevices = [
      {
        id: `device-${page}-1`,
        name: "Galaxy S24 FE",
        category: "Smartphone",
        brand: "Samsung",
      },
      {
        id: `device-${page}-2`,
        name: "Sprint Samsung Galaxy S II Epic 4G Touch",
        category: "Smartphone",
        brand: "Samsung",
      },
      {
        id: `device-${page}-3`,
        name: "Webcam Logitech C270 720p HD",
        category: "Webcam",
        brand: "Logitech",
      },
      {
        id: `device-${page}-4`,
        name: "Nexaris Galaxy QuantumSync XQ-9000 UltraEdge HyperTouch",
        category: "Smartphone",
        brand: "NEXARIS",
      },
      {
        id: `device-${page}-5`,
        name: "Webcam Logitech C270 720p HD",
        category: "Webcam",
        brand: "Logitech",
      },
      {
        id: `device-${page}-6`,
        name: "Webcam Logitech C270 720p HD",
        category: "Webcam",
        brand: "Logitech",
      },
      {
        id: `device-${page}-7`,
        name: "Webcam Logitech C270 720p HD",
        category: "Webcam",
        brand: "Logitech",
      },
      {
        id: `device-${page}-8`,
        name: "Webcam Logitech C270 720p HD",
        category: "Webcam",
        brand: "Logitech",
      },
      {
        id: `device-${page}-9`,
        name: "Webcam Logitech C270 720p HD",
        category: "Webcam",
        brand: "Logitech",
      },
    ]

    // Add page number to device names to differentiate between pages
    return baseDevices.map((device) => ({
      ...device,
      name: page > 1 ? `Page ${page}: ${device.name}` : device.name,
    }))
  }

  const devices = getDevicesForPage(pageNumber)

  // Filter devices based on selected category and brand
  const filteredDevices = devices.filter((device) => {
    let matchesCategory = true
    let matchesBrand = true

    if (selectedCategory) {
      matchesCategory = device.category === selectedCategory
    }

    if (selectedBrand) {
      matchesBrand = device.brand === selectedBrand
    }

    return matchesCategory && matchesBrand
  })

  // Total number of pages
  const totalPages = 10

  const toggleCategoryFilter = () => {
    setShowCategoryFilter(!showCategoryFilter)
    if (showBrandFilter) setShowBrandFilter(false)
  }

  const toggleBrandFilter = () => {
    setShowBrandFilter(!showBrandFilter)
    if (showCategoryFilter) setShowCategoryFilter(false)
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
  }

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#2e3139]">Choose your device</h1>

        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            className="pl-9 pr-4 py-2 rounded-full border-gray-200 bg-[#f5f6fa]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex mb-6 gap-4">
        <Button
          variant="outline"
          className={`border-gray-200 rounded-md px-6 py-2 flex items-center justify-between w-52 ${
            showCategoryFilter ? "bg-[#2d336b] text-white" : "bg-gray-100 text-black"
          }`}
          onClick={toggleCategoryFilter}
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-layout-grid"
            >
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
            <span>Category</span>
          </div>
          {showCategoryFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          className={`border-gray-200 rounded-md px-6 py-2 flex items-center justify-between w-52 ${
            showBrandFilter ? "bg-[#2d336b] text-white" : "bg-gray-100 text-black"
          }`}
          onClick={toggleBrandFilter}
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-tag"
            >
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
              <path d="M7 7h.01" />
            </svg>
            <span>Brand</span>
          </div>
          {showBrandFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Category Filter */}
      {showCategoryFilter && (
        <div className="mb-6">
          <CategoryFilter onSelect={handleCategorySelect} onClose={() => setShowCategoryFilter(false)} />
        </div>
      )}

      {/* Brand Filter */}
      {showBrandFilter && (
        <div className="mb-6">
          <BrandFilter onSelect={handleBrandSelect} onClose={() => setShowBrandFilter(false)} />
        </div>
      )}

      {/* Device Table */}
      <div className="border border-gray-200 rounded-md overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-[#2d336b] text-white">
              <th className="text-left py-3 px-4 font-medium">Device</th>
              <th className="text-left py-3 px-4 font-medium">Category</th>
              <th className="text-left py-3 px-4 font-medium">Brand</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device, index) => (
              <tr
                key={device.id}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}
                onClick={() => router.push(`/home/device-management/device/${device.id}`)}
              >
                <td className="py-3 px-4 border-t border-gray-200">{device.name}</td>
                <td className="py-3 px-4 border-t border-gray-200">{device.category}</td>
                <td className="py-3 px-4 border-t border-gray-200">{device.brand}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination currentPage={pageNumber} totalPages={totalPages} />
    </div>
  )
}
