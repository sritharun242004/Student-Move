"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Tag, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/types/marketplaceTypes";

interface ListingCardProps {
  listing: Listing;
  basePath?: string;
}

const statusVariant = (status: Listing["status"]) => {
  if (status === "ACTIVE") return "default";
  if (status === "SOLD") return "secondary";
  return "destructive";
};

export function ListingCard({ listing, basePath = "/dashboard/marketplace" }: ListingCardProps) {
  const firstPhoto = listing.photos?.[0];

  return (
    <Link href={`${basePath}/${listing.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col py-0">
        {/* Photo */}
        <div className="relative w-full aspect-video bg-muted rounded-t-lg overflow-hidden flex-shrink-0">
          {firstPhoto ? (
            <Image
              src={firstPhoto.photoUrl}
              alt={listing.title}
              fill
              className="object-cover h-full w-full"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            {
              listing.status === "SOLD" && (
                <Badge variant="secondary">SOLD</Badge>
              )
            }
          </div>
        </div>

        <CardContent className="p-4 flex flex-col gap-2 flex-1">
          {/* Title & price */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1">
              {listing.title}
            </h3>
            <span className="text-primary font-bold whitespace-nowrap text-sm">
                {Number(listing.price).toLocaleString("en-LK", { minimumFractionDigits: 2 })} €
            </span>
          </div>

           {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>

          {/* Category */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Tag className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{listing.category.name}</span>
          </div>

          {/* Seller */}
          {listing.sellerProfile && (
            <div className="flex items-center gap-2 mt-auto pt-2 border-t">
              {listing.sellerProfile.profilePhotoUrl ? (
                <Image
                  src={listing.sellerProfile.profilePhotoUrl}
                  alt={listing.sellerProfile.displayName}
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                  {listing.sellerProfile.displayName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="text-xs text-muted-foreground truncate">
                {listing.sellerProfile.displayName}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
