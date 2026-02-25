"use client";

import Sidebar from "@/components/Sidebar";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

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
                  <div className="size-3 absolute bottom-0 right-0 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className="font-semibold">
                    {otherUser?.name ?? "Loading..."}
                  </h1>
                  <p className="text-xs text-neutral-400">Online</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FAFAFB] flex-none px-3 flex items-center border-[#ECECEE] w-full h-14 border-b">
              <h1 className="font-semibold text-neutral-400">
                Select a chat to start messaging
              </h1>
            </div>
          )}
          <div className="flex-1 min-h-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
