"use client";

export default function GroupsDefaultScreen() {
  return (
    <div className="hidden md:flex h-full items-center justify-center bg-zinc-50 dark:bg-[#0a0a0a]">
      <div className="text-center">
        <div className="size-20 mx-auto mb-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center">
          <svg
            className="size-10 text-zinc-400 dark:text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-300">
          Open Group
        </h2>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
          Select a group from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
}
