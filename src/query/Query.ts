import type { EmptyObject, TableNames, TableRow } from "@/types"

import type { Brand, FPromise, List, Option, TaskOutcome } from "functype"

// Comparison operators for advanced queries
export type ComparisonOperators<V> = {
  gte?: V // Greater than or equal
  gt?: V // Greater than
  lte?: V // Less than or equal
  lt?: V // Less than
  neq?: V // Not equal
  like?: string // LIKE pattern (for string fields)
  ilike?: string // Case-insensitive LIKE
  in?: V[] // IN array
  is?: null | boolean // IS NULL/TRUE/FALSE
}

// Type-safe WHERE conditions that provide IntelliSense for table columns
// Supports both direct values and operator objects for advanced queries
export type WhereConditions<T extends object> = Partial<{
  [K in keyof T]: T[K] | null | ComparisonOperators<T[K]>
}> & {
  // Special operators that work across columns with type-safe values
  gte?: Partial<{ [K in keyof T]?: T[K] }>
  gt?: Partial<{ [K in keyof T]?: T[K] }>
  lte?: Partial<{ [K in keyof T]?: T[K] }>
  lt?: Partial<{ [K in keyof T]?: T[K] }>
  neq?: Partial<{ [K in keyof T]?: T[K] }>
  like?: Partial<{ [K in keyof T]?: Extract<T[K], string> }>
  ilike?: Partial<{ [K in keyof T]?: Extract<T[K], string> }>
}

// Enhanced type for IS conditions with field-level type safety
export type IsConditions<T extends object = EmptyObject> = Partial<Record<keyof T, null | boolean>>

// Soft delete mode for controlling how deleted records are handled
export type SoftDeleteMode = "include" | "exclude" | "only"

// =============================================================================
// Standard Execution Interfaces for Consistent OrThrow Pattern
// =============================================================================

/**
 * Base execution interface that all database operations implement
 */
export interface ExecutableQuery<T> {
  // TaskOutcome version (for explicit error handling)
  execute(): FPromise<TaskOutcome<T>>

  // OrThrow version (for simple error handling)
  executeOrThrow(): Promise<T>
}

/**
 * Standard interface for operations that return a single result
 */
export interface SingleExecution<T> extends ExecutableQuery<Option<T>> {
  one(): FPromise<TaskOutcome<Option<T>>>
  oneOrThrow(): Promise<T>
}

/**
 * Standard interface for operations that return multiple results
 */
export interface MultiExecution<T> extends ExecutableQuery<List<T>> {
  many(): FPromise<TaskOutcome<List<T>>>
  manyOrThrow(): Promise<List<T>>
}

// Branded type support for query conditions
export type BrandedWhereParams<T extends object = EmptyObject> = {
  [K in keyof T]?: T[K] | unknown // Simplified to avoid complex conditional types
}

// Helper type for branded field values
export type BrandedFieldValue<T> = T extends Brand<string, infer BaseType> ? T | BaseType : T

// Core Query interface with branded type support
export interface Query<T extends TableNames> {
  // Execution methods - explicit about expected results
  one(): FPromise<TaskOutcome<Option<TableRow<T>>>>
  many(): FPromise<TaskOutcome<List<TableRow<T>>>>
  first(): FPromise<TaskOutcome<Option<TableRow<T>>>>

  // OrThrow methods - throw errors instead of returning TaskOutcome (v0.8.0+)
  oneOrThrow(): Promise<TableRow<T>>
  manyOrThrow(): Promise<List<TableRow<T>>>
  firstOrThrow(): Promise<TableRow<T>>

  // Query composition - chainable OR logic with type-safe where conditions
  or(where: WhereConditions<TableRow<T>>, is?: IsConditions<TableRow<T>>): Query<T>

  // Branded type-aware query methods (simplified)
  whereId<ID extends Brand<string, string>>(id: ID): Query<T>
  orWhereId<ID extends Brand<string, string>>(id: ID): Query<T>

  // Functional operations - maintain composability
  map<U>(fn: (item: TableRow<T>) => U): MappedQuery<U>
  filter(predicate: (item: TableRow<T>) => boolean): Query<T>

  // Pagination
  limit(count: number): Query<T>
  offset(count: number): Query<T>

  // Soft delete filtering
  includeDeleted(): Query<T>
  excludeDeleted(): Query<T>
  onlyDeleted(): Query<T>
}

// Mapped query for transformed results
export interface MappedQuery<U> {
  one(): FPromise<TaskOutcome<Option<U>>>
  many(): FPromise<TaskOutcome<List<U>>>
  first(): FPromise<TaskOutcome<Option<U>>>

  // OrThrow methods - throw errors instead of returning TaskOutcome (v0.8.0+)
  oneOrThrow(): Promise<U>
  manyOrThrow(): Promise<List<U>>
  firstOrThrow(): Promise<U>

  // Continue chaining
  map<V>(fn: (item: U) => V): MappedQuery<V>
  filter(predicate: (item: U) => boolean): MappedQuery<U>
}

// Query condition for internal state management with type-safe where
export interface QueryCondition<T extends TableNames> {
  where: WhereConditions<TableRow<T>>
  is?: IsConditions<TableRow<T>>
  wherein?: Partial<Record<keyof TableRow<T>, unknown[]>>
  // Comparison operators
  gt?: Partial<Record<keyof TableRow<T>, number | string | Date>>
  gte?: Partial<Record<keyof TableRow<T>, number | string | Date>>
  lt?: Partial<Record<keyof TableRow<T>, number | string | Date>>
  lte?: Partial<Record<keyof TableRow<T>, number | string | Date>>
  neq?: Partial<Record<keyof TableRow<T>, unknown>>
  // Pattern matching
  like?: Partial<Record<keyof TableRow<T>, string>>
  ilike?: Partial<Record<keyof TableRow<T>, string>>
}

// Entity-specific query interfaces for better type safety
export interface EntityQuery<T extends TableNames> extends Query<T> {
  // Entity-specific methods can be added here
  normalize(): NormalizedQuery<T>
}

export interface NormalizedQuery<T extends TableNames> {
  one(): FPromise<TaskOutcome<Option<TableRow<T>>>>
  many(): FPromise<TaskOutcome<List<TableRow<T>>>>
  first(): FPromise<TaskOutcome<Option<TableRow<T>>>>
}

// Type guards for runtime type checking
export const isQuery = <T extends TableNames>(obj: unknown): obj is Query<T> => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "one" in obj &&
    "many" in obj &&
    "first" in obj &&
    "or" in obj &&
    "map" in obj &&
    "filter" in obj
  )
}

export const isMappedQuery = <U>(obj: unknown): obj is MappedQuery<U> => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "one" in obj &&
    "many" in obj &&
    "first" in obj &&
    "map" in obj &&
    "filter" in obj
  )
}

// Utility types for query parameters with type safety
export type QueryWhereParams<T extends TableNames> = WhereConditions<TableRow<T>>
export type QueryIsParams<T extends TableNames> = IsConditions<TableRow<T>>
export type QueryWhereinParams<T extends TableNames> = Partial<Record<keyof TableRow<T>, unknown[]>>
export type QueryOrderParams<T extends TableNames> = [
  keyof TableRow<T> & string,
  { ascending?: boolean; nullsFirst?: boolean },
]

// Builder configuration for query construction
export interface QueryBuilderConfig<T extends TableNames> {
  table: T
  conditions: QueryCondition<T>[]
  order?: QueryOrderParams<T>
  mapFn?: (item: TableRow<T>) => unknown
  filterFn?: (item: TableRow<T>) => boolean
  limit?: number
  offset?: number
  softDeleteMode?: SoftDeleteMode
  softDeleteAppliedByDefault?: boolean
}
