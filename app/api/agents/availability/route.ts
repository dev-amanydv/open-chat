import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/cal";

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

  try {
    const slots = await getAvailableSlots(startTime, endTime);
    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Cal.com availability error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch availability";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
