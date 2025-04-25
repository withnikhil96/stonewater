import Image from "next/image"
import Link from "next/link"
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between pb-10">
          {/* Logo and description */}
          <div className="mb-8 md:mb-0 md:w-1/3">
            <div className="flex justify-center md:justify-start">
              <Image
                src="/images/logo.png"
                alt="Stonewater Indian Restaurant"
                width={120}
                height={120}
                className="rounded-full mb-4"
              />
            </div>
            <p className="text-sm text-gray-300 text-center md:text-left">
              Stonewater Indian Restaurant: Your gateway to authentic Indian flavors in Perth, Australia. Experience the
              magic of India's culinary traditions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-xl font-bold mb-4">Quick Link</h3>
            <ul className="space-y-2">
              <li>
                <Link href="https://stonewaterristorante.au/" className="text-gray-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="https://stonewaterristorante.au/about-us/" className="text-gray-300 hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="https://stonewaterristorante.au/wp-content/uploads/2023/09/takeaway-menu_compressed-1.pdf" target="_blank" className="text-gray-300 hover:text-white">
                  Takeaway
                </Link>
              </li>
              <li>
                <Link href="https://stonewaterristorante.au/services/" className="text-gray-300 hover:text-white">
                  Service
                </Link>
              </li>
              <li>
                <Link href="https://stonewaterristorante.au/gallery/" className="text-gray-300 hover:text-white">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="https://stonewaterristorante.au/blog/" className="text-gray-300 hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="https://stonewaterristorante.au/contact/" className="text-gray-300 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Available On */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-xl font-bold mb-4">Available On</h3>
            <div className="space-y-4">
              <div className="bg-white p-2 rounded-md inline-block">
                <Image src="/stylized-delivery-icon.png" alt="UberEats" width={120} height={40} />
              </div>
              <div className="block">
                <Image src="/DoorDash-Logo-Stylized.png" alt="DoorDash" width={120} height={40} />
              </div>
            </div>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Phone size={18} className="mr-2" />
                <span>+61 8 6111 4627</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2" />
                <span>stonewater@gmail.com</span>
              </li>
              <li className="flex items-start">
                <MapPin size={18} className="mr-2 mt-1" />
                <span>G/455 893 canning highway Mount Pleasant</span>
              </li>
            </ul>
            <div className="mt-4 flex space-x-3">
              <Link href="https://www.facebook.com/stonewaterristorante" className="bg-[#6b0000] p-2 rounded-md hover:bg-red-900">
                <Facebook size={24} />
              </Link>
              <Link href="https://www.instagram.com/stonewaterristorante/" className="bg-[#6b0000] p-2 rounded-md hover:bg-red-900">
                <Instagram size={24} />
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-400">
          <p>Copyright © 2024 Stonewater restaurant. All rights reserved.</p>
        </div>
      </div>
      {/* Back to top button - small, rounded, right-aligned */}
      <div className="relative h-12">
        <div className="container mx-auto px-4">
          <a
            href="#top"
            className="absolute right-8 bottom-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center w-10 h-10"
            aria-label="Back to top"
          >
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
              className="lucide lucide-chevron-up"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
