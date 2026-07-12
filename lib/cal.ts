const CAL_API = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-08-13";

export const BOOKING_TZ = "Asia/Kolkata";

export interface Attendee {
  name: string;
  email: string;
  timeZone?: string;
}

export interface BookingResult {
  uid: string;
  status: string;
}

function getCalConfig() {
  const apiKey = process.env.CAL_API_KEY;
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID;
  if (!apiKey || !eventTypeId) {
    throw new Error("Cal.com API key or event type ID not configured");
  }
  return { apiKey, eventTypeId };
}

export async function getAvailableSlots(
  startTime: string,
  endTime: string,
): Promise<string[]> {
  const { apiKey, eventTypeId } = getCalConfig();

  const url = new URL(`${CAL_API}/slots/available`);
  url.searchParams.set("startTime", startTime);
  url.searchParams.set("endTime", endTime);
  url.searchParams.set("eventTypeId", eventTypeId);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": CAL_API_VERSION,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to fetch availability");
  }

  const slotsObj = data?.data?.slots ?? {};
  const rawSlots = Object.values(slotsObj).flat() as (
    | string
    | { time: string }
  )[];
  return rawSlots.map((s) => (typeof s === "string" ? s : s.time));
}

export async function bookSlot(
  start: string,
  attendee: Attendee,
): Promise<BookingResult> {
  const { apiKey, eventTypeId } = getCalConfig();

  const res = await fetch(`${CAL_API}/bookings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "cal-api-version": CAL_API_VERSION,
    },
    body: JSON.stringify({
      start,
      eventTypeId: Number(eventTypeId),
      attendee: {
        name: attendee.name,
        email: attendee.email,
        timeZone: attendee.timeZone ?? BOOKING_TZ,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to create booking");
  }

  return {
    uid: data?.data?.uid ?? data?.data?.id ?? "",
    status: data?.data?.status ?? "ACCEPTED",
  };
}


export function dayRange(date: string) {
  return { start: `${date}T00:00:00.000Z`, end: `${date}T23:59:59.999Z` };
}

export function formatSlotLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: BOOKING_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: BOOKING_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function slotLocalHHMM(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: BOOKING_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function parseTimeToHHMM(time: string): string | null {
  const t = time.trim().toLowerCase();
  const match = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hour = Number.parseInt(match[1], 10);
  const minute = match[2] ? Number.parseInt(match[2], 10) : 0;
  const period = match[3];

  if (Number.isNaN(hour) || hour > 23 || minute > 59) return null;

  if (period === "pm" && hour < 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
