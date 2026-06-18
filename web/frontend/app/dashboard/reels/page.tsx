"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Heart,
  MessageCircle,
  Play,
  Video,
  Share2,
  ArrowUpDown,
} from "lucide-react";
import { useReelsStore } from "@/stores/reelsStore";
import type { Reel, ReelFeedTab } from "@/types/reelTypes";
import Link from "next/link";
import ReelPlayerModal from "@/components/reels/ReelPlayerModal";

export default function ReelsFeedPage() {
  const { data: session } = useSession();
  const {
    feedItems,
    feedTab,
    feedOrderBy,
    feedLoading,
    feedHasMore,
    fetchFeed,
    loadMoreFeed,
    setFeedTab,
    setFeedOrderBy,
  } = useReelsStore();

  const isTenant = session?.role === "tenant";

  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerStartIndex, setPlayerStartIndex] = useState(0);

  useEffect(() => {
    if (session?.access) {
      fetchFeed(session.access, true);
    }
  }, [session?.access, feedTab, feedOrderBy, fetchFeed]);

  const handleTabChange = (value: string) => {
    setFeedTab(value as ReelFeedTab);
  };

  const handleOrderChange = () => {
    setFeedOrderBy(feedOrderBy === "chronological" ? "popularity" : "chronological");
  };

  const openPlayer = (index: number) => {
    setPlayerStartIndex(index);
    setPlayerOpen(true);
  };

  const handleLoadMore = () => {
    if (feedHasMore && session?.access) {
      loadMoreFeed(session.access);
    }
  };

  if (feedLoading && feedItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className=" mx-auto container space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Student Reels</h1>
          <p className="text-muted-foreground">
            Explore the feed, connect with friends, and express yourself through short reels.
          </p>
        </div>
      </div>
      {/* Tabs & Sort */}
      <Tabs value={feedTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between border-b">
          <TabsList className="w-auto justify-start gap-1 bg-transparent p-0 rounded-none">
            <TabsTrigger
              value="all"
              className="relative flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground transition-colors duration-300 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-transparent bg-transparent hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 data-[state=active]:after:scale-x-100"
            >
              <Video className="h-4 w-4" />
              All
              {feedItems.length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                  {feedItems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="followers"
              className="relative flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground transition-colors duration-300 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-transparent bg-transparent hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 data-[state=active]:after:scale-x-100"
            >
              <Share2 className="h-4 w-4" />
              Following
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 pb-1">
            {isTenant && (
              <Link href="/dashboard/reels/upload" className="hidden lg:block">
                <Button size="sm">Upload</Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleOrderChange} className="gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              {feedOrderBy === "chronological" ? "Latest" : "Popular"}
            </Button>
          </div>
        </div>

        <TabsContent value="all">
          <FeedGrid
            reels={feedItems}
            loading={feedLoading}
            hasMore={feedHasMore}
            onOpenPlayer={openPlayer}
            onLoadMore={handleLoadMore}
            isTenant={isTenant}
          />
        </TabsContent>

        <TabsContent value="followers">
          <FeedGrid
            reels={feedItems}
            loading={feedLoading}
            hasMore={feedHasMore}
            onOpenPlayer={openPlayer}
            onLoadMore={handleLoadMore}
            isTenant={isTenant}
            isFollowingGrid={true}  
          />
        </TabsContent>
      </Tabs>

      {/* Reel Player Modal */}
      <ReelPlayerModal
        reels={feedItems}
        startIndex={playerStartIndex}
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
      />
    </div>
  );
}

// ─── Feed Grid ──────────────────────────────────────────────

interface FeedGridProps {
  reels: Reel[];
  loading: boolean;
  hasMore: boolean;
  onOpenPlayer: (index: number) => void;
  onLoadMore: () => void;
  isTenant: boolean;
  isFollowingGrid?: boolean;
}

function FeedGrid({ reels, loading, hasMore, onOpenPlayer, onLoadMore, isTenant, isFollowingGrid }: FeedGridProps) {
  if (!loading && reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Play className="h-16 w-16 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No reels yet</h2>
        {isFollowingGrid ? (
          <p className="text-sm">Follow some creators to see their reels here!</p>
        ) : (
          <p className="text-sm">Be the first to upload a reel!</p>
        )}
        {isTenant && !isFollowingGrid && (
          <Link href="/dashboard/reels/upload">
            <Button className="mt-4">Upload a Reel</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className="relative group aspect-[9/16] bg-black rounded-xl overflow-hidden cursor-pointer"
            onClick={() => onOpenPlayer(index)}
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
              {/* Play icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="h-5 w-5 text-white ml-0.5" />
                </div>
              </div>
              {/* Stats at bottom */}
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
              <p className="text-white text-xs font-medium truncate">{reel.creator.displayName}</p>
            </div>

            {reel.isFlagged && (
              <Badge
                variant="destructive"
                className="absolute top-2 left-2 text-[10px]"
              >
                Flagged
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-6">
          <Button variant="outline" onClick={onLoadMore} disabled={loading}>
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
    </div>
  );
}
