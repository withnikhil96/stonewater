"use client"

import Image from "next/image"
import Link from "next/link"
import { Facebook, Instagram, MapPin, Phone, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="w-full relative z-[100]">
      {/* Top bar */}
      <div className="bg-[#6b0000] text-white py-2 relative z-[100]">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm px-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-0 mb-2 md:mb-0">
            <div className="flex items-center">
              <MapPin size={16} className="mr-1 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">G4&5 893 Canning Highway Mount Pleasant</span>
            </div>
            <span className="hidden md:block mx-4">|</span>
            <div className="flex items-center">
              <Phone size={16} className="mr-1 flex-shrink-0" />
              <span className="text-xs sm:text-sm">+61 8 6111 4627</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="mr-3 text-xs sm:text-sm font-semibold">LICENSED</span>
            <div className="flex space-x-3">
              <Link 
                href="https://www.facebook.com/stonewater.restaurant" 
                target="_blank" 
                className="hover:text-gray-200 flex items-center justify-center w-6 h-6 bg-white bg-opacity-10 rounded-full"
              >
                <Facebook size={14} />
              </Link>
              <Link 
                href="https://www.instagram.com/stonewater_restaurant/"
                target="_blank"
                className="hover:text-gray-200 flex items-center justify-center w-6 h-6 bg-white bg-opacity-10 rounded-full"
              >
                <Instagram size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation with background image */}
      <div className="relative h-44 z-[90]">
        {/* Background image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/cocktails-background.webp"
            alt="Restaurant background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Navigation content */}
        <div className="container mx-auto px-4 relative z-[95] h-full">
          {/* Mobile menu button */}
          <div className="md:hidden absolute right-4 top-4 z-[120]">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white p-2 rounded-md"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex justify-between items-center h-full">
            <nav className="flex items-center space-x-6 lg:space-x-12">
              <Link href="https://stonewaterristorante.au/" className="text-white text-lg lg:text-xl font-medium hover:text-gray-200">
                HOME
              </Link>
              <div className="relative group">
                <Link href="#" className="text-white text-lg lg:text-xl font-medium hover:text-gray-200 flex items-center">
                  ABOUT US
                  <span className="ml-1">▼</span>
                </Link>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[110] hidden group-hover:block">
                  <Link href="https://stonewaterristorante.au/about-us/our-chef/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Our Chef
                  </Link>
                </div>
              </div>
              <Link href="https://stonewaterristorante.au/services/" className="text-white text-lg lg:text-xl font-medium hover:text-gray-200">
                SERVICES
              </Link>
            </nav>

            <nav className="flex items-center space-x-6 lg:space-x-12">
              <div className="relative group">
                <Link href="#" className="text-white text-lg lg:text-xl font-medium hover:text-gray-200 flex items-center">
                  MENU
                  <span className="ml-1">▼</span>
                </Link>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[110] hidden group-hover:block">
                  <Link href="https://stonewaterristorante.au/restaurant/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Menu
                  </Link>
                  <Link href="https://stonewaterristorante.au/bar/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Bar
                  </Link>
                </div>
              </div>
              <Link href="https://stonewaterristorante.au/gallery/" className="text-white text-lg lg:text-xl font-medium hover:text-gray-200">
                GALLERY
              </Link>
              <Link
                href="https://stonewaterristorante.au/parking/"
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-md font-medium transition-colors text-base lg:text-lg whitespace-nowrap"
              >
                Find Parking
              </Link>
            </nav>
          </div>

          {/* Mobile navigation menu */}
          <div className={`md:hidden fixed inset-0 bg-black bg-opacity-90 z-[110] transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="pt-20 px-6">
              <div className="flex flex-col space-y-4">
                <Link 
                  href="https://stonewaterristorante.au/" 
                  className="text-white text-xl font-medium py-2 border-b border-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  HOME
                </Link>
                
                <div className="py-2 border-b border-gray-700">
                  <div className="text-white text-xl font-medium mb-2">ABOUT US</div>
                  <Link 
                    href="https://stonewaterristorante.au/about-us/our-chef/" 
                    className="block pl-4 text-gray-300 hover:text-white py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Our Chef
                  </Link>
                </div>
                
                <Link 
                  href="https://stonewaterristorante.au/services/" 
                  className="text-white text-xl font-medium py-2 border-b border-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  SERVICES
                </Link>
                
                <div className="py-2 border-b border-gray-700">
                  <div className="text-white text-xl font-medium mb-2">MENU</div>
                  <Link 
                    href="https://stonewaterristorante.au/restaurant/" 
                    className="block pl-4 text-gray-300 hover:text-white py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Menu
                  </Link>
                  <Link 
                    href="https://stonewaterristorante.au/bar/" 
                    className="block pl-4 text-gray-300 hover:text-white py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Bar
                  </Link>
                </div>
                
                <Link 
                  href="https://stonewaterristorante.au/gallery/" 
                  className="text-white text-xl font-medium py-2 border-b border-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  GALLERY
                </Link>
                
                <Link
                  href="https://stonewaterristorante.au/parking/"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-md font-medium text-center mt-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Find Parking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center logo - positioned to overlap the navigation and content below */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-10 sm:top-16 z-[105]">
        <Image
          src="/images/logo.png"
          alt="Stonewater Indian Restaurant"
          width={160}
          height={160}
          className="rounded-full w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] md:w-[240px] md:h-[240px]"
        />
      </div>

      {/* Space for logo overflow - transparent and reduced height */}
      <div className="h-12 sm:h-16 bg-transparent"></div>
    </header>
  )
}
