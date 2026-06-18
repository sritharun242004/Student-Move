"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Message, SellerProfile } from "@/types/marketplaceTypes";

function MsgAvatar({ profile }: { profile: SellerProfile | null | undefined }) {
  const name = profile?.displayName ?? "?";
  if (profile?.profilePhotoUrl) {
    return (
      <Image
        src={profile.profilePhotoUrl}
        alt={name}
        width={28}
        height={28}
        className="rounded-full object-cover flex-shrink-0 mt-1"
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0 mt-1">
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

interface MessageThreadProps {
  messages: Message[];
  currentStudentId: number;
  onSend: (content: string) => Promise<void>;
  loading?: boolean;
  myProfile?: SellerProfile | null;
  otherProfile?: SellerProfile | null;
}

export function MessageThread({
  messages,
  currentStudentId,
  onSend,
  loading,
  myProfile,
  otherProfile,
}: MessageThreadProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setContent("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderStudentId === currentStudentId;
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              {/* Other person's avatar on the left */}
              {!isMine && <MsgAvatar profile={otherProfile} />}

              <div
                className={`max-w-[72%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isMine ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                  }`}
                >
                  {format(new Date(msg.createdAt), "HH:mm · dd MMM")}
                </p>
              </div>

              {/* My avatar on the right */}
              {isMine && <MsgAvatar profile={myProfile} />}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-3 flex gap-2 items-center">
        <Textarea
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="resize-none flex-1"
          disabled={sending}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !content.trim()}
          size="icon"
          className="h-10 w-10 flex-shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
