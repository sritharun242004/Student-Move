import { Facebook, Twitter, Instagram } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src="/smlogo.png" alt="Student Moves" className="h-12 mb-4" />
            <p className="text-gray-400 mb-4">
              Making rental simple, transparent, and stress-free for everyone.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/student.moves"
                className="text-gray-400 hover:text-white"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/public-properties" className="text-gray-400 hover:text-white">
                  Properties
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="text-gray-400 hover:text-white">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/#about" className="text-gray-400 hover:text-white">
                  About
                </a>
              </li>
              <li>
                <a href="/#contact" className="text-gray-400 hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">For Tenants</h4>
            <ul className="space-y-2">
              <li>
                <a href="/public-properties" className="text-gray-400 hover:text-white">
                  Search Properties
                </a>
              </li>
              <li>
                <a href="/auth/signin" className="text-gray-400 hover:text-white">
                  Student Dashboard
                </a>
              </li>
              <li>
                <a href="/faq" className="text-gray-400 hover:text-white">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">For Landlords</h4>
            <ul className="space-y-2">
              <li>
                <a href="/auth/signin" className="text-gray-400 hover:text-white">
                  Landlord Dashboard
                </a>
              </li>
              <li>
                <a href="/auth/signin" className="text-gray-400 hover:text-white">
                  Property Management
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Student Moves. All rights reserved. |{" "}
            <a href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </a>{" "}
            |{" "}
            <a href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
