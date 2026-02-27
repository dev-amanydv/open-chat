export default function ChatHeaderSkeleton() {
  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex-none px-3 flex items-center border-zinc-200 dark:border-zinc-800 w-full h-14 border-b">
      <div className="flex gap-3">
        <div className="size-10 rounded-full bg-neutral-200 dark:bg-zinc-800 animate-pulse" />
        <div className="flex flex-col gap-1.5 justify-center">
          <div className="h-4 w-28 bg-neutral-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-16 bg-neutral-100 dark:bg-zinc-700/50 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
