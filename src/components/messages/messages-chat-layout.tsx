"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DirectMessageForm } from "@/components/common/direct-message-form";
import { MessagesLiveSync } from "@/components/messages/messages-live-sync";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { MessageThread } from "@/lib/data";
import { formatDateTime } from "@/lib/date";

type ProfileLite = { id: string; display_name: string | null; avatar_url: string | null };
type DirectMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type Props = {
  actorId: string;
  selectedUserId: string | null;
  selectedProfile: ProfileLite | null;
  threads: MessageThread[];
  discover: ProfileLite[];
  messages: DirectMessage[];
  onlineUserIds: string[];
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MessagesChatLayout({
  actorId,
  selectedUserId,
  selectedProfile,
  threads,
  discover,
  messages,
  onlineUserIds
}: Props) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredThreads = useMemo(() => {
    if (!normalizedQuery) return threads;
    return threads.filter((thread) => {
      const name = (thread.partner.display_name || thread.partner.id).toLowerCase();
      const snippet = thread.lastMessage.toLowerCase();
      return name.includes(normalizedQuery) || snippet.includes(normalizedQuery);
    });
  }, [normalizedQuery, threads]);

  const filteredDiscover = useMemo(() => {
    const listIds = new Set(filteredThreads.map((thread) => thread.partner.id));
    const base = discover.filter((profile) => !listIds.has(profile.id));
    if (!normalizedQuery) return base;
    return base.filter((profile) => {
      const name = (profile.display_name || profile.id).toLowerCase();
      return name.includes(normalizedQuery);
    });
  }, [discover, filteredThreads, normalizedQuery]);

  return (
    <section className="grid min-h-[calc(100vh-150px)] gap-4 lg:grid-cols-[340px_1fr]">
      <MessagesLiveSync />
      <aside className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b p-4">
          <h2 className="text-lg font-bold text-slate-900">Messages</h2>
          <p className="text-sm text-slate-500">Chat with your team</p>
          <div className="mt-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or message..."
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="max-h-[calc(100vh-290px)] space-y-1 overflow-y-auto p-2">
          {filteredThreads.map((thread) => {
            const active = selectedUserId === thread.partner.id;
            const name = thread.partner.display_name || thread.partner.id.slice(0, 8);
            return (
              <Link
                key={thread.partner.id}
                href={`/messages/${thread.partner.id}`}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${active ? "bg-indigo-50" : "hover:bg-slate-50"}`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                  {initials(name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                    <span className="text-[11px] text-slate-500">{formatDateTime(thread.lastAt)}</span>
                  </div>
                  <p className="truncate text-xs text-slate-500">{thread.lastMessage}</p>
                </div>
              </Link>
            );
          })}

          {filteredThreads.length === 0 && (
            <p className="p-3 text-sm text-slate-500">
              {normalizedQuery ? "No conversation matched your search." : "No conversations yet."}
            </p>
          )}

          {filteredDiscover.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Start new</p>
              {filteredDiscover.map((profile) => {
                const name = profile.display_name || profile.id.slice(0, 8);
                return (
                  <Link key={profile.id} href={`/messages/${profile.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                      {initials(name)}
                    </div>
                    <p className="truncate text-sm font-medium text-slate-700">{name}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white">
        {selectedUserId && selectedProfile ? (
          <>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {initials(selectedProfile.display_name || selectedProfile.id.slice(0, 8))}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedProfile.display_name || selectedProfile.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">Direct Message</p>
                </div>
              </div>
              <Badge variant="outline">{onlineUserIds.includes(selectedUserId) ? "Online" : "Offline"}</Badge>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-4">
              {messages.map((message) => {
                const mine = message.sender_id === actorId;
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        mine ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md bg-white text-slate-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-indigo-100" : "text-slate-400"}`}>{formatDateTime(message.created_at)}</p>
                    </div>
                  </div>
                );
              })}

              {messages.length === 0 && (
                <div className="grid h-full place-items-center">
                  <p className="text-sm text-slate-500">No messages yet. Send the first message.</p>
                </div>
              )}
            </div>

            <div className="border-t bg-white p-3">
              <DirectMessageForm recipientId={selectedUserId} />
            </div>
          </>
        ) : (
          <div className="grid h-full min-h-[400px] place-items-center p-6 text-center">
            <div>
              <p className="text-xl font-bold text-slate-900">Select a chat</p>
              <p className="mt-1 text-sm text-slate-500">Choose a conversation from the left to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
