"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Tag,
  Package,
  Loader2,
  MessageCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MarketplaceService } from "@/services/marketplace.service";
import type { Listing } from "@/types/marketplaceTypes";

const statusVariant = (status: Listing["status"]) => {
  if (status === "ACTIVE") return "default" as const;
  if (status === "SOLD") return "secondary" as const;
  return "destructive" as const;
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.access ?? "";
  const userRole = session?.role ?? "";

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingConversation, setStartingConversation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    setLoading(true);
    MarketplaceService.getListing(id, token)
      .then(setListing)
      .catch(() => toast.error("Failed to load listing."))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleContactSeller = async () => {
    if (!listing) return;
    setStartingConversation(true);
    try {
      const conversation = await MarketplaceService.startConversation(listing.id, token);
      router.push(`/dashboard/marketplace/conversations/${conversation.id}`);
    } catch {
      toast.error("Failed to start conversation. Please try again.");
    } finally {
      setStartingConversation(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Listing not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/marketplace">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  // Determine if the current user is the owner
  // session?.user?.id is the user ID; listing.studentId is the student's user ID
  const isOwner = userRole === "tenant" && listing.studentId === Number(session?.id);

  const selectedPhoto = listing.photos?.[selectedPhotoIndex];

  return (
    <div className="container mx-auto space-y-6">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/marketplace">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Marketplace
        </Link>
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
                    i === selectedPhotoIndex ? "border-primary" : "border-transparent"
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
            <h1 className="md:text-3xl text-xl  font-bold leading-snug">{listing.title}</h1>
            {/* <Badge variant={statusVariant(listing.status)} className="flex-shrink-0">
              {listing.status}
            </Badge> */}
             {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {/* Non-owner tenant: contact seller */}
            {userRole === "tenant" && !isOwner && listing.status === "ACTIVE" && (
              <Button onClick={handleContactSeller} disabled={startingConversation}>
                {startingConversation ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="mr-2 h-4 w-4" />
                )}
                Contact Seller
              </Button>
            )}

            {/* Owner actions */}
            {isOwner && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/marketplace/edit/${listing.id}`}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Link>
                </Button>
              </>
            )}
          </div>
          </div>

          <p className="text-3xl font-bold text-primary">
            {Number(listing.price).toLocaleString("en-LK", { minimumFractionDigits: 2 })} €
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
                {showPhone ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
                <p className="text-sm font-medium">{listing.sellerProfile.displayName}</p>
              </div>
            </div>
          )}

          {/* Stock info */}
          {listing.listingType === "STOCK" && listing.totalStock !== null && (
            <p className="text-sm text-muted-foreground">
              Stock: {listing.totalStock - listing.soldItems} remaining of {listing.totalStock}
            </p>
          )}

          {/* Description */}
          <div className="border-t pt-4">
            <h2 className="font-semibold mb-2 text-sm">Description</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
          </div>

          

         
        </div>
      </div>
    </div>
  );
}
