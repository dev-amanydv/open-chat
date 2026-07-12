export default function ChatPageSkeleton() {
  return (
    <div className="h-full relative flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col gap-0 relative">
        <div className="oc-canvas h-full absolute -z-10 inset-0 w-full" />
        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 px-4 md:px-6 w-full py-4 max-w-3xl mx-auto">
          <div className="oc-bubble oc-bubble-them self-start w-[55%] max-w-[70%] animate-pulse">
            <div className="h-3.5 w-full bg-line-strong rounded mb-2" />
            <div className="h-3.5 w-3/4 bg-line-strong rounded mb-2" />
            <div className="h-2.5 w-12 bg-line rounded ml-auto" />
          </div>

          <div className="oc-bubble oc-bubble-me self-end w-[45%] max-w-[70%] animate-pulse opacity-80">
            <div className="h-3.5 w-full bg-white/30 rounded mb-2" />
            <div className="h-2.5 w-12 bg-white/20 rounded ml-auto" />
          </div>

          <div className="oc-bubble oc-bubble-them self-start w-[40%] max-w-[70%] animate-pulse">
            <div className="h-3.5 w-full bg-line-strong rounded mb-2" />
            <div className="h-2.5 w-12 bg-line rounded ml-auto" />
          </div>

          <div className="oc-bubble oc-bubble-me self-end w-[60%] max-w-[70%] animate-pulse opacity-80">
            <div className="h-3.5 w-full bg-white/30 rounded mb-2" />
            <div className="h-3.5 w-2/3 bg-white/30 rounded mb-2" />
            <div className="h-2.5 w-12 bg-white/20 rounded ml-auto" />
          </div>

          <div className="oc-bubble oc-bubble-them self-start w-[50%] max-w-[70%] animate-pulse">
            <div className="h-3.5 w-full bg-line-strong rounded mb-2" />
            <div className="h-3.5 w-1/2 bg-line-strong rounded mb-2" />
            <div className="h-2.5 w-12 bg-line rounded ml-auto" />
          </div>
        </div>
      </div>

      <div className="oc-frost flex-none px-3 md:px-6 py-3 w-full border-line border-t">
        <div className="oc-composer max-w-3xl mx-auto flex items-center gap-2 pl-2 pr-2 py-1.5">
          <div className="size-9 bg-surface-2 rounded-full animate-pulse flex-none" />
          <div className="w-full h-6 bg-surface-2 rounded animate-pulse" />
          <div className="size-9 flex-none bg-surface-2 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
