import { NextRequest, NextResponse } from "next/server";
import { bookSlot } from "@/lib/cal";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { start, attendee } = body;

    if (!start || !attendee?.name || !attendee?.email) {
      return NextResponse.json(
        { error: "start, attendee.name, and attendee.email are required" },
        { status: 400 },
      );
    }

    const result = await bookSlot(start, {
      name: attendee.name,
      email: attendee.email,
      timeZone: attendee.timeZone,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Cal.com booking error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
