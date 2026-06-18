"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MarketplaceService } from "@/services/marketplace.service";
import { CreateEditListingForm } from "@/components/marketplace/CreateEditListingForm";
import type { Listing, ListingCategory, UpdateListingPayload } from "@/types/marketplaceTypes";
import type { ListingFormValues } from "@/components/marketplace/CreateEditListingForm";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.access ?? "";

  const [listing, setListing] = useState<Listing | null>(null);
  const [categories, setCategories] = useState<ListingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    setLoading(true);
    Promise.all([
      MarketplaceService.getListing(id, token),
      MarketplaceService.getCategories(token),
    ])
      .then(([listingData, categoriesData]) => {
        setListing(listingData);
        setCategories(categoriesData);
      })
      .catch(() => toast.error("Failed to load listing data."))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleUploadPhotos = async (files: File[]): Promise<string[]> => {
    const uploaded = await MarketplaceService.uploadPhotos(files, token);
    return uploaded.map((p) => p.photoUrl);
  };

  const handleSubmit = async (values: ListingFormValues, photoUrls: string[]) => {
    if (!id) return;
    setSubmitting(true);
    try {
      const payload: UpdateListingPayload = {
        title: values.title,
        description: values.description,
        price: values.price,
        location: values.location,
        categoryId: Number(values.categoryId),
        totalStock: values.listingType === "STOCK" ? values.totalStock : undefined,
        contactNumber: values.contactNumber,
        photoUrls: photoUrls,
      };

      await MarketplaceService.updateListing(id, payload, token);
      toast.success("Listing updated!");
      router.push(`/dashboard/marketplace/${id}`);
    } catch {
      toast.error("Failed to update listing. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Listing not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/marketplace/mine">My Listings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/dashboard/marketplace/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Listing
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Listing</h1>
        <p className="text-muted-foreground text-sm">Update your listing details</p>
      </div>

      <CreateEditListingForm
        categories={categories}
        initialValues={{
          title: listing.title,
          description: listing.description,
          price: listing.price,
          location: listing.location,
          categoryId: String(listing.category.id),
          listingType: listing.listingType,
          totalStock: listing.totalStock ?? undefined,
          contactNumber: listing.contactNumber,
          photoUrls: listing.photos.map((p) => p.photoUrl),
        }}
        submitting={submitting}
        onSubmit={handleSubmit}
        onUploadPhotos={handleUploadPhotos}
        submitLabel="Save Changes"
      />
    </div>
  );
}
