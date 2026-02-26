import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");

  if (!startTime || !endTime) {
    return NextResponse.json(
      { error: "startTime and endTime are required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.CAL_API_KEY;
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID;

  if (!apiKey || !eventTypeId) {
    return NextResponse.json(
      { error: "Cal.com API key or event type ID not configured" },
      { status: 500 },
    );
  }

  try {
    const url = new URL("https://api.cal.com/v2/slots/available");
    url.searchParams.set("startTime", startTime);
    url.searchParams.set("endTime", endTime);
    url.searchParams.set("eventTypeId", eventTypeId);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": "2024-08-13",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? "Failed to fetch availability" },
        { status: res.status },
      );
    }

    const slotsObj = data?.data?.slots ?? {};
    const rawSlots = Object.values(slotsObj).flat() as (
      | string
      | { time: string }
    )[];
    const allSlots: string[] = rawSlots.map((s) =>
      typeof s === "string" ? s : s.time,
    );

    return NextResponse.json({ slots: allSlots });
  } catch (err) {
    console.error("Cal.com availability error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
