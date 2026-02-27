"use client";

import Navbar from "@/components/Navbar";
import AgentSidebar from "@/components/AgentSidebar";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const agentId = params?.agentId as string | undefined;

  const updateLastSeen = useMutation(api.user.updateLastSeen);

  useEffect(() => {
    updateLastSeen();
    const interval = setInterval(() => {
      updateLastSeen();
    }, 5000);
    return () => clearInterval(interval);
  }, [updateLastSeen]);

  return (
    <main className="w-full h-dvh flex overflow-hidden">
      <div className={`md:flex ${agentId ? "hidden" : "flex"} h-full`}>
        <Navbar />
      </div>
      <div
        className={`md:flex ${agentId ? "hidden" : "flex"} flex-1 min-w-0 md:flex-none md:w-80 h-full`}
      >
        <AgentSidebar />
      </div>
      <div className={`w-full h-full ${agentId ? "flex" : "hidden md:flex"}`}>
        <div className="h-full flex flex-col w-full">
          <div className="flex-1 min-h-0 bg-[#fafafa]">{children}</div>
        </div>
      </div>
    </main>
  );
}
