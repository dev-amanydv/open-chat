export default function ChatPageSkeleton() {
  return (
    <div className="h-full relative flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col gap-0 relative">
        <div className="h-full absolute -z-10 inset-0 w-full bg-[#fafafa]">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.1) 0, rgba(0, 0, 0, 0.1) 1px, transparent 1px, transparent 20px),
                repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.1) 0, rgba(0, 0, 0, 0.1) 1px, transparent 1px, transparent 20px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 w-full py-3">
          <div className="self-start w-[55%] max-w-[70%] px-4 py-3 rounded-tl-lg rounded-tr-lg rounded-br-lg bg-neutral-200/60 animate-pulse">
            <div className="h-3.5 w-full bg-neutral-300/50 rounded mb-2" />
            <div className="h-3.5 w-3/4 bg-neutral-300/50 rounded mb-2" />
            <div className="h-2.5 w-12 bg-neutral-300/40 rounded ml-auto" />
          </div>

          <div className="self-end w-[45%] max-w-[70%] px-4 py-3 rounded-tl-lg rounded-tr-lg rounded-bl-lg bg-[#357578]/30 animate-pulse">
            <div className="h-3.5 w-full bg-[#357578]/20 rounded mb-2" />
            <div className="h-2.5 w-12 bg-[#357578]/15 rounded ml-auto" />
          </div>

          <div className="self-start w-[40%] max-w-[70%] px-4 py-3 rounded-tl-lg rounded-tr-lg rounded-br-lg bg-neutral-200/60 animate-pulse">
            <div className="h-3.5 w-full bg-neutral-300/50 rounded mb-2" />
            <div className="h-2.5 w-12 bg-neutral-300/40 rounded ml-auto" />
          </div>

          <div className="self-end w-[60%] max-w-[70%] px-4 py-3 rounded-tl-lg rounded-tr-lg rounded-bl-lg bg-[#357578]/30 animate-pulse">
            <div className="h-3.5 w-full bg-[#357578]/20 rounded mb-2" />
            <div className="h-3.5 w-2/3 bg-[#357578]/20 rounded mb-2" />
            <div className="h-2.5 w-12 bg-[#357578]/15 rounded ml-auto" />
          </div>

          <div className="self-start w-[50%] max-w-[70%] px-4 py-3 rounded-tl-lg rounded-tr-lg rounded-br-lg bg-neutral-200/60 animate-pulse">
            <div className="h-3.5 w-full bg-neutral-300/50 rounded mb-2" />
            <div className="h-3.5 w-1/2 bg-neutral-300/50 rounded mb-2" />
            <div className="h-2.5 w-12 bg-neutral-300/40 rounded ml-auto" />
          </div>
        </div>
      </div>

      <div className="min-h-14 flex-none px-3 w-full gap-3 border-[#ECECEE] border-t flex items-center bg-[#FAFAFB]">
        <div className="size-5 bg-neutral-200 rounded animate-pulse" />
        <div className="w-full flex py-2">
          <div className="w-full h-9 bg-neutral-100 rounded-xl animate-pulse border border-neutral-200" />
        </div>
        <div className="size-8 flex-none bg-neutral-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
