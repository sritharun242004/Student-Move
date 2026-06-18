"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { MarketplaceService } from "@/services/marketplace.service";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ListingFiltersBar } from "@/components/marketplace/ListingFilters";
import type { Listing, ListingCategory, ListingFilters } from "@/types/marketplaceTypes";

const PAGE_SIZE = 20;

export default function PublicMarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<ListingCategory[]>([]);
  const [filters, setFilters] = useState<ListingFilters>({ skip: 0, take: PAGE_SIZE });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listingsData, categoriesData] = await Promise.all([
        MarketplaceService.getListings(filters, ""),
        categories.length === 0 ? MarketplaceService.getCategories("") : Promise.resolve(null),
      ]);
      setListings(listingsData.items);
      setTotal(listingsData.total);
      if (categoriesData) setCategories(categoriesData);
    } catch {
      // silently fail; empty state will show
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Page title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-7 w-7" />
              Marketplace
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse items listed by students.
            </p>
          </div>
          <Button variant="outline" onClick={fetchAll} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
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
            Showing {listings.length === 0 ? 0 : currentSkip + 1}–
            {currentSkip + listings.length} of {total} listing
            {total !== 1 ? "s" : ""}
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
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                basePath="/marketplace"
              />
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
              Page {Math.floor(currentSkip / PAGE_SIZE) + 1} of{" "}
              {Math.ceil(total / PAGE_SIZE)}
            </span>
            <Button variant="outline" onClick={handleNext} disabled={!hasMore || loading}>
              Next
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
