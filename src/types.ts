/**
 * Core type definitions for supabase-typed-query
 */

// Database types placeholder - will be provided by consumer
export interface Database {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    }>
  }
}

// Table name types
export type TableNames = keyof Database["public"]["Tables"]
export type TableRow<T extends TableNames> = Database["public"]["Tables"][T]["Row"]
export type TableInsert<T extends TableNames> = Database["public"]["Tables"][T]["Insert"]
export type TableUpdate<T extends TableNames> = Database["public"]["Tables"][T]["Update"]

// Empty object type for optional parameters
export type EmptyObject = Record<string, never>

// Supabase client type (simplified for open source)
export interface SupabaseClientType {
  from: (table: string) => any
}