import { NextRequest, NextResponse } from "next/server";
import { getLLMModel, getOpenAIClient } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    getOpenAIClient();
  } catch {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { content } = body as { content: string };

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 },
      );
    }

    const systemPrompt =
      "You are a highly capable AI assistant that summarizes text concisely while preserving the user's intent. Output only the summarized text, without any introductory or concluding remarks.";

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: getLLMModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1024,
    });

    const summary =
      completion.choices[0]?.message?.content?.trim() ??
      "I'm sorry, I couldn't summarize this message.";

    return NextResponse.json({ summary });
  } catch (err) {
    const status =
      typeof (err as { status?: number }).status === "number"
        ? (err as { status: number }).status
        : 500;
    const message =
      err instanceof Error ? err.message : "OpenRouter API request failed";

    if (status === 503) {
      return NextResponse.json(
        {
          error:
            "This model is currently experiencing high demand. Please try again later.",
        },
        { status: 503 },
      );
    }

    console.error("Summarize API error:", err);
    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
