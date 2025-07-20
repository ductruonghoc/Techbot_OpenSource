import React, { useRef, useEffect, useState } from "react"
import BASEURL from "@/src/app/api/backend/dmc_api_gateway/baseurl"

interface LazyImageProps {
  imgId: number
  alt: string
  className?: string
}

const LazyImage: React.FC<LazyImageProps> = ({ imgId, alt, className }) => {
  const [src, setSrc] = useState<string | null>(null)
  const ref = useRef<HTMLImageElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let observer: IntersectionObserver
    if (ref.current) {
      observer = new window.IntersectionObserver(
        async ([entry]) => {
          if (entry.isIntersecting && !src) {
            try {
              const res = await fetch(`${BASEURL}/pdf_process/get_img_signed_url?img_id=${imgId}`)
              const json = await res.json()
              if (json.success) {
                setSrc(json.data.signed_url)
              }
            } catch (e) {
              // Optionally handle error
            } finally {
              setLoading(false)
            }
            observer.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(ref.current)
    }
    return () => observer && observer.disconnect()
    // eslint-disable-next-line
  }, [imgId])

  return (
    <img
      ref={ref}
      src={src || "/placeholder.svg"}
      alt={alt}
      className={className}
      style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.3s" }}
      onLoad={() => setLoading(false)}
    />
  )
}

export default LazyImage