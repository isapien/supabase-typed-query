import { describe, expect, it } from "vitest"

import { SupabaseError, type SupabaseErrorObject, toError } from "../src/utils/errors"

describe("Error Handling", () => {
  it("should convert Supabase error objects to SupabaseError", () => {
    const supabaseError: SupabaseErrorObject = {
      message: "relation does not exist",
      code: "42P01",
      details: "Table 'users' not found",
      hint: "Check table name spelling",
    }

    const error = toError(supabaseError)

    expect(error).toBeInstanceOf(SupabaseError)
    expect(error.message).toBe("relation does not exist")
    expect((error as SupabaseError).code).toBe("42P01")
    expect((error as SupabaseError).details).toBe("Table 'users' not found")
    expect((error as SupabaseError).hint).toBe("Check table name spelling")
  })

  it("should preserve error code, details, and hint", () => {
    const supabaseError: SupabaseErrorObject = {
      message: "permission denied",
      code: "42501",
      details: "User does not have SELECT permission",
      hint: "Grant SELECT permission to the user",
    }

    const error = new SupabaseError(supabaseError)

    expect(error.code).toBe("42501")
    expect(error.details).toBe("User does not have SELECT permission")
    expect(error.hint).toBe("Grant SELECT permission to the user")
  })

  it("should handle Error instances", () => {
    const originalError = new Error("Original error message")
    originalError.stack = "stack trace here"

    const error = toError(originalError)

    expect(error).toBe(originalError)
    expect(error.message).toBe("Original error message")
    expect(error.stack).toBe("stack trace here")
  })

  it("should handle unknown error types", () => {
    const unknownError = "string error"
    const error = toError(unknownError)

    expect(error).toBeInstanceOf(SupabaseError)
    expect(error.message).toBe("string error")
  })

  it("should handle objects without message property", () => {
    const unknownObject = { foo: "bar" }
    const error = toError(unknownObject)

    expect(error).toBeInstanceOf(SupabaseError)
    expect(error.message).toBe("[object Object]")
  })

  it("should format toString with all details", () => {
    const supabaseError: SupabaseErrorObject = {
      message: "connection failed",
      code: "PGRST301",
      details: "Could not connect to database",
      hint: "Check connection string",
    }

    const error = new SupabaseError(supabaseError)
    const formatted = error.toString()

    expect(formatted).toContain("connection failed")
    expect(formatted).toContain("[Code: PGRST301]")
    expect(formatted).toContain("Details: Could not connect to database")
    expect(formatted).toContain("Hint: Check connection string")
  })

  it("should format toString without optional fields", () => {
    const supabaseError: SupabaseErrorObject = {
      message: "simple error",
    }

    const error = new SupabaseError(supabaseError)
    const formatted = error.toString()

    expect(formatted).toBe("simple error")
    expect(formatted).not.toContain("Code")
    expect(formatted).not.toContain("Details")
    expect(formatted).not.toContain("Hint")
  })

  it("should handle SupabaseError name correctly", () => {
    const supabaseError: SupabaseErrorObject = {
      message: "test error",
      code: "12345",
    }

    const error = new SupabaseError(supabaseError)

    expect(error.name).toBe("SupabaseError")
  })

  it("should wrap Error instances while preserving message and stack", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message)
        this.name = "CustomError"
      }
    }

    const customError = new CustomError("custom message")
    customError.stack = "custom stack trace"
    const wrappedError = new SupabaseError(customError)

    expect(wrappedError.name).toBe("CustomError")
    expect(wrappedError.message).toBe("custom message")
    expect(wrappedError.stack).toBe("custom stack trace")
  })
})
