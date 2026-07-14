"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import {
  BsCalendarCheck,
  BsCheckCircleFill,
  BsEnvelopeFill,
  BsClock,
  BsPersonFill,
} from "react-icons/bs";
import { HiCheck } from "react-icons/hi2";
import {
  HiOutlineHandThumbUp,
  HiHandThumbUp,
  HiOutlineHandThumbDown,
  HiHandThumbDown,
} from "react-icons/hi2";
import { FiChevronLeft, FiCheck, FiX, FiEdit2 } from "react-icons/fi";
import { HiOutlineListBullet } from "react-icons/hi2";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolOrDynamicToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
  type ToolUIPart,
  type DynamicToolUIPart,
} from "ai";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { getAgentById, type Agent, type BookingDetails } from "@/lib/agents";

const MAX_TEXTAREA_HEIGHT = 150;
const SCROLL_BOTTOM_THRESHOLD = 96;

const STARTER_SUGGESTIONS: Record<string, string[]> = {
  "meeting-mind": [
    "Show Aman's available slots for tomorrow",
    "Book a meeting tomorrow with Aman at 2 PM",
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

const TOOL_LABELS: Record<string, string> = {
  checkAvailability: "Checking availability",
  bookMeeting: "Booking meeting",
  getConversations: "Reading conversations",
  searchMessages: "Searching messages",
  summarizeConversation: "Summarizing conversation",
  sendMessage: "Sending message",
  trackUnreplied: "Finding unreplied chats",
  getRecentMessages: "Fetching recent messages",
};

type BookingOutput = { booked?: boolean; booking?: BookingDetails };

const PLAN_TOOL = "updatePlan";
const APPROVAL_TOOLS = new Set(["sendMessage", "bookMeeting"]);

type AnyToolPart = ToolUIPart | DynamicToolUIPart;
type PlanStep = { title: string; status: "pending" | "active" | "done" };

function planStepsFromPart(part: AnyToolPart): PlanStep[] | null {
  const src =
    part.state === "output-available"
      ? (part.output as { steps?: PlanStep[] } | undefined)?.steps
      : (part.input as { steps?: PlanStep[] } | undefined)?.steps;
  return Array.isArray(src) && src.length ? src : null;
}

function PlanStatusDot({ status }: { status: PlanStep["status"] }) {
  if (status === "done") {
    return (
      <span className="size-4 rounded-full bg-accent flex items-center justify-center flex-none">
        <FiCheck className="size-2.5 text-accent-ink" strokeWidth={3} />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="agent-tool-spin size-4 rounded-full border-2 border-accent border-t-transparent flex-none" />
    );
  }
  return (
    <span className="size-4 rounded-full border-2 border-line-strong flex-none" />
  );
}

function PlanCard({ steps }: { steps: PlanStep[] }) {
  const done = steps.filter((s) => s.status === "done").length;
  return (
    <div className="oc-panel bg-surface-1 rounded-2xl p-3.5 mb-2">
      <div className="flex items-center justify-between mb-2.5">
        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-ink-faint">
          <HiOutlineListBullet className="size-3.5" /> Plan
        </span>
        <span className="text-[10px] font-mono-num text-ink-faint">
          {done}/{steps.length}
        </span>
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[13px]">
            <PlanStatusDot status={s.status} />
            <span
              className={
                s.status === "done"
                  ? "text-ink-faint line-through"
                  : s.status === "active"
                    ? "text-ink font-medium"
                    : "text-ink-muted"
              }
            >
              {s.title}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ApprovalCard({
  part,
  agentColor,
  approving,
  onApprove,
  onCancel,
}: {
  part: AnyToolPart;
  agentColor: string;
  approving: boolean;
  onApprove: (input: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const name = getToolOrDynamicToolName(part);
  const input = (part.input ?? {}) as Record<string, unknown>;
  const isSend = name === "sendMessage";
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(String(input.content ?? ""));

  return (
    <div className="oc-panel bg-surface-1 rounded-2xl overflow-hidden mt-2 shadow-[var(--shadow-md)]">
      <div
        className="px-4 py-2.5 flex items-center gap-2 border-b border-line"
        style={{
          color: agentColor,
          backgroundColor: `color-mix(in srgb, ${agentColor} 10%, transparent)`,
        }}
      >
        <span className="text-[11px] font-mono uppercase tracking-[0.1em] font-semibold">
          {isSend ? "Send message?" : "Book meeting?"}
        </span>
        <span className="ml-auto text-[10px] font-mono text-ink-faint">
          needs your approval
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        {isSend ? (
          <>
            <p className="text-[12px] text-ink-faint">
              To{" "}
              <span className="text-ink font-medium">
                {String(input.to ?? "—")}
              </span>
            </p>
            {editing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                autoFocus
                className="oc-input oc-focus w-full text-[13.5px] px-3 py-2 resize-none"
              />
            ) : (
              <p className="text-[13.5px] text-ink leading-relaxed whitespace-pre-wrap bg-surface-3 rounded-xl px-3 py-2">
                {content}
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-6 text-[13.5px]">
            <div>
              <p className="text-[10px] text-ink-faint uppercase tracking-[0.1em] font-mono">
                Date
              </p>
              <p className="text-ink font-medium">
                {String(input.date ?? "—")}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-ink-faint uppercase tracking-[0.1em] font-mono">
                Time
              </p>
              <p className="text-ink font-medium">
                {String(input.time ?? "—")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-3 flex items-center gap-2">
        <button
          disabled={approving}
          onClick={() => onApprove(isSend ? { ...input, content } : input)}
          className="oc-btn-accent oc-focus flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-[13px] font-semibold disabled:cursor-not-allowed"
        >
          {approving ? (
            <span className="agent-tool-spin size-3.5 rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <FiCheck className="size-4" />
          )}
          Approve
        </button>
        {isSend && (
          <button
            disabled={approving}
            onClick={() => setEditing((e) => !e)}
            className="oc-icon-btn oc-focus flex items-center gap-1.5 px-3 h-8 rounded-lg text-[13px] font-medium border border-line"
          >
            <FiEdit2 className="size-3.5" /> {editing ? "Done" : "Edit"}
          </button>
        )}
        <button
          disabled={approving}
          onClick={onCancel}
          className="oc-icon-btn oc-focus flex items-center gap-1.5 px-3 h-8 rounded-lg text-[13px] font-medium ml-auto"
        >
          <FiX className="size-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

function ActionResultChip({ part }: { part: AnyToolPart }) {
  const name = getToolOrDynamicToolName(part);
  const out = part.output as
    | {
        cancelled?: boolean;
        error?: string;
        booked?: boolean;
        message?: string;
      }
    | string
    | undefined;

  if (out && typeof out === "object" && out.cancelled) {
    return <ResultChip tone="muted" icon="✕" label="Action cancelled" />;
  }
  if (out && typeof out === "object" && out.error) {
    return <ResultChip tone="error" icon="!" label={out.error} />;
  }
  if (name === "sendMessage") {
    return <ResultChip tone="ok" icon="✓" label="Message sent" />;
  }
  if (
    name === "bookMeeting" &&
    out &&
    typeof out === "object" &&
    out.booked === false
  ) {
    return (
      <ResultChip
        tone="error"
        icon="!"
        label={out.message ?? "Couldn't book"}
      />
    );
  }
  return null;
}

function ResultChip({
  tone,
  icon,
  label,
}: {
  tone: "ok" | "muted" | "error";
  icon: string;
  label: string;
}) {
  const cls =
    tone === "ok"
      ? "text-positive border-positive/40"
      : tone === "error"
        ? "text-red-500 border-red-500/40"
        : "text-ink-faint border-line";
  return (
    <span
      className={`mt-2 inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border bg-surface-2 ${cls}`}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

function messageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("");
}

function messageBooking(message: UIMessage): BookingDetails | undefined {
  for (const part of message.parts) {
    if (
      isToolUIPart(part) &&
      getToolOrDynamicToolName(part) === "bookMeeting" &&
      part.state === "output-available"
    ) {
      const out = part.output as BookingOutput;
      if (out?.booked && out.booking) return out.booking;
    }
  }
  return undefined;
}

function persistableParts(message: UIMessage) {
  return message.parts.filter((p) => p.type === "text" || isToolUIPart(p));
}

function docToUIMessage(doc: Doc<"agentMessages">): UIMessage {
  let parts: UIMessage["parts"] | null = null;
  if (doc.uiParts) {
    try {
      parts = JSON.parse(doc.uiParts) as UIMessage["parts"];
    } catch {
      parts = null;
    }
  }
  return {
    id: doc._id,
    role: doc.role === "user" ? "user" : "assistant",
    parts: parts?.length ? parts : [{ type: "text", text: doc.content }],
  } as UIMessage;
}

function seedRatings(docs: Doc<"agentMessages">[]) {
  const seeded: Record<string, "up" | "down" | undefined> = {};
  for (const doc of docs) {
    if (doc.rating) seeded[doc._id] = doc.rating;
  }
  return seeded;
}

function getFollowUps(agentId: string, message: UIMessage): string[] {
  const tools = message.parts
    .filter(isToolUIPart)
    .map((p) => getToolOrDynamicToolName(p));

  if (tools.includes("bookMeeting") && messageBooking(message)) {
    return ["Schedule another meeting", "Send them a confirmation message"];
  }
  if (tools.includes("checkAvailability")) {
    return ["Book the earliest slot", "Try another day"];
  }
  if (tools.includes("trackUnreplied")) {
    return ["Draft a reminder message", "Show my recent messages"];
  }
  if (
    tools.includes("getConversations") ||
    tools.includes("getRecentMessages")
  ) {
    return ["Summarize the latest one", "Any unreplied messages?"];
  }
  return (STARTER_SUGGESTIONS[agentId] ?? []).slice(0, 2);
}

function AgentHeader({ agent, onBack }: { agent: Agent; onBack: () => void }) {
  const IconComponent = agent.icon;
  return (
    <div className="oc-frost flex-none px-4 md:px-5 h-16 border-b border-line flex items-center gap-2">
      <button
        onClick={onBack}
        className="oc-icon-btn oc-focus md:hidden size-9 -ml-1 mr-1"
      >
        <FiChevronLeft className="text-xl" />
      </button>
      <div className="flex items-center gap-3">
        <div
          className="size-10 rounded-2xl flex items-center justify-center border flex-none"
          style={{
            color: agent.color,
            backgroundColor: `color-mix(in srgb, ${agent.color} 12%, transparent)`,
            borderColor: `color-mix(in srgb, ${agent.color} 26%, transparent)`,
          }}
        >
          <IconComponent className="size-[19px]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-ink tracking-tight flex items-center gap-2">
            {agent.name}
            {agent.status !== "coming_soon" && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-positive font-mono">
                <span className="oc-online size-1.5 rounded-full" />
                online
              </span>
            )}
          </h1>
          <p className="text-[12.5px] text-ink-faint leading-snug max-w-md hidden sm:block truncate">
            {agent.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  const agent = getAgentById(agentId);

  const getOrCreateChat = useMutation(api.agentChats.getOrCreateChat);
  const { isAuthenticated } = useConvexAuth();
  const [resolved, setResolved] = useState<{
    agentId: string;
    id: Id<"agentChats">;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    getOrCreateChat({ agentId }).then((id) => {
      if (active) setResolved({ agentId, id });
    });
    return () => {
      active = false;
    };
  }, [agentId, isAuthenticated, getOrCreateChat]);

  const chatId = resolved?.agentId === agentId ? resolved.id : null;
  const persisted = useQuery(
    api.agentChats.getMessages,
    chatId ? { chatId } : "skip",
  );

  if (!agent) {
    return (
      <div className="oc-canvas h-full flex items-center justify-center">
        <p className="text-ink-faint">Agent not found</p>
      </div>
    );
  }

  const handleBack = () => router.push("/");

  if (!chatId || persisted === undefined) {
    return (
      <div className="oc-canvas h-full flex flex-col">
        <AgentHeader agent={agent} onBack={handleBack} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-1.5">
            {[0, 0.15, 0.3].map((d) => (
              <span
                key={d}
                className="agent-thinking-dot size-1.5 rounded-full bg-ink-faint"
                style={{ animationDelay: `${d}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AgentChat
      key={chatId}
      agent={agent}
      agentId={agentId}
      chatId={chatId}
      initial={persisted}
      onBack={handleBack}
    />
  );
}

function AgentChat({
  agent,
  agentId,
  chatId,
  initial,
  onBack,
}: {
  agent: Agent;
  agentId: string;
  chatId: Id<"agentChats">;
  initial: Doc<"agentMessages">[];
  onBack: () => void;
}) {
  const [initialMessages] = useState<UIMessage[]>(() =>
    initial.map(docToUIMessage),
  );
  const [ratings, setRatings] = useState<
    Record<string, "up" | "down" | undefined>
  >(() => seedRatings(initial));
  const [idMap, setIdMap] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasUnseenMessages, setHasUnseenMessages] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  const sendConvexMessage = useMutation(api.agentChats.sendMessage);
  const rateMessage = useMutation(api.agentChats.rateMessage);

  const [transport] = useState(
    () =>
      new DefaultChatTransport({ api: "/api/agents/chat", body: { agentId } }),
  );

  const { messages, sendMessage, status, addToolResult } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onFinish: async ({ message }) => {
      const booking = messageBooking(message);
      const convexId = await sendConvexMessage({
        chatId,
        role: "agent",
        content: messageText(message) || "…",
        uiParts: JSON.stringify(persistableParts(message)),
        booking,
      });
      setIdMap((prev) => ({ ...prev, [message.id]: convexId as string }));
    },
  });

  const busy = status === "submitted" || status === "streaming";

  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

  const runApproval = useCallback(
    async (
      toolName: string,
      toolCallId: string,
      input: Record<string, unknown>,
    ) => {
      setApprovingIds((prev) => new Set(prev).add(toolCallId));
      try {
        const res = await fetch("/api/agents/execute-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolName, input }),
        });
        const data = await res.json();
        addToolResult({
          tool: toolName,
          toolCallId,
          output: data.output ?? { error: "No result." },
        });
      } catch {
        addToolResult({
          tool: toolName,
          toolCallId,
          output: { error: "The action could not be completed." },
        });
      } finally {
        setApprovingIds((prev) => {
          const next = new Set(prev);
          next.delete(toolCallId);
          return next;
        });
      }
    },
    [addToolResult],
  );

  const cancelApproval = useCallback(
    (toolName: string, toolCallId: string) => {
      addToolResult({
        tool: toolName,
        toolCallId,
        output: { cancelled: true, message: "User cancelled this action." },
      });
    },
    [addToolResult],
  );

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
    if (atBottom) setHasUnseenMessages(false);
  }, [checkIsAtBottom]);

  useEffect(() => {
    if (didInitialScroll.current) return;
    didInitialScroll.current = true;
    const raf = requestAnimationFrame(() => scrollToBottom("auto"));
    return () => cancelAnimationFrame(raf);
  }, [scrollToBottom]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (checkIsAtBottom()) scrollToBottom("smooth");
      else if (busy) setHasUnseenMessages(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, busy, checkIsAtBottom, scrollToBottom]);

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    ta.style.overflowY =
      ta.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, []);

  const submit = (content: string) => {
    const text = content.trim();
    if (!text || busy) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    sendConvexMessage({ chatId, role: "user", content: text });
    sendMessage({ text }, { body: { agentId } });
    requestAnimationFrame(() => scrollToBottom("smooth"));
  };

  const handleSend = () => submit(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const convexIdFor = (uiId: string) => idMap[uiId] ?? uiId;

  const handleRate = async (uiId: string, rating: "up" | "down") => {
    const cid = convexIdFor(uiId);
    const next = ratings[cid] === rating ? undefined : rating;
    setRatings((prev) => ({ ...prev, [cid]: next }));
    try {
      await rateMessage({ messageId: cid as Id<"agentMessages">, rating });
    } catch {}
  };

  const lastMessage = messages[messages.length - 1];
  const followUps =
    !busy && lastMessage?.role === "assistant"
      ? getFollowUps(agentId, lastMessage)
      : [];
  const showThinkingDots =
    status === "submitted" ||
    (status === "streaming" && lastMessage?.role !== "assistant");

  const IconComponent = agent.icon;
  const starters = STARTER_SUGGESTIONS[agentId] ?? [];

  return (
    <div
      className="oc-canvas h-full relative flex flex-col"
      style={{ ["--agent" as string]: agent.color }}
    >
      <AgentHeader agent={agent} onBack={onBack} />

      <div
        ref={scrollContainerRef}
        onScroll={handleMessagesScroll}
        className="oc-scroll flex-1 min-h-0 overflow-y-auto"
      >
        <div className="flex flex-col gap-3 px-4 py-5 max-w-3xl mx-auto">
          {messages.length === 0 && !busy && (
            <div className="flex flex-col items-center justify-center py-12 oc-reveal">
              <div
                className="oc-glow relative size-20 rounded-[26px] flex items-center justify-center mb-5 border"
                style={{
                  color: agent.color,
                  backgroundColor: `color-mix(in srgb, ${agent.color} 14%, transparent)`,
                  borderColor: `color-mix(in srgb, ${agent.color} 30%, transparent)`,
                }}
              >
                <IconComponent className="size-9" />
                <div
                  className="absolute -top-1 -right-1 size-6 rounded-full flex items-center justify-center border-2 border-surface"
                  style={{ backgroundColor: agent.color }}
                >
                  <HiCheck className="size-3.5 text-white" />
                </div>
              </div>

              <h2 className="text-[18px] font-semibold text-ink mb-1.5 tracking-tight">
                {agent.name}
              </h2>
              <p className="text-[13px] text-ink-faint text-center max-w-xs mb-8 leading-relaxed">
                {agent.description}
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-8 max-w-sm">
                {getCapabilities(agentId).map((cap) => (
                  <span
                    key={cap}
                    className="text-[11.5px] px-3 py-1.5 rounded-full font-medium bg-surface-2 border border-line text-ink-muted"
                  >
                    {cap}
                  </span>
                ))}
              </div>

              {agent.status === "coming_soon" ? (
                <div className="mt-4 px-6 py-4 rounded-2xl flex items-center justify-center text-center max-w-sm oc-panel bg-surface-2 text-ink-muted">
                  <p className="text-[14px] font-medium">
                    This agent is currently in development and will be available
                    soon!
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[10px] text-ink-faint uppercase tracking-[0.14em] mb-3 font-semibold font-mono">
                    Try asking
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                    {starters.map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="oc-row text-left text-[13px] px-4 py-3 bg-surface-2 border-line cursor-pointer text-ink-muted hover:text-ink"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const text = messageText(msg);
            const allToolParts = (
              isUser ? [] : msg.parts.filter(isToolUIPart)
            ) as AnyToolPart[];
            const planPart = [...allToolParts]
              .reverse()
              .find((p) => getToolOrDynamicToolName(p) === PLAN_TOOL);
            const planSteps = planPart ? planStepsFromPart(planPart) : null;
            const chipParts = allToolParts.filter((p) => {
              const n = getToolOrDynamicToolName(p);
              return n !== PLAN_TOOL && !APPROVAL_TOOLS.has(n);
            });
            const writeParts = allToolParts.filter((p) =>
              APPROVAL_TOOLS.has(getToolOrDynamicToolName(p)),
            );
            const booking = isUser ? undefined : messageBooking(msg);
            const rating = ratings[convexIdFor(msg.id)];
            const isLast = idx === messages.length - 1;

            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"} agent-msg-entrance`}
              >
                {!isUser && (
                  <div
                    className="size-7 rounded-xl flex items-center justify-center flex-none mr-2 mt-1 border"
                    style={{
                      color: agent.color,
                      backgroundColor: `color-mix(in srgb, ${agent.color} 12%, transparent)`,
                      borderColor: `color-mix(in srgb, ${agent.color} 26%, transparent)`,
                    }}
                  >
                    <IconComponent className="size-3.5" />
                  </div>
                )}
                <div className="max-w-[78%]">
                  {planSteps && <PlanCard steps={planSteps} />}

                  {!isUser && chipParts.length > 0 && (
                    <div className="mb-1.5 space-y-1.5">
                      {chipParts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-ink-faint">
                            Tools
                          </span>
                          {chipParts.map((part, i) => (
                            <ToolChip key={i} part={part} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {(text || isUser) && (
                    <div
                      className={
                        isUser
                          ? "oc-bubble oc-bubble-me agent-msg-user"
                          : "oc-bubble oc-bubble-them agent-msg-bot"
                      }
                    >
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                        {text}
                      </p>
                    </div>
                  )}

                  {booking && (
                    <div className="mt-2 rounded-2xl overflow-hidden booking-card oc-panel bg-surface-1 shadow-[var(--shadow-md)]">
                      <div
                        className="px-5 py-4 flex items-center gap-3"
                        style={{
                          background: `linear-gradient(135deg, ${agent.color}, color-mix(in srgb, ${agent.color} 70%, #000))`,
                        }}
                      >
                        <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                          <BsCheckCircleFill className="size-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-white">
                            Meeting confirmed
                          </p>
                          <p className="text-[12px] text-white/75">
                            Your meeting has been scheduled successfully
                          </p>
                        </div>
                      </div>

                      <div className="px-5 py-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <BsCalendarCheck className="size-4 mt-0.5 flex-none text-ink-faint" />
                          <div>
                            <p className="text-[10px] text-ink-faint uppercase tracking-[0.1em] font-semibold font-mono">
                              Meeting
                            </p>
                            <p className="text-[14px] font-medium text-ink">
                              {booking.title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <BsClock
                            className="size-4 mt-0.5 flex-none"
                            style={{ color: agent.color }}
                          />
                          <div>
                            <p className="text-[10px] text-ink-faint uppercase tracking-[0.1em] font-semibold font-mono">
                              Date &amp; time
                            </p>
                            <p className="text-[13.5px] text-ink-muted">
                              {booking.date}
                            </p>
                            <p className="text-[13.5px] font-medium text-ink">
                              {booking.time}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <BsPersonFill
                            className="size-4 mt-0.5 flex-none"
                            style={{ color: agent.color }}
                          />
                          <div>
                            <p className="text-[10px] text-ink-faint uppercase tracking-[0.1em] font-semibold font-mono">
                              Attendee
                            </p>
                            <p className="text-[13.5px] text-ink-muted">
                              {booking.attendeeName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 mt-2 pt-3 border-t border-line">
                          <BsEnvelopeFill className="size-3.5 flex-none text-ink-faint" />
                          <p className="text-[12px] text-ink-faint">
                            Confirmation sent to{" "}
                            <span className="text-ink-muted font-medium">
                              {booking.attendeeEmail}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {writeParts.map((part) => {
                    const n = getToolOrDynamicToolName(part);
                    const pending =
                      part.state === "input-available" ||
                      part.state === "input-streaming";
                    const resolved = part.state === "output-available";
                    const out = part.output as BookingOutput | undefined;
                    if (n === "bookMeeting" && resolved && out?.booked) {
                      return null;
                    }
                    if (pending) {
                      if (isLast && !busy) {
                        return (
                          <ApprovalCard
                            key={part.toolCallId}
                            part={part}
                            agentColor={agent.color}
                            approving={approvingIds.has(part.toolCallId)}
                            onApprove={(input) =>
                              runApproval(n, part.toolCallId, input)
                            }
                            onCancel={() => cancelApproval(n, part.toolCallId)}
                          />
                        );
                      }
                      return (
                        <div
                          key={part.toolCallId}
                          className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-ink-faint border border-line rounded-full px-2.5 py-1 bg-surface-2"
                        >
                          <span className="agent-tool-spin size-3 rounded-full border-2 border-ink-faint border-t-transparent" />
                          Waiting to {n === "sendMessage" ? "send" : "book"}…
                        </div>
                      );
                    }
                    if (resolved) {
                      return (
                        <ActionResultChip key={part.toolCallId} part={part} />
                      );
                    }
                    return null;
                  })}

                  {!isUser && text && (
                    <div className="flex items-center gap-0.5 mt-1 ml-1">
                      <button
                        onClick={() => handleRate(msg.id, "up")}
                        className="rating-btn oc-icon-btn size-7 rounded-lg group"
                        title="Good response"
                      >
                        {rating === "up" ? (
                          <HiHandThumbUp className="size-3.5 text-accent" />
                        ) : (
                          <HiOutlineHandThumbUp className="size-3.5 text-ink-faint group-hover:text-ink-muted transition-colors" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRate(msg.id, "down")}
                        className="rating-btn oc-icon-btn size-7 rounded-lg group"
                        title="Poor response"
                      >
                        {rating === "down" ? (
                          <HiHandThumbDown className="size-3.5 text-red-400" />
                        ) : (
                          <HiOutlineHandThumbDown className="size-3.5 text-ink-faint group-hover:text-ink-muted transition-colors" />
                        )}
                      </button>
                    </div>
                  )}

                  {!isUser &&
                    idx === messages.length - 1 &&
                    followUps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-1 agent-suggestions-entrance">
                        {followUps.map((s) => (
                          <button
                            key={s}
                            onClick={() => submit(s)}
                            className="oc-row text-[12px] px-3 py-1.5 cursor-pointer bg-surface-2 border-line text-ink-muted hover:text-ink"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            );
          })}

          {showThinkingDots && (
            <div className="flex justify-start">
              <div
                className="size-7 rounded-xl flex items-center justify-center flex-none mr-2 mt-1 border"
                style={{
                  color: agent.color,
                  backgroundColor: `color-mix(in srgb, ${agent.color} 12%, transparent)`,
                  borderColor: `color-mix(in srgb, ${agent.color} 26%, transparent)`,
                }}
              >
                <IconComponent className="size-3.5" />
              </div>
              <div className="oc-bubble oc-bubble-them">
                <div className="flex items-center gap-1.5 py-0.5">
                  {[0, 0.15, 0.3].map((d) => (
                    <span
                      key={d}
                      className="agent-thinking-dot size-1.5 rounded-full bg-ink-faint"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {hasUnseenMessages && !isAtBottom && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="oc-btn-accent oc-focus absolute bottom-24 left-1/2 -translate-x-1/2 z-20 rounded-full px-4 py-2 text-xs font-semibold"
        >
          ↓ New messages
        </button>
      )}

      {agent.status !== "coming_soon" && (
        <div className="flex-none px-4 pb-4 pt-2 max-w-3xl mx-auto w-full">
          <div className="oc-composer flex items-end gap-2 px-3 py-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.name}…`}
              className="flex-1 bg-transparent text-[14.5px] text-ink placeholder:text-ink-faint focus:outline-none resize-none h-9 py-2 leading-snug"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || busy}
              className="oc-btn-accent oc-focus size-8 flex-none rounded-xl flex items-center justify-center mb-0.5 disabled:cursor-not-allowed"
            >
              <IoSend className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolChip({ part }: { part: ToolUIPart | DynamicToolUIPart }) {
  const name = getToolOrDynamicToolName(part);
  const label = TOOL_LABELS[name] ?? name;
  const running =
    part.state === "input-streaming" || part.state === "input-available";
  const errored = part.state === "output-error";

  const icon = errored ? "✕" : running ? "⟳" : "✓";
  const tone = errored
    ? "border-red-500/40 text-red-500"
    : running
      ? "border-accent/40 text-accent"
      : "border-line text-ink-muted";

  return (
    <span
      className={`text-[10.5px] px-2 py-0.5 rounded-full border bg-surface-2 font-medium font-mono tracking-wide inline-flex items-center gap-1 ${tone}`}
    >
      <span className={running ? "agent-tool-spin" : ""}>{icon}</span>
      {label}
      {running ? "…" : ""}
    </span>
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
