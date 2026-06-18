"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Facebook, Twitter, Instagram } from "lucide-react";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <>
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <a href="/">
              <img src="smlogo.png" width={300} />
            </a>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="/public-properties"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Properties
            </a>
            <a
              href="/#how-it-works"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              How It Works
            </a>
            <a
              href="/faq"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              FAQ
            </a>{" "}
            <a
              href="/#about"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              About
            </a>
            <a
              href="/#contact"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Contact
            </a>
          </nav>
          <div className="flex items-center space-x-3">
            <Button
              className="cursor-pointer"
              onClick={() => router.push("/auth/signin")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-4">
              Privacy Policy & Legal Information
            </h1>
            <p className="text-center text-gray-600 mb-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-center text-gray-600 mb-12">
              Contact: info@studentmoves.co.uk
            </p>

            {/* Accurate Property Advertising */}
            <Card className="mb-8 p-6">
              <h2 className="text-2xl font-bold mb-6">
                1. Accurate Property Advertising
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Student Moves aims to provide clear, honest, and fair
                  information across all property listings. We want every user
                  to understand the key details before making an enquiry or
                  starting an application.
                </p>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Our commitments:
                  </h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Listings are checked for accuracy before going live.
                    </li>
                    <li>
                      Key details such as rent, utilities, room sizes, features,
                      and restrictions will be included wherever possible.
                    </li>
                    <li>
                      Photos, videos, and floor plans reflect the property as it
                      is.
                    </li>
                    <li>
                      Listings are updated promptly when a property is let or
                      withdrawn.
                    </li>
                    <li>
                      We do not knowingly publish misleading, incomplete, or
                      outdated information.
                    </li>
                  </ul>
                </div>

                <p>
                  We follow current UK consumer law, including the Digital
                  Markets, Competition and Consumers Act 2024, which requires
                  clear, fair, and accurate marketing.
                </p>

                <p>
                  If something looks incorrect, contact us at{" "}
                  <a
                    href="mailto:info@studentmoves.co.uk"
                    className="text-primary hover:underline"
                  >
                    info@studentmoves.co.uk
                  </a>
                  .
                </p>
              </div>
            </Card>

            {/* Privacy, Data Protection & GDPR */}
            <Card className="mb-8 p-6">
              <h2 className="text-2xl font-bold mb-6">
                2. Privacy, Data Protection & GDPR
              </h2>
              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Who we are</h3>
                  <p>
                    <strong>Student Moves</strong>
                    <br />
                    Email:{" "}
                    <a
                      href="mailto:info@studentmoves.co.uk"
                      className="text-primary hover:underline"
                    >
                      info@studentmoves.co.uk
                    </a>
                    <br />
                    We are the data controller for information collected through
                    our website and platform.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    What personal data we collect
                  </h3>
                  <p className="mb-2">
                    We may collect and process the following:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Name, email address, phone number</li>
                    <li>Student status and property preferences</li>
                    <li>Messages and enquiries submitted through the site</li>
                    <li>Information in tenancy applications</li>
                    <li>Identity verification and guarantor details</li>
                    <li>Landlord and agent account information</li>
                    <li>Payment information where relevant</li>
                    <li>
                      IP address, device data, and website usage information
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    How we use your personal data
                  </h3>
                  <p className="mb-2">We use your information to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Register and manage user accounts</li>
                    <li>Arrange viewings and process enquiries</li>
                    <li>Handle tenancy applications and referencing</li>
                    <li>Verify identity and guarantor details</li>
                    <li>
                      Manage property listings and communication between
                      tenants, landlords, and agents
                    </li>
                    <li>Provide utility-included tenancy services</li>
                    <li>
                      Send property alerts and marketing (only where allowed)
                    </li>
                    <li>Improve platform functionality and user experience</li>
                    <li>
                      Meet legal or regulatory requirements, including fraud
                      prevention and anti-money laundering checks where relevant
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Lawful basis under UK GDPR
                  </h3>
                  <p className="mb-2">
                    We process your personal data under the following legal
                    bases:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <strong>Contractual necessity:</strong> to provide letting
                      services, tenancy processing, and platform access.
                    </li>
                    <li>
                      <strong>Legal obligation:</strong> for regulatory,
                      financial, or anti-fraud requirements.
                    </li>
                    <li>
                      <strong>Legitimate interests:</strong> for service
                      improvement, communication, and property matching—except
                      where your rights override those interests.
                    </li>
                    <li>
                      <strong>Consent:</strong> for marketing emails, alerts,
                      and optional features. You can withdraw consent at any
                      time.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Your GDPR rights
                  </h3>
                  <p className="mb-2">
                    Under the UK GDPR, you have the right to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Access the personal data we hold about you</li>
                    <li>Request correction of inaccurate information</li>
                    <li>Request deletion of your data (where appropriate)</li>
                    <li>Object to certain types of processing</li>
                    <li>Withdraw consent for marketing</li>
                    <li>Request a copy of your data in a portable format</li>
                    <li>
                      Restrict how your data is processed in certain situations
                    </li>
                    <li>
                      Make a complaint to the Information Commissioner's Office
                      (ICO)
                    </li>
                  </ul>
                  <p className="mt-3">
                    To exercise any rights, email{" "}
                    <a
                      href="mailto:info@studentmoves.co.uk"
                      className="text-primary hover:underline"
                    >
                      info@studentmoves.co.uk
                    </a>
                    .
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Data retention</h3>
                  <p className="mb-2">
                    We only keep your data for as long as needed to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide our services</li>
                    <li>Meet legal obligations</li>
                    <li>Resolve disputes</li>
                    <li>Maintain accurate records</li>
                  </ul>
                  <p className="mt-3">
                    After this, your data is securely deleted or anonymised.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Sharing your data
                  </h3>
                  <p className="mb-2">We may share your information with:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Letting agents and landlords</li>
                    <li>Third-party referencing companies</li>
                    <li>
                      Professional service providers supporting our platform
                    </li>
                    <li>
                      Utility providers involved in all-inclusive tenancy
                      packages
                    </li>
                    <li>Payment service providers where required</li>
                  </ul>
                  <p className="mt-3">
                    We do not sell personal data to third parties.
                  </p>
                  <p>
                    Any third party receiving your data must handle it in line
                    with the UK GDPR.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Security measures
                  </h3>
                  <p className="mb-2">
                    We use technical and organisational measures to protect your
                    information, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Encryption</li>
                    <li>Access controls</li>
                    <li>Secure data storage</li>
                    <li>Regular monitoring and security checks</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Cookies Policy */}
            <Card className="mb-8 p-6">
              <h2 className="text-2xl font-bold mb-6">3. Cookies Policy</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  The Student Moves website uses cookies to operate smoothly and
                  improve usability.
                </p>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Cookies help us with:
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Basic website functions</li>
                    <li>Keeping you signed in</li>
                    <li>Remembering preferences</li>
                    <li>Analytics and performance tracking</li>
                    <li>Security and fraud prevention</li>
                  </ul>
                </div>

                <p>
                  You can change your cookie settings in your browser at any
                  time. Some features may not function correctly if cookies are
                  disabled.
                </p>
              </div>
            </Card>

            {/* Terms of Use */}
            <Card className="mb-8 p-6">
              <h2 className="text-2xl font-bold mb-6">4. Terms of Use</h2>
              <div className="space-y-6 text-gray-700">
                <p>
                  By using the Student Moves website, you agree to the following
                  terms.
                </p>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Website use</h3>
                  <p>
                    You must not misuse the site, attempt to interfere with its
                    operation, or use content without permission.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Accuracy of information
                  </h3>
                  <p>
                    We take care to publish accurate listings, but some
                    information comes directly from landlords and agents. Users
                    should verify details during viewings and tenancy stages.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Account responsibilities
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Users must keep login details secure.</li>
                    <li>We may suspend accounts if we detect misuse.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Limitation of liability
                  </h3>
                  <p className="mb-2">Student Moves is not responsible for:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Decisions made by landlords, tenants, guarantors, or
                      agents
                    </li>
                    <li>Third-party information we rely on</li>
                    <li>Technical issues or temporary outages</li>
                    <li>
                      Losses arising from inaccurate or incomplete information
                      supplied by others
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Updates to this page
                  </h3>
                  <p>
                    We may update these terms or policies to reflect changes in
                    law or services. The latest version will always be available
                    on the website.
                  </p>
                </div>
              </div>
            </Card>

            {/* Contact Us */}
            <Card className="mb-12 p-6 bg-primary/5">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">
                For property queries, privacy questions, or GDPR requests,
                email:
              </p>
              <a
                href="mailto:info@studentmoves.co.uk"
                className="text-primary hover:underline font-semibold"
              >
                info@studentmoves.co.uk
              </a>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <img src="/smlogo.png" width={300} alt="Student Moves Logo" />
                </div>
                <p className="text-gray-400 mb-4">
                  Making rental property management simple and efficient for
                  everyone.
                </p>
                <div className="flex space-x-4">
                  <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                  <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                  <a href="https://www.instagram.com/student.moves">
                    <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">For Tenants</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a
                      href="/public-properties"
                      className="hover:text-white transition-colors"
                    >
                      Search Properties
                    </a>
                  </li>
                  <li>
                    <a
                      href="/auth/signin"
                      className="hover:text-white transition-colors"
                    >
                      Payment Portal
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">For Landlords</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a
                      href="/auth/signin"
                      className="hover:text-white transition-colors"
                    >
                      Property Management
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Contact</h3>
                <div className="space-y-2 text-gray-400">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <a
                      href="mailto:info@studentmoves.co.uk"
                      className="hover:text-white transition-colors"
                    >
                      info@studentmoves.co.uk
                    </a>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>Leeds, UK</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>
                &copy; {new Date().getFullYear()} Student Moves. All rights
                reserved. |{" "}
                <a
                  href="/privacy-policy"
                  className="hover:text-white transition-colors"
                >
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
      </div>
    </>
  );
}
