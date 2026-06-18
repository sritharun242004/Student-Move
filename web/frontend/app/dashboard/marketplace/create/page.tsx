"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MarketplaceService } from "@/services/marketplace.service";
import { CreateEditListingForm } from "@/components/marketplace/CreateEditListingForm";
import type { ListingCategory, CreateListingPayload } from "@/types/marketplaceTypes";
import type { ListingFormValues } from "@/components/marketplace/CreateEditListingForm";

export default function CreateListingPage() {
  const { data: session } = useSession();
  const token = session?.access ?? "";
  const router = useRouter();

  const [categories, setCategories] = useState<ListingCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    MarketplaceService.getCategories(token)
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories."))
      .finally(() => setLoadingCategories(false));
  }, [token]);

  const handleUploadPhotos = async (files: File[]): Promise<string[]> => {
    const uploaded = await MarketplaceService.uploadPhotos(files, token);
    return uploaded.map((p) => p.photoUrl);
  };

  const handleSubmit = async (values: ListingFormValues, photoUrls: string[]) => {
    setSubmitting(true);
    try {
      const payload: CreateListingPayload = {
        title: values.title,
        description: values.description,
        price: values.price,
        location: values.location,
        categoryId: Number(values.categoryId),
        listingType: values.listingType,
        totalStock: values.listingType === "STOCK" ? values.totalStock : undefined,
        contactNumber: values.contactNumber,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      };

      const created = await MarketplaceService.createListing(payload, token);
      toast.success("Listing created!");
      router.push(`/dashboard/marketplace/${created.id}`);
    } catch {
      toast.error("Failed to create listing. Please try again.");
      setSubmitting(false);
    }
  };

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/marketplace/mine">
          <ArrowLeft className="h-4 w-4 mr-1" /> My Listings
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Listing</h1>
        <p className="text-muted-foreground text-sm">List an item for sale on the marketplace</p>
      </div>

      <CreateEditListingForm
        categories={categories}
        submitting={submitting}
        onSubmit={handleSubmit}
        onUploadPhotos={handleUploadPhotos}
        submitLabel="Create Listing"
      />
    </div>
  );
}
