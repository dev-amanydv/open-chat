"use client";

export default function ChatsDefaultScreen() {
  return (
    <div className="h-full flex items-center justify-center bg-[#fafafa]">
      <div className="text-center">
        <div className="size-20 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
          <svg
            className="size-10 text-neutral-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-neutral-600">Open Chat</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Select a user from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
}
