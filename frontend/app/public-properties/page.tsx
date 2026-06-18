"use client";
import React, { useEffect, useState, Suspense } from "react";
import Axios from "@/config/axios.config";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

import { Bath, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Building,
  Phone,
  Mail,
  Bed,
  PoundSterling,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cities, townsByCity } from "@/constants/locations";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
// import { getPriceDisplayInfo } from "@/utils/priceUtils";
// import { PriceDisplay } from "@/components/ui/price-display";
// import PropertyList from "../dashboard/my-properties/page";

interface PropertyImage {
  image: string;
}

// Bedroom options (1-10)
const bedroomOptions = Array.from({ length: 10 }, (_, i) => i + 1);

// Price range options
const priceOptions = [
  { label: "Up to £50", value: "0-50" },
  { label: "Up to £75", value: "0-75" },
  { label: "Up to £100", value: "0-100" },
  { label: "Up to £125", value: "0-125" },
  { label: "Up to £150", value: "0-150" },
  { label: "Up to £175", value: "0-175" },
  { label: "Up to £200", value: "0-200" },
  { label: "Up to £225", value: "0-225" },
  { label: "Up to £250", value: "0-250" },
];

// This is the main component that will be exported
export default function LandingPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LandingPageContent />
    </Suspense>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header placeholder */}
      <div className="h-16 border-b bg-white/95"></div>

      {/* Content loading state */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Properties
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Discovering our premium rental properties...
            </p>

            {/* Loading spinner */}
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Content component that uses the searchParams
function LandingPageContent() {
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchFilters, setSearchFilters] = useState({
    city: (() => {
      if (!urlSearchParams) return "all-cities";
      const city = urlSearchParams.get("city");
      return city || "all-cities";
    })(),
    town: (() => {
      if (!urlSearchParams) return "all-areas";
      const town = urlSearchParams.get("town");
      return town || "all-areas";
    })(),
    bedrooms: (() => {
      if (!urlSearchParams) return "any-bedrooms";
      const bedrooms = urlSearchParams.get("bedrooms");
      return bedrooms || "any-bedrooms";
    })(),
    priceRange: (() => {
      if (!urlSearchParams) return "any-price";
      const minPrice = urlSearchParams.get("minPrice");
      const maxPrice = urlSearchParams.get("maxPrice");
      if (minPrice && maxPrice) {
        return `${minPrice}-${maxPrice}`;
      }
      return "any-price";
    })(),
  });

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter locally instead of fetching again
    filterProperties();

    // Update URL with search params without page reload
    const queryParams = new URLSearchParams();

    if (searchFilters.city) {
      queryParams.append("city", searchFilters.city);
      if (searchFilters.town) {
        queryParams.append("town", searchFilters.town);
      }
    }
    if (searchFilters.bedrooms && searchFilters.bedrooms !== "any-bedrooms") {
      queryParams.append("bedrooms", searchFilters.bedrooms);
    }
    if (searchFilters.priceRange && searchFilters.priceRange !== "any-price") {
      const [minPrice, maxPrice] = searchFilters.priceRange.split("-");
      queryParams.append("minPrice", minPrice);
      queryParams.append("maxPrice", maxPrice);
    }

    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch all properties once
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await Axios.get("/properties/all/");
      const data = response.data.data;
      setAllProperties(data);
      // Apply initial filters if provided in URL
      filterProperties(data);
    } catch (err) {
      toast("Error", {
        description: "Something went wrong!",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter properties locally based on search filters
  const filterProperties = (propertiesToFilter = allProperties) => {
    let filtered = [...propertiesToFilter];

    // Apply city and town filters
    if (searchFilters.city && searchFilters.city !== "all-cities") {
      filtered = filtered.filter(
        (property) =>
          property.city &&
          property.city.name.toLowerCase() === searchFilters.city.toLowerCase()
      );

      if (searchFilters.town && searchFilters.town !== "all-areas") {
        filtered = filtered.filter(
          (property) =>
            property.area &&
            property.area.name.toLowerCase() ===
              searchFilters.town.toLowerCase()
        );
      }
    }

    // Apply bedrooms filter
    if (searchFilters.bedrooms && searchFilters.bedrooms !== "any-bedrooms") {
      const bedroomCount = parseInt(searchFilters.bedrooms);
      filtered = filtered.filter(
        (property) => parseInt(property.rooms || "0") === bedroomCount
      );
    }

    // Apply price range filter
    if (searchFilters.priceRange && searchFilters.priceRange !== "any-price") {
      const [minPrice, maxPrice] = searchFilters.priceRange
        .split("-")
        .map((p) => parseFloat(p));
      filtered = filtered.filter((property) => {
        const basePrice = parseFloat(property.price || "0");
        const utilityAmount = parseFloat(property.utilityAmount || "0");
        const totalPrice = basePrice + utilityAmount;
        return totalPrice >= minPrice && totalPrice <= maxPrice;
      });
    }

    setFilteredProperties(filtered);
  };

  // Apply filters whenever search filters change
  useEffect(() => {
    if (allProperties.length > 0) {
      filterProperties();
    }
  }, [searchFilters]);

  // Helper to map API property to UI property
  const mapProperty = (property: any) => ({
    id: property.id,
    title: property.name,
    location: property.address,
    price: property.price,
    bedrooms: property.rooms,
    bathrooms: property.bathrooms,
    sqft: property.additionalDetails?.sqft || 0,
    image: property.images[0]?.image || "/placeholder.svg",
    rating: property.rating || 0,
    amenities: property.keyFeatures || [],
    furnished: property.additionalDetails?.furnished || false,
    billsIncluded: property.billsIncluded || false,
    city: property.city?.name || "",
    area: property.area?.name || "",
    status: property.status || "available",
    university:
      property.universities?.length > 0 ? property.universities[0].name : "",
    zipCode: property.zipCode || "",
  });
  //
  console.log("Filtered Properties:", filteredProperties[0]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <section id="properties" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Properties
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Discover our handpicked selection of premium rental properties
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
              <form onSubmit={handleSearch}>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* City Select */}
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                    <Select
                      value={searchFilters.city}
                      onValueChange={(value) =>
                        setSearchFilters((prev) => ({
                          ...prev,
                          city: value,
                          town: "all-areas", // Reset town when city changes
                        }))
                      }
                    >
                      <SelectTrigger className="pl-10 h-12 w-full">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-cities">All Cities</SelectItem>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Town Select - Only shown if a city is selected */}
                  {searchFilters.city && (
                    <div className="flex-1 relative">
                      <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                      <Select
                        value={searchFilters.town}
                        onValueChange={(value) =>
                          setSearchFilters((prev) => ({
                            ...prev,
                            town: value,
                          }))
                        }
                      >
                        <SelectTrigger className="pl-10 h-12 w-full">
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-areas">All Areas</SelectItem>
                          {cities.findIndex((c) => c === searchFilters.city) >
                            -1 &&
                            townsByCity[
                              cities.findIndex((c) => c === searchFilters.city)
                            ].map((town) => (
                              <SelectItem key={town} value={town}>
                                {town}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Bedrooms Select */}
                  <div className="w-48 relative">
                    <Bed className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                    <Select
                      value={searchFilters.bedrooms}
                      onValueChange={(value) =>
                        setSearchFilters((prev) => ({
                          ...prev,
                          bedrooms: value,
                        }))
                      }
                    >
                      <SelectTrigger className="pl-10 h-12">
                        <SelectValue placeholder="Bedrooms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any-bedrooms">Any</SelectItem>
                        {bedroomOptions.map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Bedroom{num > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Select */}
                  <div className="w-48 relative">
                    <PoundSterling className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                    <Select
                      value={searchFilters.priceRange}
                      onValueChange={(value) =>
                        setSearchFilters((prev) => ({
                          ...prev,
                          priceRange: value,
                        }))
                      }
                    >
                      <SelectTrigger className="pl-10 h-12">
                        <SelectValue placeholder="Price Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any-price">Any Price</SelectItem>
                        {priceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" size="lg" className="h-12 px-8">
                    <Search className="h-5 w-5 mr-2" />
                    Filter
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No properties found matching your search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredProperties.map((property) => {
                const p = mapProperty(property);
                return (
                  <div
                    className="max-w-sm rounded-2xl shadow-lg border p-3 bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:cursor-grab"
                    key={p.id}
                    onClick={() => {
                      router.push(`public-properties/${property.id}`);
                    }}
                  >
                    {/* Top image + badge */}
                    <div className="relative">
                      <img
                        src={property.images[0]?.image || "room1.jpeg"}
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-sm px-3 py-1 rounded-full shadow">
                        Available{" "}
                        {property.availableAfter
                          ? new Date(
                              property.availableAfter
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Available"}
                      </span>

                      <div className="absolute bottom-4 left-4 flex gap-2">
                        <div className="bg-primary text-white px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
                          <Bed className="w-5 h-5" />
                          <span>{property.rooms}</span>
                        </div>
                        <div className="bg-white text-gray-800 px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
                          <Bath className="w-5 h-5" />
                          <span>{property.bathrooms}</span>
                        </div>
                      </div>
                    </div>

                    {/* Side gallery */}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <img
                        src={property.images[1]?.image || "room1.jpeg"}
                        className="h-20 w-full object-cover rounded-md"
                      />
                      <img
                        src={property.images[2]?.image || "room2.jpeg"}
                        className="h-20 w-full object-cover rounded-md"
                      />
                      <img
                        src={property.images[3]?.image || "room3.jpeg"}
                        className="h-20 w-full object-cover rounded-md"
                      />
                    </div>

                    {/* Info section */}
                    <div className="mt-3">
                      <p className="text-xl font-semibold mt-2 text-gray-900">
                        £
                        {(
                          parseFloat(property?.price || "0") +
                          (property?.utilityAmount
                            ? parseFloat(property?.utilityAmount.toString())
                            : 0)
                        ).toFixed(2)}
                        <span className="text-sm font-normal ml-1">
                          Per Person Per Week
                        </span>
                      </p>

                      <p className="font-semibold mt-2 mb-1 text-gray-800">
                        {p.location}, {p.area}, {p.city}
                      </p>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span className="font-medium">{p.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FileText className="w-4 h-4 text-red-500" />
                          <span className="font-medium">Bills Included</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  // <Card
                  //   key={p.id}
                  //   className="pt-0 relative h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 bg-white cursor-pointer flex flex-col"
                  //   onClick={() => {
                  //     router.push(`public-properties/${property.id}`);
                  //   }}
                  // >
                  //   <div className="">
                  //     <div className="grid md:grid-cols-3 grid-cols-1 gap-1">
                  //       {/* Main image (2x2) */}
                  //       <div className="col-span-2 row-span-3 relative rounded-lg overflow-hidden">
                  //         <img
                  //           src={
                  //             property?.images[0]?.image || "/placeholder.jpg"
                  //           }
                  //           alt="Property main view"
                  //           className="object-cover h-48 w-full  hover:scale-105 transition-transform duration-300 rounded-lg"
                  //         />
                  //       </div>

                  //       {/* Right side images (1x1 each) */}
                  //       <div className="md:block hidden">
                  //         {property?.images
                  //           ?.slice(1, 4)
                  //           .map((image: PropertyImage, index: number) => (
                  //             <div
                  //               key={`right-${index}`}
                  //               className={`relative rounded-lg overflow-hidden h-[64px]`}
                  //             >
                  //               <img
                  //                 src={image.image || "/placeholder.jpg"}
                  //                 alt={`Property view ${index + 2}`}
                  //                 className="object-cover w-full hover:scale-105 transition-transform duration-300"
                  //               />
                  //             </div>
                  //           ))}
                  //       </div>

                  //       {p.billsIncluded && (
                  //         <Badge className="absolute top-3 right-3 bg-green-400">
                  //           Bills Included
                  //         </Badge>
                  //       )}
                  //     </div>
                  //   </div>
                  //   <CardContent className="px-2 pb-2">
                  //     <div className="flex items-center justify-between mb-2">
                  //       <h3 className="font-semibold text-md truncate">
                  //         {p.location}, {p.area}, {p.city}
                  //       </h3>
                  //       <Badge
                  //         variant={p.furnished ? "default" : "outline"}
                  //         className="text-xs whitespace-nowrap md:block hidden text-white flex-shrink-0"
                  //       >
                  //         {p.furnished ? "Furnished" : "Unfurnished"}
                  //       </Badge>
                  //     </div>
                  //     <div className="flex items-center text-gray-600 mb-2">
                  //       <MapPin className="h-4 w-4 mr-1" />
                  //       <span className="text-sm">{p.area}</span>
                  //     </div>

                  //     <div className="flex items-center md:justify-between justify-start mb-3">
                  //       <PriceDisplay
                  //         priceInfo={getPriceDisplayInfo(
                  //           property,
                  //           session?.role,
                  //           false // Not acting as landlord for public view
                  //         )}
                  //         size="sm"
                  //         utilityAmount={property.utilityAmount}
                  //       />
                  //       <span className="text-gray-500 md:ml-0 ml-2">
                  //         per person per week
                  //       </span>
                  //     </div>

                  //     <div className="grid grid-cols-3 text-sm mb-3 border-t border-b border-gray-100 py-2 text-white bg-primary">
                  //       <div className="flex flex-col items-center justify-center border-r border-gray-100 text-white">
                  //         <span className="font-medium">{p.bedrooms}</span>
                  //         <span className="text-xs ">Beds</span>
                  //       </div>
                  //       <div className="flex flex-col items-center justify-center border-r border-gray-100">
                  //         <span className="font-medium">{p.bathrooms}</span>
                  //         <span className="text-xs ">Baths</span>
                  //       </div>
                  //       <div className="flex flex-col items-center justify-center">
                  //         <span className="font-medium">{p.area || "—"}</span>
                  //         <span className="text-xs ">Area</span>
                  //       </div>
                  //     </div>

                  //     {p.university && (
                  //       <div className="flex items-center mb-3">
                  //         <Building className="h-4 w-4 mr-1 text-gray-500 flex-shrink-0" />
                  //         <span className="text-xs text-gray-600 line-clamp-1">
                  //           Near {p.university}
                  //         </span>
                  //       </div>
                  //     )}

                  //     <div className="flex flex-col md:flex-row md:flex-wrap items-start gap-2 mb-4">
                  //       {p.amenities &&
                  //         p.amenities.slice(0, 3).map((amenity: string) => (
                  //           <Badge
                  //             key={amenity}
                  //             variant="secondary"
                  //             className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 max-w-max whitespace-nowrap px-2 py-1 rounded"
                  //           >
                  //             {amenity}
                  //           </Badge>
                  //         ))}
                  //       {p.amenities && p.amenities.length > 3 && (
                  //         <Badge
                  //           variant="secondary"
                  //           className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 max-w-max whitespace-nowrap px-2 py-1 rounded"
                  //         >
                  //           +{p.amenities.length - 3} more
                  //         </Badge>
                  //       )}
                  //     </div>
                  //   </CardContent>
                  //   <div className="mt-auto px-2">
                  //     <Button className="w-full font-semibold rounded-b-lg">
                  //       View Details
                  //     </Button>
                  //   </div>
                  // </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of satisfied tenants and landlords who trust Student
            Moves for their rental needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="border-white border-2 text-white"
            >
              Find a Property
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-primary border-white hover:bg-white hover:text-primary"
            >
              List Your Property
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
