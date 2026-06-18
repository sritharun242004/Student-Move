"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ticket, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import {
  MerchantService,
  StudentMerchantOffer,
} from "@/services/merchant.service";

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDiscountLabel = (offer: StudentMerchantOffer) => {
  if (offer.discountType === "PERCENTAGE") return "Percentage";
  if (offer.discountType === "FIXED_AMOUNT") return "Fixed amount";
  return "-";
};

function OfferDescription({ description }: { description?: string }) {
  const [showFade, setShowFade] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);

  const updateFadeState = (element: HTMLParagraphElement | null) => {
    if (!element) return;
    const hasOverflow = element.scrollHeight > element.clientHeight + 1;
    const isAtBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
    setShowFade(hasOverflow && !isAtBottom);
  };

  useEffect(() => {
    updateFadeState(descriptionRef.current);
  }, [description]);

  return (
    <div className="relative mt-1">
      <p
        ref={descriptionRef}
        onScroll={(e) => updateFadeState(e.currentTarget)}
        className="text-sm max-h-36 overflow-y-auto text-muted-foreground whitespace-pre-wrap pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {description || "-"}
      </p>
      {showFade && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
      )}
    </div>
  );
}

export default function PublicOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<StudentMerchantOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<StudentMerchantOffer["merchant"] | null>(null);

  useEffect(() => {
    MerchantService.getActiveOffers("")
      .then((data) => setOffers(Array.isArray(data) ? data : []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="h-7 w-7" />
            Merchant Offers
          </h1>
          <p className="text-muted-foreground mt-1">
            Exclusive discounts from our partnered merchants for Student Moves tenants.
          </p>
        </div>

        {/* Offers grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Ticket className="h-12 w-12" />
            <p className="text-sm">No active merchant offers right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <Card key={offer.id} className="overflow-hidden py-0 gap-0 border">
                <div className="relative">
                  {offer.imageUrl ? (
                    <img
                      src={offer.imageUrl}
                      alt={offer.title || "Offer image"}
                      className="aspect-[4/3] w-full object-cover bg-muted"
                    />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-green-500/80 border-green-500 text-white">
                      Active
                    </Badge>
                    <Badge className="bg-primary/80 text-gray-200">
                      {getDiscountLabel(offer)}
                    </Badge>
                  </div>
                </div>

                <CardContent className="space-y-3 p-4 grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <h3 className="text-base font-semibold leading-tight pb-1">
                      {offer.title}
                    </h3>
                    <CardDescription>
                      <button
                        type="button"
                        onClick={() => setSelectedMerchant(offer.merchant)}
                        className="flex items-center gap-1.5 text-primary font-medium cursor-pointer text-left"
                      >
                        {offer.merchant.profileImageUrl ? (
                          <img
                            src={offer.merchant.profileImageUrl}
                            alt={offer.merchant.businessName || "Merchant logo"}
                            className="w-5 h-5 rounded-full object-cover shrink-0 border"
                          />
                        ) : null}
                        {offer.merchant.businessName || "Merchant offer"}
                      </button>
                    </CardDescription>
                    <OfferDescription description={offer.description} />
                  </div>

                  <div className="text-sm pt-1">
                    <div className="pb-2">
                      <p className="text-muted-foreground">Voucher Usage</p>
                      <p className="font-medium">
                        {offer.usedCount ?? 0} / {offer.usageLimit ?? "-"}
                      </p>
                    </div>
                    <div className="pb-2">
                      <p className="text-muted-foreground">Per Student</p>
                      <p className="font-medium">{offer.perStudentLimit ?? "-"}</p>
                    </div>
                    <div className="pb-3">
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium">{formatDate(offer.expiryDate)}</p>
                    </div>

                    <Button
                      onClick={() => router.push("/auth/signin")}
                      className="w-full cursor-pointer rounded-lg hover:bg-amber-300 bg-amber-400"
                    >
                      USE NOW
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Merchant info dialog */}
      <Dialog open={Boolean(selectedMerchant)} onOpenChange={(open) => { if (!open) setSelectedMerchant(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMerchant?.profileImageUrl && (
                <img
                  src={selectedMerchant.profileImageUrl}
                  alt={selectedMerchant.businessName || "Merchant"}
                  className="w-8 h-8 rounded-full object-cover border"
                />
              )}
              {selectedMerchant?.businessName || "Merchant"}
            </DialogTitle>
            <DialogDescription>
              {selectedMerchant?.description || "No description available."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <Button
              onClick={() => { setSelectedMerchant(null); router.push("/auth/signin"); }}
              className="w-full gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign in to redeem offers
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
