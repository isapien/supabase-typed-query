// test/integration/setup.ts
import { afterAll, beforeAll } from "vitest"

import { config } from "dotenv"
import { resolve } from "path"

// Load test environment variables
beforeAll(() => {
  // Try to load .env.test file if it exists
  config({ path: resolve(process.cwd(), ".env.test") })
  config({ path: resolve(process.cwd(), ".env.integration") })

  // Verify we have the required environment variables
  const hasSupabase = Boolean(process.env.TEST_SUPABASE_URL && process.env.TEST_SUPABASE_ANON_KEY)
  const hasPostgrest = Boolean(process.env.TEST_POSTGREST_URL && process.env.TEST_POSTGREST_ANON_KEY)

  if (!hasSupabase && !hasPostgrest) {
    console.warn(
      "⚠️  Integration tests require either:\n" +
        "   - Supabase (Local): TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY\n" +
        "   - PostgREST (CI): TEST_POSTGREST_URL, TEST_POSTGREST_ANON_KEY\n" +
        "   Create a .env.test or .env.integration file or set environment variables",
    )
  }

  if (hasPostgrest) {
    console.log("🔗 Integration tests using PostgREST:", process.env.TEST_POSTGREST_URL)
  } else if (hasSupabase) {
    console.log("🔗 Integration tests using Supabase:", process.env.TEST_SUPABASE_URL)
  }
})

afterAll(() => {
  // Any global cleanup can go here
})
