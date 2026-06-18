"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Loader2, ShoppingBag, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MarketplaceService } from "@/services/marketplace.service";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ListingFiltersBar } from "@/components/marketplace/ListingFilters";
import type { Listing, ListingCategory, ListingFilters } from "@/types/marketplaceTypes";

const PAGE_SIZE = 20;

export default function MarketplacePage() {
  const { data: session } = useSession();
  const token = session?.access ?? "";
  const userRole = session?.role ?? "";

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<ListingCategory[]>([]);
  const [filters, setFilters] = useState<ListingFilters>({ skip: 0, take: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [listingsData, categoriesData] = await Promise.all([
        MarketplaceService.getListings(filters, token),
        categories.length === 0 ? MarketplaceService.getCategories(token) : Promise.resolve(null),
      ]);
      setListings(listingsData.items);
      setTotal(listingsData.total);
      if (categoriesData) setCategories(categoriesData);
    } catch {
      toast.error("Failed to load marketplace listings.");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  // Only re-fetch categories once; listings re-fetch on filter change
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!token) return;
    MarketplaceService.getConversationUnreadCount(token)
      .then(setUnreadCount)
      .catch(() => {});
  }, [token]);

  const handleFiltersChange = (newFilters: ListingFilters) => {
    setFilters(newFilters);
  };

  const handlePrev = () => {
    setFilters((f) => ({ ...f, skip: Math.max(0, (f.skip ?? 0) - PAGE_SIZE) }));
  };

  const handleNext = () => {
    setFilters((f) => ({ ...f, skip: (f.skip ?? 0) + PAGE_SIZE }));
  };

  const currentSkip = filters.skip ?? 0;
  const hasMore = currentSkip + PAGE_SIZE < total;
  const hasPrev = currentSkip > 0;

  return (
    <div className="space-y-6 container mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">Browse items listed by students</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* refresh button */}
          <Button variant="outline" onClick={fetchAll} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
          {userRole === "tenant" && (
            <Button asChild variant="outline" className="relative">
              <Link href="/dashboard/marketplace/conversations">
                Inbox
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          )}
          {userRole === "tenant" && (
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard/marketplace/mine">My Listings</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/marketplace/create">
                  <Plus className="h-4 w-4 mr-1" /> Add New
                </Link>
              </Button>
            </>
          )}
          {userRole === "admin" && (
            <Button asChild variant="outline">
              <Link href="/dashboard/marketplace/admin">Admin View</Link>
            </Button>
          )}
         
        </div>
      </div>

      {/* Filters */}
      <ListingFiltersBar
        categories={categories}
        filters={filters}
        onChange={handleFiltersChange}
      />

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted-foreground">
          Showing {listings.length === 0 ? 0 : currentSkip + 1}–{currentSkip + listings.length} of {total} listing{total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <ShoppingBag className="h-12 w-12" />
          <p className="text-sm">No listings found. Try adjusting your filters.</p>
          {userRole === "tenant" && (
            <Button asChild size="sm">
              <Link href="/dashboard/marketplace/create">
                <Plus className="h-4 w-4 mr-1" /> Be the first to list something
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(hasPrev || hasMore) && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button variant="outline" onClick={handlePrev} disabled={!hasPrev || loading}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {Math.floor(currentSkip / PAGE_SIZE) + 1} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          <Button variant="outline" onClick={handleNext} disabled={!hasMore || loading}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
