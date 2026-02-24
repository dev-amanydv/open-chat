export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-[#FAFAFB] flex-none px-3 flex items-center border-[#ECECEE] w-full h-14 border-b">
        <div className="flex gap-3">
          <div className="border-neutral-200 relative border size-10 bg-white rounded-full ">
            <div className="size-3 absolute bottom-0 right-0 bg-neutral-300 rounded-full  border-neutral-200" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-semibold">Aman Yadav</h1>
            <p className="text-xs text-neutral-400">Active 2m ago</p>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
