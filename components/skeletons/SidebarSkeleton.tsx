export default function SidebarSkeleton() {
  return (
    <div className="max-w-xs px-0 h-screen flex flex-col w-full border-r border-zinc-200 dark:border-zinc-800">
      <div className="flex px-2 flex-none py-4 justify-between items-center">
        <div className="h-7 w-20 bg-neutral-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="size-5 bg-neutral-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>

      <div className="flex px-2 flex-none items-center relative">
        <div className="border w-full rounded-md h-[30px] bg-neutral-100 dark:bg-zinc-800 animate-pulse border-neutral-200 dark:border-zinc-700" />
      </div>

      <div className="flex-1 flex-col mt-5 overflow-y-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="py-3 px-2 flex gap-2">
            <div className="size-10 rounded-full bg-neutral-200 dark:bg-zinc-800 animate-pulse flex-none" />
            <div className="w-full flex flex-col gap-2 justify-center">
              <div
                className="h-3.5 bg-neutral-200 dark:bg-zinc-800 rounded animate-pulse"
                style={{ width: `${50 + (i % 3) * 15}%` }}
              />
              <div
                className="h-3 bg-neutral-100 dark:bg-zinc-700/50 rounded animate-pulse"
                style={{ width: `${60 + (i % 4) * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex-none px-3 py-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="size-8 rounded-full bg-neutral-200 dark:bg-zinc-800 animate-pulse" />
      </div>
    </div>
  );
}
