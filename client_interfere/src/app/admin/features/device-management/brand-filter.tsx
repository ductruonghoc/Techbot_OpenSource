"use client"

import { useState } from "react"

interface BrandFilterProps {
  onSelect: (brand: string) => void
  onClose: () => void
}

export default function BrandFilter({ onSelect, onClose }: BrandFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Expanded alphabetically organized brands
  const brands = {
    A: ["Apple", "Acer", "Asus", "AMD", "Alienware", "AOC", "APC", "Aorus", "Avermedia", "Anker"],
    B: ["Bose", "Beats", "Brother", "BenQ", "Belkin", "BlackBerry", "Bosch", "Bang & Olufsen", "Buffalo"],
    C: ["Canon", "Corsair", "Cooler Master", "Cisco", "Crucial", "Creative", "Chromebook", "Compaq"],
    D: ["Dell", "DJI", "D-Link", "Dyson", "Drobo", "Ducky", "Dahua", "Denon"],
    E: ["Epson", "EVGA", "Eizo", "Elgato", "Element", "Ericsson", "EKWB", "Edifier"],
    F: ["Fujitsu", "Fitbit", "Fractal Design", "Fujifilm", "Fossil", "Foscam", "Filco"],
    G: ["Google", "Gigabyte", "Garmin", "GoPro", "Grado", "G.Skill", "Gateway", "Glorious"],
    H: ["HP", "Huawei", "HTC", "Hisense", "HyperX", "Harman Kardon", "Honeywell", "Hikvision"],
    I: ["Intel", "IBM", "iRobot", "Insta360", "Inwin", "Iiyama", "Incase", "Iomega"],
    J: ["JBL", "Jabra", "Jura", "JVC", "Juniper", "Jaybird", "Jamo"],
    K: ["Kingston", "Keychron", "Kensington", "Kyocera", "Klipsch", "Kodak", "Koss"],
    L: ["Lenovo", "LG", "Logitech", "Lexar", "Lian Li", "Leopold", "Linksys", "Leica"],
    M: ["Microsoft", "MSI", "Motorola", "Micron", "Marshall", "Miele", "Maxtor", "Monoprice"],
    N: ["NEXARIS", "Nokia", "Nikon", "Nintendo", "NZXT", "Netgear", "NEC", "Noctua"],
    O: ["OnePlus", "Olympus", "OPPO", "Oculus", "OWC", "Optoma", "Orico"],
    P: ["Philips", "Panasonic", "Plantronics", "PNY", "Patriot", "Polk Audio", "Pioneer", "Pentax"],
    Q: ["Qualcomm", "Qnap", "Quantum", "Quanta", "Qpad"],
    R: ["Razer", "Roku", "Raspberry Pi", "Roland", "Rosewill", "Ricoh", "Realtek", "Rode"],
    S: ["Samsung", "Sony", "Seagate", "SteelSeries", "Sennheiser", "Sharp", "Synology", "Sapphire"],
    T: ["Toshiba", "TP-Link", "Thermaltake", "TCL", "Thrustmaster", "Turtle Beach", "Tenda", "Tyan"],
    U: ["Ubiquiti", "Ultimate Ears", "Uniden", "Ugreen", "Urbanears", "Ultrasone"],
    V: ["Vizio", "ViewSonic", "Varmilo", "Vantec", "Verbatim", "Verizon", "Vivo", "Velodyne"],
    W: ["Western Digital", "Wacom", "Withings", "Wiko", "Westone", "Wyze", "Wharfedale"],
    X: ["Xiaomi", "XFX", "Xbox", "Xerox", "X-Rite", "XYZprinting"],
    Y: ["Yamaha", "Yubikey", "Yealink", "Yubico", "Yanmai", "Yeston"],
    Z: ["Zotac", "Zalman", "ZTE", "Zebra", "Zowie", "Zoom", "Zhiyun"],
  }

  // Filter brands based on search term
  const filteredBrands = Object.entries(brands).reduce(
    (acc, [letter, items]) => {
      const filteredItems = items.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()))
      if (filteredItems.length > 0) {
        acc[letter] = filteredItems
      }
      return acc
    },
    {} as Record<string, string[]>,
  )

  // Get all letters that have brands after filtering
  const letters = Object.keys(filteredBrands)

  // Group letters into columns (3 columns)
  const columns = [
    letters.slice(0, Math.ceil(letters.length / 3)),
    letters.slice(Math.ceil(letters.length / 3), Math.ceil(letters.length / 3) * 2),
    letters.slice(Math.ceil(letters.length / 3) * 2),
  ]

  return (
    <div className="border border-gray-200 rounded-[10px] overflow-hidden">
      <div className="p-3 border-b">
        <input
          type="text"
          placeholder="Search brands..."
          className="w-full px-3 py-2 border border-gray-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#4045ef]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <div className="grid grid-cols-3 gap-4 p-4">
          {columns.map((columnLetters, columnIndex) => (
            <div key={`column-${columnIndex}`} className="space-y-6">
              {columnLetters.map((letter) => (
                <div key={letter} className="space-y-2">
                  <h3 className="text-xl font-bold">{letter}</h3>
                  {filteredBrands[letter].map((brand) => (
                    <div
                      key={brand}
                      className="py-1 cursor-pointer hover:text-[#4045ef]"
                      onClick={() => {
                        onSelect(brand)
                        onClose()
                      }}
                    >
                      {brand}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
