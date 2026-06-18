"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Search, Users, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReelsService } from "@/services/reels.service";
import type { SearchProfileResult } from "@/types/reelTypes";

const DEBOUNCE_MS = 400;

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function StatusBadge({ status }: { status: SearchProfileResult["status"] }) {
  const isActive = status === "ACTIVE";
  return (
    <Badge
      variant="secondary"
      className={
        isActive
          ? "text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:text-green-400"
          : "text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:text-red-400"
      }
    >
      {status}
    </Badge>
  );
}

function ProfileCard({ profile }: { profile: SearchProfileResult }) {
  return (
    <Link href={`/dashboard/reels/profile/${encodeURIComponent(profile.userId)}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-16 w-16 mx-4 shrink-0 rounded-full overflow-hidden">
            {profile.profilePhotoUrl && (
              <AvatarImage
                src={profile.profilePhotoUrl}
                alt={profile.displayName}
                className="object-cover w-full h-full"
              />
            )}
            <AvatarFallback className="text-lg w-full h-full font-semibold bg-primary/10 text-primary">
              {getInitials(profile.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">{profile.displayName}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {profile.followersCount.toLocaleString()} followers
              </span>
              <span className="inline-flex items-center gap-1 ml-4">
                <Users className="h-3.5 w-3.5" />
                {profile.followingCount.toLocaleString()} following
              </span>
            </p>
          </div>

          <StatusBadge status={profile.status} />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SearchProfilesPage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProfileResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (q: string) => {
      if (!session?.access) return;
      setLoading(true);
      setSearched(true);
      try {
        const data = await ReelsService.searchProfiles(q, session.access, 50);
        setResults(data);
      } catch {
        toast.error("Failed to search profiles. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [session?.access]
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(trimmed);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-primary" />
          Search Profiles
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Find tenants, landlords and agents by display name.
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search by display name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <>
          {results.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No profiles found</p>
              <p className="text-sm mt-1">Try a different search term.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </p>
              {results.map((profile) => (
                <ProfileCard key={profile.userId} profile={profile} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Idle state */}
      {!loading && !searched && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Start typing to search for profiles.</p>
        </div>
      )}
    </div>
  );
}
