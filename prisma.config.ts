// Vercel's `vercel env pull` writes to .env.local (not .env), so load that
// first — this mirrors what Next.js itself does for the app at runtime.
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection — the app itself
    // connects with the pooled DATABASE_URL via the Neon adapter at runtime.
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
