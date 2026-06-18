"use client";

import { useState, useEffect } from "react";
import { MapPin, Droplets, Map, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Property } from "@/types/propertyTypes";
import { LandlordGuard } from "@/components/dashboard/landlord-guard";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { getPriceDisplayInfo } from "@/utils/priceUtils";
import { PriceDisplay } from "@/components/ui/price-display";
import { useLandlordContext } from "@/app/store/useLandlordContext";

export default function PropertyList() {
  const { data: session } = useSession();
  const router = useRouter();
  const axios = useAgentAxios();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<{ [key: number]: number }>({
    [0]: 0,
  });
  const [sortOption, setSortOption] = useState<string>("relevance");
  const { selectedLandlord, setSelectedLandlord, clearSelectedLandlord } =
    useLandlordContext();

  useEffect(() => {
    if (!session) {
      return;
    }
    const fetchProperties = async () => {
      try {
        const response = await axios.get("/properties/");

        let data = await response.data.data;

        // Sort properties based on selected option
        if (sortOption === "price-asc") {
          data = [...data].sort(
            (a, b) => parseFloat(a.price) - parseFloat(b.price)
          );
        } else if (sortOption === "price-desc") {
          data = [...data].sort(
            (a, b) => parseFloat(b.price) - parseFloat(a.price)
          );
        } else if (sortOption === "newest") {
          data = [...data].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
        }

        setProperties(data);
      } catch (err) {
        toast("Error", {
          description: "Something went wrong!",
        });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [session, sortOption, selectedLandlord]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">Loading properties...</div>
    );
  }

  if (error) {
    return <div className="container mx-auto py-8 px-4">Error: {error}</div>;
  }

  return (
    <LandlordGuard>
      <div className="container mx-auto  px-4">
        <h1 className="text-3xl font-bold mb-2">My Properties</h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-1">
              {properties.length} total student houses
            </h2>
            <p className="text-muted-foreground">
              View and manage your properties
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              defaultValue="relevance"
              onValueChange={(value) => setSortOption(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort by relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(properties) && properties.length > 0 ? (
            properties?.map((property) => (
              <Card
                key={property.id}
                className="overflow-hidden group cursor-pointer py-0"
                onClick={() => {
                  router.push(`properties/${property.id}`);
                }}
              >
                <div className="relative">
                  <div className="aspect-[4/3] relative overflow-hidden flex items-center">
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
                    <div className="absolute top-2 right-2 z-20 rounded-full bg-white shadow-md hover:bg-gray-50 hover:shadow-lg transition-all duration-200 border border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`my-properties/edit/${property.id}`);
                        }}
                        className="p-2 rounded-full bg-white hover:bg-gray-50 transition-colors"
                        title="Edit Property"
                      >
                        <Edit className="w-4 h-4 text-gray-600 hover:text-yellow-600 transition-colors cursor-pointer" />
                      </button>
                    </div>
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
                          onClick={() =>
                            setActiveImage({
                              ...activeImage,
                              [property.id]: index,
                            })
                          }
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
                  <p className="text-sm text-muted-foreground/80 mb-3 ml-5">
                    {property.area?.name && property.city?.name
                      ? `${property.area.name}, ${property.city.name}`
                      : property.city?.name || "Location not specified"}
                  </p>
                  <div className="flex items-baseline gap-1">
                    {property.display_price || property.price}
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
                  ) : property.status === "flagged" ? (
                    <span className="text-orange-600 font-medium">
                      Flagged for review
                    </span>
                  ) : property.availableAfter && property.availableTo ? (
                    <span className="text-blue-600 font-medium">
                      Available from{" "}
                      {new Date(property.availableAfter).toLocaleDateString()}{" "}
                      to {new Date(property.availableTo).toLocaleDateString()}
                    </span>
                  ) : property.availableAfter ? (
                    <span className="text-blue-600 font-medium">
                      Available from{" "}
                      {new Date(property.availableAfter).toLocaleDateString()}
                    </span>
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
            </div>
          )}
        </div>
      </div>
    </LandlordGuard>
  );
}
