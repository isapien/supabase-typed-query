import { vi } from "vitest"

import type { SupabaseClientType } from "@/types"

/**
 * Creates a type-safe mock Supabase client for unit tests
 * This mock simulates the Supabase query builder API without requiring a real database
 */
export function createMockSupabaseClient(mockData?: {
  data?: unknown
  error?: unknown
  count?: number | null
}): SupabaseClientType {
  const defaultResponse = {
    data: mockData?.data ?? null,
    error: mockData?.error ?? null,
    count: mockData?.count ?? null,
  }

  // Create a chainable query builder mock
  const createQueryBuilder = (response = defaultResponse) => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(response),
      then: vi.fn().mockImplementation((resolve) => {
        return Promise.resolve(response).then(resolve)
      }),
    }

    // Make it a thenable (Promise-like)
    Object.setPrototypeOf(builder, Promise.prototype)

    return builder
  }

  return {
    from: vi.fn().mockImplementation(() => createQueryBuilder()),
  } as unknown as SupabaseClientType
}

/**
 * Creates a mock client that returns specific data for testing
 */
export function createMockClientWithData<T>(data: T, error: unknown = null) {
  return createMockSupabaseClient({ data, error })
}

/**
 * Creates a mock client that returns an error for testing
 */
export function createMockClientWithError(error: unknown) {
  return createMockSupabaseClient({ data: null, error })
}

/**
 * Creates a typed mock function that preserves function signatures
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTypedMock<T extends (...args: any[]) => unknown>(
  implementation?: T,
): ReturnType<typeof vi.fn> & T {
  return vi.fn(implementation) as unknown as ReturnType<typeof vi.fn> & T
}
