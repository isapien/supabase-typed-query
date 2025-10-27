// test/integration/Query.integration.spec.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import "./augment-database-types" // Augment Database interface with test schema

import { query } from "@/query"

import { DatabaseSetup } from "./database-setup"

describe("Query API Integration Tests", () => {
  const dbSetup = new DatabaseSetup()

  beforeAll(async () => {
    await dbSetup.initialize()
    await dbSetup.cleanupTestData()

    // Create test user for queries
    await dbSetup.createTestUsers(1)
  })

  afterAll(async () => {
    await dbSetup.cleanupTestData()
  })

  describe("Basic Query Execution", () => {
    it("should execute one() and return a single result", async () => {
      const client = dbSetup.getClient()

      const result = await query<"users">(client, "users", {
        email: "test_user_1@example.com",
      }).one()

      const outcome = result.orThrow()

      expect(outcome.isEmpty).toBe(false)
      const user = outcome.orThrow()
      expect(user.email).toBe("test_user_1@example.com")
      expect(user.name).toBe("Test User 1")
    })

    it("should execute many() and return multiple results", async () => {
      const client = dbSetup.getClient()

      // Create additional users
      await dbSetup.createTestUsers(5)

      const result = await query<"users">(client, "users", {}).many()

      const list = result.orThrow()

      expect(list.length).toBeGreaterThan(0)
      expect(Array.isArray(list.toArray())).toBe(true)
    })

    it("should execute first() and return the first result", async () => {
      const client = dbSetup.getClient()

      const result = await query<"users">(client, "users", {
        active: true,
      }).first()

      const outcome = result.orThrow()

      expect(outcome.isEmpty).toBe(false)
      const user = outcome.orThrow()
      expect(user.active).toBe(true)
    })

    it("should execute oneOrThrow() and return a result", async () => {
      const client = dbSetup.getClient()

      const user = await query<"users">(client, "users", {
        email: "test_user_1@example.com",
      }).oneOrThrow()

      expect(user.email).toBe("test_user_1@example.com")
    })

    it("should execute manyOrThrow() and return results", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {
        active: true,
      }).manyOrThrow()

      expect(users.length).toBeGreaterThan(0)
    })

    it("should execute firstOrThrow() and return first result", async () => {
      const client = dbSetup.getClient()

      const user = await query<"users">(client, "users", {}).firstOrThrow()

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
    })
  })

  describe("Comparison Operators", () => {
    beforeAll(async () => {
      await dbSetup.createTestUsers(10) // Creates users with ages 20-29
    })

    it("should filter with gt (greater than)", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {
        age: { gt: 25 },
      }).manyOrThrow()

      users.forEach((user) => {
        expect((user.age as number) > 25).toBe(true)
      })
    })

    it("should filter with gte (greater than or equal)", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {
        age: { gte: 25 },
      }).manyOrThrow()

      users.forEach((user) => {
        expect((user.age as number) >= 25).toBe(true)
      })
    })

    it("should filter with lt (less than)", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {
        age: { lt: 25 },
      }).manyOrThrow()

      users.forEach((user) => {
        expect((user.age as number) < 25).toBe(true)
      })
    })

    it("should filter with lte (less than or equal)", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {
        age: { lte: 25 },
      }).manyOrThrow()

      users.forEach((user) => {
        expect((user.age as number) <= 25).toBe(true)
      })
    })

    it("should filter with neq (not equal)", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {
        role: { neq: "admin" },
      }).manyOrThrow()

      users.forEach((user) => {
        expect(user.role).not.toBe("admin")
      })
    })

    it("should filter with in operator", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {
        role: { in: ["admin", "moderator"] },
      }).manyOrThrow()

      users.forEach((user) => {
        expect(["admin", "moderator"]).toContain(user.role)
      })
    })

    it("should filter with is null", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {
        deleted: { is: null },
      }).manyOrThrow()

      users.forEach((user) => {
        expect(user.deleted).toBeNull()
      })
    })

    it("should filter with is true/false", async () => {
      const client = dbSetup.getClient()

      const activeUsers = await query<"users">(client, "users", {
        active: { is: true },
      }).manyOrThrow()

      activeUsers.forEach((user) => {
        expect(user.active).toBe(true)
      })
    })
  })

  describe("Pattern Matching", () => {
    beforeAll(async () => {
      await dbSetup.createTestUsers(5)
    })

    it("should filter with like operator", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {
        email: { like: "%test_user%@example.com" },
      }).manyOrThrow()

      expect(users.length).toBeGreaterThan(0)
      users.forEach((user) => {
        expect(user.email).toMatch(/test_user/)
      })
    })

    it("should filter with ilike operator (case-insensitive)", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {
        email: { ilike: "%TEST_USER%@example.com" },
      }).manyOrThrow()

      expect(users.length).toBeGreaterThan(0)
    })
  })

  describe("OR Chaining", () => {
    beforeAll(async () => {
      await dbSetup.createTestUsers(10)
    })

    it("should chain OR conditions", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", { role: "admin" }).or({ role: "moderator" }).manyOrThrow()

      users.forEach((user) => {
        expect(["admin", "moderator"]).toContain(user.role)
      })
    })

    it("should chain multiple OR conditions", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", { role: "admin" })
        .or({ role: "moderator" })
        .or({ role: "user" })
        .manyOrThrow()

      expect(users.length).toBeGreaterThan(0)
    })

    it("should support OR with IS conditions", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", { active: true })
        .or({ active: false }, { deleted: null })
        .manyOrThrow()

      expect(users.length).toBeGreaterThan(0)
    })
  })

  describe("Functional Operations", () => {
    beforeAll(async () => {
      await dbSetup.createTestUsers(10)
    })

    it("should map query results", async () => {
      const client = dbSetup.getClient()

      const emails = await query<"users">(client, "users", {})
        .map((user) => user.email)
        .manyOrThrow()

      expect(Array.isArray(emails.toArray())).toBe(true)
      emails.forEach((email) => {
        expect(typeof email).toBe("string")
        expect(email).toContain("@")
      })
    })

    it("should chain multiple map operations", async () => {
      const client = dbSetup.getClient()

      const upperEmails = await query<"users">(client, "users", {})
        .map((user) => user.email)
        .map((email) => (email as string).toUpperCase())
        .manyOrThrow()

      upperEmails.forEach((email) => {
        expect(email).toBe((email as string).toUpperCase())
      })
    })

    it("should filter query results", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {})
        .filter((user) => (user.age as number) > 25)
        .manyOrThrow()

      users.forEach((user) => {
        expect((user.age as number) > 25).toBe(true)
      })
    })

    it("should combine filter and map", async () => {
      const client = dbSetup.getClient()

      const names = await query<"users">(client, "users", {})
        .filter((user) => user.active === true)
        .map((user) => user.name)
        .manyOrThrow()

      expect(names.length).toBeGreaterThan(0)
      names.forEach((name) => {
        expect(typeof name).toBe("string")
      })
    })

    it("should apply limit to query", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {}).limit(3).manyOrThrow()

      expect(users.length).toBeLessThanOrEqual(3)
    })

    it("should apply offset to query", async () => {
      const client = dbSetup.getClient()

      const allUsers = await query<"users">(client, "users", {}).manyOrThrow()

      const offsetUsers = await query<"users">(client, "users", {}).offset(5).manyOrThrow()

      expect(offsetUsers.length).toBeLessThan(allUsers.length)
    })

    it("should combine limit and offset for pagination", async () => {
      const client = dbSetup.getClient()

      const page1 = await query<"users">(client, "users", {}).limit(5).offset(0).manyOrThrow()

      const page2 = await query<"users">(client, "users", {}).limit(5).offset(5).manyOrThrow()

      expect(page1.length).toBeGreaterThan(0)
      expect(page2.length).toBeGreaterThan(0)

      // Ensure different results
      const page1Ids = page1.map((u) => u.id).toArray()
      const page2Ids = page2.map((u) => u.id).toArray()

      const hasOverlap = page1Ids.some((id) => page2Ids.includes(id))
      expect(hasOverlap).toBe(false)
    })
  })

  describe("Soft Delete Operations", () => {
    let activeId: string
    let deletedId: string

    beforeAll(async () => {
      const { activeId: active, deletedId: deleted } = await dbSetup.createSoftDeleteTestData()
      activeId = active
      deletedId = deleted
    })

    it("should include deleted records with includeDeleted()", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {}).includeDeleted().manyOrThrow()

      const hasActive = users.some((u) => u.id === activeId)
      const hasDeleted = users.some((u) => u.id === deletedId)

      expect(hasActive).toBe(true)
      expect(hasDeleted).toBe(true)
    })

    it("should exclude deleted records with excludeDeleted()", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {}).excludeDeleted().manyOrThrow()

      const hasActive = users.some((u) => u.id === activeId)
      const hasDeleted = users.some((u) => u.id === deletedId)

      expect(hasActive).toBe(true)
      expect(hasDeleted).toBe(false)
    })

    it("should return only deleted records with onlyDeleted()", async () => {
      const client = dbSetup.getClient()

      const users = await query<"users">(client, "users", {}).onlyDeleted().manyOrThrow()

      users.forEach((user) => {
        expect(user.deleted).not.toBeNull()
      })

      const hasDeleted = users.some((u) => u.id === deletedId)
      expect(hasDeleted).toBe(true)
    })
  })

  describe("Complex Query Chains", () => {
    beforeAll(async () => {
      await dbSetup.createTestUsers(20)
    })

    it("should combine OR, filter, map, and limit", async () => {
      const client = dbSetup.getClient()

      const names = await query<"users">(client, "users", { role: "admin" })
        .or({ role: "moderator" })
        .filter((user) => user.active === true)
        .map((user) => user.name)
        .limit(5)
        .manyOrThrow()

      expect(names.length).toBeGreaterThan(0)
      expect(names.length).toBeLessThanOrEqual(5)
    })

    it("should maintain type safety through chain", async () => {
      const client = dbSetup.getClient()

      const result = await query<"users">(client, "users", {})
        .map((user) => ({ name: user.name, email: user.email }))
        .filter((obj) => (obj.email as string).includes("test"))
        .manyOrThrow()

      result.forEach((obj) => {
        expect(obj).toHaveProperty("name")
        expect(obj).toHaveProperty("email")
      })
    })
  })
})
