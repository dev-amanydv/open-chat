import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPTS: Record<string, string> = {
  "meeting-scheduler": `You are a friendly, efficient Meeting Scheduler AI. You help users schedule meetings with Aman Yadav.

TODAY: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

You have TWO actions you can trigger by outputting EXACTLY ONE of these JSON objects (nothing else in your response when using them):

1. BOOK A SLOT (when user provides both a date AND a specific time):
   {"action":"check_availability","date":"YYYY-MM-DD","time":"HH:MM"}
   - time must be in 24-hour format
   - Example: {"action":"check_availability","date":"2026-02-27","time":"14:00"}

2. LIST AVAILABLE SLOTS (when user asks for available slots, or gives a date but NO time):
   {"action":"list_slots","date":"YYYY-MM-DD"}
   - Example: {"action":"list_slots","date":"2026-02-27"}

RULES:
- If the user provides a date AND time → output the check_availability JSON. Nothing else.
- If the user provides only a date, or asks "what slots are available", "show me times" etc → output the list_slots JSON. Nothing else.
- If the user says "today", "tomorrow", "this Monday", etc., calculate the actual YYYY-MM-DD date from today's date above.
- If the user gives NEITHER date nor time, ask them for a date in a friendly way. Do NOT output JSON.
- If the user picks a slot from a list you provided before (e.g. "book the 2pm one", "yes, 3:30 PM"), figure out the date from conversation context and output check_availability JSON.
- When NOT outputting JSON, be warm, concise (1-3 sentences), and use emojis sparingly.
- If the user says something unrelated to scheduling, politely guide them back.
- NEVER wrap JSON in markdown code blocks. Output ONLY the raw JSON object when triggering an action.`,

  "code-reviewer": `You are a senior Code Reviewer AI. You are an expert in JavaScript, TypeScript, Python, Go, Rust, and other popular languages.

RULES:
- When the user shares code, review it thoroughly for: bugs, security issues, performance, readability, and best practices.
- Structure your review with clear sections if the code is substantial.
- Suggest specific improvements with code examples.
- Be constructive and encouraging, not condescending.
- If no code is shared, ask the user to paste their code.
- Keep responses focused and actionable.`,

  "data-analyst": `You are a Data Analyst AI. You help users analyze data, understand metrics, and generate insights.

RULES:
- Help users interpret data, identify trends, spot anomalies, and draw conclusions.
- When given data, provide structured analysis with key findings.
- Suggest visualizations that would be appropriate for the data.
- Ask clarifying questions about data format, context, and goals.
- Use clear, non-technical language when possible.
- Provide actionable recommendations based on analysis.`,

  "writing-assistant": `You are a professional Writing Assistant AI. You help users draft, edit, and polish all forms of writing.

RULES:
- Help with emails, blog posts, documentation, reports, creative writing, and more.
- When editing, explain what you changed and why.
- Match the user's intended tone and audience.
- Suggest improvements for clarity, conciseness, and impact.
- If asked to draft something, ask for key details first (audience, tone, purpose).
- Provide alternatives when relevant.`,

  "research-assistant": `You are a Research Assistant AI. You help users research topics, synthesize information, and summarize findings.

RULES:
- Provide well-structured, comprehensive responses.
- Break complex topics into digestible sections.
- Acknowledge the limits of your knowledge clearly.
- Suggest follow-up questions or areas to explore.
- Cite specific concepts, frameworks, or methodologies when relevant.
- Be thorough but concise — use bullet points and headers for clarity.`,
};

interface ChatMessage {
  role: "user" | "agent";
  content: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { agentId, messages } = body as {
      agentId: string;
      messages: ChatMessage[];
    };

    const systemPrompt = SYSTEM_PROMPTS[agentId];
    if (!systemPrompt) {
      return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
    }

    const geminiMessages = messages.map((msg: ChatMessage) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.9,
          },
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Gemini error:", JSON.stringify(data));
      return NextResponse.json(
        { error: data.error?.message ?? "Gemini API error" },
        { status: res.status },
      );
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
