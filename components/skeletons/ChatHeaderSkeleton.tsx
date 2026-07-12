export default function ChatHeaderSkeleton() {
  return (
    <div className="oc-frost flex-none px-3 flex items-center border-line w-full h-16 border-b">
      <div className="flex gap-3 items-center">
        <div className="size-10 rounded-xl bg-surface-3 animate-pulse" />
        <div className="flex flex-col gap-1.5 justify-center">
          <div className="h-4 w-28 bg-surface-3 rounded animate-pulse" />
          <div className="h-3 w-16 bg-surface-3/60 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
