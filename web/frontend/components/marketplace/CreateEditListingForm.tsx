"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { PhotoUploader } from "./PhotoUploader";
import type { ListingCategory, CreateListingPayload } from "@/types/marketplaceTypes";

export type ListingFormValues = Omit<CreateListingPayload, "photoUrls" | "listingType" | "categoryId"> & {
  listingType: "SINGLE" | "STOCK";
  categoryId: string;
  totalStock?: number;
};

interface CreateEditListingFormProps {
  categories: ListingCategory[];
  initialValues?: Partial<ListingFormValues & { photoUrls: string[] }>;
  submitting: boolean;
  onSubmit: (values: ListingFormValues, photoUrls: string[]) => void;
  onUploadPhotos: (files: File[]) => Promise<string[]>;
  submitLabel?: string;
}

export function CreateEditListingForm({
  categories,
  initialValues,
  submitting,
  onSubmit,
  onUploadPhotos,
  submitLabel = "Save Listing",
}: CreateEditListingFormProps) {
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialValues?.photoUrls ?? []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingFormValues>({
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      price: initialValues?.price ?? (undefined as unknown as number),
      location: initialValues?.location ?? "",
      categoryId: initialValues?.categoryId ?? "",
      listingType: initialValues?.listingType ?? "SINGLE",
      totalStock: initialValues?.totalStock,
      contactNumber: initialValues?.contactNumber ?? "",
    },
  });

  const listingType = watch("listingType");

  const parentCategories = categories.filter((c) => c.parentId === null);
  const subsByParent = (parentId: number) =>
    categories.filter((c) => c.parentId === parentId);

  const handleFormSubmit = (values: ListingFormValues) => {
    onSubmit(values, photoUrls);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="e.g. Macbook - Great Condition"
          maxLength={200}
          {...register("title", { required: "Title is required", maxLength: { value: 200, message: "Max 200 characters" } })}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe your item..."
          rows={4}
          {...register("description", { required: "Description is required" })}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {/* Price & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (EUR) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min={0}
            placeholder="0.00"
            {...register("price", {
              required: "Price is required",
              min: { value: 0, message: "Price must be 0 or more" },
              valueAsNumber: true,
            })}
          />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            placeholder="e.g. Abbey Road, London"
            {...register("location", { required: "Location is required" })}
          />
          {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
        </div>
      </div>

      {/* Category & Listing Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select
            value={watch("categoryId")}
            onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {parentCategories.map((parent) => {
                const children = subsByParent(parent.id);
                return (
                  <React.Fragment key={parent.id}>
                    <SelectItem value={String(parent.id)}>
                      {parent.name}
                    </SelectItem>
                    {children.map((sub) => (
                      <SelectItem key={sub.id} value={String(sub.id)} className="pl-6">
                        <span className="text-muted-foreground mr-1">›</span> {sub.name}
                      </SelectItem>
                    ))}
                  </React.Fragment>
                );
              })}
              {categories
                .filter((c) => c.parentId !== null && !parentCategories.find((p) => p.id === c.parentId))
                .map((sub) => (
                  <SelectItem key={sub.id} value={String(sub.id)}>
                    {sub.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <input
            type="hidden"
            {...register("categoryId", { required: "Category is required" })}
          />
          {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Listing Type *</Label>
          <Select
            value={listingType}
            onValueChange={(v) => setValue("listingType", v as "SINGLE" | "STOCK")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">Single Item</SelectItem>
              <SelectItem value="STOCK">Stock (multiple units)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Total Stock (only for STOCK type) */}
      {listingType === "STOCK" && (
        <div className="space-y-1.5">
          <Label htmlFor="totalStock">Total Stock *</Label>
          <Input
            id="totalStock"
            type="number"
            min={1}
            placeholder="e.g. 10"
            {...register("totalStock", {
              required: listingType === "STOCK" ? "Total stock is required for stock listings" : false,
              min: { value: 1, message: "Must be at least 1" },
              valueAsNumber: true,
            })}
          />
          {errors.totalStock && <p className="text-xs text-destructive">{errors.totalStock.message}</p>}
        </div>
      )}
      </div>

      

      {/* Contact Number */}
      <div className="space-y-1.5">
        <Label htmlFor="contactNumber">Contact Number *</Label>
        <Input
          id="contactNumber"
          placeholder="01577 234567"
          {...register("contactNumber", { required: "Contact number is required" })}
        />
        {errors.contactNumber && (
          <p className="text-xs text-destructive">{errors.contactNumber.message}</p>
        )}
      </div>

      {/* Photos */}
      <div className="space-y-1.5">
        <Label>Photos</Label>
        <PhotoUploader
          photoUrls={photoUrls}
          onPhotosChange={setPhotoUrls}
          onUpload={onUploadPhotos}
          disabled={submitting}
        />
      </div>

      {/* Submit */}
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
