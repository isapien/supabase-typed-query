// test/integration/Database.integration.spec.ts
import { beforeAll, describe, expect, it } from "vitest"

import { DatabaseSetup } from "./database-setup"

describe("Database Integration Tests", () => {
  const dbSetup = new DatabaseSetup()

  beforeAll(async () => {
    await dbSetup.initialize()
    // Clean up any existing test data
    await dbSetup.cleanupTestData()
  })

  it("should connect to database", async () => {
    const client = dbSetup.getClient()
    expect(client).toBeDefined()

    // Verify we can query a table
    const { error } = await client.from("users").select("*").limit(1)

    // If table doesn't exist, that's OK - connection still works
    if (error && (error as { code?: string }).code !== "42P01") {
      // 42P01 = table does not exist
      expect(error).toBeNull()
    }
  })

  it("should verify client has required methods", () => {
    const client = dbSetup.getClient()

    expect(typeof client.from).toBe("function")
  })
})
