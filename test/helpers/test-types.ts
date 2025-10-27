/**
 * Test database schema types
 * These mock the structure of a typical Supabase database for testing
 */

export interface TestDatabase {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          age: number | null
          active: boolean
          role: "admin" | "user" | "moderator"
          created_at: string
          deleted: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          age?: number | null
          active?: boolean
          role?: "admin" | "user" | "moderator"
          created_at?: string
          deleted?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          age?: number | null
          active?: boolean
          role?: "admin" | "user" | "moderator"
          created_at?: string
          deleted?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          status: "draft" | "published" | "archived"
          view_count: number
          published_at: string | null
          created_at: string
          tenant_id: string | null
          deleted: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          status?: "draft" | "published" | "archived"
          view_count?: number
          published_at?: string | null
          created_at?: string
          tenant_id?: string | null
          deleted?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          status?: "draft" | "published" | "archived"
          view_count?: number
          published_at?: string | null
          created_at?: string
          tenant_id?: string | null
          deleted?: string | null
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          text: string
          created_at: string
          deleted: string | null
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          text: string
          created_at?: string
          deleted?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          text?: string
          created_at?: string
          deleted?: string | null
        }
      }
    }
  }
}

// Type helpers for tests
export type TestTableNames = keyof TestDatabase["public"]["Tables"]
export type TestTableRow<T extends TestTableNames> = TestDatabase["public"]["Tables"][T]["Row"]
export type TestTableInsert<T extends TestTableNames> = TestDatabase["public"]["Tables"][T]["Insert"]
export type TestTableUpdate<T extends TestTableNames> = TestDatabase["public"]["Tables"][T]["Update"]
