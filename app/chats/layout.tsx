"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import ChatHeaderSkeleton from "@/components/skeletons/ChatHeaderSkeleton";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";
import { FiChevronLeft } from "react-icons/fi";
import Avatar from "@/components/Avatar";

const ONLINE_WINDOW_MS = 75_000;

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as Id<"users"> | undefined;

  const chatInfo = useQuery(
    api.chats.getChatHeaderInfo,
    userId ? { id: userId } : "skip",
  );

  const updateLastSeen = useMutation(api.user.updateLastSeen);
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      updateLastSeen();
    };

    tick();
    const interval = setInterval(() => {
      tick();
    }, 60_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateLastSeen();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updateLastSeen]);

  return (
    <main className="w-full h-dvh flex overflow-hidden">
      <div className={`md:flex ${userId ? "hidden" : "flex"} h-full`}>
        <Navbar />
      </div>
      <div
        className={`md:flex ${userId ? "hidden" : "flex"} flex-1 min-w-0 md:flex-none md:w-80 h-full`}
      >
        <Sidebar />
      </div>
      <div className={`w-full h-full ${userId ? "flex" : "hidden md:flex"}`}>
        <div className="h-full flex flex-col w-full">
          {userId ? (
            chatInfo === undefined ? (
              <ChatHeaderSkeleton />
            ) : chatInfo === null ? (
              <div className="oc-frost flex-none px-3 flex items-center border-line w-full h-16 border-b gap-3">
                <button
                  onClick={() => router.push("/chats")}
                  className="oc-icon-btn oc-focus md:hidden size-9 -ml-1"
                >
                  <FiChevronLeft className="text-xl" />
                </button>
                <p className="text-sm font-medium text-ink-muted">
                  Chat not found
                </p>
              </div>
            ) : (
              <div className="oc-frost flex-none px-3 flex items-center border-line w-full h-16 border-b gap-3">
                <button
                  onClick={() => router.push("/chats")}
                  className="oc-icon-btn oc-focus md:hidden size-9 -ml-1"
                >
                  <FiChevronLeft className="text-xl" />
                </button>
                <div className="flex gap-3 items-center">
                  <Avatar
                    name={chatInfo.name ?? "?"}
                    imageUrl={!chatInfo.isGroup ? chatInfo.imageUrl : undefined}
                    sizeClass="size-10"
                    radiusClass="rounded-xl"
                    online={
                      !chatInfo.isGroup &&
                      !!chatInfo.lastSeen &&
                      // eslint-disable-next-line react-hooks/purity
                      Date.now() - chatInfo.lastSeen < ONLINE_WINDOW_MS
                    }
                  />
                  <div className="flex flex-col min-w-0 justify-center">
                    <h1 className="font-semibold text-[15px] truncate text-ink tracking-tight">
                      {chatInfo.name}
                    </h1>
                    {chatInfo.isGroup ? (
                      <span className="text-xs text-ink-faint">
                        {chatInfo.memberCount} members
                      </span>
                    ) : chatInfo.lastSeen &&
                      // eslint-disable-next-line react-hooks/purity
                      Date.now() - chatInfo.lastSeen < ONLINE_WINDOW_MS ? (
                      <span className="text-xs text-positive font-medium flex items-center gap-1.5">
                        <span className="oc-online size-1.5 rounded-full" />
                        Online
                      </span>
                    ) : (
                      <span className="text-xs text-ink-faint">
                        Last seen{" "}
                        {chatInfo.lastSeen
                          ? timeAgo(chatInfo.lastSeen)
                          : "unknown"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : null}
          <div className="flex-1 min-h-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
