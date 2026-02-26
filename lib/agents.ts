import { IconType } from "react-icons";
import { BsCalendar2Check } from "react-icons/bs";
import { VscCode } from "react-icons/vsc";
import { TbChartBar } from "react-icons/tb";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { PiMagnifyingGlass } from "react-icons/pi";

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  color: string;
  bgGradient: string;
}

export const agents: Agent[] = [
  {
    id: "meeting-scheduler",
    name: "Meeting Scheduler",
    description:
      "Schedule meetings with Aman Yadav. I'll check availability and book the perfect time slot for you.",
    icon: BsCalendar2Check,
    color: "#6C63FF",
    bgGradient:
      "linear-gradient(135deg, rgba(108,99,255,0.08) 0%, rgba(108,99,255,0.02) 100%)",
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    description:
      "Paste your code and I'll review it for best practices, potential bugs, and performance improvements.",
    icon: VscCode,
    color: "#10B981",
    bgGradient:
      "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)",
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    description:
      "Ask me to analyze data, generate insights, or help you understand complex datasets.",
    icon: TbChartBar,
    color: "#F59E0B",
    bgGradient:
      "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)",
  },
  {
    id: "writing-assistant",
    name: "Writing Assistant",
    description:
      "I help you draft, edit, and polish your writing — emails, docs, or creative content.",
    icon: HiOutlinePencilSquare,
    color: "#EC4899",
    bgGradient:
      "linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(236,72,153,0.02) 100%)",
  },
  {
    id: "research-assistant",
    name: "Research Assistant",
    description:
      "I can help you research topics, summarize articles, and compile information quickly.",
    icon: PiMagnifyingGlass,
    color: "#14B8A6",
    bgGradient:
      "linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(20,184,166,0.02) 100%)",
  },
];

export function getAgentById(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export type MessageRole = "user" | "agent";

export interface BookingDetails {
  title: string;
  date: string;
  time: string;
  attendeeName: string;
  attendeeEmail: string;
  uid: string;
}

export interface AgentMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  booking?: BookingDetails;
  rating?: "up" | "down";
}

function parseRelativeDate(text: string): Date | null {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes("today")) return now;
  if (lower.includes("tomorrow")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }

  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  for (let i = 0; i < dayNames.length; i++) {
    if (lower.includes(dayNames[i])) {
      const d = new Date(now);
      const diff = (i - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return d;
    }
  }

  const dateMatch = text.match(
    /(\d{4}-\d{2}-\d{2})|(\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}\b)/i,
  );
  if (dateMatch) {
    const parsed = new Date(dateMatch[0]);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function parseTime(text: string): { hour: number; minute: number } | null {
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3]?.toLowerCase();

  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;

  if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
    return { hour, minute };
  }
  return null;
}

export async function processAgentMessage(
  agentId: string,
  userMessage: string,
  conversationHistory: AgentMessage[],
  attendeeName: string,
  attendeeEmail: string,
): Promise<AgentMessage> {
  const id = crypto.randomUUID();
  const timestamp = Date.now();

  const historyForApi = conversationHistory.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  historyForApi.push({ role: "user" as const, content: userMessage });

  try {
    const res = await fetch("/api/agents/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, messages: historyForApi }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        id,
        role: "agent",
        content:
          "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp,
      };
    }

    const reply: string = data.reply;

    if (agentId === "meeting-scheduler") {
      const jsonMatch = reply.match(/\{[\s\S]*?"action"\s*:[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const action = JSON.parse(jsonMatch[0]);

          if (action.action === "list_slots" && action.date) {
            return await handleListSlots(action.date, id, timestamp);
          }

          if (
            action.action === "check_availability" &&
            action.date &&
            action.time
          ) {
            const [hours, minutes] = action.time.split(":").map(Number);
            const requestedDate = new Date(action.date + "T00:00:00");
            requestedDate.setHours(hours, minutes, 0, 0);

            return await handleMeetingBooking(
              requestedDate,
              attendeeName,
              attendeeEmail,
              id,
              timestamp,
            );
          }
        } catch {
        }
      }
    }

    return { id, role: "agent", content: reply, timestamp };
  } catch {
    return {
      id,
      role: "agent",
      content: "Something went wrong. Please try again later.",
      timestamp,
    };
  }
}

async function handleListSlots(
  dateStr: string,
  id: string,
  timestamp: number,
): Promise<AgentMessage> {
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd = new Date(dateStr + "T23:59:59");

  try {
    const res = await fetch(
      `/api/agents/availability?startTime=${encodeURIComponent(dayStart.toISOString())}&endTime=${encodeURIComponent(dayEnd.toISOString())}`,
    );
    const data = await res.json();

    if (!res.ok) {
      return {
        id,
        role: "agent",
        content:
          "I'm having trouble checking availability right now. Please try again in a moment.",
        timestamp,
      };
    }

    const slots: string[] = data.slots ?? [];
    const friendlyDate = dayStart.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    if (slots.length === 0) {
      return {
        id,
        role: "agent",
        content: `There are no available slots on ${friendlyDate}. Would you like to try a different date? 📅`,
        timestamp,
      };
    }

    const formatted = slots.map((s) =>
      new Date(s).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    );

    return {
      id,
      role: "agent",
      content: `Here are the available slots on ${friendlyDate}:\n\n${formatted.map((t) => `• ${t}`).join("\n")}\n\nWhich time works best for you? 😊`,
      timestamp,
    };
  } catch {
    return {
      id,
      role: "agent",
      content:
        "Something went wrong while checking availability. Please try again.",
      timestamp,
    };
  }
}

async function handleMeetingBooking(
  requestedDate: Date,
  attendeeName: string,
  attendeeEmail: string,
  id: string,
  timestamp: number,
): Promise<AgentMessage> {
  const startISO = requestedDate.toISOString();
  const endDate = new Date(requestedDate);
  endDate.setHours(23, 59, 59, 999);
  const endISO = endDate.toISOString();

  try {
    const availRes = await fetch(
      `/api/agents/availability?startTime=${encodeURIComponent(startISO)}&endTime=${encodeURIComponent(endISO)}`,
    );
    const availData = await availRes.json();

    if (!availRes.ok) {
      return {
        id,
        role: "agent",
        content:
          "I'm having trouble checking availability right now. Please try again in a moment.",
        timestamp,
      };
    }

    const slots: string[] = availData.slots ?? [];
    const requestedTimeStr = requestedDate.toTimeString().slice(0, 5);
    const slotAvailable = slots.some((s: string) => {
      const slotTime = new Date(s).toTimeString().slice(0, 5);
      return slotTime === requestedTimeStr;
    });

    if (!slotAvailable) {
      const dateStr = requestedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      if (slots.length === 0) {
        return {
          id,
          role: "agent",
          content: `Unfortunately, there are no available slots on ${dateStr}. Would you like to try a different date?`,
          timestamp,
        };
      }

      const suggestions = slots.slice(0, 4).map((s: string) =>
        new Date(s).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );

      return {
        id,
        role: "agent",
        content: `That time isn't available on ${dateStr}. Here are some open slots:\n\n${suggestions.map((s: string) => `• ${s}`).join("\n")}\n\nWould you like to book one of these?`,
        timestamp,
      };
    }

    const bookRes = await fetch("/api/agents/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: startISO,
        attendee: {
          name: attendeeName,
          email: attendeeEmail,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    });

    const bookData = await bookRes.json();

    if (!bookRes.ok) {
      return {
        id,
        role: "agent",
        content:
          "The slot is available but I couldn't complete the booking. Please try again.",
        timestamp,
      };
    }

    const formattedDate = requestedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = requestedDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return {
      id,
      role: "agent",
      content: "Your meeting has been booked successfully! 🎉",
      timestamp,
      booking: {
        title: "Meeting with Aman Yadav",
        date: formattedDate,
        time: formattedTime,
        attendeeName,
        attendeeEmail,
        uid: bookData.uid ?? bookData.id ?? "",
      },
    };
  } catch {
    return {
      id,
      role: "agent",
      content:
        "Something went wrong while processing your request. Please try again later.",
      timestamp,
    };
  }
}
