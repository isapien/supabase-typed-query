// test/integration/database-setup.ts
import type { SupabaseClientType } from "@/types"

import { createClient } from "@supabase/supabase-js"

export class DatabaseSetup {
  private client: SupabaseClientType | undefined

  /**
   * Initialize the test database connection
   * Supports both Supabase (local dev) and PostgREST (CI)
   */
  async initialize(): Promise<void> {
    const url = this.getTestDatabaseUrl()
    const key = this.getTestDatabaseKey()

    if (!url || !key) {
      throw new Error(
        "Integration test database credentials not found. " +
          "Please set TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY environment variables " +
          "for local development, or TEST_POSTGREST_URL and TEST_POSTGREST_ANON_KEY for CI.",
      )
    }

    console.log(`🔗 Integration tests using ${url?.includes("supabase") ? "Supabase" : "PostgREST"}`)

    // Create Supabase client
    this.client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }) as unknown as SupabaseClientType

    // Verify connection works
    await this.verifyConnection()
  }

  /**
   * Get the database client for tests
   */
  getClient(): SupabaseClientType {
    if (!this.client) {
      throw new Error("Database not initialized. Call initialize() first.")
    }
    return this.client
  }

  /**
   * Clean up test data and close connections
   */
  async cleanup(): Promise<void> {
    if (!this.client) return

    // Clean up test data in reverse dependency order
    await this.cleanupTestData()
  }

  /**
   * Clean up all test data from the database
   * This ensures tests start with a clean state
   * Deletes all records that match the test data pattern (test_* prefix)
   */
  async cleanupTestData(): Promise<void> {
    if (!this.client) return

    try {
      // Clean up test users (prefix: test_)
      const { error: usersError } = await this.client.from("users").delete().ilike("email", "test_%@example.com")

      if (usersError && (usersError as { code?: string }).code !== "PGRST116") {
        // PGRST116 = no rows to delete (not an error)
        console.warn("Warning: Could not clean users:", (usersError as { message?: string }).message)
      }

      // Clean up test posts (prefix: test_)
      const { error: postsError } = await this.client.from("posts").delete().ilike("title", "test_%")

      if (postsError && (postsError as { code?: string }).code !== "PGRST116") {
        console.warn("Warning: Could not clean posts:", (postsError as { message?: string }).message)
      }

      // Clean up test comments (prefix: test_)
      const { error: commentsError } = await this.client.from("comments").delete().ilike("text", "test_%")

      if (commentsError && (commentsError as { code?: string }).code !== "PGRST116") {
        console.warn("Warning: Could not clean comments:", (commentsError as { message?: string }).message)
      }
    } catch (error) {
      console.warn("Warning: Error during test data cleanup:", error)
    }
  }

  /**
   * Create test data for integration tests
   * Returns IDs of created test records for use in tests
   */
  async createTestData(): Promise<TestDataIds> {
    if (!this.client) {
      throw new Error("Database not initialized")
    }

    // Create test user
    const { data: users, error: userError } = await this.client
      .from("users")
      .insert({
        name: "Test User",
        email: "test_user@example.com",
        age: 30,
        active: true,
        role: "admin",
      })
      .select()

    if (userError || !users || !Array.isArray(users) || users.length === 0) {
      throw new Error(`Failed to create test user: ${(userError as { message?: string })?.message ?? "Unknown error"}`)
    }

    const testUserId = (users[0] as { id: string }).id

    // Create test post
    const { data: posts, error: postError } = await this.client
      .from("posts")
      .insert({
        title: "Test Post",
        content: "Test content for integration testing",
        author_id: testUserId,
        status: "published",
        view_count: 0,
      })
      .select()

    if (postError || !posts || !Array.isArray(posts) || posts.length === 0) {
      throw new Error(`Failed to create test post: ${(postError as { message?: string })?.message ?? "Unknown error"}`)
    }

    const testPostId = (posts[0] as { id: string }).id

    // Create test comment
    const { data: comments, error: commentError } = await this.client
      .from("comments")
      .insert({
        post_id: testPostId,
        user_id: testUserId,
        text: "Test comment",
      })
      .select()

    if (commentError || !comments || !Array.isArray(comments) || comments.length === 0) {
      throw new Error(
        `Failed to create test comment: ${(commentError as { message?: string })?.message ?? "Unknown error"}`,
      )
    }

    return {
      userId: testUserId,
      postId: testPostId,
      commentId: (comments[0] as { id: string }).id,
    }
  }

  private getTestDatabaseUrl(): string | undefined {
    return (
      // PostgREST for CI
      process.env.TEST_POSTGREST_URL ??
      // Supabase for local development
      process.env.TEST_SUPABASE_URL ??
      process.env.SUPABASE_TEST_URL
    )
  }

  private getTestDatabaseKey(): string | undefined {
    return (
      // PostgREST for CI
      process.env.TEST_POSTGREST_ANON_KEY ??
      // Supabase for local development
      process.env.TEST_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_TEST_ANON_KEY
    )
  }

  private async verifyConnection(): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized")
    }

    try {
      // Test database connection with a simple query
      // Most Supabase projects won't have this table, so we just test the connection works
      const { error } = await this.client.from("users").select("id").limit(1)

      if (error) {
        // If table doesn't exist (42P01), that's actually OK - connection works
        const errorCode = (error as { code?: string }).code
        const errorMessage = (error as { message?: string }).message
        if (errorCode === "42P01" || errorMessage?.includes("does not exist")) {
          console.log("✅ Database connection successful (schema may need setup)")
          return
        }
        throw new Error(`Database connection failed: ${errorMessage ?? "Unknown database error"}`)
      }

      console.log("✅ Database connection successful")
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Database connection failed:")) {
        throw error
      }
      throw new Error(`Database connection verification failed: ${error}`)
    }
  }
}

export type TestDataIds = {
  userId: string
  postId: string
  commentId: string
}
