/**
 * Core type definitions for supabase-typed-query
 */

// Database types placeholder - will be provided by consumer
export interface Database {
  public: {
    Tables: Record<
      string,
      {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    >
  }
}

// Table name types
export type TableNames = keyof Database["public"]["Tables"]
export type TableRow<T extends TableNames> = Database["public"]["Tables"][T]["Row"]
export type TableInsert<T extends TableNames> = Database["public"]["Tables"][T]["Insert"]
export type TableUpdate<T extends TableNames> = Database["public"]["Tables"][T]["Update"]

// Empty object type for optional parameters
export type EmptyObject = Record<string, never>

// Query builder interface that Supabase returns from .from()
export interface QueryBuilder extends Promise<{ data: unknown; error: unknown }> {
  select: (columns?: string) => QueryBuilder
  insert: (data: unknown) => QueryBuilder
  update: (data: unknown) => QueryBuilder
  upsert: (data: unknown, options?: { onConflict?: string }) => QueryBuilder
  delete: () => QueryBuilder
  match: (query: Record<string, unknown>) => QueryBuilder
  eq: (column: string, value: unknown) => QueryBuilder
  neq: (column: string, value: unknown) => QueryBuilder
  gt: (column: string, value: unknown) => QueryBuilder
  gte: (column: string, value: unknown) => QueryBuilder
  lt: (column: string, value: unknown) => QueryBuilder
  lte: (column: string, value: unknown) => QueryBuilder
  like: (column: string, pattern: string) => QueryBuilder
  ilike: (column: string, pattern: string) => QueryBuilder
  is: (column: string, value: boolean | null) => QueryBuilder
  in: (column: string, values: unknown[]) => QueryBuilder
  or: (filters: string) => QueryBuilder
  single: () => QueryBuilder
  limit: (count: number) => QueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder
}

// Supabase client type (simplified for open source)
export interface SupabaseClientType {
  from: (table: string) => QueryBuilder
}
