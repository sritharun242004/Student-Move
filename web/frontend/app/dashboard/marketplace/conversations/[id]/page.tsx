"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MarketplaceService } from "@/services/marketplace.service";
import { MessageThread } from "@/components/marketplace/MessageThread";
import type { Message, Conversation, SellerProfile } from "@/types/marketplaceTypes";

export default function ConversationThreadPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const token = session?.access ?? "";
  const currentStudentId = Number(session?.id);

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!token || !conversationId) return;
    try {
      const data = await MarketplaceService.getMessages(conversationId, token);
      setMessages(data);
    } catch {
      toast.error("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [token, conversationId]);

  useEffect(() => {
    if (!token || !conversationId) return;
    MarketplaceService.getConversation(conversationId, token)
      .then(setConversation)
      .catch(() => {});
    fetchMessages();
    // Fire-and-forget: mark all messages in this conversation as read
    MarketplaceService.markMessagesRead(conversationId, token).catch(() => {});
  }, [token, conversationId, fetchMessages]);

  const handleSend = async (content: string) => {
    const newMessage = await MarketplaceService.sendMessage(conversationId, { content }, token);
    setMessages((prev) => [...prev, newMessage]);
  };

  const isSeller = currentStudentId === conversation?.sellerStudentId;
  const otherStudentId = isSeller ? conversation?.buyerStudentId : conversation?.sellerStudentId;
  const otherProfile: SellerProfile | null = isSeller
    ? (conversation?.buyerProfile ?? null)
    : (conversation?.sellerProfile ?? null);
  const myProfile: SellerProfile | null = isSeller
    ? (conversation?.sellerProfile ?? null)
    : (conversation?.buyerProfile ?? null);

  return (
    <div className="container mx-auto flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0 border-b pb-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 hidden md:inline-flex">
          <Link href="/dashboard/marketplace/conversations">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>


        {conversation && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Other person's avatar */}
            <Link
              href={otherStudentId ? `/dashboard/reels/profile/${otherStudentId}` : "#"}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              {otherProfile?.profilePhotoUrl ? (
                <Image
                  src={otherProfile.profilePhotoUrl}
                  alt={otherProfile.displayName}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {otherProfile?.displayName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg leading-tight truncate">
                {otherProfile?.displayName ?? "Unknown"}
              </p>
              <h1 className="text-sm text-gray-600 hidden sm:inline-flex">Message Thread</h1>
             
            </div>
          </div>    
        )}
        {conversation && (
          <Link
            href={`/dashboard/marketplace/${conversation.listingId}`}
            className="flex items-center gap-1.5 mt-0.5 hover:opacity-80 transition-opacity"
          >
            <p className="text-sm truncate">{conversation.listingTitle}</p>
            {/* Listing thumbnail */}
            <div className="relative w-4 h-4 md:w-10 md:h-10 rounded overflow-hidden bg-muted border flex-shrink-0">
              {conversation.listingFirstPhotoUrl ? (
                <Image
                  src={conversation.listingFirstPhotoUrl}
                  alt={conversation.listingTitle}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <Package className="h-3 w-3 text-muted-foreground m-0.5" />
              )}
            </div>
          </Link>
        )}
        </div>

      <div className="flex-1 min-h-0">
        <MessageThread
          messages={messages}
          currentStudentId={currentStudentId}
          onSend={handleSend}
          loading={loading}
          myProfile={myProfile}
          otherProfile={otherProfile}
        />
      </div>
    </div>
  );
}
