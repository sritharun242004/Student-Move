import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Package } from "lucide-react";
import type { Conversation } from "@/types/marketplaceTypes";

interface ConversationListProps {
  conversations: Conversation[];
  currentStudentId?: number;
}

export function ConversationList({ conversations, currentStudentId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <MessageCircle className="h-10 w-10" />
        <p className="text-sm">No conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border overflow-hidden">
      {conversations.map((conv) => {
        const isSeller = currentStudentId === conv.sellerStudentId;
        const lastMsg = conv.lastMessage;
        const unread = (conv.unreadCount ?? 0) > 0;
        const otherName = isSeller
          ? (conv.buyerProfile?.displayName ?? "Unknown")
          : (conv.sellerProfile?.displayName ?? "Unknown");
        const otherPhoto = isSeller
          ? conv.buyerProfile?.profilePhotoUrl
          : conv.sellerProfile?.profilePhotoUrl;

        return (
          <Link
            key={conv.id}
            href={`/dashboard/marketplace/conversations/${conv.id}`}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors ${unread ? "bg-muted/40" : "bg-background"}`}
          >
            {/* Listing thumbnail */}
            <div className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted border">
              {conv.listingFirstPhotoUrl ? (
                <Image
                  src={conv.listingFirstPhotoUrl}
                  alt={conv.listingTitle}
                  fill
                  className="object-cover"
                  quality={60}
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Other person avatar */}
            <div className="relative flex-shrink-0 -ml-5 self-end mb-0.5">
              {otherPhoto ? (
                <Image
                  src={otherPhoto}
                  alt={otherName}
                  width={22}
                  height={22}
                  className="rounded-full object-cover ring-2 ring-background"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold ring-2 ring-background">
                  {otherName[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${unread ? "font-semibold" : "font-medium"}`}>
                  {otherName}
                </p>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {formatDistanceToNow(
                    new Date(lastMsg ? lastMsg.createdAt : conv.createdAt),
                    { addSuffix: true }
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-muted-foreground truncate flex-1">
                  {lastMsg ? (
                    <>
                      {lastMsg.senderStudentId === currentStudentId && (
                        <span className="text-muted-foreground/70">You: </span>
                      )}
                      {lastMsg.content}
                    </>
                  ) : (
                    <span className="italic">No messages yet</span>
                  )}
                </p>
                {unread && (
                  <span className="flex-shrink-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white leading-none">
                    {(conv.unreadCount ?? 0) > 99 ? "99+" : conv.unreadCount}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">{conv.listingTitle}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
