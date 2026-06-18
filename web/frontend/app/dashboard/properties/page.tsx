"use client";

import { useState, useEffect } from "react";
import { MapPin, Droplets, Heart, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { Property } from "@/types/propertyTypes";
import { FilterMenu, FilterState } from "./filterMenu";
import { addFavorite, getFavorites, removeFavorite } from "@/lib/favorites";
import { cities, townsByCity } from "@/constants/locations";
import { LandlordGuard } from "@/components/dashboard/landlord-guard";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { getPriceDisplayInfo } from "@/utils/priceUtils";
import { PriceDisplay } from "@/components/ui/price-display";
import { tr } from "date-fns/locale";

export default function PropertyList() {
  const { data: session } = useSession();
  const router = useRouter();
  const axios = useAgentAxios();

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<{ [key: number]: number }>({
    [0]: 0,
  });
  const [sortOption, setSortOption] = useState<string>("relevance");
  const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);
  const [favList, setFavList] = useState<number[]>(getFavorites());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleFavorite = (propertyId: number) => {
    const isFav = favList.includes(propertyId);
    if (isFav) {
      removeFavorite(propertyId);
      setFavList(favList.filter((id) => id !== propertyId));
    } else {
      addFavorite(propertyId);
      setFavList([...favList, propertyId]);
    }
  };

  useEffect(() => {
    if (!session) {
      return;
    }
    const fetchProperties = async () => {
      try {
        const response = await axios.get("/properties/all/");

        const data: Property[] = await response.data.data;
        // Sort properties by creation date, most recent first
        const sortedData = [...data].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        setProperties(sortedData);
        setFilteredProperties(sortedData);
      } catch (err: any) {
        toast("Error", {
          description: "Something went wrong!",
        });
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [session]);

  useEffect(() => {
    if (!properties.length) return;

    // Apply filters first
    let result = [...properties];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((prop) => {
        return (
          prop.name?.toLowerCase().includes(query) ||
          prop.address?.toLowerCase().includes(query) ||
          prop.city?.name?.toLowerCase().includes(query) ||
          prop.area?.name?.toLowerCase().includes(query) ||
          prop.zipCode?.toLowerCase().includes(query) ||
          prop.universities?.some((uni: any) =>
            uni.name?.toLowerCase().includes(query)
          )
        );
      });
    }

    if (activeFilters) {
      // Filter by city
      if (activeFilters.city !== null) {
        result = result.filter((prop) => {
          if (!prop.city || activeFilters.city === null) return false;

          // Check if the property has cityIndex that matches the filter
          if (prop.cityIndex !== undefined) {
            return prop.cityIndex === activeFilters.city;
          }

          // Map city index to city name and compare with prop.city.name
          const cityName = cities[activeFilters.city];
          return prop.city.name === cityName;
        });
      }

      // Filter by area
      if (activeFilters.area !== null && activeFilters.city !== null) {
        result = result.filter((prop) => {
          if (
            !prop.area ||
            activeFilters.city === null ||
            activeFilters.area === null
          )
            return false;

          // Check if the property has areaIndex that matches the filter
          if (prop.areaIndex !== undefined) {
            return prop.areaIndex === activeFilters.area;
          }

          // Map area index to area name and compare with prop.area.name
          const areaName = townsByCity[activeFilters.city][activeFilters.area];
          return prop.area.name === areaName;
        });
      }

      // Filter by university
      if (activeFilters.university) {
        result = result.filter((prop) => {
          if (!prop.universities || !Array.isArray(prop.universities)) {
            return false;
          }

          const hasMatchingUni = prop.universities.some((uni: any) => {
            // Make sure both are treated as numbers for comparison
            const uniId =
              typeof uni.id === "string" ? parseInt(uni.id) : uni.id;
            const filterUniId = activeFilters.university;

            return uniId === filterUniId;
          });

          return hasMatchingUni;
        });
      }

      // Filter by price
      result = result.filter((prop) => {
        if (!prop.price) return false;

        const price = parseFloat(prop.price);
        // Check if price is a valid number
        if (isNaN(price)) {
          console.warn(`Invalid price for property ${prop.id}: ${prop.price}`);
          return false;
        }

        const passes =
          price >= activeFilters.minPrice && price <= activeFilters.maxPrice;

        return passes;
      });

      // Filter by bedrooms
      result = result.filter((prop) => {
        const rooms = prop.rooms !== undefined ? prop.rooms : 0;
        // Make sure rooms is a number
        const roomCount =
          typeof rooms === "number" ? rooms : parseInt(rooms as any);

        if (isNaN(roomCount)) {
          console.warn(
            `Invalid room count for property ${prop.id}: ${prop.rooms}`
          );
          return false;
        }

        const passes =
          roomCount >= activeFilters.minBedrooms &&
          roomCount <= activeFilters.maxBedrooms;

        return passes;
      });

      // Filter by bills included
      if (activeFilters.billsIncluded) {
        result = result.filter((prop) => {
          const billsIncluded = !!prop.billsIncluded; // Convert to boolean
          return billsIncluded;
        });
      }
    }

    // Then apply sorting
    if (sortOption === "price-asc") {
      result = [...result].sort(
        (a, b) => parseFloat(a.price) - parseFloat(b.price)
      );
    } else if (sortOption === "price-desc") {
      result = [...result].sort(
        (a, b) => parseFloat(b.price) - parseFloat(a.price)
      );
    } else if (sortOption === "newest") {
      result = [...result].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    }

    if (showFavoritesOnly) {
      result = result.filter((prop) => favList.includes(prop.id));
    }

    setFilteredProperties(result);
  }, [properties, sortOption, activeFilters, showFavoritesOnly, searchQuery]);

  const handleFilterApply = (filters: FilterState) => {
    setActiveFilters(filters);
  };

  if (loading) {
    return <div className="container mx-auto py-8 ">Loading properties...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 ">Error: {error}</div>;
  }

  if (session?.role === "agent") {
    redirect("/dashboard/landlord-lease-management");
  }

  return (
    <LandlordGuard requireLandlord={false}>
      <div className="container mx-auto ">
        <h1 className="text-3xl font-bold mb-2">All Properties</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Input
              type="text"
              placeholder="Search properties by name, location, university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-6 text-gray-400 hover:text-gray-600 z-10 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-1">
              {filteredProperties.length} total student houses
            </h2>
            <p className="text-muted-foreground">
              Find the perfect house from our properties. Filter and sort the
              list to find the one that suits you.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              defaultValue="relevance"
              onValueChange={(value) => setSortOption(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort by relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
            <FilterMenu onFilterApply={handleFilterApply} />
            <Button
              variant="outline"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              disabled={favList.length === 0 && !showFavoritesOnly}
            >
              Favorites
              <Heart
                fill={showFavoritesOnly ? "#ffb200" : "none"}
                className={`w-5 h-5 hover:text-primary transition-colors ${
                  showFavoritesOnly ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(filteredProperties) &&
          filteredProperties.length > 0 ? (
            filteredProperties?.map((property) => (
              <Card
                key={property.id}
                className="overflow-hidden group cursor-pointer py-0"
                onClick={() => {
                  router.push(`properties/${property.id}`);
                }}
              >
                <div className="relative">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={
                          property.images[activeImage[property.id] || 0]?.image
                        }
                        alt={"Property image"}
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        No image available
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(property.id);
                      }}
                      className={`absolute top-2 z-10 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors`}
                    >
                      <Heart
                        fill={
                          favList.includes(property.id) ? "#ffb200" : "none"
                        }
                        className={`w-5 h-5 hover:text-primary transition-colors ${
                          favList.includes(property.id)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  </div>
                  {property.images && property.images.length > 0 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                      {property.images.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            (activeImage[property.id] || 0) === index
                              ? "bg-white"
                              : "bg-white/50"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImage({
                              ...activeImage,
                              [property.id]: index,
                            });
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {property.billsIncluded && (
                      <Badge variant="secondary" className="font-normal">
                        Bills Included
                      </Badge>
                    )}
                    <Badge variant="secondary" className="font-normal">
                      <Droplets className="w-3 h-3 mr-1" />
                      {property.bathrooms}{" "}
                      {property.bathrooms === 1 ? "bathroom" : "bathrooms"}
                    </Badge>
                    {property.status && (
                      <Badge
                        variant={
                          property.status === "available"
                            ? "default"
                            : "secondary"
                        }
                        className="font-normal"
                      >
                        {property.status.charAt(0).toUpperCase() +
                          property.status.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {property.name} | {property.rooms} Bedroom
                  </h3>
                  <p className="flex items-center text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    {property.address}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3 ml-5">
                    {property.area?.name && property.city?.name
                      ? `${property.area.name}, ${property.city.name}`
                      : property.area?.name
                      ? property.area.name
                      : property.city?.name
                      ? property.city.name
                      : ""}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <PriceDisplay
                      priceInfo={getPriceDisplayInfo(
                        property,
                        session?.role,
                        true
                      )}
                      size="sm"
                      utilityAmount={property.utilityAmount}
                    />
                    <span className="text-muted-foreground text-sm ml-2">
                      per person per week
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="px-4 py-3 bg-muted/50 text-sm">
                  {property.status === "pending" ? (
                    <span className="text-yellow-600 font-medium">
                      Pending approval
                    </span>
                  ) : property.status === "rejected" ? (
                    <span className="text-red-600 font-medium">
                      Not available
                    </span>
                  ) : property.availableAfter && property.availableTo ? (
                    <span className="text-blue-600 font-medium">
                      Available from{" "}
                      {new Date(property.availableAfter).toLocaleDateString()}{" "}
                      to {new Date(property.availableTo).toLocaleDateString()}
                    </span>
                  ) : property.availableAfter ? (
                    new Date(property.availableAfter) > new Date() ? (
                      <span className="text-blue-600 font-medium">
                        Available from{" "}
                        {new Date(property.availableAfter).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">
                        Available now
                      </span>
                    )
                  ) : property.availableTo ? (
                    <span className="text-orange-600 font-medium">
                      Available until{" "}
                      {new Date(property.availableTo).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">
                      Available now
                    </span>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No properties found</p>
              {(activeFilters || searchQuery) && (
                <Button
                  variant="link"
                  onClick={() => {
                    setActiveFilters(null);
                    setSearchQuery("");
                  }}
                  className="mt-2"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </LandlordGuard>
  );
}
