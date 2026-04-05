import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getSystemPrompt } from "@/lib/prompts/get-system-prompt";
import { searchVectorStore } from "@/lib/vector-store";
import { getProfile } from "./tools/getProfile";
import { getContact } from "./tools/getContact";
import { getProjects } from "./tools/getProjects";
import { getResume } from "./tools/getResume";
import { getSkills } from "./tools/getSkills";

export const maxDuration = 30;

/**
 * Retrieves relevant context from the vector store based on the user's query
 */
async function getRAGContext(userQuery: string): Promise<string> {
  try {
    // Search for relevant documents (retrieve top 5 most relevant)
    const results = await searchVectorStore(userQuery, 5);

    if (results.length === 0) {
      return "";
    }

    // Format the retrieved documents as context
    const contextSections = results.map((result, index) => {
      const { content, metadata } = result;
      const source = metadata.source || "unknown";
      const type = metadata.type || "general";
      
      return `[Context ${index + 1} - ${type}]\n${content}`;
    });

    return `\n\n## Relevant Information from Portfolio:\n${contextSections.join("\n\n")}`;
  } catch (error) {
    console.error("Error retrieving RAG context:", error);
    // Return empty string on error to not break the chat flow
    return "";
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the latest user message for RAG retrieval
  const latestUserMessage = messages
    .filter((msg: any) => msg.role === "user")
    .pop();

  // Retrieve relevant context from vector store if there's a user message
  let ragContext = "";
  if (latestUserMessage?.content) {
    ragContext = await getRAGContext(latestUserMessage.content);
  }

  // Build the enhanced system prompt with RAG context
  const baseSystemPrompt = await getSystemPrompt();
  const systemPrompt = ragContext
    ? `${baseSystemPrompt}\n\n${ragContext}\n\nUse the information above to provide accurate and detailed answers. If the context doesn't contain relevant information, you can still use your general knowledge, but prioritize the provided context.`
    : baseSystemPrompt;

  messages.unshift({
    role: "system",
    content: systemPrompt,
  });

  const tools = {
    getContact,
    getProfile,
    getProjects,
    getResume,
    getSkills,
  };

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
    tools,
  });

  return result.toDataStreamResponse();
}
