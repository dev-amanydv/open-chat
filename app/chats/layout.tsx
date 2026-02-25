"use client";

import Sidebar from "@/components/Sidebar";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";

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
  const userId = params?.userId as Id<"users"> | undefined;

  const otherUser = useQuery(
    api.chats.getUserById,
    userId ? { userId } : "skip",
  );

  const updateLastSeen = useMutation(api.user.updateLastSeen);
  useEffect(() => {
    updateLastSeen();
    const intervel = setInterval(() => updateLastSeen(), 5000);

    return () => clearInterval(intervel);
  }, [updateLastSeen]);

  return (
    <main className="w-full flex">
      <Sidebar />
      <div className="w-full">
        <div className="h-screen flex flex-col">
          {userId ? (
            <div className="bg-[#FAFAFB] flex-none px-3 flex items-center border-[#ECECEE] w-full h-14 border-b">
              <div className="flex gap-3">
                <div className="border-neutral-200 relative border size-10 bg-white rounded-full flex items-center justify-center text-sm font-semibold text-neutral-500">
                  {otherUser?.name?.charAt(0).toUpperCase() ?? "?"}
                  {otherUser?.lastSeen &&
                  Date.now() - otherUser.lastSeen < 5000 ? (
                    <span className="size-2 bg-green-400 rounded-full absolute bottom-0 right-0"></span>
                  ) : null}
                </div>
                <div className="flex flex-col">
                  <h1 className="font-semibold">
                    {otherUser?.name ?? "Loading..."}
                  </h1>
                  {otherUser?.lastSeen &&
                  Date.now() - otherUser.lastSeen < 5000 ? (
                    <span className="text-xs text-neutral-400">Online</span>
                  ) : (
                    <span className="text-xs text-neutral-400">
                      Last seen{" "}
                      {otherUser?.lastSeen
                        ? timeAgo(otherUser.lastSeen)
                        : "unknown"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex-1 min-h-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
