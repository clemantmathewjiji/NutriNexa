import { generateText } from "ai";

// Ensure environment variables from .env.local are loaded if not already in process.env
if (!process.env.AI_GATEWAY_API_KEY && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Environment variables already loaded
  }
}

async function main() {
  const result = await generateText({
    model: "moonshotai/kimi-k3",
    prompt: "Invent a new holiday and describe its traditions.",
  });

  console.log("=== Generated Holiday & Traditions ===");
  console.log(result.text);
}

main().catch((err) => {
  console.error("Error generating text:", err);
  process.exit(1);
});
