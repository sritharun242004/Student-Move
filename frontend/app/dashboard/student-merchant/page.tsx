"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Ticket, History, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import {
  MerchantService,
  StudentMerchantOffer,
  StudentRedeemedOffer,
} from "@/services/merchant.service";

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return "-";
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const getDiscountLabel = (offer: StudentMerchantOffer) => {
  if (offer.discountType === "PERCENTAGE") {
    return "Percentage";
  }

  if (offer.discountType === "FIXED_AMOUNT") {
    return "Fixed amount";
  }

  return "-";
};

const getRedeemedCode = (record: StudentRedeemedOffer) => {
  return record.uniqueCode || "-";
};

const getRedeemedOfferTitle = (record: StudentRedeemedOffer) => {
  return record.offer?.title || "-";
};

const getRedeemedDate = (record: StudentRedeemedOffer) => {
  return formatDate(record.createdAt);
};

const getVoucherCountdownLabel = (expiresAt: string | null, now: number) => {
  if (!expiresAt) {
    return null;
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) {
    return null;
  }

  const remainingMs = expiresAtMs - now;
  if (remainingMs <= 0) {
    return "Expired";
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes} min ${seconds} sec left`;
};

function OfferDescription({ description }: { description?: string }) {
  const [showFade, setShowFade] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);

  const updateFadeState = (element: HTMLParagraphElement | null) => {
    if (!element) {
      return;
    }

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
        onScroll={(event) => updateFadeState(event.currentTarget)}
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

export default function StudentMerchantPage() {
  const { data: session, status } = useSession();
  const [offers, setOffers] = useState<StudentMerchantOffer[]>([]);
  const [redeemedHistory, setRedeemedHistory] = useState<StudentRedeemedOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [creatingVoucherFor, setCreatingVoucherFor] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherOfferTitle, setVoucherOfferTitle] = useState("");
  const [voucherExpiresAt, setVoucherExpiresAt] = useState<string | null>(null);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [isPreviewImageLoading, setIsPreviewImageLoading] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<StudentMerchantOffer["merchant"] | null>(null);

  const isStudent = session?.role === "tenant";

  const loadOffers = async () => {
    if (!session?.access) {
      return;
    }

    try {
      setOffersLoading(true);
      const data = await MerchantService.getActiveOffers(session.access);
      setOffers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load active offers:", error);
      toast.error("Failed to load merchant offers");
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  console.log("Offers loading state:", redeemedHistory);

  const loadRedeemedHistory = async () => {
    if (!session?.access) {
      return;
    }

    try {
      setHistoryLoading(true);
      const data = await MerchantService.getStudentRedeemedHistory(session.access);
      setRedeemedHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load redeemed history:", error);
      toast.error("Failed to load redeemed history");
      setRedeemedHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    if (!isStudent) {
      setOffersLoading(false);
      setHistoryLoading(false);
      return;
    }

    loadOffers();
    loadRedeemedHistory();
  }, [status, isStudent, session?.access]);

  useEffect(() => {
    if (!voucherCode || !voucherExpiresAt) {
      return;
    }

    setCountdownNow(Date.now());
    const timer = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [voucherCode, voucherExpiresAt]);

  const voucherCountdownLabel = getVoucherCountdownLabel(voucherExpiresAt, countdownNow);

  const handleUseNow = async (offer: StudentMerchantOffer) => {
    if (!session?.access) {
      return;
    }

    try {
      setCreatingVoucherFor(offer.id);
      const response = await MerchantService.createVoucher(
        { offerId: offer.id },
        session.access
      );

      if (!response?.uniqueCode) {
        toast.error("Voucher created, but unique code was not returned");
        return;
      }

      setVoucherCode(response.uniqueCode);
      setVoucherOfferTitle(offer.title);
      setVoucherExpiresAt(response.validUntil || null);
      await loadRedeemedHistory();
    } catch (error: unknown) {
      const maybeAxiosError = error as {
        response?: { data?: { message?: string; error?: string } };
      };

      const message =
        maybeAxiosError?.response?.data?.message ||
        maybeAxiosError?.response?.data?.error ||
        "Unable to create voucher. User limit may be exceeded.";

      toast.error(message);
      console.error("Failed to create voucher:", error);
    } finally {
      setCreatingVoucherFor(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-7xl">
        <Card>
          <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading student merchant section...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isStudent) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>
              This section is only available for students.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getRedeemedDiscountType = (record: StudentRedeemedOffer) => {
    if (!record.offer?.discountType) {
      return "-";
    }

    if (record.offer.discountType === "PERCENTAGE") {
      return "Percentage";
    }

    if (record.offer.discountType === "FIXED_AMOUNT") {
      return "Fixed amount";
    }

    return "-";
  };
  return (
    <div className="mx-auto container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Merchant Offers</h1>
          <p className="text-muted-foreground">
            Discover and redeem offers from our partnered merchants. Use your Unique-Code/QR at the merchant to enjoy exclusive discounts and deals.
          </p>
        </div>
      </div>

      <Tabs defaultValue="offers" className="w-full">
        <TabsList>
          <TabsTrigger value="offers" className="cursor-pointer">
            <Ticket className="h-4 w-4" />
            Merchant Offers
          </TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">
            <History className="h-4 w-4" />
            Redeemed History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="mt-4">
    
              {offersLoading ? (
                <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading active offers...
                </div>
              ) : offers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No active merchant offers available.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {offers.map((offer) => {
                    const isCreating = creatingVoucherFor === offer.id;

                    return (
                      <Card key={offer.id} className="overflow-hidden py-0 gap-0 border">
                        <div className="relative">
                          {offer.imageUrl ? (
                            <button
                              type="button"
                              className="w-full text-left"
                              onClick={() => {
                                setIsPreviewImageLoading(true);
                                setPreviewImage({
                                  src: offer.imageUrl as string,
                                  alt: offer.title || "Offer image",
                                });
                              }}
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
                              <p className="text-muted-foreground">Per Student Limit</p>
                              <p className="font-medium">{offer.perStudentLimit ?? "-"}</p>
                            </div>
                            <div className="pb-3">
                              <p className="text-muted-foreground">Expire Date</p>
                              <p className="font-medium">{formatDate(offer.expiryDate)}</p>
                            </div>

                            <Button
                              onClick={() => handleUseNow(offer)}
                              disabled={isCreating}
                              className="w-full cursor-pointer rounded-lg hover:bg-amber-300 bg-amber-400"
                            //   size="sm"
                            >
                              {isCreating ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Generating...
                                </>
                              ) : (
                                "USE NOW"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
   
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Redeemed History</CardTitle>
              <CardDescription>
                Previously redeemed offers for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading redeemed history...
                </div>
              ) : redeemedHistory.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No redeemed history found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer</TableHead>
                      <TableHead>Discount Type</TableHead>
                      <TableHead>Unique Code</TableHead>
                      <TableHead>Redeemed Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redeemedHistory.map((record, index) => (
                      <TableRow key={record.id }>
                        <TableCell>{getRedeemedOfferTitle(record)}</TableCell>
                        <TableCell>{getRedeemedDiscountType(record)}</TableCell>
                        <TableCell>{getRedeemedCode(record)}</TableCell>
                        <TableCell>{getRedeemedDate(record)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(voucherCode)}
        onOpenChange={(open) => {
          if (!open) {
            setVoucherCode("");
            setVoucherOfferTitle("");
            setVoucherExpiresAt(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Voucher Details
            </DialogTitle>
            <DialogDescription>
              Show this Secret Code or QR Code to the merchant to redeem your offer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Offer</p>
              <p className="font-medium">{voucherOfferTitle || "-"}</p>
            </div>

            <div className="rounded-md border p-4 bg-muted/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">Secret Code</p>
              <p className="text-lg font-semibold tracking-wide break-all">{voucherCode}</p>
            </div>

            {voucherCode && (
              <div className="rounded-md border p-4 flex flex-col items-center gap-2 bg-white">
                <QRCode value={voucherCode} size={220} />
                {voucherCountdownLabel && (
                  <p
                    className={`text-sm font-medium ${
                      voucherCountdownLabel === "Expired" ? "text-red-600" : "text-muted-foreground"
                    }`}
                  >
                    {voucherCountdownLabel}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
            <DialogDescription>
              Full size preview of the selected offer image.
            </DialogDescription>
          </DialogHeader>
          {previewImage && (
            <div className="relative w-[80vw] h-[80vh] bg-black flex items-center justify-center">
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

      <Sheet
        open={Boolean(selectedMerchant)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMerchant(null);
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selectedMerchant?.businessName || "Merchant details"}</SheetTitle>
            <SheetDescription>
              Details about the selected merchant.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-4 space-y-4 overflow-y-auto">
            {selectedMerchant?.profileImageUrl ? (
              <div className="flex justify-center">
                <img
                  src={selectedMerchant.profileImageUrl}
                  alt={selectedMerchant.businessName || "Merchant profile"}
                  className="w-40 aspect-square object-cover rounded-full border shrink-0"
                />
              </div>
            ) : null}

            <div>
              <p className="text-sm text-muted-foreground">Business Name</p>
              <p className="font-medium">{selectedMerchant?.businessName || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium whitespace-pre-wrap">{selectedMerchant?.description || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Business Email</p>
              {selectedMerchant?.businessEmail ? (
                <a
                  href={`mailto:${selectedMerchant.businessEmail}`}
                  className="font-medium break-all text-primary hover:underline"
                >
                  {selectedMerchant.businessEmail}
                </a>
              ) : (
                <p className="font-medium">-</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              {selectedMerchant?.phone ? (
                <a
                  href={`tel:${selectedMerchant.phone.replace(/\s+/g, "")}`}
                  className="font-medium text-primary hover:underline"
                >
                  {selectedMerchant.phone}
                </a>
              ) : (
                <p className="font-medium">-</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium whitespace-pre-wrap">{selectedMerchant?.address || "-"}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
