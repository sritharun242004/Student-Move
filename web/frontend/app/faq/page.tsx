"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

export default function FAQPage() {
  return (
    <>
      <PublicNavbar />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-2">
              Student Moves FAQ
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-12">
              Your Questions, Answered
            </p>
            <p className="mb-8 text-gray-600">
              Finding your student home should be straightforward and
              stress-free. At Student Moves, we manage high-quality,
              all-inclusive student properties across England to make your
              student life easier. Below, you'll find answers to our most
              frequently asked questions.
            </p>

            {/* Category 1: About Student Moves & Our Properties */}
            <Card className="mb-8 p-6">
              <h2 className="text-2xl font-bold mb-6">
                About Student Moves & Our Properties
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="cities">
                  <AccordionTrigger>
                    Which cities do you operate in?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Student Moves offers all-inclusive student accommodation
                      in most major university cities across England, including
                      but not limited to:
                    </p>
                    <ul className="list-disc pl-6 mt-2 mb-4">
                      <li>Manchester</li>
                      <li>Liverpool</li>
                      <li>Leeds</li>
                      <li>Birmingham</li>
                      <li>Nottingham</li>
                      <li>Sheffield</li>
                      <li>Newcastle</li>
                      <li>Bristol</li>
                      <li>Exeter</li>
                      <li>York</li>
                      <li>Leicester</li>
                    </ul>
                    <p>
                      Our portfolio is always growing — use our{" "}
                      <Link
                        href="/public-properties"
                        className="text-primary hover:underline"
                      >
                        Property Search
                      </Link>{" "}
                      page and filter by your city or university to see what's
                      available.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="all-inclusive">
                  <AccordionTrigger>
                    What does "All-Inclusive" really mean at Student Moves?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      It means one simple payment covers all your main household
                      bills, including:
                    </p>
                    <ul className="list-disc pl-6 mt-2">
                      <li>Gas</li>
                      <li>Electricity</li>
                      <li>Water</li>
                      <li>Super-fast Broadband & Wi-Fi</li>
                    </ul>
                    <p className="mt-4">
                      There are no hidden fees or confusing usage limits — just
                      one clear monthly payment. We set up and manage all
                      accounts so you never have to deal with separate bills.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="property-types">
                  <AccordionTrigger>
                    What type of properties do you offer?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      We offer a wide range of high-quality student houses and
                      flats, all fully furnished and designed with comfort,
                      practicality, and modern living in mind.
                    </p>
                    <p className="mt-2">
                      We also provide various bedroom sizes to suit all budgets
                      and preferences — from spacious master bedrooms to
                      comfortable standard rooms.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="location">
                  <AccordionTrigger>
                    Are your properties close to universities?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Yes. We select properties in popular student areas,
                      usually within walking distance or a short bus ride from
                      university campuses. Each property listing shows nearby
                      universities and estimated travel times.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>

            {/* Category 2: Viewings & Applications */}
            <Card className="mb-8 p-6">
              <h2 className="text-2xl font-bold mb-6">
                Viewings & Applications
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="viewings">
                  <AccordionTrigger>
                    How can I view a property?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>You can book a viewing in two ways:</p>
                    <ul className="list-disc pl-6 mt-2">
                      <li>
                        <strong>Online:</strong> Click "Book a Viewing" on any
                        property listing page.
                      </li>
                      <li>
                        <strong>Email:</strong> Contact us at
                        info@studentmoves.co.uk
                      </li>
                    </ul>
                    <p className="mt-4">
                      We offer both in-person and virtual viewings for your
                      convenience.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="international">
                  <AccordionTrigger>
                    I'm an international student and can't view in person. What
                    can I do?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      No problem. We provide detailed virtual tours and can also
                      arrange a live video call to walk you through the property
                      and answer any questions.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="application">
                  <AccordionTrigger>
                    How do I apply for a property?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>Once you've found a property you like:</p>
                    <ol className="list-decimal pl-6 mt-2">
                      <li>
                        Click "Apply Now" on the listing page and complete the
                        online form
                      </li>
                      <li>
                        Pay the holding deposit (one week's rent) to reserve the
                        property
                      </li>
                      <li>
                        Submit your student details for referencing — we'll
                        guide you through every step
                      </li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="referencing">
                  <AccordionTrigger>
                    What is the referencing process?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      It's a quick verification to confirm your student status.
                      Usually, this means providing proof of enrolment and ID —
                      it's not a credit check.
                    </p>
                    <p className="mt-2">
                      If you're an international student, don't worry — we can
                      complete the process remotely using your university
                      documents and passport.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>

            {/* Add more categories... */}

            <div className="text-center mt-12">
              <p className="mb-6">Still have questions? We're here to help!</p>
              <Button asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Footer */}
        <PublicFooter />
      </div>
    </>
  );
}
