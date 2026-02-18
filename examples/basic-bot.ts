import "dotenv/config";
import { bootstrapRealBotExample } from "./real-bot/main";

bootstrapRealBotExample().catch((error) => {
  console.error("Failed to start real bot example:", error);
  process.exit(1);
});
