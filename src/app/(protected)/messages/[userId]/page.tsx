import { redirect } from "next/navigation";

import { MessagesChatLayout } from "@/components/messages/messages-chat-layout";
import {
  getCurrentUser,
  getDirectMessagesWith,
  getMessageThreads,
  getOnlineUserIds,
  getOtherProfiles,
  getProfileById
} from "@/lib/data";

export default async function MessageThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [threads, discover, selectedProfile, messages] = await Promise.all([
    getMessageThreads(),
    getOtherProfiles(),
    getProfileById(userId),
    getDirectMessagesWith(userId)
  ]);

  const onlineUserIds = await getOnlineUserIds([
    ...new Set([...threads.map((thread) => thread.partner.id), ...discover.map((profile) => profile.id), userId])
  ]);

  return (
    <MessagesChatLayout
      actorId={user.id}
      selectedUserId={userId}
      selectedProfile={selectedProfile}
      threads={threads}
      discover={discover}
      messages={messages}
      onlineUserIds={onlineUserIds}
    />
  );
}
