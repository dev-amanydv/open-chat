"use client";

import { TbRobot } from "react-icons/tb";

export default function AgentsDefaultScreen() {
  return (
    <div className="hidden md:flex h-full items-center justify-center bg-zinc-50 dark:bg-[#0a0a0a]">
      <div className="text-center">
        <div className="size-20 mx-auto mb-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center backdrop-blur-sm">
          <TbRobot className="size-9 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-300">
          AI Agents
        </h2>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1.5 max-w-[260px]">
          Select an agent from the sidebar to start a conversation
        </p>
      </div>
    </div>
  );
}
