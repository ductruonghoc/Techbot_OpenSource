"use client"

import { useState } from "react"

interface CategoryFilterProps {
  onSelect: (category: string) => void
  onClose: () => void
}

export default function CategoryFilter({ onSelect, onClose }: CategoryFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Expanded alphabetically organized categories
  const categories = {
    A: ["Accessories", "Audio Equipment", "Adapters", "All-in-One PC", "Amplifiers"],
    B: ["Bluetooth Devices", "Batteries", "Biometric Devices", "Barcode Scanners", "Business Laptops"],
    C: ["Cameras", "Computers", "Cables", "CPUs", "Cooling Systems", "Chargers"],
    D: ["Displays", "Desktop PCs", "Digital Cameras", "Docking Stations", "Data Storage"],
    E: ["External Drives", "Earphones", "E-readers", "Ethernet Adapters"],
    F: ["Fans", "Fingerprint Readers", "Flash Drives", "Firewire Devices"],
    G: ["Gaming Laptops", "Graphics Cards", "GPS Devices", "Gaming Accessories"],
    H: ["Hard Drives", "Headphones", "HDMI Devices", "Home Theater Systems"],
    I: ["Input Devices", "IoT Devices", "Internal Components", "Inkjet Printers"],
    J: ["Joysticks", "Jacks", "Junction Boxes"],
    K: ["Keyboards", "Kits", "KVM Switches"],
    L: ["Laptops", "LED Monitors", "Laser Printers", "LAN Equipment"],
    M: ["Monitors", "Mice", "Memory Cards", "Microphones", "Mobile Devices"],
    N: ["Network Equipment", "NAS Devices", "Notebooks", "Netbooks"],
    O: ["Optical Drives", "Office Equipment", "OLED Displays"],
    P: ["Printers", "Projectors", "Power Supplies", "Peripherals", "Portable Drives"],
    Q: ["QHD Monitors", "Quick Charge Devices"],
    R: ["Routers", "RAM", "Remote Controls", "Rugged Devices"],
    S: ["Smartphones", "Speakers", "Scanners", "Storage Devices", "Servers"],
    T: ["Tablets", "TVs", "Touchscreens", "Trackpads", "Thermal Printers"],
    U: ["USB Devices", "UPS Systems", "Ultra HD Displays"],
    V: ["VR Headsets", "Video Cards", "Voice Recorders", "Vacuum Cleaners"],
    W: ["Webcams", "Wireless Devices", "Workstations", "Wearables"],
    X: ["XLR Equipment", "Xbox Accessories"],
    Y: ["Yoga Laptops", "Y-Adapters"],
    Z: ["Zoom Lenses", "ZIF Sockets"],
  }

  // Filter categories based on search term
  const filteredCategories = Object.entries(categories).reduce(
    (acc, [letter, items]) => {
      const filteredItems = items.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()))
      if (filteredItems.length > 0) {
        acc[letter] = filteredItems
      }
      return acc
    },
    {} as Record<string, string[]>,
  )

  // Get all letters that have categories after filtering
  const letters = Object.keys(filteredCategories)

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
          placeholder="Search categories..."
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
                  {filteredCategories[letter].map((category) => (
                    <div
                      key={category}
                      className="py-1 cursor-pointer hover:text-[#4045ef]"
                      onClick={() => {
                        onSelect(category)
                        onClose()
                      }}
                    >
                      {category}
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
