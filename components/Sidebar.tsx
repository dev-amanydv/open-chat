"use client";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CiSearch } from "react-icons/ci";
import { IoCreateOutline } from "react-icons/io5";
import { RiCheckDoubleFill, RiCheckFill } from "react-icons/ri";
import SidebarSkeleton from "@/components/skeletons/SidebarSkeleton";
import { Id } from "@/convex/_generated/dataModel";
import CreateGroupModal from "./CreateGroupModal";

type DeliveryStatus = "sent" | "delivered" | "seen" | null | undefined;

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}

function DeliveryStatusTick({
  isMyMessage,
  status,
}: {
  isMyMessage: boolean;
  status: DeliveryStatus;
}) {
  if (!isMyMessage || !status) return null;

  if (status === "sent") {
    return <RiCheckFill className="text-neutral-400 flex-none" />;
  }

  return (
    <RiCheckDoubleFill
      className={`${status === "seen" ? "text-blue-400 dark:text-blue-500" : "text-neutral-400 dark:text-neutral-500"} flex-none`}
    />
  );
}

function UserSubtitle({
  userId,
  convo,
  unreadCount,
}: {
  userId: Id<"users">;
  convo?: {
    lastMessage: string;
    lastMessageSentByMe: boolean;
    lastMessageStatus?: DeliveryStatus;
  };
  unreadCount: number;
}) {
  const lastTyped = useQuery(api.typing.getTypingForUser, { userId });
  const now = useNow();
  const isTyping = Boolean(lastTyped && now - lastTyped < 3000);

  if (isTyping) {
    return <p className="text-[13px] font-medium text-green-500">typing...</p>;
  }

  if (convo) {
    return (
      <div className="flex items-center gap-1">
        <DeliveryStatusTick
          isMyMessage={convo.lastMessageSentByMe}
          status={convo.lastMessageStatus}
        />
        <p
          className={`text-[13px] truncate ${unreadCount > 0 ? "font-semibold text-neutral-800 dark:text-neutral-200" : "text-neutral-500 dark:text-neutral-400"}`}
        >
          {convo.lastMessage}
        </p>
      </div>
    );
  }

  return (
    <p className="text-neutral-400 dark:text-neutral-500 text-[13px] italic">
      Tap to start conversation
    </p>
  );
}

export default function Sidebar({
  groupsOnly = false,
}: { groupsOnly?: boolean } = {}) {
  const users = useQuery(api.user.getAllUsers);
  const conversations = useQuery(api.chats.getConversationsForCurrentUser);
  const currentUser = useQuery(api.chats.getCurrentUser);
  const syncUser = useMutation(api.user.getForCurrentUser);
  const router = useRouter();
  const params = useParams();
  const activeUserId = params?.userId as string | undefined;
  const [search, setSearch] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const now = useNow(5000);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  if (users === undefined) {
    return <SidebarSkeleton />;
  }

  const searchText = search.toLowerCase().trim();
  const usersExceptCurrent = users.filter(
    (user) => user._id !== currentUser?._id,
  );
  const usersById = new Map(
    usersExceptCurrent.map((user) => [String(user._id), user]),
  );
  const sortedConversations = conversations ?? [];
  const filteredChats = sortedConversations.filter((convo) => {
    const lastMessage = convo.lastMessage?.toLowerCase() ?? "";

    if (convo.isGroup) {
      if (!searchText) return true;
      const groupName = convo.name?.toLowerCase() ?? "";
      return groupName.includes(searchText) || lastMessage.includes(searchText);
    }

    if (groupsOnly) return false;

    if (!convo.otherUserId) return false;
    const user = usersById.get(String(convo.otherUserId));
    if (!user) return false;

    if (!searchText) return true;
    return (
      user.name.toLowerCase().includes(searchText) ||
      lastMessage.includes(searchText)
    );
  });

  const allUsers = usersExceptCurrent
    .filter((user) => user.name.toLowerCase().includes(searchText))
    .sort((a, b) => b._creationTime - a._creationTime);

  const renderUserRow = (
    user: (typeof usersExceptCurrent)[number],
    convo?: (typeof sortedConversations)[number],
  ) => {
    const isActive = activeUserId === user._id;
    const isOnline = user.lastSeen && now - user.lastSeen < 5000;

    return (
      <div
        key={user._id}
        onClick={() => router.push(`/chats/${user._id}`)}
        className={`py-3 px-2 flex gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-md cursor-pointer ${isActive ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" : "border border-transparent"}`}
      >
        <div className="size-10 relative rounded-full border border-neutral-400 dark:border-zinc-700 bg-neutral-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-300 overflow-hidden">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.name}
              className="size-full object-cover"
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
          {isOnline && (
            <span className="size-2 bg-green-400 rounded-full absolute bottom-0 right-0"></span>
          )}
        </div>
        <div className="w-full pr-3 flex flex-col flex-1">
          <div className="flex justify-between items-center">
            <h1
              className={`text-[14px] ${convo && convo.unreadCount > 0 ? "font-bold" : "font-semibold"}`}
            >
              {user.name}
            </h1>
            {convo && convo.unreadCount > 0 && (
              <span className="bg-green-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {convo.unreadCount}
              </span>
            )}
          </div>
          <div className="w-full flex justify-between">
            <UserSubtitle
              userId={user._id}
              convo={convo}
              unreadCount={convo?.unreadCount ?? 0}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderChatRow = (chat: (typeof filteredChats)[number]) => {
    if (chat.isGroup) {
      const isActive = activeUserId === chat.conversationId;

      return (
        <div
          key={chat.conversationId}
          onClick={() =>
            router.push(
              `${groupsOnly ? "/groups" : "/chats"}/${chat.conversationId}`,
            )
          }
          className={`py-3 px-2 flex gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-md cursor-pointer ${isActive ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" : "border border-transparent"}`}
        >
          <div className="size-10 relative rounded-full border border-neutral-400 dark:border-zinc-700 bg-neutral-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-300 overflow-hidden">
            {chat.name?.charAt(0).toUpperCase() || "G"}
          </div>
          <div className="w-full pr-3 flex flex-col flex-1">
            <div className="flex justify-between items-center">
              <h1
                className={`text-[14px] ${chat.unreadCount > 0 ? "font-bold" : "font-semibold"}`}
              >
                {chat.name || "Unnamed Group"}
              </h1>
              {chat.unreadCount > 0 && (
                <span className="bg-green-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {chat.unreadCount}
                </span>
              )}
            </div>
            <div className="w-full flex justify-between">
              <div className="flex items-center gap-1">
                <DeliveryStatusTick
                  isMyMessage={chat.lastMessageSentByMe}
                  status={chat.lastMessageStatus}
                />
                <p
                  className={`text-[13px] truncate ${chat.unreadCount > 0 ? "font-semibold text-neutral-800 dark:text-neutral-200" : "text-neutral-500 dark:text-neutral-400"}`}
                >
                  {chat.lastMessage || `${chat.participants.length} members`}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const user = chat.otherUserId
      ? usersById.get(String(chat.otherUserId))
      : undefined;
    if (!user) return null;
    return renderUserRow(user, chat);
  };

  return (
    <div className="md:max-w-xs px-0 h-dvh flex flex-col w-full border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
      <div className="flex px-2 flex-none py-4 justify-between items-center">
        <h1 className="text-xl font-bold">{groupsOnly ? "Groups" : "Chats"}</h1>
        <button
          onClick={() => setIsGroupModalOpen(true)}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors"
          title="Create Group"
        >
          <IoCreateOutline className="size-5" />
        </button>
      </div>
      <div className="flex px-2 flex-none items-center relative">
        <input
          onChange={(e) => setSearch(e.target.value)}
          className="border w-full rounded-md pl-7 text-sm py-1 focus:outline-0 border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-300 dark:focus:border-zinc-700 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          type="text"
          placeholder="Search chats or users"
        />
        <CiSearch className="absolute left-4 text-zinc-500" />
      </div>
      <div className="flex-1 flex-col mt-5 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="px-3 py-2 text-sm text-neutral-400 dark:text-neutral-500">
            No chats found
          </div>
        ) : (
          filteredChats.map((chat) => renderChatRow(chat))
        )}
        {groupsOnly ? null : (
          <>
            <div className="px-3 pt-4 pb-1 text-[11px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500 font-semibold">
              All Users
            </div>
            {allUsers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-400 dark:text-neutral-500">
                No users found
              </div>
            ) : (
              allUsers.map((user) =>
                renderUserRow(
                  user,
                  sortedConversations.find(
                    (convo) =>
                      !convo.isGroup &&
                      String(convo.otherUserId) === String(user._id),
                  ),
                ),
              )
            )}
          </>
        )}
      </div>
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </div>
  );
}
