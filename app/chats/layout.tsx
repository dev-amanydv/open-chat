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
  const markAllAsDelivered = useMutation(api.chats.markAllAsDelivered);
  useEffect(() => {
    updateLastSeen();
    markAllAsDelivered();
    const intervel = setInterval(() => {
      updateLastSeen();
      markAllAsDelivered();
    }, 5000);

    return () => clearInterval(intervel);
  }, [updateLastSeen, markAllAsDelivered]);

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
              <div className="bg-[#FAFAFB] dark:bg-zinc-900 flex-none px-3 flex items-center border-[#ECECEE] dark:border-zinc-800 w-full h-14 border-b gap-3">
                <button
                  onClick={() => router.push("/chats")}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-neutral-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FiChevronLeft className="text-xl text-neutral-600 dark:text-neutral-400" />
                </button>
                <div className="flex gap-3">
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Chat not found
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAFAFB] dark:bg-zinc-900 flex-none px-3 flex items-center border-[#ECECEE] dark:border-zinc-800 w-full h-14 border-b gap-3">
                <button
                  onClick={() => router.push("/chats")}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-neutral-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FiChevronLeft className="text-xl text-neutral-600 dark:text-neutral-400" />
                </button>
                <div className="flex gap-3">
                  <div className="border-neutral-200 dark:border-zinc-700 relative border size-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-sm font-semibold text-neutral-500 dark:text-neutral-400 overflow-hidden shrink-0">
                    {!chatInfo.isGroup && chatInfo.imageUrl ? (
                      <img
                        src={chatInfo.imageUrl}
                        alt={chatInfo.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      (chatInfo.name?.charAt(0).toUpperCase() ?? "?")
                    )}
                    {!chatInfo.isGroup &&
                    chatInfo.lastSeen &&
                    // eslint-disable-next-line react-hooks/purity
                    Date.now() - chatInfo.lastSeen < 5000 ? (
                      <span className="size-2 bg-green-400 rounded-full absolute bottom-0 right-0"></span>
                    ) : null}
                  </div>
                  <div className="flex flex-col min-w-0 justify-center">
                    <h1 className="font-semibold text-sm truncate dark:text-zinc-100">
                      {chatInfo.name}
                    </h1>
                    {chatInfo.isGroup ? (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        {chatInfo.memberCount} members
                      </span>
                    ) : chatInfo.lastSeen &&
                      // eslint-disable-next-line react-hooks/purity
                      Date.now() - chatInfo.lastSeen < 5000 ? (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        Online
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
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
