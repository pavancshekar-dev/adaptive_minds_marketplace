// Side-effect-only module: loads env vars for standalone scripts (tsx), which
// don't get Next.js's automatic .env / .env.local loading. Must be the first
// import in any entrypoint that transitively imports `prisma.ts`, since ES
// module imports evaluate before the importing file's own statements do.
import { config } from "dotenv";

config({ path: ".env.local" });
config();
