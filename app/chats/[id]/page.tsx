"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const ICE_BREAKERS = [
  "What's your ideal weekend at home?",
  "Morning person or night owl?",
  "What's the last thing you cooked?",
  "Favourite Netflix show right now?",
];

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showIceBreakers, setShowIceBreakers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [partnerName, setPartnerName] = useState("Chat");
  const [partnerPhoto, setPartnerPhoto] = useState<string | undefined>();
  const [partnerId, setPartnerId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadChat() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Get conversation details
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (conv) {
        const otherId = (conv.user1_id as string) === user.id
          ? (conv.user2_id as string)
          : (conv.user1_id as string);
        setPartnerId(otherId);

        // Get partner profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, photos")
          .eq("user_id", otherId)
          .single();

        if (profile) {
          setPartnerName((profile.name as string) || "PadPal User");
          setPartnerPhoto(((profile.photos as string[]) || [])[0]);
        }
      }

      // Load existing messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgs) setMessages(msgs as Message[]);
      setLoading(false);

      // Mark unread messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    }

    loadChat();

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !userId) return;
    const supabase = createClient();
    const trimmed = text.trim();

    // Optimistic: show message immediately
    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      sender_id: userId,
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setShowIceBreakers(false);

    // Insert message to DB
    const { data: inserted } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: trimmed,
    }).select("id").single();

    // Replace optimistic ID with real DB ID to prevent realtime duplicate
    if (inserted) {
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticMsg.id ? { ...m, id: inserted.id } : m)
      );
    }

    // Update conversation last_message
    await supabase
      .from("conversations")
      .update({
        last_message: trimmed,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    // Send push notification to partner
    if (partnerId) {
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: partnerId,
          title: partnerName === "Chat" ? "New message" : `Message from you`,
          body: text.trim().slice(0, 100),
          url: `/chats/${conversationId}`,
          tag: `chat-${conversationId}`,
        }),
      }).catch(() => {}); // Fire and forget
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-white px-3 py-2.5 shadow-sm">
        <Link
          href="/chats"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
        >
          <svg className="h-5 w-5 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-surface">
          {partnerPhoto ? (
            <img src={partnerPhoto} alt={partnerName} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted">
              {partnerName[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-dark">{partnerName}</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-dark-secondary font-medium">Start the conversation</p>
            <p className="text-sm text-muted mt-1">Say hi or use an ice breaker below</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-3 flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.sender_id === userId
                    ? "rounded-br-md bg-primary text-white"
                    : "rounded-bl-md bg-white text-dark shadow-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p
                  className={`mt-1 text-right text-[10px] ${
                    msg.sender_id === userId ? "text-white/60" : "text-muted"
                  }`}
                >
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Ice breakers */}
      {showIceBreakers && (
        <div className="border-t border-border bg-white px-4 py-3 animate-fade-in-up">
          <p className="mb-2 text-xs font-medium text-muted">Quick starters</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {ICE_BREAKERS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="flex-shrink-0 rounded-full border border-primary/30 bg-primary-bg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowIceBreakers(!showIceBreakers)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-primary"
            aria-label="Ice breakers"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="h-10 flex-1 rounded-full border border-border bg-surface px-4 text-sm text-dark outline-none transition-colors focus:border-primary"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all hover:bg-primary-dark disabled:opacity-40 disabled:shadow-none"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
