"use client";

import { agents } from "@/lib/agents";
import { useRouter, useParams } from "next/navigation";
import { CiSearch } from "react-icons/ci";
import { useState } from "react";
import { TbRobot } from "react-icons/tb";

export default function AgentSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeAgentId = params?.agentId as string | undefined;
  const [search, setSearch] = useState("");

  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  return (
    <div className="max-w-xs px-0 h-screen flex flex-col w-full border-r border-[#ECECEE]">
      <div className="flex px-3 flex-none py-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <TbRobot className="size-5 text-neutral-500" />
          <h1 className="text-xl font-bold">AI Agents</h1>
        </div>
      </div>
      <div className="flex px-2 flex-none items-center relative">
        <input
          onChange={(e) => setSearch(e.target.value)}
          className="border w-full rounded-md pl-7 text-sm py-1 focus:outline-0 border-neutral-300"
          type="text"
          placeholder="Search agents"
        />
        <CiSearch className="absolute left-4" />
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
                isActive ? "agent-sidebar-active" : "hover:bg-neutral-50"
              }`}
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${agent.color}0A 0%, ${agent.color}04 100%)`,
                      boxShadow: `0 0 0 1px ${agent.color}18`,
                    }
                  : undefined
              }
            >
              <div
                className="size-10 rounded-xl flex items-center justify-center flex-none transition-colors duration-200"
                style={{
                  background: isActive
                    ? `${agent.color}18`
                    : `${agent.color}0D`,
                  color: agent.color,
                }}
              >
                <IconComponent className="size-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2
                    className={`text-[14px] truncate ${
                      isActive
                        ? "font-semibold text-neutral-900"
                        : "font-medium text-neutral-700"
                    }`}
                  >
                    {agent.name}
                  </h2>
                  {agent.status === "coming_soon" && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-500 border border-neutral-200">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-neutral-400 truncate leading-tight">
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
