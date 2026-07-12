import { auth, currentUser } from "@clerk/nextjs/server";
import {
  buildAgentTools,
  WRITE_TOOL_NAMES,
  type AgentToolName,
} from "@/lib/agent-tools";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId, getToken } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { toolName, input } = (await req.json()) as {
    toolName?: AgentToolName;
    input?: Record<string, unknown>;
  };

  if (!toolName || !WRITE_TOOL_NAMES.includes(toolName)) {
    return new Response("Unknown or non-approvable tool", { status: 400 });
  }

  const token = await getToken({ template: "convex" });
  const user = await currentUser();
  const attendee = {
    name: user?.fullName ?? user?.firstName ?? "Guest",
    email: user?.primaryEmailAddress?.emailAddress ?? "guest@example.com",
  };

  const tools = buildAgentTools({ convexToken: token, attendee });
  const tool = tools[toolName];
  const execute = tool?.execute;
  if (!execute) {
    return new Response("Tool not executable", { status: 400 });
  }

  try {
    const output = await execute(
      (input ?? {}) as never,
      { toolCallId: "user-approved", messages: [] } as never,
    );
    return Response.json({ output });
  } catch (err) {
    return Response.json(
      {
        output: {
          error: err instanceof Error ? err.message : "Action failed.",
        },
      },
      { status: 200 },
    );
  }
}
