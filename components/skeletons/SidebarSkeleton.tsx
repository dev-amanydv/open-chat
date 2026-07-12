export default function SidebarSkeleton() {
  return (
    <div className="md:max-w-xs px-2.5 h-dvh flex flex-col w-full border-r border-line bg-surface-1">
      <div className="flex flex-none pt-5 pb-3 px-1.5 justify-between items-center">
        <div className="h-6 w-20 bg-surface-3 rounded-lg animate-pulse" />
        <div className="size-8 bg-surface-3 rounded-lg animate-pulse" />
      </div>

      <div className="flex flex-none items-center relative px-0.5">
        <div className="w-full rounded-xl h-[38px] bg-surface-3 animate-pulse" />
      </div>

      <div className="flex-1 flex-col mt-4 overflow-y-auto flex gap-0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="py-2.5 px-2.5 flex gap-3 items-center">
            <div className="size-11 rounded-2xl bg-surface-3 animate-pulse flex-none" />
            <div className="w-full flex flex-col gap-2 justify-center">
              <div
                className="h-3.5 bg-surface-3 rounded animate-pulse"
                style={{ width: `${50 + (i % 3) * 15}%` }}
              />
              <div
                className="h-3 bg-surface-3/60 rounded animate-pulse"
                style={{ width: `${60 + (i % 4) * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
