"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Calendar,
  CheckCircle2,
  MapPin,
  Droplets,
  Wifi,
  Tv,
  Flame,
  Info,
  WashingMachine,
  Trees,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useRouter } from "next/navigation";
import Axios from "@/config/axios.config";
import type { Property } from "@/types/propertyTypes";
import { getTownName } from "@/constants/locations";
import { addFavorite, getFavorites, removeFavorite } from "@/lib/favorites";
import logo from "@/public/smlogo-t.png";
import Image from "next/image";

export default function PropertyDetails() {
  const params = useParams<{ id: string }>();
  // const { data: session } = useSession();
  const router = useRouter();

  const id = params.id;
  const propertyId = parseInt(id);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [property, setProperty] = useState<Property>();

  useEffect(() => {
    // Check if property is in favorites
    const favorites = getFavorites();
    setIsShortlisted(favorites.includes(propertyId));
  }, [propertyId]);

  const toggleFavorite = () => {
    if (isShortlisted) {
      removeFavorite(propertyId);
    } else {
      addFavorite(propertyId);
    }
    setIsShortlisted(!isShortlisted);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await Axios.get(`/properties/${id}/`, {});
        const data = await res.data.data;
        setProperty(data);
      } catch (error) {
        console.error("Error fetching property details:", error);
      }
    };
    fetchData();
  }, [id]);

  // Helper to render a specific icon for known features, fallback to CheckCircle2
  const renderFeatureIcon = (feature: string) => {
    const key = (feature || "").toLowerCase();

    if (key.includes("american fridge") || key.includes("fridge freezer")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="American Fridge Freezer"
        >
          <Droplets className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("prime location")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Prime Location"
        >
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("double bedroom")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Double Bedroom"
        >
          <Home className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("large screen") || key.includes("tv")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Large Screen TV"
        >
          <Tv className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("newly refurbished")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Newly Refurbished"
        >
          <Flame className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("fitted kitchen")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Newly Fitted Kitchen"
        >
          <Info className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("walking distance") || key.includes("university")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Walking Distance to University"
        >
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("en-suite") || key.includes("bathroom")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="En-suite Bathrooms"
        >
          <Droplets className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("open-plan") || key.includes("living area")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Open-plan Living Area"
        >
          <Home className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("excellent location")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Excellent Location"
        >
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("dishwasher")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Dishwasher"
        >
          <WashingMachine className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (
      key.includes("washing") ||
      key.includes("washing machine") ||
      key.includes("washer")
    ) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Washing Machine"
        >
          <WashingMachine className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("dryer") || key.includes("tumble")) {
      return (
        <span className="h-5 w-5 text-primary flex-shrink-0" aria-label="Dryer">
          <WashingMachine className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }
    if (key.includes("garden")) {
      return (
        <span
          className="h-5 w-5 text-primary flex-shrink-0"
          aria-label="Garden"
        >
          <Trees className="h-5 w-5 text-primary flex-shrink-0" />
        </span>
      );
    }

    // Fallback to the existing check icon for unknown/custom features
    return <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <a href="/">
              <Image src={logo} width={300} alt="logo" />
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
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container mx-auto py-4">
          <div className="flex items-center gap-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Properties
            </Button>
            <span className="text-muted-foreground">/</span>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              {property?.name}, {property?.address || "Property Address"}
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6">
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Main Content */}
          <div className="space-y-6 w-[80%] ml-8">
            {/* Image Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main image (2x2 on md+, stacked on mobile) */}
              <div className="md:col-span-2 md:row-span-2 relative rounded-lg overflow-hidden">
                <img
                  src={property?.images[0]?.image || "/placeholder.jpg"}
                  alt="Property main view"
                  className="object-cover w-full h-64 md:h-[480px] hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Right side images (1x1 each) */}
              {property?.images?.slice(1, 3).map((image, index) => (
                <div
                  key={`right-${index}`}
                  className="relative rounded-lg overflow-hidden"
                >
                  <img
                    src={image.image || "/placeholder.jpg"}
                    alt={`Property view ${index + 2}`}
                    className="object-cover w-full h-40 md:h-[240px] hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}

              {/* Bottom row images (1x1 each) */}
              {property?.images?.slice(3, 6).map((image, index) => (
                <div
                  key={`bottom-${index}`}
                  className="relative rounded-lg overflow-hidden"
                >
                  <img
                    src={image.image || "/placeholder.jpg"}
                    alt={`Property view ${index + 4}`}
                    className="object-cover w-full h-40 md:h-[240px] hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>

            {/* Key Features */}
            <Card>
              <CardHeader>
                <CardTitle>Key features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {property?.keyFeatures && property.keyFeatures.length > 0 ? (
                    property.keyFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {renderFeatureIcon(feature)}
                        <span>{feature}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span>No key features listed</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      Parking:{" "}
                      {property?.additionalDetails?.parking || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      Accessibility:{" "}
                      {property?.additionalDetails?.accessibility ||
                        "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      Pets allowed:{" "}
                      {property?.additionalDetails?.pets_allowed ||
                        "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      Furnished:{" "}
                      {property?.additionalDetails?.furnished !== undefined
                        ? property.additionalDetails.furnished
                          ? "Yes"
                          : "No"
                        : "Not specified"}
                    </span>
                  </div>
                  {(property?.gasFromDate || property?.gasToDate) && (
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>
                        Gas Safety Certificate:{" "}
                        {property.gasFromDate && property.gasToDate
                          ? `${new Date(
                              property.gasFromDate
                            ).toLocaleDateString()} - ${new Date(
                              property.gasToDate
                            ).toLocaleDateString()}`
                          : property.gasFromDate
                          ? `From ${new Date(
                              property.gasFromDate
                            ).toLocaleDateString()}`
                          : property.gasToDate
                          ? `Until ${new Date(
                              property.gasToDate
                            ).toLocaleDateString()}`
                          : ""}
                      </span>
                    </div>
                  )}
                  {(property?.electricFromDate || property?.electricToDate) && (
                    <div className="flex items-center gap-2">
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
                        className="h-5 w-5 text-primary flex-shrink-0"
                      >
                        <path d="M14.5 8L19 12.5L14.5 17" />
                        <path d="M9.5 17L5 12.5L9.5 8" />
                      </svg>
                      <span>
                        Electric Safety Certificate:{" "}
                        {property.electricFromDate && property.electricToDate
                          ? `${new Date(
                              property.electricFromDate
                            ).toLocaleDateString()} - ${new Date(
                              property.electricToDate
                            ).toLocaleDateString()}`
                          : property.electricFromDate
                          ? `From ${new Date(
                              property.electricFromDate
                            ).toLocaleDateString()}`
                          : property.electricToDate
                          ? `Until ${new Date(
                              property.electricToDate
                            ).toLocaleDateString()}`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card> */}

            {/* Property Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p>{property?.description || "No description available"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Bills Included */}
            {property?.billsIncluded && (
              <Card>
                <CardHeader>
                  <CardTitle>Bills included</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Droplets className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm">Water</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Flame className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm">Gas</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-6 w-6 text-primary"
                        >
                          <path d="M14.5 8L19 12.5L14.5 17" />
                          <path d="M9.5 17L5 12.5L9.5 8" />
                        </svg>
                      </div>
                      <span className="text-sm">Electricity</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wifi className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm">Super Fast Broadband</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg mb-6">
                  {/* Map would go here */}
                  <div className="w-full h-full flex items-center justify-center">
                    {property && property ? (
                      <iframe
                        title="Google Map"
                        width="100%"
                        height="100%"
                        style={{ border: 0, borderRadius: "0.5rem" }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyDjrFgY6xSK2h7nrTtVZf77X4avKZVzACE&center=53.80427918028866,-1.5484352402510058&zoom=16&maptype=roadmap`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        Map not available
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bedroom Prices */}

            <Card className="">
              <CardHeader>
                <CardTitle>Bedroom prices</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="weekly">
                  <TabsList className="flex flex-wrap sm:flex-nowrap w-auto gap-2 h-12">
                    <TabsTrigger
                      value="weekly"
                      className="whitespace-normal text-sm leading-tight break-words px-2 py-1 text-center min-w-0 max-w-[7rem] sm:max-w-none"
                    >
                      Weekly prices
                    </TabsTrigger>
                    <TabsTrigger
                      value="monthly"
                      className="whitespace-normal text-sm leading-tight break-words px-2 py-1 text-center min-w-0 max-w-[7rem] sm:max-w-none"
                    >
                      Monthly prices
                    </TabsTrigger>
                    <TabsTrigger
                      value="quarterly"
                      className="whitespace-normal text-sm leading-tight break-words px-2 py-1 text-center min-w-0 max-w-[7rem] sm:max-w-none"
                    >
                      Quarterly prices
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="weekly">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bedroom</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">
                            Price per week
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: property?.rooms || 4 }).map(
                          (_, index) => (
                            <TableRow key={index}>
                              <TableCell>Bedroom {index + 1}</TableCell>
                              <TableCell>Double</TableCell>
                              <TableCell className="text-right">
                                £{" "}
                                {(
                                  parseFloat(property?.price || "0") +
                                  (property?.utilityAmount
                                    ? parseFloat(
                                        property?.utilityAmount.toString()
                                      )
                                    : 0)
                                ).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="monthly">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bedroom</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">
                            Price per month
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: property?.rooms || 4 }).map(
                          (_, index) => (
                            <TableRow key={index}>
                              <TableCell>Bedroom {index + 1}</TableCell>
                              <TableCell>Double</TableCell>
                              <TableCell className="text-right">
                                £
                                {Number(
                                  (
                                    parseFloat(property?.price || "0") +
                                    (property?.utilityAmount
                                      ? parseFloat(
                                          property?.utilityAmount.toString()
                                        )
                                      : 0)
                                  ).toFixed(2)
                                ) * 4}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="quarterly">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bedroom</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">
                            Price per quarter
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: property?.rooms || 4 }).map(
                          (_, index) => (
                            <TableRow key={index}>
                              <TableCell>Bedroom {index + 1}</TableCell>
                              <TableCell>Double</TableCell>
                              <TableCell className="text-right">
                                £
                                {Number(
                                  (
                                    parseFloat(property?.price || "0") +
                                    (property?.utilityAmount
                                      ? parseFloat(
                                          property?.utilityAmount.toString()
                                        )
                                      : 0)
                                  ).toFixed(2)
                                ) * 13}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">
                      Security deposit (per tenant)
                    </span>

                    <span>
                      {property?.securityDeposit
                        ? `£${property.securityDeposit}`
                        : "To be confirmed"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">
                      Holding deposit (per tenant)
                    </span>
                    <span>
                      {property?.holdingDeposit
                        ? `£${property.holdingDeposit}`
                        : "To be confirmed"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:fixed relative lg:right-5 lg:top-44 space-y-6 h-fit lg:w-1/3 w-[95%] mx-auto">
            <Card>
              <CardContent className="">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-xl font-bold">
                      {property?.name || "Property Name"}
                    </h1>
                    <p className="text-md mt-1">
                      {property?.address || "Property Address"},{" "}
                      {getTownName(
                        property?.city?.id || 0,
                        property?.area?.id || 0
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Home className="h-4 w-4" />
                      <span>
                        House with {property?.rooms || 0} bedrooms and{" "}
                        {property?.bathrooms || 0} bathroom
                        {property?.bathrooms !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {property?.availableAfter && property?.availableTo
                          ? `Available from ${new Date(
                              property.availableAfter
                            ).toLocaleDateString()} to ${new Date(
                              property.availableTo
                            ).toLocaleDateString()}`
                          : property?.availableAfter &&
                            new Date(property.availableAfter) > new Date()
                          ? `Available from ${new Date(
                              property.availableAfter
                            ).toLocaleDateString()}`
                          : property?.availableTo
                          ? `Available until ${new Date(
                              property.availableTo
                            ).toLocaleDateString()}`
                          : property?.status === "available"
                          ? "Available now"
                          : (property?.status === "pending" && "Pending") ||
                            "Not available"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        £
                        {(
                          parseFloat(property?.price || "0") +
                          (property?.utilityAmount
                            ? parseFloat(property?.utilityAmount.toString())
                            : 0)
                        ).toFixed(2)}
                      </span>
                      {/* <span className="text-muted-foreground">
                      {/* <span className="text-muted-foreground">
                        per{" "}
                        {property?.billsIncluded
                          ? "person per week"
                          ? "person per week"
                          : "person per week"}
                      </span> */}
                    </div>
                    <div>
                      {/* {property?.utilityAmount && (
                        <span className="text-sm font-bold text-green-500">
                          + £{property.utilityAmount} utility amount
                        </span>
                      )} */}
                    </div>
                    {/* <div>
                      {property?.utilityAmount && (
                        <span className="text-sm font-bold text-green-500">
                          + £{property.utilityAmount} utility amount
                        </span>
                      )}
                    </div> */}
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span>
                        EPC Rating: {property?.epcRating || "Not available"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 mt-3">
                      <Button
                        className="cursor-pointer"
                        onClick={() => router.push("/auth/signup")}
                      >
                        Enquire Now/Sign Up
                      </Button>
                    </div>
                  </div>

                  {property?.billsIncluded && (
                    <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Home className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Bills included</h3>
                        <p className="text-sm text-muted-foreground">
                          We take the stress out of student living
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Deposits information */}
                  <div className="space-y-3 pt-3 border-t">
                    {property?.securityDeposit && (
                      <div className="flex justify-between">
                        <span className="font-medium">
                          Security deposit (per tenant)
                        </span>
                        <span>£{property.securityDeposit}</span>
                      </div>
                    )}
                    {property?.holdingDeposit && (
                      <div className="flex justify-between">
                        <span className="font-medium">
                          Holding deposit (per tenant)
                        </span>
                        <span>£{property.holdingDeposit}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
