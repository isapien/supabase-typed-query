import { describe, expect, it } from "vitest"

import type { ComparisonOperators, SoftDeleteMode, WhereConditions } from "@/query"

describe("Query Types", () => {
  it("should allow basic where conditions", () => {
    type TestTable = {
      id: number
      name: string
      active: boolean
    }

    const where: WhereConditions<TestTable> = {
      id: 1,
      name: "test",
      active: true,
    }

    expect(where).toBeDefined()
    expect(where.id).toBe(1)
    expect(where.name).toBe("test")
    expect(where.active).toBe(true)
  })

  it("should allow comparison operators", () => {
    type TestTable = {
      id: number
      score: number
    }

    const where: WhereConditions<TestTable> = {
      id: { gte: 1 },
      score: { lt: 100 },
    }

    expect(where).toBeDefined()
    expect(where.id).toEqual({ gte: 1 })
    expect(where.score).toEqual({ lt: 100 })
  })

  it("should allow nested comparison operators", () => {
    type TestTable = {
      id: number
      age: number
      name: string
    }

    const where: WhereConditions<TestTable> = {
      gte: { id: 1, age: 18 },
      like: { name: "%john%" },
    }

    expect(where).toBeDefined()
    expect(where.gte).toEqual({ id: 1, age: 18 })
    expect(where.like).toEqual({ name: "%john%" })
  })

  it("should type check comparison operators", () => {
    const validOperator: ComparisonOperators<number> = {
      gte: 5,
    }

    expect(validOperator).toBeDefined()
    expect(validOperator.gte).toBe(5)
  })

  it("should allow soft delete mode values", () => {
    const includeMode: SoftDeleteMode = "include"
    const excludeMode: SoftDeleteMode = "exclude"
    const onlyMode: SoftDeleteMode = "only"

    expect(includeMode).toBe("include")
    expect(excludeMode).toBe("exclude")
    expect(onlyMode).toBe("only")
  })

  it("should type check soft delete mode", () => {
    // Type should only accept the three valid values
    const validModes: SoftDeleteMode[] = ["include", "exclude", "only"]

    expect(validModes).toHaveLength(3)
    expect(validModes).toContain("include")
    expect(validModes).toContain("exclude")
    expect(validModes).toContain("only")
  })
})
