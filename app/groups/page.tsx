export default function GroupsPage() {
  return (
    <div className="flex-1 flex items-center justify-center h-full bg-[#FAFAFB]">
      <div className="flex flex-col items-center gap-5 max-w-sm text-center px-6">
        <div className="relative">
          <div className="size-24 rounded-full bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center">
            <svg
              className="size-12 text-teal-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
          
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-neutral-800">Group Chats</h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Chat with multiple friends at once.
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
          <span className="relative flex size-2">
            <span className=" absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-teal-500"></span>
          </span>
          <span className="text-sm font-medium text-teal-700">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
