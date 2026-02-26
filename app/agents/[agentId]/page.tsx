"use client";

import { useParams } from "next/navigation";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { IoSend } from "react-icons/io5";
import {
  BsCalendarCheck,
  BsCheckCircleFill,
  BsEnvelopeFill,
  BsClock,
  BsPersonFill,
} from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import {
  HiOutlineHandThumbUp,
  HiHandThumbUp,
  HiOutlineHandThumbDown,
  HiHandThumbDown,
} from "react-icons/hi2";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAgentById, AgentMessage, processAgentMessage } from "@/lib/agents";

const MAX_TEXTAREA_HEIGHT = 150;

const STARTER_SUGGESTIONS: Record<string, string[]> = {
  "meeting-scheduler": [
    "📅 Show available slots for today",
    "🕐 Book a meeting tomorrow at 3 PM",
    "📆 What times are free this week?",
    "⚡ Schedule a quick call",
  ],
  "code-reviewer": [
    "🔍 Review my React component",
    "🛡️ Check this code for security issues",
    "⚡ Optimize this function for performance",
    "📝 Review my TypeScript types",
  ],
  "data-analyst": [
    "📊 Help me analyze sales trends",
    "📈 Compare these two datasets",
    "🎯 Find patterns in my user data",
    "📉 Explain this metric drop",
  ],
  "writing-assistant": [
    "✉️ Draft a professional email",
    "📝 Help me write a blog post",
    "✨ Polish this paragraph",
    "📄 Create project documentation",
  ],
  "research-assistant": [
    "🔬 Research latest AI trends",
    "📖 Summarize this topic for me",
    "🧠 Compare these two technologies",
    "📋 Create a literature review",
  ],
};

function getFollowUpSuggestions(
  agentId: string,
  lastMessage: string,
  hasBooking: boolean,
): string[] {
  if (hasBooking) {
    return [
      "📅 Schedule another meeting",
      "🔄 Reschedule this meeting",
      "📋 Show my upcoming meetings",
    ];
  }

  const lower = lastMessage.toLowerCase();

  if (agentId === "meeting-scheduler") {
    if (lower.includes("available slots") || lower.includes("here are")) {
      return [
        "Book the first available slot",
        "Show me afternoon slots",
        "Try a different date",
      ];
    }
    if (lower.includes("not available") || lower.includes("no available")) {
      return [
        "Show me tomorrow's slots",
        "Try next week instead",
        "Any morning slots available?",
      ];
    }
    return [
      "📅 Check availability for tomorrow",
      "🕐 Book a slot for this afternoon",
      "📆 Show me this week's openings",
    ];
  }

  if (agentId === "code-reviewer") {
    if (lower.includes("security") || lower.includes("vulnerab")) {
      return [
        "How do I fix this?",
        "Show a secure alternative",
        "Any other concerns?",
      ];
    }
    return [
      "Review another snippet",
      "Explain this pattern more",
      "Suggest best practices",
    ];
  }

  if (agentId === "data-analyst") {
    return [
      "Visualize this data",
      "Dig deeper into this trend",
      "Compare with last quarter",
    ];
  }

  if (agentId === "writing-assistant") {
    return [
      "Make it more concise",
      "Change to a formal tone",
      "Add a call-to-action",
    ];
  }

  if (agentId === "research-assistant") {
    return [
      "Go deeper on this topic",
      "Find counterarguments",
      "Summarize the key points",
    ];
  }

  return [];
}

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const agent = getAgentById(agentId);
  const { user } = useUser();

  const [chatId, setChatId] = useState<Id<"agentChats"> | null>(null);
  const [localMessages, setLocalMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getOrCreateChat = useMutation(api.agentChats.getOrCreateChat);
  const sendConvexMessage = useMutation(api.agentChats.sendMessage);
  const rateMessage = useMutation(api.agentChats.rateMessage);
  const persistedMessages = useQuery(
    api.agentChats.getMessages,
    chatId ? { chatId } : "skip",
  );

  useEffect(() => {
    setChatId(null);
    setLocalMessages([]);
    setInput("");
    getOrCreateChat({ agentId }).then(setChatId);
  }, [agentId, getOrCreateChat]);

  useEffect(() => {
    if (!persistedMessages) return;
    setLocalMessages(
      persistedMessages.map((m) => ({
        id: m._id,
        role: m.role,
        content: m.content,
        timestamp: m._creationTime,
        booking: m.booking,
        rating: m.rating,
      })),
    );
  }, [persistedMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isThinking]);

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    ta.style.overflowY =
      ta.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !agent || !chatId) return;

    setInput("");
    setIsThinking(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendConvexMessage({ chatId, role: "user", content: content.trim() });

    try {
      const reply = await processAgentMessage(
        agent.id,
        content.trim(),
        localMessages,
        user?.fullName ?? user?.firstName ?? "Guest",
        user?.primaryEmailAddress?.emailAddress ?? "guest@example.com",
      );

      await sendConvexMessage({
        chatId,
        role: "agent",
        content: reply.content,
        booking: reply.booking,
      });

      if (reply.booking) {
        await sendConvexMessage({
          chatId,
          role: "agent",
          content: `📧 A confirmation email with complete meeting details has been sent to **${reply.booking.attendeeEmail}**. You'll also receive a calendar invite shortly. See you there!`,
        });
      }
    } catch {
      await sendConvexMessage({
        chatId,
        role: "agent",
        content: "Something went wrong. Please try again.",
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleRate = async (messageId: string, rating: "up" | "down") => {
    await rateMessage({
      messageId: messageId as Id<"agentMessages">,
      rating,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const followUpSuggestions = useMemo(() => {
    if (localMessages.length === 0 || isThinking) return [];
    const lastMsg = localMessages[localMessages.length - 1];
    if (lastMsg.role !== "agent") return [];
    const hasBookingInRecent = localMessages.some((m) => m.booking);
    if (hasBookingInRecent) return [];
    return getFollowUpSuggestions(agentId, lastMsg.content, false);
  }, [localMessages, agentId, isThinking]);

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center bg-[#fafafa]">
        <p className="text-neutral-400">Agent not found</p>
      </div>
    );
  }

  const IconComponent = agent.icon;
  const starters = STARTER_SUGGESTIONS[agentId] ?? [];

  return (
    <div className="h-full flex flex-col bg-[#fafafa]">
      <div
        className="flex-none px-5 py-4 border-b border-black/4"
        style={{ background: agent.bgGradient }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="size-11 rounded-xl flex items-center justify-center agent-hero-icon"
            style={{
              background: `${agent.color}14`,
              color: agent.color,
              boxShadow: `0 0 0 1px ${agent.color}12`,
            }}
          >
            <IconComponent className="size-[20px]" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-neutral-800">
              {agent.name}
            </h1>
            <p className="text-[12.5px] text-neutral-400 leading-snug max-w-md">
              {agent.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 py-4 max-w-3xl mx-auto">
          {localMessages.length === 0 && !isThinking && (
            <div className="flex flex-col items-center justify-center py-12 agent-empty-entrance">
              <div
                className="size-20 rounded-3xl flex items-center justify-center mb-5 relative"
                style={{
                  background: `linear-gradient(135deg, ${agent.color}18 0%, ${agent.color}08 100%)`,
                  color: agent.color,
                  boxShadow: `0 8px 32px ${agent.color}14, 0 0 0 1px ${agent.color}10`,
                }}
              >
                <IconComponent className="size-9" />
                <div
                  className="absolute -top-1 -right-1 size-6 rounded-full flex items-center justify-center"
                  style={{ background: agent.color }}
                >
                  <HiSparkles className="size-3.5 text-white" />
                </div>
              </div>

              <h2 className="text-[17px] font-semibold text-neutral-800 mb-1.5">
                {agent.name}
              </h2>
              <p className="text-[13px] text-neutral-400 text-center max-w-xs mb-8 leading-relaxed">
                {agent.description}
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-8 max-w-sm">
                {getCapabilities(agentId).map((cap) => (
                  <span
                    key={cap}
                    className="text-[11.5px] px-3 py-1.5 rounded-full font-medium"
                    style={{
                      background: `${agent.color}0A`,
                      color: agent.color,
                      border: `1px solid ${agent.color}15`,
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>

              <p className="text-[11px] text-neutral-300 uppercase tracking-widest mb-3 font-medium">
                Try asking
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={!chatId}
                    className="text-left text-[13px] px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer suggestion-chip"
                    style={{
                      background: "rgba(255,255,255,0.7)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(0,0,0,0.05)",
                      color: "#555",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {localMessages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} agent-msg-entrance`}
            >
              {msg.role === "agent" && (
                <div
                  className="size-7 rounded-lg flex items-center justify-center flex-none mr-2 mt-1"
                  style={{
                    background: `${agent.color}10`,
                    color: agent.color,
                  }}
                >
                  <IconComponent className="size-3.5" />
                </div>
              )}
              <div className="max-w-[75%]">
                <div
                  className={
                    msg.role === "user" ? "agent-msg-user" : "agent-msg-bot"
                  }
                  style={
                    msg.role === "user"
                      ? {
                          background: agent.color,
                          color: "#fff",
                          borderRadius: "16px 16px 4px 16px",
                          padding: "10px 16px",
                        }
                      : {
                          background: "rgba(255,255,255,0.7)",
                          backdropFilter: "blur(12px)",
                          WebkitBackdropFilter: "blur(12px)",
                          border: "1px solid rgba(0,0,0,0.05)",
                          borderRadius: "16px 16px 16px 4px",
                          padding: "10px 16px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }
                  }
                >
                  <p
                    className={`text-[14px] leading-relaxed whitespace-pre-wrap ${msg.role === "agent" ? "text-neutral-700" : ""}`}
                  >
                    {msg.content}
                  </p>

                  {msg.booking && (
                    <div
                      className="mt-3 rounded-2xl overflow-hidden booking-card"
                      style={{
                        background: "#fff",
                        boxShadow: `0 4px 24px ${agent.color}12, 0 1px 4px rgba(0,0,0,0.06)`,
                        border: `1px solid ${agent.color}18`,
                      }}
                    >
                      <div
                        className="px-5 py-4 flex items-center gap-3"
                        style={{
                          background: `linear-gradient(135deg, ${agent.color} 0%, ${agent.color}CC 100%)`,
                        }}
                      >
                        <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                          <BsCheckCircleFill className="size-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-white">
                            Meeting Confirmed!
                          </p>
                          <p className="text-[12px] text-white/70">
                            Your meeting has been scheduled successfully
                          </p>
                        </div>
                      </div>

                      <div className="px-5 py-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <BsCalendarCheck
                            className="size-4 mt-0.5 flex-none"
                            style={{ color: agent.color }}
                          />
                          <div>
                            <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">
                              Meeting
                            </p>
                            <p className="text-[14px] font-medium text-neutral-800">
                              {msg.booking.title}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-6">
                          <div className="flex items-start gap-3">
                            <BsClock
                              className="size-4 mt-0.5 flex-none"
                              style={{ color: agent.color }}
                            />
                            <div>
                              <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">
                                Date & Time
                              </p>
                              <p className="text-[13.5px] text-neutral-700">
                                {msg.booking.date}
                              </p>
                              <p className="text-[13.5px] font-medium text-neutral-800">
                                {msg.booking.time}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <BsPersonFill
                            className="size-4 mt-0.5 flex-none"
                            style={{ color: agent.color }}
                          />
                          <div>
                            <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">
                              Attendee
                            </p>
                            <p className="text-[13.5px] text-neutral-700">
                              {msg.booking.attendeeName}
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-2.5 mt-2 pt-3 border-t"
                          style={{ borderColor: `${agent.color}12` }}
                        >
                          <BsEnvelopeFill
                            className="size-3.5 flex-none"
                            style={{ color: agent.color }}
                          />
                          <p className="text-[12px] text-neutral-400">
                            Confirmation sent to{" "}
                            <span className="text-neutral-600 font-medium">
                              {msg.booking.attendeeEmail}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <p
                    className={`text-[10.5px] mt-1 ${
                      msg.role === "user"
                        ? "text-white/50 text-right"
                        : "text-neutral-300"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {msg.role === "agent" && (
                  <div className="flex items-center gap-0.5 mt-1 ml-1">
                    <button
                      onClick={() => handleRate(msg.id, "up")}
                      className="rating-btn group"
                      title="Good response"
                    >
                      {msg.rating === "up" ? (
                        <HiHandThumbUp
                          className="size-3.5 transition-all duration-200"
                          style={{ color: agent.color }}
                        />
                      ) : (
                        <HiOutlineHandThumbUp className="size-3.5 text-neutral-300 group-hover:text-neutral-500 transition-all duration-200" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRate(msg.id, "down")}
                      className="rating-btn group"
                      title="Poor response"
                    >
                      {msg.rating === "down" ? (
                        <HiHandThumbDown className="size-3.5 text-red-400 transition-all duration-200" />
                      ) : (
                        <HiOutlineHandThumbDown className="size-3.5 text-neutral-300 group-hover:text-neutral-500 transition-all duration-200" />
                      )}
                    </button>
                  </div>
                )}

                {msg.role === "agent" &&
                  idx === localMessages.length - 1 &&
                  followUpSuggestions.length > 0 &&
                  !isThinking && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-1 agent-suggestions-entrance">
                      {followUpSuggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          className="text-[12px] px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer suggestion-chip-inline"
                          style={{
                            background: `${agent.color}08`,
                            border: `1px solid ${agent.color}18`,
                            color: agent.color,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div
                className="size-7 rounded-lg flex items-center justify-center flex-none mr-2 mt-1"
                style={{
                  background: `${agent.color}10`,
                  color: agent.color,
                }}
              >
                <IconComponent className="size-3.5" />
              </div>
              <div
                className="px-4 py-3 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="agent-thinking-dot size-1.5 rounded-full"
                    style={{ background: agent.color, animationDelay: "0s" }}
                  />
                  <span
                    className="agent-thinking-dot size-1.5 rounded-full"
                    style={{
                      background: agent.color,
                      animationDelay: "0.15s",
                    }}
                  />
                  <span
                    className="agent-thinking-dot size-1.5 rounded-full"
                    style={{ background: agent.color, animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-none px-4 pb-4 pt-2 max-w-3xl mx-auto w-full">
        <div
          className="flex items-end gap-2 rounded-2xl px-4 py-2 agent-input-bar"
          style={{
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${agent.name}...`}
            className="flex-1 bg-transparent text-[14px] text-neutral-800 placeholder:text-neutral-300 focus:outline-none resize-none h-9 py-2 leading-snug"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="size-8 flex-none rounded-xl flex items-center justify-center transition-all duration-200 mb-0.5"
            style={{
              background: input.trim() ? agent.color : "transparent",
              color: input.trim() ? "#fff" : "#ccc",
              opacity: isThinking ? 0.5 : 1,
              transform: input.trim() ? "scale(1)" : "scale(0.9)",
            }}
          >
            <IoSend className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getCapabilities(agentId: string): string[] {
  const caps: Record<string, string[]> = {
    "meeting-scheduler": [
      "Check Availability",
      "Book Meetings",
      "Smart Scheduling",
      "Calendar Sync",
    ],
    "code-reviewer": [
      "Bug Detection",
      "Security Audit",
      "Performance Tips",
      "Best Practices",
    ],
    "data-analyst": [
      "Trend Analysis",
      "Data Visualization",
      "Statistical Insights",
      "Anomaly Detection",
    ],
    "writing-assistant": [
      "Drafting",
      "Editing & Polish",
      "Tone Matching",
      "SEO Writing",
    ],
    "research-assistant": [
      "Topic Research",
      "Summarization",
      "Fact Checking",
      "Synthesis",
    ],
  };
  return caps[agentId] ?? [];
}
