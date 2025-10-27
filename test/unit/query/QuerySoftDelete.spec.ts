import { describe, expect, it } from "vitest"

import { createMockSupabaseClient } from "../../helpers/mock-client"

import { query } from "@/query"

describe("Query Soft Delete Operations", () => {
  const mockClient = createMockSupabaseClient({ data: [], error: null })

  describe("Soft Delete Modes", () => {
    it("should support includeDeleted mode", () => {
      const q = query(mockClient, "users", {}).includeDeleted()

      expect(q).toBeDefined()
      expect(typeof q.many).toBe("function")
    })

    it("should support excludeDeleted mode", () => {
      const q = query(mockClient, "users", {}).excludeDeleted()

      expect(q).toBeDefined()
    })

    it("should support onlyDeleted mode", () => {
      const q = query(mockClient, "users", {}).onlyDeleted()

      expect(q).toBeDefined()
    })

    it("should allow chaining soft delete with other operations", () => {
      const q = query(mockClient, "users", { active: true }).excludeDeleted().limit(10)

      expect(q).toBeDefined()
    })

    it("should allow switching between soft delete modes", () => {
      const q1 = query(mockClient, "users", {}).excludeDeleted()
      const q2 = q1.includeDeleted()
      const q3 = q2.onlyDeleted()

      expect(q1).toBeDefined()
      expect(q2).toBeDefined()
      expect(q3).toBeDefined()
    })
  })

  describe("OR Chaining", () => {
    it("should chain OR conditions", () => {
      const q = query(mockClient, "users", { role: "admin" }).or({ role: "moderator" })

      expect(q).toBeDefined()
      expect(typeof q.many).toBe("function")
    })

    it("should chain multiple OR conditions", () => {
      const q = query(mockClient, "users", { role: "admin" }).or({ role: "moderator" }).or({ role: "editor" })

      expect(q).toBeDefined()
    })

    it("should support OR with IS conditions", () => {
      const q = query(mockClient, "posts", { status: "published" }).or({ published_at: null }, { deleted: null })

      expect(q).toBeDefined()
    })

    it("should support OR with different fields", () => {
      const q = query(mockClient, "posts", { status: "published" }).or({ view_count: { gte: 1000 } } as never)

      expect(q).toBeDefined()
    })

    it("should allow complex OR chains", () => {
      const q = query(mockClient, "posts", { status: "published" })
        .or({ status: "featured" })
        .or({ view_count: { gte: 500 }, status: "draft" } as never)

      expect(q).toBeDefined()
    })

    it("should work with functional operations after OR", () => {
      const q = query(mockClient, "posts", { status: "published" })
        .or({ status: "featured" })
        .filter((post) => (post.view_count as number) > 100)
        .map((post) => post.title)

      expect(q).toBeDefined()
    })
  })

  describe("Combined Operations", () => {
    it("should combine OR, soft delete, and functional operations", () => {
      const q = query(mockClient, "posts", { status: "published" })
        .or({ status: "featured" })
        .excludeDeleted()
        .filter((post) => (post.view_count as number) > 0)
        .limit(20)

      expect(q).toBeDefined()
    })

    it("should allow OR after soft delete operations", () => {
      const q = query(mockClient, "users", { active: true }).excludeDeleted().or({ role: "admin" })

      expect(q).toBeDefined()
    })

    it("should maintain query builder pattern throughout", () => {
      const q = query(mockClient, "posts", {})
        .or({ status: "published" })
        .or({ status: "featured" })
        .includeDeleted()
        .filter((p) => (p.view_count as number) > 100)
        .map((p) => p.title)

      expect(q).toBeDefined()
      expect(typeof q.many).toBe("function")
      expect(typeof q.one).toBe("function")
      expect(typeof q.first).toBe("function")
    })
  })
})
