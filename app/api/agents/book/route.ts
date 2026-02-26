import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.CAL_API_KEY;
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID;

  if (!apiKey || !eventTypeId) {
    return NextResponse.json(
      { error: "Cal.com API key or event type ID not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { start, attendee } = body;

    if (!start || !attendee?.name || !attendee?.email) {
      return NextResponse.json(
        { error: "start, attendee.name, and attendee.email are required" },
        { status: 400 },
      );
    }

    const res = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-08-13",
      },
      body: JSON.stringify({
        start,
        eventTypeId: Number(eventTypeId),
        attendee: {
          name: attendee.name,
          email: attendee.email,
          timeZone: attendee.timeZone ?? "Asia/Kolkata",
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? "Failed to create booking" },
        { status: res.status },
      );
    }

    return NextResponse.json({
      uid: data?.data?.uid ?? data?.data?.id ?? "",
      status: data?.data?.status ?? "ACCEPTED",
    });
  } catch (err) {
    console.error("Cal.com booking error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
