"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MarketplaceService } from "@/services/marketplace.service";
import { ConversationList } from "@/components/marketplace/ConversationList";
import type { Conversation } from "@/types/marketplaceTypes";

export default function ConversationsPage() {
  const { data: session } = useSession();
  const token = session?.access ?? "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(() => {
    if (!token) return;
    setLoading(true);
    MarketplaceService.getConversations(token)
      .then(setConversations)
      .catch(() => toast.error("Failed to load conversations."))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="container mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/marketplace">
          <ArrowLeft className="h-4 w-4 mr-1" /> Marketplace
        </Link>
      </Button>

      <div>
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold tracking-tight">My Conversations</h1>
          {/* refresh button */}
          <Button variant="outline" disabled={loading} onClick={fetchConversations}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">Buyer / seller messages for marketplace listings</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ConversationList
          conversations={conversations}
          currentStudentId={Number(session?.id)}
        />
      )}
    </div>
  );
}
