"use client";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { CiSearch } from "react-icons/ci";
import { RiCheckDoubleFill, RiCheckFill } from "react-icons/ri";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import SidebarSkeleton from "@/components/skeletons/SidebarSkeleton";
import SemanticSearchModal from "./SemanticSearchModal";
import Avatar from "./Avatar";
import { primaryAgent } from "@/lib/agents";

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
    return <RiCheckFill className="text-ink-faint flex-none" />;
  }

  return (
    <RiCheckDoubleFill
      className={`${status === "seen" ? "text-accent" : "text-ink-faint"} flex-none`}
    />
  );
}

function UserSubtitle({
  convo,
  unreadCount,
}: {
  convo?: {
    lastMessage: string;
    lastMessageSentByMe: boolean;
    lastMessageStatus?: DeliveryStatus;
  };
  unreadCount: number;
}) {
  if (convo) {
    return (
      <div className="flex items-center gap-1">
        <DeliveryStatusTick
          isMyMessage={convo.lastMessageSentByMe}
          status={convo.lastMessageStatus}
        />
        <p
          className={`text-[13px] truncate ${unreadCount > 0 ? "font-semibold text-ink" : "text-ink-muted"}`}
        >
          {convo.lastMessage}
        </p>
      </div>
    );
  }

  return (
    <p className="text-ink-faint text-[13px] italic">
      Tap to start conversation
    </p>
  );
}

function AssistantRow({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  const Icon = primaryAgent.icon;
  return (
    <button
      onClick={onClick}
      data-active={active ? "true" : "false"}
      className="oc-row w-full text-left py-2.5 px-2.5 flex gap-3 items-center cursor-pointer"
    >
      <div
        className="oc-glow relative size-11 rounded-2xl flex items-center justify-center flex-none border"
        style={{
          color: primaryAgent.color,
          backgroundColor: `color-mix(in srgb, ${primaryAgent.color} 14%, transparent)`,
          borderColor: `color-mix(in srgb, ${primaryAgent.color} 28%, transparent)`,
        }}
      >
        <Icon className="size-[20px]" />
      </div>
      <div className="w-full min-w-0 flex flex-col flex-1">
        <div className="flex items-center gap-1.5">
          <h1 className="text-[14px] font-semibold text-ink truncate">
            {primaryAgent.name}
          </h1>
          <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-accent-soft text-accent font-mono">
            AI
          </span>
        </div>
        <p className="text-[12px] text-ink-faint truncate">
          Your AI chief of staff · ⌘J
        </p>
      </div>
    </button>
  );
}

export default function Sidebar() {
  const users = useQuery(api.user.getAllUsers, {});
  const conversations = useQuery(api.chats.getConversationsForCurrentUser);
  const currentUser = useQuery(api.chats.getCurrentUser, {});
  const syncUser = useMutation(api.user.getForCurrentUser);
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const activeUserId = params?.userId as string | undefined;
  const agentActive = pathname?.startsWith("/agents") ?? false;
  const [search, setSearch] = useState("");
  const [isSemanticOpen, setIsSemanticOpen] = useState(false);
  const now = useNow(15_000);

  useEffect(() => {
    if (!isAuthenticated) return;
    syncUser();
  }, [isAuthenticated, syncUser]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSemanticOpen((prev) => !prev);
      }
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        router.push(`/agents/${primaryAgent.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (users === undefined) {
    return <SidebarSkeleton />;
  }

  const searchText = search.toLowerCase().trim();
  const usersList = users ?? [];
  const usersExceptCurrent = usersList.filter(
    (user) => user._id !== currentUser?._id,
  );
  const usersById = new Map(
    usersExceptCurrent.map((user) => [String(user._id), user]),
  );
  const sortedConversations = conversations ?? [];
  const filteredChats = sortedConversations.filter((convo) => {
    if (convo.isGroup) return false;
    if (!convo.otherUserId) return false;
    const user = usersById.get(String(convo.otherUserId));
    if (!user) return false;

    if (!searchText) return true;
    const lastMessage = convo.lastMessage?.toLowerCase() ?? "";
    return (
      user.name.toLowerCase().includes(searchText) ||
      lastMessage.includes(searchText)
    );
  });

  const allUsers = usersExceptCurrent
    .filter((user) => user.name.toLowerCase().includes(searchText))
    .sort((a, b) => (b.lastSeen ?? 0) - (a.lastSeen ?? 0));

  const renderUserRow = (
    user: (typeof usersExceptCurrent)[number],
    convo?: (typeof sortedConversations)[number],
  ) => {
    const isActive = activeUserId === user._id;
    const isOnline = user.lastSeen && now - user.lastSeen < 75_000;

    return (
      <div
        key={user._id}
        onClick={() => router.push(`/chats/${user._id}`)}
        data-active={isActive ? "true" : "false"}
        className="oc-row py-2.5 px-2.5 flex gap-3 cursor-pointer items-center"
      >
        <Avatar
          name={user.name}
          imageUrl={user.imageUrl}
          online={Boolean(isOnline)}
        />
        <div className="w-full min-w-0 flex flex-col flex-1">
          <div className="flex justify-between items-center gap-2">
            <h1
              className={`text-[14px] truncate text-ink ${convo && convo.unreadCount > 0 ? "font-bold" : "font-semibold"}`}
            >
              {user.name}
            </h1>
            {convo && convo.unreadCount > 0 && (
              <span className="bg-accent text-accent-ink text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-none font-mono-num">
                {convo.unreadCount}
              </span>
            )}
          </div>
          <div className="w-full flex justify-between min-w-0">
            <UserSubtitle convo={convo} unreadCount={convo?.unreadCount ?? 0} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="md:max-w-xs px-2.5 h-dvh flex flex-col w-full border-r border-line bg-surface-1">
      <div className="flex flex-none pt-5 pb-3 px-1.5 justify-between items-center">
        <h1 className="text-[19px] font-bold tracking-tight text-ink">Chats</h1>
        <button
          onClick={() => setIsSemanticOpen(true)}
          className="oc-icon-btn oc-focus size-9"
          title="Semantic search (⌘K)"
        >
          <HiOutlineMagnifyingGlass className="size-[18px]" />
        </button>
      </div>
      <div className="flex flex-none items-center relative px-0.5">
        <CiSearch className="absolute left-3 text-ink-faint size-[18px]" />
        <input
          onChange={(e) => setSearch(e.target.value)}
          className="oc-input oc-focus w-full pl-9 pr-3 text-[13px] py-2.5"
          type="text"
          placeholder="Filter chats & people"
        />
      </div>

      <div className="flex-1 flex-col mt-4 -mx-0.5 px-0.5 overflow-y-auto oc-scroll">
        {searchText === "" && (
          <div className="mb-1 pb-2 border-b border-line">
            <AssistantRow
              active={agentActive}
              onClick={() => router.push(`/agents/${primaryAgent.id}`)}
            />
          </div>
        )}

        {filteredChats.length === 0 ? (
          <div className="px-3 py-6 text-[13px] text-ink-faint text-center">
            No chats found
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 pt-1">
            {filteredChats.map((chat) => {
              const user = chat.otherUserId
                ? usersById.get(String(chat.otherUserId))
                : undefined;
              return user ? renderUserRow(user, chat) : null;
            })}
          </div>
        )}

        <div className="px-2.5 pt-5 pb-2 text-[10px] uppercase tracking-[0.14em] text-ink-faint font-semibold font-mono">
          All People
        </div>
        {allUsers.length === 0 ? (
          <div className="px-3 py-2 text-[13px] text-ink-faint">
            No users found
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {allUsers.map((user) =>
              renderUserRow(
                user,
                sortedConversations.find(
                  (convo) =>
                    !convo.isGroup &&
                    String(convo.otherUserId) === String(user._id),
                ),
              ),
            )}
          </div>
        )}
      </div>

      <SemanticSearchModal
        open={isSemanticOpen}
        onClose={() => setIsSemanticOpen(false)}
      />
    </div>
  );
}
