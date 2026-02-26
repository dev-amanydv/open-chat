import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();

    if (!payload.action) {
      return NextResponse.json(
        { error: "Missing action parameter" },
        { status: 400 },
      );
    }

    convex.setAuth(token);

    const result = await convex.mutation(api.chatMind.executeAction, {
      action: payload.action,
      query: payload.query,
      with: payload.with,
      to: payload.to,
      content: payload.content,
    });

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("ChatMind API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute ChatMind action" },
      { status: 500 },
    );
  }
}
