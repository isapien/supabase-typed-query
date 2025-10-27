// test/integration/QueryAdvanced.integration.spec.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import "./augment-database-types" // Augment Database interface with test schema

import { query } from "@/query"

import { DatabaseSetup } from "./database-setup"

describe("Advanced Query Integration Tests", () => {
  const dbSetup = new DatabaseSetup()
  let testAuthorId: string

  beforeAll(async () => {
    await dbSetup.initialize()
    await dbSetup.cleanupTestData()

    // Create test author
    const users = await dbSetup.createTestUsers(1)
    testAuthorId = users[0]

    // Create test posts
    await dbSetup.createTestPosts(testAuthorId, 15)
  })

  afterAll(async () => {
    await dbSetup.cleanupTestData()
  })

  describe("Complex Query Chains", () => {
    it("should handle OR + filter + map + limit in sequence", async () => {
      const client = dbSetup.getClient()

      const titles = await query<"posts">(client, "posts", { status: "published" })
        .or({ status: "archived" })
        .filter((post) => (post.view_count as number) >= 10)
        .map((post) => post.title)
        .limit(5)
        .manyOrThrow()

      expect(titles.length).toBeGreaterThan(0)
      expect(titles.length).toBeLessThanOrEqual(5)
      titles.forEach((title) => {
        expect(typeof title).toBe("string")
      })
    })

    it("should handle complex nested transformations", async () => {
      const client = dbSetup.getClient()

      const result = await query<"posts">(client, "posts", {})
        .filter((post) => (post.view_count as number) > 0)
        .map((post) => ({
          id: post.id,
          title: post.title,
          viewCount: post.view_count,
        }))
        .filter((obj) => (obj.viewCount as number) > 5)
        .map((obj) => obj.title)
        .manyOrThrow()

      expect(Array.isArray(result.toArray())).toBe(true)
    })

    it("should maintain correct results with multiple OR conditions + filter", async () => {
      const client = dbSetup.getClient()

      const posts = await query<"posts">(client, "posts", { status: "draft" })
        .or({ status: "published" })
        .or({ status: "archived" })
        .filter((post) => post.author_id === testAuthorId)
        .manyOrThrow()

      expect(posts.length).toBeGreaterThan(0)
      posts.forEach((post) => {
        expect(post.author_id).toBe(testAuthorId)
        expect(["draft", "published", "archived"]).toContain(post.status)
      })
    })
  })

  describe("Pagination Scenarios", () => {
    it("should handle offset-based pagination correctly", async () => {
      const client = dbSetup.getClient()

      const pageSize = 5
      const totalPages = 3

      const pages = []
      for (let page = 0; page < totalPages; page++) {
        const results = await query<"posts">(client, "posts", {})
          .limit(pageSize)
          .offset(page * pageSize)
          .manyOrThrow()

        pages.push(results)
      }

      // Verify pages don't overlap
      const allIds = pages.flatMap((page) => page.map((post) => post.id).toArray())
      const uniqueIds = new Set(allIds)
      expect(uniqueIds.size).toBe(allIds.length) // No duplicates
    })

    it("should handle limit without offset", async () => {
      const client = dbSetup.getClient()

      const posts = await query<"posts">(client, "posts", {}).limit(3).manyOrThrow()

      expect(posts.length).toBeLessThanOrEqual(3)
    })

    it("should handle offset without limit (returns rest of results)", async () => {
      const client = dbSetup.getClient()

      const allPosts = await query<"posts">(client, "posts", {}).manyOrThrow()

      const offsetPosts = await query<"posts">(client, "posts", {}).offset(5).manyOrThrow()

      expect(offsetPosts.length).toBeLessThan(allPosts.length)
    })
  })

  describe("Concurrent Query Execution", () => {
    it("should handle multiple concurrent queries", async () => {
      const client = dbSetup.getClient()

      const [users, posts, drafts] = await Promise.all([
        query<"users">(client, "users", {}).manyOrThrow(),
        query<"posts">(client, "posts", {}).manyOrThrow(),
        query<"posts">(client, "posts", { status: "draft" }).manyOrThrow(),
      ])

      expect(users.length).toBeGreaterThan(0)
      expect(posts.length).toBeGreaterThan(0)
      expect(drafts.length).toBeGreaterThan(0)
    })

    it("should handle concurrent map operations", async () => {
      const client = dbSetup.getClient()

      const [userEmails, postTitles] = await Promise.all([
        query<"users">(client, "users", {})
          .map((u) => u.email)
          .manyOrThrow(),
        query<"posts">(client, "posts", {})
          .map((p) => p.title)
          .manyOrThrow(),
      ])

      expect(userEmails.length).toBeGreaterThan(0)
      expect(postTitles.length).toBeGreaterThan(0)
    })
  })

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle empty result sets gracefully", async () => {
      const client = dbSetup.getClient()

      const posts = await query<"posts">(client, "posts", {
        status: "nonexistent_status",
      }).manyOrThrow()

      expect(posts.length).toBe(0)
      expect(Array.isArray(posts.toArray())).toBe(true)
    })

    it("should handle very long OR chains", async () => {
      const client = dbSetup.getClient()

      let q = query<"posts">(client, "posts", { status: "draft" })

      // Chain 10 OR conditions
      for (let i = 0; i < 10; i++) {
        q = q.or({ view_count: { gte: i * 10 } } as never)
      }

      const posts = await q.manyOrThrow()

      expect(Array.isArray(posts.toArray())).toBe(true)
    })

    it("should handle queries with no matching records", async () => {
      const client = dbSetup.getClient()

      const result = await query<"users">(client, "users", {
        email: "nonexistent@example.com",
      }).one()

      const option = result.orThrow()
      expect(option.isEmpty).toBe(true)
    })

    it("should handle null values in comparisons", async () => {
      const client = dbSetup.getClient()

      const posts = await query<"posts">(client, "posts", {
        published_at: { is: null },
      }).manyOrThrow()

      posts.forEach((post) => {
        expect(post.published_at).toBeNull()
      })
    })
  })

  describe("Performance Characteristics", () => {
    it("should handle large result sets with map efficiently", async () => {
      const client = dbSetup.getClient()

      // Create many test posts
      await dbSetup.createTestPosts(testAuthorId, 50)

      const startTime = Date.now()

      const titles = await query<"posts">(client, "posts", {})
        .map((post) => post.title)
        .manyOrThrow()

      const duration = Date.now() - startTime

      expect(titles.length).toBeGreaterThan(0)
      // Query should complete in reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000)
    })

    it("should handle multiple filters efficiently", async () => {
      const client = dbSetup.getClient()

      const startTime = Date.now()

      const posts = await query<"posts">(client, "posts", {})
        .filter((post) => (post.view_count as number) > 0)
        .filter((post) => post.status !== "draft")
        .filter((post) => post.title !== "")
        .manyOrThrow()

      const duration = Date.now() - startTime

      expect(Array.isArray(posts.toArray())).toBe(true)
      expect(duration).toBeLessThan(5000)
    })
  })

  describe("Type Safety in Practice", () => {
    it("should preserve types through complex chains", async () => {
      const client = dbSetup.getClient()

      const result = await query<"posts">(client, "posts", {})
        .map((post) => ({
          id: post.id,
          title: post.title,
          views: post.view_count,
        }))
        .filter((obj) => (obj.views as number) > 0)
        .limit(10)
        .manyOrThrow()

      result.forEach((obj) => {
        expect(obj).toHaveProperty("id")
        expect(obj).toHaveProperty("title")
        expect(obj).toHaveProperty("views")
        expect(typeof obj.id).toBe("string")
        expect(typeof obj.title).toBe("string")
      })
    })

    it("should handle nested transformations with type safety", async () => {
      const client = dbSetup.getClient()

      const result = await query<"users">(client, "users", {})
        .map((user) => user.email)
        .map((email) => (email as string).toLowerCase())
        .map((email) => ({ email, domain: (email as string).split("@")[1] }))
        .manyOrThrow()

      result.forEach((obj) => {
        expect(obj).toHaveProperty("email")
        expect(obj).toHaveProperty("domain")
        expect(typeof obj.email).toBe("string")
        expect(typeof obj.domain).toBe("string")
      })
    })
  })

  describe("Real-world Scenarios", () => {
    it("should handle 'get recent active posts' query", async () => {
      const client = dbSetup.getClient()

      const recentPosts = await query<"posts">(client, "posts", {
        status: "published",
      })
        .or({ status: "archived" })
        .filter((post) => post.published_at !== null)
        .filter((post) => (post.view_count as number) > 0)
        .limit(10)
        .manyOrThrow()

      expect(recentPosts.length).toBeGreaterThan(0)
      recentPosts.forEach((post) => {
        expect(["published", "archived"]).toContain(post.status)
        expect(post.published_at).not.toBeNull()
        expect((post.view_count as number) > 0).toBe(true)
      })
    })

    it("should handle 'get user emails for admins and moderators' query", async () => {
      const client = dbSetup.getClient()

      await dbSetup.createTestUsers(10)

      const emails = await query<"users">(client, "users", { role: "admin" })
        .or({ role: "moderator" })
        .filter((user) => user.active === true)
        .map((user) => user.email)
        .manyOrThrow()

      expect(emails.length).toBeGreaterThan(0)
      emails.forEach((email) => {
        expect(typeof email).toBe("string")
        expect(email).toContain("@")
      })
    })

    it("should handle 'paginated search results' query", async () => {
      const client = dbSetup.getClient()

      const searchTerm = "Test"
      const page = 1
      const pageSize = 5

      const results = await query<"posts">(client, "posts", {
        title: { ilike: `%${searchTerm}%` },
      })
        .filter((post) => post.status !== "draft")
        .limit(pageSize)
        .offset(page * pageSize)
        .manyOrThrow()

      expect(results.length).toBeLessThanOrEqual(pageSize)
    })
  })
})
