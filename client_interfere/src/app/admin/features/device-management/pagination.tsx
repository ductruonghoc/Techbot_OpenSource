"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const pageNumbers = []

    // First page
    pageNumbers.push(1)

    // If we're not on the first few pages, add ellipsis
    if (currentPage > 3) {
      pageNumbers.push("...")
    }

    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i !== 1 && i !== totalPages) {
        pageNumbers.push(i)
      }
    }

    // If we're not on the last few pages, add ellipsis
    if (currentPage < totalPages - 2) {
      pageNumbers.push("...")
    }

    // Last page
    if (totalPages > 1) {
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  return (
    <div className="flex justify-center items-center mt-6 mb-4">
      <Link
        href={currentPage > 1 ? `/home/device-management/page/${currentPage - 1}` : "#"}
        className={`w-8 h-8 flex items-center justify-center rounded-[10px] border border-gray-300 mr-2 ${
          currentPage === 1 ? "opacity-50 pointer-events-none bg-gray-100" : "bg-white hover:bg-gray-100"
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4 text-[#2e3139]" />
      </Link>

      {getPaginationNumbers().map((number, index) =>
        number === "..." ? (
          <span key={`ellipsis-${index}`} className="mx-1 text-[#2e3139]">
            ...
          </span>
        ) : (
          <Link
            key={`page-${number}`}
            href={`/home/device-management/page/${number}`}
            className={`w-8 h-8 flex items-center justify-center rounded-[10px] mx-1 ${
              currentPage === number
                ? "bg-[#4045ef] text-white"
                : "border border-gray-300 hover:bg-gray-100 bg-white text-[#2e3139]"
            }`}
          >
            {number}
          </Link>
        ),
      )}

      <Link
        href={currentPage < totalPages ? `/home/device-management/page/${currentPage + 1}` : "#"}
        className={`w-8 h-8 flex items-center justify-center rounded-[10px] border border-gray-300 ml-2 ${
          currentPage === totalPages ? "opacity-50 pointer-events-none bg-gray-100" : "bg-white hover:bg-gray-100"
        }`}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4 text-[#2e3139]" />
      </Link>
    </div>
  )
}
