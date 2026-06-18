"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Package } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATUS_OPTIONS: ListingStatus[] = ["ACTIVE", "SOLD", "REMOVED"];

const statusVariant = (status: ListingStatus) => {
  if (status === "ACTIVE") return "default" as const;
  if (status === "SOLD") return "secondary" as const;
  return "destructive" as const;
};

export default function MyListingsPage() {
  const { data: session } = useSession();
  const token = session?.access ?? "";
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchListings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await MarketplaceService.getMyListings(token);
      setListings(data);
    } catch {
      toast.error("Failed to load your listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [token]);

  const handleStatusChange = async (listingId: string, status: ListingStatus) => {
    setStatusUpdating(listingId);
    try {
      const updated = await MarketplaceService.updateListingStatus(listingId, { status }, token);
      setListings((prev) => prev.map((l) => (l.id === listingId ? updated : l)));
      toast.success("Listing status updated.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDelete = async (listingId: string) => {
    setDeleting(listingId);
    try {
      await MarketplaceService.deleteListing(listingId, token);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      toast.success("Listing deleted.");
    } catch {
      toast.error("Failed to delete listing.");
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground text-sm">Manage items you have listed for sale</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/marketplace">Browse All</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/marketplace/create">
              <Plus className="h-4 w-4 mr-1" /> New Listing
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Package className="h-12 w-12" />
          <p className="text-sm">You have no listings yet.</p>
          <Button asChild size="sm">
            <Link href="/dashboard/marketplace/create">
              <Plus className="h-4 w-4 mr-1" /> Create your first listing
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/marketplace/${listing.id}`}
                      className="font-medium hover:underline line-clamp-1 max-w-[180px] block"
                    >
                      {listing.title}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    EUR {Number(listing.price).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{listing.category.name}</span>
                  </TableCell>
                  <TableCell>
                    {statusUpdating === listing.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Select
                        value={listing.status}
                        onValueChange={(v) => handleStatusChange(listing.id, v as ListingStatus)}
                      >
                        <SelectTrigger className="w-[110px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                      >
                        <Link href={`/dashboard/marketplace/edit/${listing.id}`}>Edit</Link>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deleting === listing.id}
                          >
                            {deleting === listing.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{listing.title}&quot; will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(listing.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
