"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MerchantOffer, MerchantService, MerchantStatus } from "@/services/merchant.service";

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

interface OfferFormState {
  title: string;
  description: string;
  discountType: DiscountType;
  usageLimit: string;
  perStudentLimit: string;
  expiryDate: string;
  isActive: boolean;
  imageUrl: string;
}

const initialFormState: OfferFormState = {
  title: "",
  description: "",
  discountType: "PERCENTAGE",
  usageLimit: "",
  perStudentLimit: "1",
  expiryDate: "",
  isActive: true,
  imageUrl: "",
};

const toDateInputValue = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
};

const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function OfferDescription({ description }: { description?: string }) {
  const [showFade, setShowFade] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);

  const updateFadeState = (element: HTMLParagraphElement | null) => {
    if (!element) {
      return;
    }

    const hasOverflow = element.scrollHeight > element.clientHeight + 1;
    const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
    setShowFade(hasOverflow && !isAtBottom);
  };

  useEffect(() => {
    updateFadeState(descriptionRef.current);
  }, [description]);

  return (
    <div className="relative mt-1">
      <p
        ref={descriptionRef}
        onScroll={(event) => updateFadeState(event.currentTarget)}
        className="text-sm max-h-40 overflow-y-auto text-muted-foreground whitespace-pre-wrap pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {description || "-"}
      </p>
      {showFade && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
      )}
    </div>
  );
}

export default function MerchantOffersPage() {
  const { data: session } = useSession();
  const [offers, setOffers] = useState<MerchantOffer[]>([]);
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [isPreviewImageLoading, setIsPreviewImageLoading] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<MerchantOffer | null>(null);
  const [formState, setFormState] = useState<OfferFormState>(initialFormState);

  const isMerchant = session?.role === "merchant";
  const isCreateLocked =
    merchantStatus?.isSuspended === true || merchantStatus?.isApproved === false;

  const loadOffers = async (showLoader = true) => {
    if (!session?.access || !isMerchant) {
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      } 

      const [offersResult, statusResult] = await Promise.allSettled([
        MerchantService.getMyOffers(session.access),
        MerchantService.getMyStatus(session.access),
      ]);

      if (offersResult.status === "fulfilled") {
        setOffers(Array.isArray(offersResult.value) ? offersResult.value : []);
      } else {
        throw offersResult.reason;
      }

      if (statusResult.status === "fulfilled") {
        setMerchantStatus(statusResult.value);
      }
    } catch (error) {
      console.error("Failed to load offers", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.access || !isMerchant) {
      return;
    }

    loadOffers(true);
  }, [session?.access, isMerchant]);

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingOfferId(null);
  };

  const handleOpenCreateOfferModal = () => {
    if (isCreateLocked) {
      toast.error("Your merchant account is inactive or suspended. You cannot create offers.");
      return;
    }

    resetForm();
    setIsOfferModalOpen(true);
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !session?.access) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    try {
      setUploadingImage(true);
      const uploaded = await MerchantService.uploadOfferImage(file, session.access);
      setFormState((prev) => ({ ...prev, imageUrl: uploaded.imageUrl }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload failed", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitOffer = async () => {
    if (!session?.access) {
      return;
    }

    if (!formState.title.trim() || !formState.description.trim() || !formState.expiryDate) {
      toast.error("Title, description and expiry date are required");
      return;
    }

    const perStudentLimit = Number(formState.perStudentLimit || "0");
    const usageLimit = formState.usageLimit ? Number(formState.usageLimit) : undefined;

    if (!Number.isFinite(perStudentLimit) || perStudentLimit <= 0) {
      toast.error("Per-student limit must be greater than 0");
      return;
    }

    if (usageLimit !== undefined && (!Number.isFinite(usageLimit) || usageLimit <= 0)) {
      toast.error("Usage limit must be greater than 0");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: formState.title.trim(),
        description: formState.description,
        discountType: formState.discountType,
        usageLimit,
        imageUrl: formState.imageUrl || undefined,
        perStudentLimit,
        expiryDate: new Date(formState.expiryDate).toISOString(),
        isActive: formState.isActive,
      };

      if (editingOfferId) {
        await MerchantService.updateOffer(editingOfferId, payload, session.access);
        toast.success("Offer updated successfully");
      } else {
        await MerchantService.createOffer(payload, session.access);
        toast.success("Offer created successfully");
      }

      resetForm();
      setIsOfferModalOpen(false);
      await loadOffers(false);
    } catch (error) {
      console.error("Failed to save offer", error);
      toast.error("Failed to save offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOffer = (offer: MerchantOffer) => {
    setEditingOfferId(offer.id);
    setFormState({
      title: offer.title || "",
      description: offer.description || "",
      discountType: offer.discountType || "PERCENTAGE",
      usageLimit: offer.usageLimit ? String(offer.usageLimit) : "",
      perStudentLimit: offer.perStudentLimit ? String(offer.perStudentLimit) : "1",
      expiryDate: toDateInputValue(offer.expiryDate),
      isActive: offer.isActive,
      imageUrl: offer.imageUrl || "",
    });
    setIsOfferModalOpen(true);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!session?.access) {
      return;
    }

    try {
      setDeletingOfferId(offerId);
      await MerchantService.deleteOffer(offerId, session.access);
      setOffers((prev) => prev.filter((offer) => offer.id !== offerId));
      toast.success("Offer deleted successfully");
      if (editingOfferId === offerId) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to delete offer", error);
      toast.error("Failed to delete offer");
    } finally {
      setDeletingOfferId(null);
    }
  };

  const handleConfirmDeleteOffer = async () => {
    if (!offerToDelete) {
      return;
    }

    await handleDeleteOffer(offerToDelete.id);
    setOfferToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <p className="text-muted-foreground">Loading offers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Manage Offers</h2>
          <div className="text-muted-foreground">
            <h1> Manage your offers and their details.</h1>
            <h1 className="text-sm text-gray-400 pt-1"> Total offers: {offers.length}</h1>
          </div>
        </div>
        <Button onClick={handleOpenCreateOfferModal} disabled={isCreateLocked}>
          <Plus className="h-4 w-4 mr-2" />
          Create Offer
        </Button>
      </div>
      {merchantStatus?.isApproved === false && (
        <Alert className="border-orange-200 bg-orange-50 text-orange-800">
            <AlertTriangle className={`h-4 w-4 text-orange-600 `} /> 
          <AlertDescription>
            Your merchant account is inactive (pending approval). You cannot create new offers until approval is completed.
          </AlertDescription>
        </Alert>
      )}

      {merchantStatus?.isSuspended && (
        <Alert variant="destructive">
          <AlertTriangle className={`h-4 w-4 text-destructive `} />
          <AlertDescription>
            Your merchant account is suspended. Offer creation is locked. Please contact support.
          </AlertDescription>
        </Alert>
      )}
          {offers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No offers found. Create your first offer to attract students!</p>
              <Button
                className="m-2 mt-4"
                variant="outline"
                onClick={handleOpenCreateOfferModal}
                disabled={isCreateLocked}
              >
                Create Offer
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {offers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden py-0 gap-0">
                  <div className="relative">
                    {offer.imageUrl ? (
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() =>
                          {
                            setIsPreviewImageLoading(true);
                          setPreviewImage({
                            src: offer.imageUrl as string,
                            alt: offer.title || "Offer image",
                          });
                          }
                        }
                        aria-label="See full image"
                      >
                        <img
                          src={offer.imageUrl}
                          alt={offer.title || "Offer image"}
                          className="aspect-[4/3] w-full object-cover cursor-pointer bg-muted"
                        />
                      </button>
                    ) : (
                       <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                          No image
                        </div>
                    )}

                     <div className="absolute bottom-3 right-3 flex flex-wrap gap-2">
                      <Badge className={offer.isActive ? "bg-green-500/80 border-green-500 text-white" : ""} variant={offer.isActive ? "outline" : "secondary"}>
                        {offer.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge className="bg-primary/80 text-gray-200">{offer.discountType === "PERCENTAGE" ? "Percentage" : offer.discountType === "FIXED_AMOUNT" ? "Fixed Amount" : "-"}</Badge>
                    </div>

                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={() => handleEditOffer(offer)}
                        aria-label="Edit offer"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setOfferToDelete(offer)}
                        disabled={deletingOfferId === offer.id}
                        aria-label="Delete offer"
                      >
                        {deletingOfferId === offer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <CardContent className="space-y-3 p-4 grid grid-cols-3 gap-1">
                    <div className="col-span-2">
                      <h3 className="text-base font-semibold leading-tight pb-2">{offer.title}</h3>
                      <OfferDescription description={offer.description} />
                    </div>
                    <div className="text-sm pt-2">
                      <div className="pb-2">
                        <p className="text-muted-foreground">Voucher Usage</p>
                        <p className="font-medium">{offer.usedCount} / {offer.usageLimit ?? "-"}</p>
                      </div>
                      <div className="pb-2">
                        <p className="text-muted-foreground">Per Student Limit</p>
                        <p className="font-medium">{offer.perStudentLimit ?? "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expire Date</p>
                        <p className="font-medium">{formatDate(offer.expiryDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

      <Dialog
        open={Boolean(previewImage)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewImage(null);
            setIsPreviewImageLoading(false);
          }
        }}
      >
        <DialogContent className="!max-w-fit p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{previewImage?.alt || "Offer image preview"}</DialogTitle>
            <DialogDescription>Full size preview of the selected offer image.</DialogDescription>
          </DialogHeader>
          {previewImage && (
            <div className="relative w-[80vw] h-[80vh]  bg-black flex items-center justify-center">
              {isPreviewImageLoading && (
                <Loader2 className="h-8 w-8 animate-spin text-white/80" />
              )}
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                onLoad={() => setIsPreviewImageLoading(false)}
                onError={() => setIsPreviewImageLoading(false)}
                className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
                  isPreviewImageLoading ? "opacity-0" : "opacity-100"
                }`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(offerToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setOfferToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{offerToDelete?.title ? ` \"${offerToDelete.title}\"` : " this offer"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOfferToDelete(null)}
              disabled={deletingOfferId === offerToDelete?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteOffer}
              disabled={deletingOfferId === offerToDelete?.id}
            >
              {deletingOfferId === offerToDelete?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOfferModalOpen}
        onOpenChange={(open) => {
          setIsOfferModalOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent  className="max-h-[90vh] !max-w-fit overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOfferId ? "Update Offer" : "Create Offer"}</DialogTitle>
            <DialogDescription>
              {editingOfferId
                ? "Update selected offer details"
                : "Create a new offer for students"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="10% off Coffee"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={formState.discountType}
                  onValueChange={(value: DiscountType) =>
                    setFormState((prev) => ({ ...prev, discountType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">FIXED_AMOUNT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                rows={7}
                id="description"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Valid for all hot coffees"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage Limit (optional)</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min={1}
                  value={formState.usageLimit}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, usageLimit: event.target.value }))
                  }
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="perStudentLimit">Per Student Limit</Label>
                <Input
                  id="perStudentLimit"
                  type="number"
                  min={1}
                  value={formState.perStudentLimit}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, perStudentLimit: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="datetime-local"
                  value={formState.expiryDate}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, expiryDate: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 items-end">
              <div className="space-y-2">
                <Label htmlFor="image">Offer Image (optional)</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} />
                {formState.imageUrl && (
                  <p className="text-xs text-muted-foreground break-all">
                    Image Uploaded.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formState.isActive}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            </div>

            {uploadingImage && (
              <p className="text-sm text-muted-foreground flex items-center">
                <Upload className="h-4 w-4 mr-2" /> Uploading image...
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOfferModalOpen(false);
                resetForm();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button onClick={handleSubmitOffer} disabled={submitting || uploadingImage}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : editingOfferId ? (
                <Pencil className="h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {editingOfferId ? "Update Offer" : "Create Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
