/**
 * Augment the global Database interface with our test schema types
 * This file MUST be imported before using any query functions in integration tests
 */
import type { Database as TestDatabase } from "./database.types"

declare module "@/types" {
  // Replace the generic Database interface with our concrete test schema
  export interface Database {
    graphql_public: TestDatabase["graphql_public"]
    public: TestDatabase["public"]
  }
}
