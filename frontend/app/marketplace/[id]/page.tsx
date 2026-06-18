"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Tag,
  Package,
  Loader2,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketplaceService } from "@/services/marketplace.service";
import type { Listing } from "@/types/marketplaceTypes";

const statusVariant = (status: Listing["status"]) => {
  if (status === "ACTIVE") return "default" as const;
  if (status === "SOLD") return "secondary" as const;
  return "destructive" as const;
};

export default function PublicListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    MarketplaceService.getListing(id, "")
      .then(setListing)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Listing not found.</p>
        <Button variant="outline" onClick={() => router.push("/marketplace")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Marketplace
        </Button>
      </div>
    );
  }

  const selectedPhoto = listing.photos?.[selectedPhotoIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/">
            <img src="/smlogo-t.png" width={220} alt="Student Moves" />
          </a>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/public-properties" className="text-gray-600 hover:text-primary transition-colors">Properties</a>
            <a href="/reels" className="text-gray-600 hover:text-primary transition-colors">Student Reels</a>
            <a href="/marketplace" className="text-primary font-medium transition-colors">Marketplace</a>
            <a href="/offers" className="text-gray-600 hover:text-primary transition-colors">Offers</a>
            <a href="/faq" className="text-gray-600 hover:text-primary transition-colors">FAQ</a>
          </nav>
          <Button className="cursor-pointer text-white" onClick={() => router.push("/auth/signin")}>
            Sign In
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => router.push("/marketplace")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Photos */}
          <div className="space-y-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border">
              {selectedPhoto ? (
                <Image
                  src={selectedPhoto.photoUrl}
                  alt={listing.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {listing.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {listing.photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhotoIndex(i)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      i === selectedPhotoIndex
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={photo.photoUrl}
                      alt={`Photo ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="md:text-3xl text-xl font-bold leading-snug">
                {listing.title}
              </h1>
              <Badge variant={statusVariant(listing.status)} className="flex-shrink-0">
                {listing.status}
              </Badge>
            </div>

            <p className="text-3xl font-bold text-primary">
              {Number(listing.price).toLocaleString("en-LK", {
                minimumFractionDigits: 2,
              })}{" "}
              €
            </p>

            {/* Meta */}
            <div className="space-y-2 sm:text-sm text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <span>{listing.category.name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{listing.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="font-mono">
                  {showPhone ? listing.contactNumber : "••••••••••"}
                </span>
                <button
                  onClick={() => setShowPhone((v) => !v)}
                  className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPhone ? "Hide contact number" : "Show contact number"}
                >
                  {showPhone ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Seller */}
            {listing.sellerProfile && (
              <div className="flex items-center gap-3 border-t pt-4">
                {listing.sellerProfile.profilePhotoUrl ? (
                  <Image
                    src={listing.sellerProfile.profilePhotoUrl}
                    alt={listing.sellerProfile.displayName}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {listing.sellerProfile.displayName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Listed by</p>
                  <p className="text-sm font-medium">
                    {listing.sellerProfile.displayName}
                  </p>
                </div>
              </div>
            )}

            {/* Stock info */}
            {listing.listingType === "STOCK" && listing.totalStock !== null && (
              <p className="text-sm text-muted-foreground">
                Stock: {listing.totalStock - listing.soldItems} remaining of{" "}
                {listing.totalStock}
              </p>
            )}

            {/* CTA — redirect to login to contact seller */}
            {listing.status === "ACTIVE" && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Interested in this item? Sign in to message the seller.
                </p>
                <Button
                  onClick={() => router.push("/auth/signin")}
                  className="w-full gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in to contact the seller
                </Button>
              </div>
            )}

            {/* Description */}
            <div className="border-t pt-4">
              <h2 className="font-semibold mb-2 text-sm">Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
