"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import {
  Loader2,
  Heart,
  MessageCircle,
  Play,
  Video,
  ArrowUpDown,
} from "lucide-react";
import axios from "axios";
import type { Reel } from "@/types/reelTypes";

const gatewayAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  timeout: 25000,
});
import ReelPlayerModal from "@/components/reels/ReelPlayerModal";

const PAGE_SIZE = 20;

type OrderBy = "chronological" | "popularity";

export default function PublicReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<OrderBy>("chronological");

  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerStartIndex, setPlayerStartIndex] = useState(0);

  const fetchReels = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      try {
        const params: Record<string, string> = {
          tab: "all",
          orderBy,
          take: String(PAGE_SIZE),
        };
        if (!reset && cursor) {
          params.cursor = cursor;
        }

        const response = await gatewayAxios.get<{ items: Reel[]; nextCursorCreatedAt: string | null }>(
          "/reels/public-feed",
          { params }
        );

        const { items, nextCursorCreatedAt } = response.data;

        if (reset) {
          setReels(items);
        } else {
          setReels((prev) => [...prev, ...items]);
        }

        setCursor(nextCursorCreatedAt);
        setHasMore(!!nextCursorCreatedAt);
      } catch {
        // silently fail; empty state will show
      } finally {
        setLoading(false);
      }
    },
    [orderBy, cursor]
  );

  useEffect(() => {
    setCursor(null);
    fetchReels(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderBy]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchReels(false);
    }
  };

  const openPlayer = (index: number) => {
    setPlayerStartIndex(index);
    setPlayerOpen(true);
  };

  const toggleOrder = () => {
    setOrderBy((prev) => (prev === "chronological" ? "popularity" : "chronological"));
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Page title + controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Video className="h-7 w-7" />
              Student Reels
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore short reels from students across the UK showcasing their university life, tips, and experiences.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleOrder} className="gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" />
            {orderBy === "chronological" ? "Latest" : "Popular"}
          </Button>
        </div>

        {/* Grid */}
        {loading && reels.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Play className="h-16 w-16 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No reels yet</h2>
            <p className="text-sm">Check back soon for student content.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {reels.map((reel, index) => (
                <div
                  key={reel.id}
                  className="relative group aspect-[9/16] bg-black rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => openPlayer(index)}
                >
                  <video
                    src={`${reel.videoUrl}#t=0.001`}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="h-5 w-5 text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-5">
                      <span className="flex items-center gap-1.5 text-white text-sm">
                        <Heart className="h-4 w-4" />
                        {reel.likesCount}
                      </span>
                      <span className="flex items-center gap-1.5 text-white text-sm">
                        <MessageCircle className="h-4 w-4" />
                        {reel.commentsCount}
                      </span>
                    </div>
                  </div>

                  {/* Creator overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-0 transition-opacity duration-300">
                    <p className="text-white text-xs font-medium truncate">
                      {reel.creator.displayName}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-2 pb-6">
                <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load more
                </Button>
              </div>
            )}

            {loading && reels.length > 0 && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Public reel player — no like/comment/share/report */}
      <ReelPlayerModal
        reels={reels}
        startIndex={playerStartIndex}
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        isPublic={true}
      />

    </div>
  );
}
