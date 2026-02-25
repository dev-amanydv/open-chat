"use client";
import { api } from "@/convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { Authenticated, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CiSearch } from "react-icons/ci";
import { IoCreateOutline } from "react-icons/io5";
import { RiCheckDoubleFill } from "react-icons/ri";
import SidebarSkeleton from "@/components/skeletons/SidebarSkeleton";

export default function Sidebar() {
  const users = useQuery(api.user.getAllUsers);
  const conversations = useQuery(api.chats.getConversationsForCurrentUser);
  const syncUser = useMutation(api.user.getForCurrentUser);
  const router = useRouter();
  const params = useParams();
  const activeUserId = params?.userId as string | undefined;
  const [search, setSearch] = useState("");

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  const searchedUsers = users?.filter((user) =>
    user.name.toLowerCase().trim().includes(search.toLowerCase().trim()),
  );

  if (users === undefined) {
    return <SidebarSkeleton />;
  }

  return (
    <div className="max-w-xs px-0 h-screen flex flex-col w-full border-r border-[#ECECEE]">
      <div className="flex px-2 flex-none py-4 justify-between items-center">
        <h1 className="text-xl font-bold">Chats</h1>
        <IoCreateOutline className="size-5" />
      </div>
      <div className="flex px-2 flex-none items-center relative">
        <input
          onChange={(e) => setSearch(e.target.value)}
          className="border w-full rounded-md pl-7 text-sm py-1 focus:outline-0 border-neutral-300"
          type="text"
          placeholder="Search"
        />
        <CiSearch className="absolute left-4" />
      </div>
      <div className="flex-1 flex-col mt-5 overflow-y-auto">
        {users.length === 0 ? (
          <div className="px-3 py-2 text-sm text-neutral-400">
            No users found
          </div>
        ) : (
          searchedUsers &&
          searchedUsers.map((user) => {
            const convo = conversations?.find(
              (convo) => convo.otherUserId === user._id,
            );
            const isActive = activeUserId === user._id;
            const isOnline = user.lastSeen && Date.now() - user.lastSeen < 5000;
            return (
              <div
                key={user._id}
                onClick={() => router.push(`/chats/${user._id}`)}
                className={`py-3 px-2 flex gap-2 hover:bg-neutral-100 rounded-md cursor-pointer ${isActive ? "bg-neutral-100" : ""}`}
              >
                <div className="size-10 relative rounded-full border border-neutral-400 bg-neutral-200 flex items-center justify-center text-sm font-semibold text-neutral-600 overflow-hidden">
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
                  <div className="flex justify-between">
                    <h1 className="font-semibold text-[14px]">{user.name}</h1>
                  </div>
                  <div className="w-full flex justify-between">
                    {convo ? (
                      <div className="flex items-center gap-1">
                        <RiCheckDoubleFill className="text-neutral-400" />
                        <p className="text-neutral-500 text-[13px]">
                          {convo.lastMessage}
                        </p>
                      </div>
                    ) : (
                      <p className="text-neutral-400 text-[13px] italic">
                        Tap to start conversation
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <Authenticated>
        <div className="flex-none px-3 py-3 border-t border-[#ECECEE]">
          <UserButton />
        </div>
      </Authenticated>
    </div>
  );
}
