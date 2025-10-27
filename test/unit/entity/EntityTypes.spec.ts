import { describe, expect, it } from "vitest"

import type { EntityConfig, EntityType, IdParam, IEntity, TypedRecord, WhereParams } from "@/entity"

describe("Entity Types", () => {
  it("should define proper entity type structure", () => {
    // EntityType expects a TableNames type (string literal)
    type TestTable = "test_table"

    const entityType: EntityType<TestTable> = {
      getItem: expect.any(Function) as never,
      getItems: expect.any(Function) as never,
      addItems: expect.any(Function) as never,
      updateItem: expect.any(Function) as never,
      updateItems: expect.any(Function) as never,
    }

    expect(entityType).toBeDefined()
  })

  it("should type check IdParam", () => {
    // IdParam is not generic
    const idParam: IdParam = {
      id: "test-id",
    }

    expect(idParam).toBeDefined()
    expect(idParam.id).toBe("test-id")
  })

  it("should type check WhereParams", () => {
    type TestTable = {
      id: number
      name: string
      active: boolean
    }

    const whereParams: WhereParams<TestTable> = {
      where: {
        active: true,
        name: "test",
      },
    }

    expect(whereParams).toBeDefined()
    expect(whereParams.where?.active).toBe(true)
    expect(whereParams.where?.name).toBe("test")
  })

  it("should handle TypedRecord type", () => {
    type TestObject = { id: string; value: number }
    // TypedRecord takes two generic parameters: T and V
    type TestRecord = TypedRecord<TestObject, string | number>

    const record: TestRecord = {
      id: "test",
      value: 42,
    }

    expect(record).toBeDefined()
    expect(record.id).toBe("test")
    expect(record.value).toBe(42)
  })

  it("should type check EntityConfig", () => {
    const configExclude: EntityConfig = {
      softDelete: true,
    }

    const configInclude: EntityConfig = {
      softDelete: false,
    }

    expect(configExclude).toBeDefined()
    expect(configInclude).toBeDefined()
    expect(configExclude.softDelete).toBe(true)
    expect(configInclude.softDelete).toBe(false)
  })

  it("should support partition key in EntityConfig", () => {
    const configWithPartition: EntityConfig = {
      softDelete: true,
      partitionKey: { tenant_id: "123" },
    }

    const configWithoutPartition: EntityConfig = {
      softDelete: false,
    }

    expect(configWithPartition).toBeDefined()
    expect(configWithPartition.partitionKey).toEqual({ tenant_id: "123" })
    expect(configWithoutPartition.partitionKey).toBeUndefined()
  })

  it("should type check IEntity interface", () => {
    type TestTable = "test_table"

    // IEntity should have all required methods - just test type compatibility
    const mockFn = (() => {}) as never

    const entityInterface: IEntity<TestTable> = {
      getItem: mockFn,
      getItems: mockFn,
      addItems: mockFn,
      updateItem: mockFn,
      updateItems: mockFn,
    }

    expect(entityInterface).toBeDefined()
    expect(entityInterface.getItem).toBeDefined()
    expect(entityInterface.getItems).toBeDefined()
  })
})
