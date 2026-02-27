"use client";

export default function ChatsDefaultScreen() {
  return (
    <div className="hidden md:flex h-full items-center justify-center bg-zinc-50 dark:bg-[#0a0a0a]">
      <div className="text-center">
        <div className="size-20 mx-auto mb-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center">
          <div className="landing-logo-mark">
            <span />
          </div>
        </div>
        <h2 className="landing-heading text-lg font-semibold tracking-[0.04em] text-neutral-700 dark:text-neutral-200">
          OPEN CHAT
        </h2>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
          Select a user from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
}
