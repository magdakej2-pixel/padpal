"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

interface ConversationItem {
  id: string;
  otherUser: {
    id: string;
    name: string;
    photo?: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConversations() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get all conversations for current user
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false })
        .limit(50);

      if (!convs || convs.length === 0) { setLoading(false); return; }

      // Get other users' profiles
      const otherIds = convs.map((c: Record<string, unknown>) =>
        (c.user1_id as string) === user.id ? (c.user2_id as string) : (c.user1_id as string)
      );
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, photos")
        .in("user_id", otherIds);

      const profileMap: Record<string, { name: string; photo?: string }> = {};
      (profiles || []).forEach((p: Record<string, unknown>) => {
        profileMap[p.user_id as string] = {
          name: (p.name as string) || "PadPal User",
          photo: ((p.photos as string[]) || [])[0],
        };
      });

      // Count unread messages per conversation
      const { data: unreads } = await supabase
        .from("messages")
        .select("conversation_id")
        .eq("is_read", false)
        .neq("sender_id", user.id);

      const unreadMap: Record<string, number> = {};
      (unreads || []).forEach((m: Record<string, unknown>) => {
        const cid = m.conversation_id as string;
        unreadMap[cid] = (unreadMap[cid] || 0) + 1;
      });

      const items: ConversationItem[] = convs.map((c: Record<string, unknown>) => {
        const otherId = (c.user1_id as string) === user.id ? (c.user2_id as string) : (c.user1_id as string);
        const profile = profileMap[otherId];
        return {
          id: c.id as string,
          otherUser: {
            id: otherId,
            name: profile?.name || "PadPal User",
            photo: profile?.photo,
          },
          lastMessage: (c.last_message as string) || "",
          lastMessageAt: formatTimeAgo(c.last_message_at as string),
          unreadCount: unreadMap[c.id as string] || 0,
        };
      });

      setConversations(items);
      setLoading(false);
    }
    fetchConversations();
  }, []);

  function formatTimeAgo(dateStr: string): string {
    if (!dateStr) return "";
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="border-b border-border bg-white px-4 pt-4 pb-4">
        <h1 className="text-2xl font-bold text-dark">Messages</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <p className="text-dark-secondary font-medium">No conversations yet</p>
            <p className="text-sm text-muted mt-1">Match with someone to start chatting!</p>
            <Link href="/discover" className="mt-4 rounded-[var(--radius-lg)] bg-primary px-6 py-3 text-sm font-semibold text-white">
              Discover People
            </Link>
          </div>
        ) : (
          conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chats/${conv.id}`}
              className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-surface"
            >
              {/* Avatar */}
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-surface">
                {conv.otherUser.photo ? (
                  <Image
                    src={conv.otherUser.photo}
                    alt={conv.otherUser.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted">
                    {conv.otherUser.name[0]}
                  </div>
                )}
                {conv.unreadCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {conv.unreadCount}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${conv.unreadCount > 0 ? "text-dark" : "text-dark-secondary"}`}>
                    {conv.otherUser.name}
                  </p>
                  <span className="text-xs text-muted">{conv.lastMessageAt}</span>
                </div>
                <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-medium text-dark" : "text-muted"}`}>
                  {conv.lastMessage || "Start a conversation..."}
                </p>
              </div>

              {/* Arrow */}
              <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
