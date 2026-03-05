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

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [threads, discover] = await Promise.all([getMessageThreads(), getOtherProfiles()]);

  const selectedUserId = threads[0]?.partner.id ?? discover[0]?.id ?? null;
  const [selectedProfile, messages] = selectedUserId
    ? await Promise.all([getProfileById(selectedUserId), getDirectMessagesWith(selectedUserId)])
    : [null, []];

  const onlineUserIds = await getOnlineUserIds([
    ...new Set([
      ...threads.map((thread) => thread.partner.id),
      ...discover.map((profile) => profile.id),
      ...(selectedUserId ? [selectedUserId] : [])
    ])
  ]);

  return (
    <MessagesChatLayout
      actorId={user.id}
      selectedUserId={selectedUserId}
      selectedProfile={selectedProfile}
      threads={threads}
      discover={discover}
      messages={messages}
      onlineUserIds={onlineUserIds}
    />
  );
}
