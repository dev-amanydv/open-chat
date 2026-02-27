"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiX, FiCheck } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function CreateGroupModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const users = useQuery(api.user.getAllUsers, isOpen ? {} : "skip");
  const createGroup = useMutation(api.chats.createGroup);
  const currentUser = useQuery(api.chats.getCurrentUser, isOpen ? {} : "skip");

  if (!isOpen) return null;

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (selectedUsers.size === 0) {
      toast.error("Please select at least one other member");
      return;
    }

    try {
      await createGroup({
        name: groupName.trim(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        participants: Array.from(selectedUsers) as any,
      });
      toast.success("Group created successfully!");
      setGroupName("");
      setSelectedUsers(new Set());
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create group");
    }
  };

  const availableUsers = users?.filter(
    (u) => currentUser && u._id !== currentUser._id,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-[90%] max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800/50 flex-none">
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
            New Group
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto min-h-0 flex-1">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Project Team, Family"
              className="w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 focus:bg-zinc-50 dark:focus:bg-zinc-800 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Add Members ({selectedUsers.size})
            </label>
            <div className="flex-1 overflow-y-auto border border-zinc-100 dark:border-zinc-800/50 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
              {!availableUsers || availableUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-400 dark:text-zinc-500 italic">
                  No other users available.
                </div>
              ) : (
                availableUsers.map((user) => {
                  const isSelected = selectedUsers.has(user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => handleToggleUser(user._id)}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 ${
                        isSelected ? "bg-zinc-100/80 dark:bg-zinc-800/80" : ""
                      }`}
                    >
                      <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-semibold text-xs overflow-hidden shrink-0">
                        {user.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt={user.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-zinc-800 dark:text-zinc-200 truncate">
                          {user.name}
                        </p>
                      </div>
                      <div
                        className={`size-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-zinc-800 dark:bg-blue-600 border-zinc-800 dark:border-blue-600"
                            : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                        }`}
                      >
                        {isSelected && (
                          <FiCheck className="text-white text-[10px]" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-end flex-none">
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.size === 0}
            className="bg-zinc-900 dark:bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:dark:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-blue-700 transition-colors shadow-sm"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
