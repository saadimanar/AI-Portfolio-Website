import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import {
  ChatSession,
  type ChatSessionDocument,
} from "@/lib/database/models/chat-session.model";
import { z } from "zod";

const SaveChatBodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SaveChatBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { messages } = parsed.data;
    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No messages to save" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const session = (await ChatSession.create({
      messages,
    })) as ChatSessionDocument;
    return NextResponse.json({
      ok: true,
      id: String(session._id),
      createdAt: session.createdAt,
    });
  } catch (error) {
    console.error("Failed to save chat session:", error);
    return NextResponse.json(
      { error: "Failed to save chat session" },
      { status: 500 }
    );
  }
}
