import { describe, expect, it } from "vitest"

import type { ComparisonOperators, WhereConditions } from "../src/query"

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
})
