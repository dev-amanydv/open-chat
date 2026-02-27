"use client";

import { useParams, useRouter } from "next/navigation";
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
import { FiChevronLeft } from "react-icons/fi";

const MAX_TEXTAREA_HEIGHT = 150;
const SCROLL_BOTTOM_THRESHOLD = 96;

const STARTER_SUGGESTIONS: Record<string, string[]> = {
  "meeting-mind": [
    "Show Aman's available slots for tomorrow",
    "Book a meeting with Aman at 3 PM",
    "What times is Aman free next week?",
    "Schedule a quick call with Aman",
  ],
  "chat-mind": [
    "Show my recent conversations",
    "Search messages about the project",
    "Summarize my chat with Aman",
    "Who hasn't replied to me?",
  ],
  "master-mind": [
    "What did I do today?",
    "Book a meeting and notify Aman Yadav",
    "Actions I need to take?",
    "Summarize my recent activity",
  ],
  "mail-mind": ["Read my unread emails", "Draft a reply to the client"],
};

function getFollowUpSuggestions(
  agentId: string,
  lastMessage: string,
  hasBooking: boolean,
  actionTrace: string[],
  lastUserMessage?: string,
): string[] {
  const lower = lastMessage.toLowerCase();
  const lowerUser = (lastUserMessage ?? "").toLowerCase();
  const hasStep = (step: string) => actionTrace.includes(step);

  const transcriptMatch = lastMessage.match(/transcript with ([^:]+):/i);
  const transcriptName = transcriptMatch?.[1]?.trim();

  const hasPlanPrompt =
    lower.includes("mastermind plan") ||
    (lower.includes("step 1") && lower.includes("shall i proceed"));

  const asksForConfirmation =
    hasPlanPrompt ||
    hasStep("plan_pending") ||
    lower.includes("shall i proceed") ||
    lower.includes("should i proceed") ||
    lower.includes("ready to send") ||
    lower.includes('say "confirm"') ||
    lower.includes("say 'confirm'");

  const hasMessageFailure =
    hasStep("message_failed") ||
    lower.includes("couldn't find a user") ||
    lower.includes("missing 'to' or 'content'") ||
    lower.includes("trouble accessing your messages") ||
    lower.includes("couldn't access your messages");

  if (asksForConfirmation) {
    if (agentId === "master-mind") {
      return ["confirm", "Edit the plan", "Cancel"];
    }
    if (agentId === "meeting-mind") {
      return ["confirm", "Change time", "Cancel"];
    }
    if (agentId === "chat-mind") {
      return ["confirm", "Edit the message", "Cancel"];
    }
    return ["confirm", "Edit", "Cancel"];
  }

  if (hasBooking || hasStep("booked")) {
    if (hasMessageFailure) {
      return [
        "Edit recipient and retry",
        "Send message with a new name",
        "Schedule another meeting",
      ];
    }
    if (hasStep("message_sent")) {
      return [
        "Check if they replied",
        "Schedule a follow-up meeting",
        "Summarize today's activity",
      ];
    }
    return [
      "Schedule another meeting",
      "Reschedule this meeting",
      "Send them a confirmation message",
    ];
  }

  if (agentId === "meeting-mind") {
    if (hasStep("availability_checked") && lower.includes("here are")) {
      return [
        "Book the earliest available slot",
        "Book an afternoon slot",
        "Show tomorrow's slots",
      ];
    }
    if (lower.includes("available slots") || lower.includes("here are")) {
      return [
        "Book the earliest available slot",
        "Show me afternoon slots instead",
        "How about next week?",
      ];
    }
    if (lower.includes("not available") || lower.includes("no available")) {
      return ["What about tomorrow?", "Show me next week's slots"];
    }
    return [
      "Check availability for tomorrow",
      "Book a slot for this afternoon",
    ];
  }

  if (agentId === "chat-mind") {
    if (hasMessageFailure) {
      return ["Edit recipient", "Edit message", "Cancel sending"];
    }
    if (lower.includes("here are your last")) {
      return [
        "Summarize the latest one",
        "Any unreplied messages?",
        "Search messages about project update",
      ];
    }
    if (lower.includes("people who haven't replied")) {
      return [
        "Draft a reminder message",
        "Show my last 10 messages",
        "Who needs follow-up first?",
      ];
    }
    if (transcriptName) {
      return [
        "Summarize this conversation",
        `Draft a reply to ${transcriptName}`,
        "Show recent conversations",
      ];
    }
    if (
      lower.includes("recent conversations") ||
      lower.includes("conversations:")
    ) {
      return ["Summarize the latest one", "Any unreplied messages?"];
    }
    if (lower.includes("search results")) {
      return ["Summarize this conversation", "Reply to them"];
    }
    if (lower.includes("ready to send")) {
      return ["confirm", "Edit the message", "Cancel"];
    }
    if (lower.includes("message sent successfully")) {
      return ["Any unreplied messages?", "Show recent conversations"];
    }
    return ["Show recent conversations", "Check pending replies"];
  }

  if (agentId === "master-mind") {
    if (hasMessageFailure) {
      return [
        "Edit recipient and retry",
        "Revise the message",
        "Cancel",
      ];
    }
    if (hasStep("booked") && !hasStep("message_sent")) {
      return [
        "Send confirmation message to them",
        "Share meeting details",
        "Schedule another meeting",
      ];
    }
    if (hasStep("booked") && hasStep("message_sent")) {
      return [
        "Check if they replied",
        "What are my pending actions?",
        "Schedule another meeting",
      ];
    }
    if (hasStep("delegated")) {
      return ["confirm", "Revise the plan", "Cancel"];
    }
    if (lowerUser.includes("book") || lowerUser.includes("schedule")) {
      return ["confirm", "Adjust time", "Cancel"];
    }
    return ["Explain your plan", "Do it", "Let's change the plan"];
  }

  return [];
}

function getActionTrace(message: AgentMessage): string[] {
  if (message.role !== "agent") return [];

  const text = message.content.toLowerCase();
  const steps: string[] = [];

  if (
    message.booking ||
    text.includes("meeting has been booked successfully") ||
    text.includes("meeting confirmed")
  ) {
    steps.push("booked");
  }

  if (
    text.includes("confirmation message status") ||
    text.includes("message sent successfully")
  ) {
    if (
      text.includes("message sent successfully") ||
      text.includes("✅ message sent successfully")
    ) {
      steps.push("message_sent");
    } else if (
      text.includes("couldn't find a user") ||
      text.includes("missing 'to' or 'content'") ||
      text.includes("trouble accessing your messages") ||
      text.includes("couldn't access your messages")
    ) {
      steps.push("message_failed");
    }
  }

  if (
    text.includes("available slots") ||
    text.includes("slot is available") ||
    text.includes("isn't available")
  ) {
    steps.push("availability_checked");
  }

  if (text.includes("completed the task")) {
    steps.push("delegated");
  }

  if (text.includes("mastermind plan") && text.includes("shall i proceed")) {
    steps.push("plan_pending");
  }

  return Array.from(new Set(steps));
}

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  const agent = getAgentById(agentId);
  const { user } = useUser();

  const [chatId, setChatId] = useState<Id<"agentChats"> | null>(null);
  const [localMessages, setLocalMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasUnseenMessages, setHasUnseenMessages] = useState(false);
  const previousMessageCountRef = useRef(0);
  const hasInitializedScrollRef = useRef(false);

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

  const checkIsAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
    setIsAtBottom(true);
    setHasUnseenMessages(false);
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const atBottom = checkIsAtBottom();
    setIsAtBottom(atBottom);
    if (atBottom) {
      setHasUnseenMessages(false);
    }
  }, [checkIsAtBottom]);

  useEffect(() => {
    hasInitializedScrollRef.current = false;
    previousMessageCountRef.current = 0;
    setIsAtBottom(true);
    setHasUnseenMessages(false);
  }, [chatId]);

  useEffect(() => {
    const currentMessageCount = localMessages.length;

    if (!hasInitializedScrollRef.current) {
      hasInitializedScrollRef.current = true;
      previousMessageCountRef.current = currentMessageCount;

      if (currentMessageCount > 0) {
        requestAnimationFrame(() => scrollToBottom("auto"));
      }
      return;
    }

    const hasNewMessage = currentMessageCount > previousMessageCountRef.current;
    previousMessageCountRef.current = currentMessageCount;
    if (!hasNewMessage) return;

    if (checkIsAtBottom()) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
      return;
    }

    setHasUnseenMessages(true);
  }, [localMessages, checkIsAtBottom, scrollToBottom]);

  useEffect(() => {
    if (!isThinking) return;
    requestAnimationFrame(() => scrollToBottom("smooth"));
  }, [isThinking, scrollToBottom]);

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
    requestAnimationFrame(() => scrollToBottom("smooth"));

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendConvexMessage({ chatId, role: "user", content: content.trim() });
    requestAnimationFrame(() => scrollToBottom("smooth"));

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
      requestAnimationFrame(() => scrollToBottom("smooth"));

      const hasInlineMessageStatus =
        /confirmation message status|message sent successfully/i.test(
          reply.content,
        );

      if (reply.booking && !hasInlineMessageStatus) {
        await sendConvexMessage({
          chatId,
          role: "agent",
          content: `📧 A confirmation email with complete meeting details has been sent to **${reply.booking.attendeeEmail}**. You'll also receive a calendar invite shortly. See you there!`,
        });
        requestAnimationFrame(() => scrollToBottom("smooth"));
      }
    } catch {
      await sendConvexMessage({
        chatId,
        role: "agent",
        content: "Something went wrong. Please try again.",
      });
      requestAnimationFrame(() => scrollToBottom("smooth"));
    } finally {
      setIsThinking(false);
      requestAnimationFrame(() => scrollToBottom("smooth"));
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
    const actionTrace = getActionTrace(lastMsg);
    const previousUserMessage = [...localMessages]
      .reverse()
      .find((m) => m.role === "user")?.content;
    return getFollowUpSuggestions(
      agentId,
      lastMsg.content,
      Boolean(lastMsg.booking),
      actionTrace,
      previousUserMessage,
    );
  }, [localMessages, agentId, isThinking]);

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <p className="text-neutral-400 dark:text-neutral-500">
          Agent not found
        </p>
      </div>
    );
  }

  const IconComponent = agent.icon;
  const starters = STARTER_SUGGESTIONS[agentId] ?? [];

  return (
    <div className="h-full relative flex flex-col bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex-none px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <button
          onClick={() => router.push("/agents")}
          className="md:hidden p-2 -ml-3 mr-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <FiChevronLeft className="text-xl text-neutral-800 dark:text-zinc-100" />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl flex items-center justify-center agent-hero-icon bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
            <IconComponent className="size-[20px]" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-neutral-800 dark:text-zinc-100">
              {agent.name}
            </h1>
            <p className="text-[12.5px] text-neutral-400 dark:text-neutral-500 leading-snug max-w-md hidden sm:block">
              {agent.description}
            </p>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        <div className="flex flex-col gap-3 px-4 py-4 max-w-3xl mx-auto">
          {localMessages.length === 0 && !isThinking && (
            <div className="flex flex-col items-center justify-center py-12 agent-empty-entrance">
              <div className="size-20 rounded-3xl flex items-center justify-center mb-5 relative bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-sm">
                <IconComponent className="size-9" />
                <div className="absolute -top-1 -right-1 size-6 rounded-full flex items-center justify-center bg-zinc-900 dark:bg-blue-600 border-2 border-white dark:border-zinc-900">
                  <HiSparkles className="size-3.5 text-white" />
                </div>
              </div>

              <h2 className="text-[17px] font-semibold text-neutral-800 dark:text-zinc-100 mb-1.5">
                {agent.name}
              </h2>
              <p className="text-[13px] text-neutral-400 dark:text-neutral-500 text-center max-w-xs mb-8 leading-relaxed">
                {agent.description}
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-8 max-w-sm">
                {getCapabilities(agentId).map((cap) => (
                  <span
                    key={cap}
                    className="text-[11.5px] px-3 py-1.5 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                  >
                    {cap}
                  </span>
                ))}
              </div>

              {agent.status === "coming_soon" ? (
                <div className="mt-4 px-6 py-4 rounded-2xl flex items-center justify-center text-center max-w-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                  <p className="text-[14px] font-medium">
                    This agent is currently in development and will be available
                    soon!
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-neutral-300 dark:text-neutral-600 uppercase tracking-widest mb-3 font-medium">
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
                          background:
                            "var(--tw-bg-opacity, rgba(255,255,255,0.7))",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {localMessages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} agent-msg-entrance`}
            >
              {msg.role === "agent" && (
                <div className="size-7 rounded-lg flex items-center justify-center flex-none mr-2 mt-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                  <IconComponent className="size-3.5" />
                </div>
              )}
              <div className="max-w-[75%]">
                <div
                  className={`px-4 py-2.5 ${
                    msg.role === "user"
                      ? "agent-msg-user bg-zinc-800 dark:bg-blue-600 text-white rounded-[16px_16px_4px_16px]"
                      : "agent-msg-bot bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-[16px_16px_16px_4px]"
                  }`}
                  style={{
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                >
                  <p
                    className={`text-[14px] leading-relaxed whitespace-pre-wrap ${msg.role === "agent" ? "text-neutral-700 dark:text-zinc-300" : ""}`}
                  >
                    {msg.content}
                  </p>

                  {msg.booking && (
                    <div className="mt-3 rounded-2xl overflow-hidden booking-card bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                      <div className="px-5 py-4 flex items-center gap-3 bg-zinc-900 dark:bg-zinc-950">
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
                          <BsCalendarCheck className="size-4 mt-0.5 flex-none text-zinc-500 dark:text-zinc-400" />
                          <div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium">
                              Meeting
                            </p>
                            <p className="text-[14px] font-medium text-neutral-800 dark:text-zinc-100">
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
                              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium">
                                Date & Time
                              </p>
                              <p className="text-[13.5px] text-neutral-700 dark:text-zinc-300">
                                {msg.booking.date}
                              </p>
                              <p className="text-[13.5px] font-medium text-neutral-800 dark:text-zinc-100">
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
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium">
                              Attendee
                            </p>
                            <p className="text-[13.5px] text-neutral-700 dark:text-zinc-300">
                              {msg.booking.attendeeName}
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-2.5 mt-2 pt-3 border-t"
                          style={{ borderColor: `${agent.color}12` }}
                        >
                          <BsEnvelopeFill className="size-3.5 flex-none text-zinc-500 dark:text-zinc-400" />
                          <p className="text-[12px] text-neutral-400 dark:text-neutral-500">
                            Confirmation sent to{" "}
                            <span className="text-neutral-600 dark:text-neutral-300 font-medium">
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

                {msg.role === "agent" && getActionTrace(msg).length > 0 && (
                  <div className="hidden md:flex flex-wrap items-center gap-1.5 mt-1.5 ml-1">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                      Action Trace
                    </span>
                    {getActionTrace(msg).map((step) => (
                      <span
                        key={step}
                        className="text-[10.5px] px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium tracking-wide"
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                )}

                {msg.role === "agent" && (
                  <div className="flex items-center gap-0.5 mt-1 ml-1">
                    <button
                      onClick={() => handleRate(msg.id, "up")}
                      className="rating-btn group"
                      title="Good response"
                    >
                      {msg.rating === "up" ? (
                        <HiHandThumbUp className="size-3.5 transition-all duration-200 text-zinc-500" />
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
                          className="text-[12px] px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer suggestion-chip-inline bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
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
                className="size-7 rounded-lg flex items-center justify-center flex-none mr-2 mt-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                style={{ color: agent.color }}
              >
                {" "}
                <IconComponent className="size-3.5" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span
                    className="agent-thinking-dot size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                    style={{ animationDelay: "0s" }}
                  />
                  <span
                    className="agent-thinking-dot size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="agent-thinking-dot size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {hasUnseenMessages && !isAtBottom && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3.5 py-2 text-xs font-medium shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          ↓ New messages
        </button>
      )}

      {agent.status !== "coming_soon" && (
        <div className="flex-none px-4 pb-4 pt-2 max-w-3xl mx-auto w-full">
          <div className="flex items-end gap-2 rounded-2xl px-4 py-2 agent-input-bar bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.name}...`}
              className="flex-1 bg-transparent text-[14px] text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-300 dark:placeholder:text-zinc-500 focus:outline-none resize-none h-9 py-2 leading-snug"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className={`size-8 flex-none rounded-xl flex items-center justify-center transition-all duration-200 mb-0.5 ${
                input.trim()
                  ? "bg-zinc-900 dark:bg-blue-600 text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
              }`}
              style={{
                opacity: isThinking ? 0.5 : 1,
                transform: input.trim() ? "scale(1)" : "scale(0.9)",
              }}
            >
              <IoSend className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getCapabilities(agentId: string): string[] {
  const caps: Record<string, string[]> = {
    "meeting-mind": [
      "Check Availability",
      "Book Meetings",
      "Smart Scheduling",
      "Calendar Sync",
    ],
    "chat-mind": [
      "Search Messages",
      "Summarize Threads",
      "Send Messages",
      "Track Reminders",
    ],
    "master-mind": [
      "Cross-Agent Sync",
      "Multi-Step Planning",
      "Activity Dashboards",
      "Task Delegation",
    ],
    "mail-mind": [
      "Gmail Integration",
      "Smart Drafts",
      "Inbox Zero",
      "Thread Search",
    ],
  };
  return caps[agentId] ?? [];
}
