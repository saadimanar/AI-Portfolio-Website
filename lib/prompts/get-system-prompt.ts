import fs from "fs/promises";
import path from "path";

const SYSTEM_PROMPT_FILENAME = "system-bio.txt";

export async function getSystemPrompt(): Promise<string> {
  const filePath = path.join(
    process.cwd(),
    "lib",
    "prompts",
    SYSTEM_PROMPT_FILENAME
  );
  const content = await fs.readFile(filePath, "utf-8");
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("System prompt file is empty");
  }
  return trimmed;
}
