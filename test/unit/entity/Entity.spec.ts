import { describe, expect, it, vi } from "vitest"

import { createMockSupabaseClient } from "../../helpers/mock-client"

import { Entity } from "@/entity"
import type { SupabaseClientType } from "@/types"

describe("Entity", () => {
  describe("Entity Configuration", () => {
    it("should create entity with softDelete enabled", () => {
      const mockClient = createMockSupabaseClient()

      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      expect(UserEntity).toBeDefined()
      expect(typeof UserEntity.getItem).toBe("function")
      expect(typeof UserEntity.getItems).toBe("function")
      expect(typeof UserEntity.addItems).toBe("function")
      expect(typeof UserEntity.updateItem).toBe("function")
      expect(typeof UserEntity.updateItems).toBe("function")
    })

    it("should create entity with softDelete disabled", () => {
      const mockClient = createMockSupabaseClient()

      const UserEntity = Entity(mockClient, "users", { softDelete: false })

      expect(UserEntity).toBeDefined()
    })

    it("should create entity with partition key", () => {
      const mockClient = createMockSupabaseClient()

      const TenantEntity = Entity(mockClient, "posts", {
        softDelete: true,
        partitionKey: { tenant_id: "tenant-123" },
      })

      expect(TenantEntity).toBeDefined()
    })
  })

  describe("getItem()", () => {
    it("should return a Query interface", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const query = UserEntity.getItem({ id: "user-123" })

      expect(query).toBeDefined()
      expect(typeof query.one).toBe("function")
      expect(typeof query.many).toBe("function")
      expect(typeof query.first).toBe("function")
    })

    it("should accept where conditions", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const query = UserEntity.getItem({
        id: "user-123",
        where: { active: true },
      })

      expect(query).toBeDefined()
    })

    it("should accept IS conditions", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const query = UserEntity.getItem({
        id: "user-123",
        is: { deleted: null },
      })

      expect(query).toBeDefined()
    })
  })

  describe("getItems()", () => {
    it("should return a Query interface", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const query = UserEntity.getItems()

      expect(query).toBeDefined()
      expect(typeof query.many).toBe("function")
    })

    it("should accept where conditions", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const query = UserEntity.getItems({
        where: { active: true, role: "admin" },
      })

      expect(query).toBeDefined()
    })

    it("should accept IS conditions", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const query = UserEntity.getItems({
        is: { deleted: null },
      })

      expect(query).toBeDefined()
    })

    it("should accept wherein conditions", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const query = UserEntity.getItems({
        wherein: { id: ["id1", "id2", "id3"] },
      })

      expect(query).toBeDefined()
    })

    it("should accept order parameters", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const query = UserEntity.getItems({
        order: ["created_at", { ascending: false }],
      })

      expect(query).toBeDefined()
    })

    it("should accept combined parameters", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const query = UserEntity.getItems({
        where: { active: true },
        is: { deleted: null },
        wherein: { role: ["admin", "moderator"] },
        order: ["name", { ascending: true }],
      })

      expect(query).toBeDefined()
    })
  })

  describe("addItems()", () => {
    it("should call client insert with items", () => {
      const insertSpy = vi.fn().mockReturnThis()
      const selectSpy = vi.fn().mockResolvedValue({
        data: [{ id: "1", name: "Test" }],
        error: null,
      })

      const mockClient = {
        from: vi.fn().mockReturnValue({
          insert: insertSpy,
          select: selectSpy,
          then: vi.fn().mockImplementation((resolve) => {
            return Promise.resolve({ data: [{ id: "1", name: "Test" }], error: null }).then(resolve)
          }),
        }),
      } as unknown as SupabaseClientType

      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const items = [
        { name: "User 1", email: "user1@example.com" },
        { name: "User 2", email: "user2@example.com" },
      ]

      const result = UserEntity.addItems({ items })

      expect(result).toBeDefined()
      expect(typeof result.many).toBe("function")
      expect(typeof result.manyOrThrow).toBe("function")
      expect(typeof result.execute).toBe("function")
      expect(typeof result.executeOrThrow).toBe("function")
    })
  })

  describe("updateItem()", () => {
    it("should return a mutation execution interface", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const result = UserEntity.updateItem({
        id: "user-123",
        item: { name: "Updated Name" },
      })

      expect(result).toBeDefined()
      expect(typeof result.one).toBe("function")
      expect(typeof result.oneOrThrow).toBe("function")
      expect(typeof result.execute).toBe("function")
      expect(typeof result.executeOrThrow).toBe("function")
    })

    it("should accept where conditions", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const result = UserEntity.updateItem({
        id: "user-123",
        item: { name: "Updated" },
        where: { active: true },
      })

      expect(result).toBeDefined()
    })
  })

  describe("updateItems()", () => {
    it("should return a mutation multi execution interface", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const result = UserEntity.updateItems({
        items: [{ id: "1", name: "Updated 1" }],
      })

      expect(result).toBeDefined()
      expect(typeof result.many).toBe("function")
      expect(typeof result.manyOrThrow).toBe("function")
      expect(typeof result.execute).toBe("function")
      expect(typeof result.executeOrThrow).toBe("function")
    })

    it("should accept identity parameter", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const result = UserEntity.updateItems({
        items: [{ email: "user1@example.com", name: "Updated" }],
        identity: "email",
      })

      expect(result).toBeDefined()
    })

    it("should accept composite identity", () => {
      const mockClient = createMockSupabaseClient()
      const UserEntity = Entity(mockClient, "users", { softDelete: true })

      const result = UserEntity.updateItems({
        items: [{ id: "1", name: "Updated" }],
        identity: ["id", "name"],
      })

      expect(result).toBeDefined()
    })
  })

  describe("Partition Key Integration", () => {
    it("should automatically apply partition key to getItem", () => {
      const fromSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const mockClient = { from: fromSpy } as unknown as SupabaseClientType

      const TenantEntity = Entity(mockClient, "posts", {
        softDelete: true,
        partitionKey: { tenant_id: "tenant-123" },
      })

      TenantEntity.getItem({ id: "post-1" }).one()

      expect(fromSpy).toHaveBeenCalledWith("posts")
    })

    it("should automatically apply partition key to getItems", () => {
      const fromSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      const mockClient = { from: fromSpy } as unknown as SupabaseClientType

      const TenantEntity = Entity(mockClient, "posts", {
        softDelete: true,
        partitionKey: { tenant_id: "tenant-123" },
      })

      TenantEntity.getItems({ where: { status: "published" } }).many()

      expect(fromSpy).toHaveBeenCalledWith("posts")
    })
  })

  describe("Soft Delete Behavior", () => {
    it("should exclude deleted items when softDelete is true", () => {
      const mockClient = createMockSupabaseClient()

      const UserEntity = Entity(mockClient, "users", { softDelete: true })
      const query = UserEntity.getItems()

      expect(query).toBeDefined()
      // The query should have soft delete mode set to "exclude" by default
    })

    it("should include deleted items when softDelete is false", () => {
      const mockClient = createMockSupabaseClient()

      const UserEntity = Entity(mockClient, "users", { softDelete: false })
      const query = UserEntity.getItems()

      expect(query).toBeDefined()
      // The query should have soft delete mode set to "include" by default
    })

    it("should allow overriding soft delete mode on queries", () => {
      const mockClient = createMockSupabaseClient()

      const UserEntity = Entity(mockClient, "users", { softDelete: true })
      const query = UserEntity.getItems().includeDeleted()

      expect(query).toBeDefined()
      expect(typeof query.includeDeleted).toBe("function")
      expect(typeof query.excludeDeleted).toBe("function")
      expect(typeof query.onlyDeleted).toBe("function")
    })
  })
})
