"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Heart,
  Home,
  Calendar,
  CheckCircle2,
  MapPin,
  Droplets,
  Wifi,
  Tv,
  Flame,
  Info,
  Star,
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
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { useSession } from "next-auth/react";
import type { Property } from "@/types/propertyTypes";
import { getCityName, getTownName } from "@/constants/locations";
import { addFavorite, getFavorites, removeFavorite } from "@/lib/favorites";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function PropertyDetails() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const axios = useAgentAxios();

  const id = params.id;
  const propertyId = parseInt(id);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [property, setProperty] = useState<Property>();
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquirySubject, setEnquirySubject] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [utilityDialogOpen, setUtilityDialogOpen] = useState(false);
  const [utilityAmount, setUtilityAmount] = useState("");
  const [isUpdatingUtility, setIsUpdatingUtility] = useState(false);
  const [sidebarTop, setSidebarTop] = useState(176); // Initial top position (44 * 4 = 176px for lg:top-44)
  const [isClient, setIsClient] = useState(false);
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if property is in favorites
    const favorites = getFavorites();
    setIsShortlisted(favorites.includes(propertyId));
  }, [propertyId]);

  // Scroll effect for sidebar
  useEffect(() => {
    setIsClient(true);

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const initialTop = 176; // lg:top-44 equivalent in pixels (44 * 4)
      const minTop = 80; // Much lower stopping position - sidebar can go below viewport top
      const maxScroll = 400; // Maximum scroll distance before stopping

      // Calculate new top position based on scroll
      // const scrollProgress = Math.min(scrollY / maxScroll, 1);
      const newTop = Math.max(initialTop - scrollY * 0.8, minTop);

      setSidebarTop(newTop);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFavorite = () => {
    if (isShortlisted) {
      removeFavorite(propertyId);
    } else {
      addFavorite(propertyId);
    }
    setIsShortlisted(!isShortlisted);
  };

  useEffect(() => {
    if (!session) return;
    const fetchData = async () => {
      try {
        const res = await axios.get(`/properties/${id}/`);
        const data = await res.data.data;
        setProperty(data);
      } catch (error) {
        console.error("Error fetching property details:", error);
      }
    };
    fetchData();
  }, [id, session]);

  // Property management functionality has been moved to the property edit page

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      toast.error("You must be logged in to send an enquiry.");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post("/tenants/inquiries/", {
        property: propertyId,
        subject: enquirySubject,
        chat: [
          {
            sender: "tenant",
            message: enquiryMessage,
          },
        ],
      });

      toast.success("Enquiry sent successfully!");

      // Reset form and close dialog
      setEnquirySubject("");
      setEnquiryMessage("");
      setEnquiryOpen(false);
      router.push("/dashboard/inquiries");
    } catch (error) {
      console.error("Error sending enquiry:", error);
      toast.error("Failed to send enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlagProperty = async (propertyId: number) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      const response = await axios.patch(
        `/properties/${propertyId}/flag/`, // Dynamic property ID
        {} // Empty body for the PATCH request
      );

      toast("Success", {
        description: `Property ${propertyId} has been flagged successfully.`,
      });

      // Optionally, refresh the property list or update the UI
      // fetchProperties(); // Call your fetch function to refresh the list
    } catch (err: any) {
      console.error(
        `Error flagigng property ${propertyId}:`,
        err.response?.data || err.message
      );
      toast("Error", {
        description: `Failed to flag property ${propertyId}. Please try again.`,
      });
    }
  };

  // Toggle featured state for a property (admin only)
  const handleToggleFeatured = async (propertyId: number) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      setIsTogglingFeatured(true);

      const res = await axios.patch(`/properties/${propertyId}/featured/`, {});

      // Backend should return the updated property or new isFeatured flag
      const newIsFeatured = res?.data?.data?.isFeatured;

      if (typeof newIsFeatured === "boolean") {
        setProperty((prev) =>
          prev ? { ...prev, isFeatured: newIsFeatured } : prev
        );
      } else {
        // Fallback: toggle locally
        setProperty((prev) =>
          prev ? { ...prev, isFeatured: !prev.isFeatured } : prev
        );
      }

      toast.success(
        `Property ${
          typeof newIsFeatured === "boolean" && newIsFeatured
            ? "featured"
            : "updated"
        } successfully`
      );
    } catch (err) {
      console.error("Error toggling featured status:", err);
      toast.error("Failed to toggle featured status. Please try again.");
    } finally {
      setIsTogglingFeatured(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: property?.name || "Property Details",
      text: `Check out this property: ${property?.name} at ${property?.address}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Property shared successfully!");
      } catch (error: any) {
        if (error.name !== "AbortError") {
          // Fallback to copy URL if sharing fails
          handleCopyUrl();
        }
      }
    } else {
      // Fallback to copy URL if Web Share API is not supported
      handleCopyUrl();
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Property URL copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy URL. Please try again.");
    }
  };

  const handleUtilityAmountChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      toast.error("You must be logged in to update utility amount.");
      return;
    }

    if (!utilityAmount || isNaN(Number(utilityAmount))) {
      toast.error("Please enter a valid utility amount.");
      return;
    }

    setIsUpdatingUtility(true);

    try {
      await axios.patch(`/properties/${propertyId}/`, {
        utilityAmount: Number(utilityAmount),
      });

      toast.success("Utility amount updated successfully!");

      // Update local property state
      if (property) {
        setProperty({
          ...property,
          utilityAmount: Number(utilityAmount),
        });
      }

      // Reset form and close dialog
      setUtilityAmount("");
      setUtilityDialogOpen(false);
    } catch (error) {
      console.error("Error updating utility amount:", error);
      toast.error("Failed to update utility amount. Please try again.");
    } finally {
      setIsUpdatingUtility(false);
    }
  };

  // Property management functionality has been moved to the property edit page

  return (
    <div className="min-h-screen bg-background">
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
          <div className="space-y-6">
            {/* Image Gallery */}
            <div className="grid grid-cols-3 gap-4">
              {/* Main image (2x2) */}
              <div className="col-span-2 row-span-2 relative rounded-lg overflow-hidden">
                <img
                  src={property?.images[0]?.image || "/placeholder.jpg"}
                  alt="Property main view"
                  className="object-cover hover:scale-105 transition-transform duration-300"
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
                    className="object-cover h-full w-full hover:scale-105 transition-transform duration-300"
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
                    className="object-cover h-full w-full hover:scale-105 transition-transform duration-300"
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
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
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
                          ? `${new Date(property.gasFromDate).toLocaleDateString()} - ${new Date(property.gasToDate).toLocaleDateString()}`
                          : property.gasFromDate
                          ? `From ${new Date(property.gasFromDate).toLocaleDateString()}`
                          : property.gasToDate
                          ? `Until ${new Date(property.gasToDate).toLocaleDateString()}`
                          : ''}
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
                          ? `${new Date(property.electricFromDate).toLocaleDateString()} - ${new Date(property.electricToDate).toLocaleDateString()}`
                          : property.electricFromDate
                          ? `From ${new Date(property.electricFromDate).toLocaleDateString()}`
                          : property.electricToDate
                          ? `Until ${new Date(property.electricToDate).toLocaleDateString()}`
                          : ''}
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
            <Card>
              <CardHeader>
                <CardTitle>Bills included</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-4">
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

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg mb-6">
                  {/* Map would go here */}
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
                <h3 className="text-lg font-semibold mb-4">
                  Nearby Universities
                </h3>
                <div className="space-y-4">
                  {property?.universities &&
                  property.universities.length > 0 ? (
                    property.universities.map((university, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{university.name}</h3>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>No universities listed</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bedroom Prices */}

            <Card>
              <CardHeader>
                <CardTitle>Bedroom prices</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="weekly">
                  <TabsList>
                    <TabsTrigger value="weekly">Weekly prices</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly prices</TabsTrigger>
                    <TabsTrigger value="quarterly">
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
                                £
                                {property?.display_price
                                  ? property.utilityAmount
                                    ? (
                                        Number(property.display_price) +
                                        Number(property.utilityAmount)
                                      ).toFixed(2)
                                    : property.display_price
                                  : property?.price
                                  ? (
                                      Number(property.price) +
                                      Number(property.utilityAmount)
                                    ).toFixed(2)
                                  : property?.price}
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
                                £{" "}
                                {property?.display_price
                                  ? property.utilityAmount
                                    ? (
                                        Number(property.display_price) +
                                        Number(property.utilityAmount) * 4
                                      ).toFixed(2)
                                    : (
                                        Number(property.display_price) * 4
                                      ).toFixed(2)
                                  : property?.price
                                  ? (
                                      Number(property.price) +
                                      Number(property.utilityAmount) * 4
                                    ).toFixed(2)
                                  : Number(property?.price) * 4}
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
                                £{" "}
                                {property?.display_price
                                  ? property.utilityAmount
                                    ? (
                                        Number(property.display_price) +
                                        Number(property.utilityAmount) * 13
                                      ).toFixed(2)
                                    : (
                                        Number(property.display_price) * 13
                                      ).toFixed(2)
                                  : property?.price
                                  ? (
                                      Number(property.price) +
                                      Number(property.utilityAmount) * 13
                                    ).toFixed(2)
                                  : Number(property?.price) * 13}
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
          <div
            ref={sidebarRef}
            className="lg:fixed relative right-5 transition-all duration-300 ease-out space-y-2 h-fit"
            style={{
              top:
                isClient && window.innerWidth >= 1024
                  ? `${sidebarTop}px`
                  : "auto",
            }}
          >
            <Card>
              <CardContent className="pt-3">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {property?.name || "Property Name"}
                    </h1>
                    <p className="text-lg mt-1">
                      {property?.address || "Property Address"},{" "}
                      {getTownName(
                        property?.city?.id || 0,
                        property?.area?.id || 0
                      )}
                      , {getCityName(property?.city?.id || 0)}
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
                      <span className="text-3xl font-bold">
                        £
                        {property?.display_price
                          ? property.utilityAmount
                            ? (
                                Number(property.display_price) +
                                Number(property.utilityAmount)
                              ).toFixed(2)
                            : property.display_price
                          : property?.price
                          ? (
                              Number(property.price) +
                              Number(property.utilityAmount)
                            ).toFixed(2)
                          : property?.price}
                      </span>
                      {/* {property?.utilityAmount && (
                        <span className="ml-2 text-base text-muted-foreground font-normal">
                          (£{property.price} + £{property.utilityAmount} utilities)
                        </span>
                      )} */}
                      <span className="text-muted-foreground">
                        per {property?.billsIncluded ? "person" : "property"}
                      </span>
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
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      size="lg"
                      className="w-full cursor-pointer"
                      disabled={session?.role !== "tenant"}
                      onClick={() => setEnquiryOpen(true)}
                    >
                      Enquire now
                    </Button>

                    <Button
                      size="lg"
                      variant={"destructive"}
                      className={`w-full cursor-pointer ${
                        session?.role !== "admin" ? "hidden" : "visible"
                      }`}
                      disabled={session?.role !== "admin"}
                      onClick={() => handleFlagProperty(propertyId)}
                    >
                      Flag Property
                    </Button>

                    {/* Feature toggle - admin only */}
                    <Button
                      size="lg"
                      variant={property?.isFeatured ? "outline" : "outline"}
                      className={`w-full cursor-pointer mt-2 ${
                        session?.role !== "admin" ? "hidden" : "visible"
                      } ${property?.isFeatured ? "bg-yellow-100" : ""}`}
                      disabled={session?.role !== "admin" || isTogglingFeatured}
                      onClick={() => handleToggleFeatured(propertyId)}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      {isTogglingFeatured
                        ? "Updating..."
                        : property?.isFeatured
                        ? "Unfeature Property"
                        : "Feature Property"}
                    </Button>

                    <Button
                      size="lg"
                      variant={"outline"}
                      className={`w-full cursor-pointer bg-orange-200 hover:bg-orange-100 ${
                        session?.role !== "admin" ? "hidden" : "visible"
                      }`}
                      disabled={session?.role !== "admin"}
                      onClick={() => {
                        setUtilityAmount(
                          property?.utilityAmount?.toString() || ""
                        );
                        setUtilityDialogOpen(true);
                      }}
                    >
                      Change Utility Amount
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={toggleFavorite}
                      >
                        <Heart
                          className={`mr-2 h-4 w-4 ${
                            isShortlisted ? "fill-current text-destructive" : ""
                          }`}
                        />
                        Shortlist
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleShare}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>

                  {/* Enquiry Dialog */}
                  <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Send Enquiry</DialogTitle>
                        <DialogDescription>
                          Ask about {property?.name || "this property"},{" "}
                          {property?.address}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleEnquirySubmit}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <label
                              htmlFor="subject"
                              className="text-sm font-medium"
                            >
                              Subject
                            </label>
                            <Input
                              id="subject"
                              value={enquirySubject}
                              onChange={(e) =>
                                setEnquirySubject(e.target.value)
                              }
                              placeholder="E.g. I'd like to know more information"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <label
                              htmlFor="message"
                              className="text-sm font-medium"
                            >
                              Message
                            </label>
                            <Textarea
                              id="message"
                              value={enquiryMessage}
                              onChange={(e) =>
                                setEnquiryMessage(e.target.value)
                              }
                              placeholder="Enter your message here..."
                              className="min-h-[120px]"
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEnquiryOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Sending..." : "Send Enquiry"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Utility Amount Change Dialog */}
                  <Dialog
                    open={utilityDialogOpen}
                    onOpenChange={setUtilityDialogOpen}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Utility Amount</DialogTitle>
                        <DialogDescription>
                          Update the utility amount for{" "}
                          {property?.name || "this property"}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUtilityAmountChange}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <label
                              htmlFor="utilityAmount"
                              className="text-sm font-medium"
                            >
                              Utility Amount (£)
                            </label>
                            <Input
                              id="utilityAmount"
                              type="number"
                              step="0.01"
                              min="0"
                              value={utilityAmount}
                              onChange={(e) => setUtilityAmount(e.target.value)}
                              placeholder="Enter utility amount"
                              required
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current utility amount: £
                            {property?.utilityAmount || "Not set"}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setUtilityDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isUpdatingUtility}>
                            {isUpdatingUtility
                              ? "Updating..."
                              : "Update Amount"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

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
                        <span className="font-medium">Security deposit</span>
                        <span>£{property.securityDeposit}</span>
                      </div>
                    )}
                    {property?.holdingDeposit && (
                      <div className="flex justify-between">
                        <span className="font-medium">Holding deposit</span>
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
