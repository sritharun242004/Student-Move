"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { Listing, ListingStatus } from "@/types/marketplaceTypes";

const statusVariant = (status: ListingStatus) => {
  if (status === "ACTIVE") return "default" as const;
  if (status === "SOLD") return "secondary" as const;
  return "destructive" as const;
};

export default function AdminMarketplacePage() {
  const { data: session } = useSession();
  const token = session?.access ?? "";
  const userRole = session?.role ?? "";
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    // Redirect non-admins
    if (session && userRole !== "admin") {
      router.replace("/dashboard/marketplace");
      return;
    }
  }, [session, userRole, router]);

  useEffect(() => {
    if (!token || userRole !== "admin") return;
    MarketplaceService.getAdminListings(token)
      .then(setListings)
      .catch(() => toast.error("Failed to load listings."))
      .finally(() => setLoading(false));
  }, [token, userRole]);

  const handleRemove = async (listingId: string) => {
    setRemoving(listingId);
    try {
      await MarketplaceService.adminRemoveListing(listingId, token);
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: "REMOVED" as const } : l))
      );
      toast.success("Listing removed.");
    } catch {
      toast.error("Failed to remove listing.");
    } finally {
      setRemoving(null);
    }
  };

  if (userRole && userRole !== "admin") {
    return null; // redirecting
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/marketplace">
          <ArrowLeft className="h-4 w-4 mr-1" /> Marketplace
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketplace Moderation</h1>
          <p className="text-muted-foreground text-sm">
            All listings across all students — remove inappropriate content
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No listings found.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Seller ID</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/marketplace/${listing.id}`}
                      className="font-medium hover:underline line-clamp-1 max-w-[200px] block"
                    >
                      {listing.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {listing.studentId}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    EUR {Number(listing.price).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{listing.category.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(listing.status)}>{listing.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {listing.status !== "REMOVED" ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={removing === listing.id}
                          >
                            {removing === listing.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove this listing?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{listing.title}&quot; will be set to REMOVED status. The student
                              will no longer see it as active.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemove(listing.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <span className="text-xs text-muted-foreground">Already removed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
