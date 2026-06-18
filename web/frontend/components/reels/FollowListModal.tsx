"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, User } from "lucide-react";
import { ReelsService } from "@/services/reels.service";
import type { FollowEntry } from "@/types/reelTypes";

interface FollowListModalProps {
  open: boolean;
  onClose: () => void;
  mode: "followers" | "following";
  studentId: string;
  token: string;
}

export default function FollowListModal({
  open,
  onClose,
  mode,
  studentId,
  token,
}: FollowListModalProps) {
  const router = useRouter();
  const [list, setList] = useState<FollowEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!studentId || !token) return;
    setLoading(true);
    try {
      const data =
        mode === "followers"
          ? await ReelsService.getFollowers(studentId, token)
          : await ReelsService.getFollowing(studentId, token);
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [mode, studentId, token]);

  useEffect(() => {
    if (open) {
      setList([]);
      load();
    }
  }, [open, load]);

  const handleNavigate = (userId: string) => {
    onClose();
    router.push(`/dashboard/reels/profile/${userId}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "followers" ? "Followers" : "Following"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <User className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">
              {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          </div>
        ) : (
          <ul className="divide-y max-h-[60vh] overflow-y-auto">
            {list.map((entry) => (
              <li key={entry.userId}>
                <button
                  type="button"
                  className="flex items-center gap-3 w-full px-1 py-3 hover:bg-muted/50 rounded-md transition-colors cursor-pointer text-left"
                  onClick={() => handleNavigate(entry.userId)}
                >
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {entry.profilePhotoUrl ? (
                      <img
                        src={entry.profilePhotoUrl}
                        alt={entry.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{entry.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
