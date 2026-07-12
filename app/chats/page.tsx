"use client";

export default function ChatsDefaultScreen() {
  return (
    <div className="oc-canvas hidden md:flex h-full items-center justify-center">
      <div className="text-center oc-reveal">
        <div className="relative size-20 mx-auto mb-5 rounded-3xl bg-accent text-accent-ink shadow-[0_16px_40px_-12px_var(--accent-ring)] flex items-center justify-center text-3xl font-bold oc-glow">
          O
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Open Chat
        </h2>
        <p className="text-sm text-ink-faint mt-1.5 max-w-[280px]">
          Select a conversation from the sidebar, or press{" "}
          <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-line bg-surface-2 text-ink-muted">
            ⌘K
          </kbd>{" "}
          to search your messages.
        </p>
      </div>
    </div>
  );
}
