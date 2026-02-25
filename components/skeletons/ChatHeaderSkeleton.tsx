export default function ChatHeaderSkeleton() {
  return (
    <div className="bg-[#FAFAFB] flex-none px-3 flex items-center border-[#ECECEE] w-full h-14 border-b">
      <div className="flex gap-3">
        <div className="size-10 rounded-full bg-neutral-200 animate-pulse" />
        <div className="flex flex-col gap-1.5 justify-center">
          <div className="h-4 w-28 bg-neutral-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
