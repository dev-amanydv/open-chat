"use client";

import { agents } from "@/lib/agents";
import { useRouter, useParams } from "next/navigation";
import { CiSearch } from "react-icons/ci";
import { useState } from "react";
import Image from "next/image";

export default function AgentSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeAgentId = params?.agentId as string | undefined;
  const [search, setSearch] = useState("");

  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  return (
    <div className="md:max-w-xs px-0 h-dvh flex flex-col w-full border-r border-zinc-200 dark:border-zinc-800 dark:bg-[#0a0a0a]">
      <div className="flex px-3 flex-none py-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <Image src={"/agent.png"} width={28} height={28} alt="agent" />
          <h1 className="text-xl font-bold dark:text-zinc-100">AI Agents</h1>
        </div>
      </div>
      <div className="flex px-2 flex-none items-center relative">
        <input
          onChange={(e) => setSearch(e.target.value)}
          className="border w-full rounded-md pl-7 text-sm py-1 focus:outline-0 border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-300 dark:focus:border-zinc-700 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 dark:text-zinc-100"
          type="text"
          placeholder="Search agents"
        />
        <CiSearch className="absolute left-4 dark:text-zinc-400" />
      </div>
      <div className="flex-1 flex-col mt-4 overflow-y-auto px-1.5">
        {filteredAgents.map((agent) => {
          const isActive = activeAgentId === agent.id;
          const IconComponent = agent.icon;
          return (
            <div
              key={agent.id}
              onClick={() => router.push(`/agents/${agent.id}`)}
              className={`py-3 px-2.5 flex gap-3 items-center rounded-xl cursor-pointer transition-all duration-200 mb-0.5 ${
                isActive
                  ? "bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-transparent"
              }`}
            >
              <div className="size-10 rounded-xl flex items-center justify-center flex-none transition-colors duration-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                <IconComponent className="size-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2
                    className={`text-[14px] truncate ${
                      isActive
                        ? "font-semibold text-neutral-900 dark:text-zinc-100"
                        : "font-medium text-neutral-700 dark:text-zinc-300"
                    }`}
                  >
                    {agent.name}
                  </h2>
                  {agent.status === "coming_soon" && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-zinc-400 border border-neutral-200 dark:border-zinc-700">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-neutral-400 dark:text-zinc-500 truncate leading-tight">
                  {agent.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
