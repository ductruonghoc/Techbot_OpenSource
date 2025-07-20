import React, { useEffect, useState } from "react"
import BASEURL from "@/src/app/api/backend/dmc_api_gateway/baseurl"
const MessageImageSlider = ({ images_ids }: { images_ids: number[] }) => {
  const [sliderIdx, setSliderIdx] = useState(0)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!images_ids || images_ids.length === 0) return
    const fetchSignedUrl = async () => {
      try {
        const res = await fetch(
          `${BASEURL}/pdf_process/get_img_signed_url?img_id=${images_ids[sliderIdx]}`
        )
        const json = await res.json()
        if (json.success) setSignedUrl(json.data.signed_url)
        else setSignedUrl(null)
      } catch {
        setSignedUrl(null)
      }
    }
    fetchSignedUrl()
  }, [sliderIdx, images_ids])

  if (!images_ids || images_ids.length === 0) return null

  return (
    <div className="mt-2 relative bg-gray-200 p-4 rounded-[10px]">
      <img
        src={signedUrl ? signedUrl : "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
        alt="Image"
        className="rounded-[10px] border border-white-300 max-w-full h-auto mx-auto"
      />
      <div className="flex justify-between items-center mt-2">
        <button
          onClick={() =>
            setSliderIdx((prev) =>
              prev > 0 ? prev - 1 : images_ids.length - 1
            )
          }
          className="text-[#2d336b] hover:text-[#4045ef]"
        >
          &lt;
        </button>
        <div className="flex space-x-1">
          {images_ids.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full ${sliderIdx === idx ? "bg-[#4045ef]" : "bg-gray-300"}`}
            />
          ))}
        </div>
        <button
          onClick={() =>
            setSliderIdx((prev) =>
              prev < images_ids.length - 1 ? prev + 1 : 0
            )
          }
          className="text-[#2d336b] hover:text-[#4045ef]"
        >
          &gt;
        </button>
      </div>
    </div>
  )
}

export default MessageImageSlider