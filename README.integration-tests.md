# Integration Tests

This document describes how to set up and run integration tests for supabase-typed-query.

## Overview

Integration tests verify that our library works correctly against a real Supabase database. We support two testing approaches:

- **Unit Tests**: Fast, mock-based tests that don't require a database (default for `pnpm test:unit`)
- **Integration Tests**: Real database tests that verify actual Supabase behavior (`pnpm test:integration`)

## Test Architecture

```
supabase-typed-query → Supabase Client → PostgreSQL/Supabase Database
```

## Test Coverage

The integration tests are organized into three main test suites with **65+ comprehensive tests**:

### Query API Tests (`Query.integration.spec.ts`)

- **Basic Query Execution** (6 tests): one(), many(), first(), oneOrThrow(), manyOrThrow(), firstOrThrow()
- **Comparison Operators** (8 tests): gt, gte, lt, lte, neq, in, is null, is true/false
- **Pattern Matching** (2 tests): like, ilike (case-insensitive)
- **OR Chaining** (3 tests): Single OR, multiple OR, OR with IS conditions
- **Functional Operations** (9 tests): map, chained map, filter, filter+map, limit, offset, pagination
- **Soft Delete Operations** (3 tests): includeDeleted(), excludeDeleted(), onlyDeleted()
- **Complex Query Chains** (2 tests): Combined operations, type safety

**Total**: ~33 Query API integration tests

### Entity API Tests (`Entity.integration.spec.ts`)

- **getGlobalItems()** (3 tests): Fetch all, with conditions, soft delete filtering
- **getItem()** (2 tests): Fetch by ID, not found handling
- **addItems()** (2 tests): Single insert, batch insert
- **updateItem()** (2 tests): Update by ID, non-existent item
- **deleteItem()** (2 tests): Hard delete, soft delete
- **deleteItems()** (1 test): Batch delete
- **OrThrow Variants** (6 tests): All \*OrThrow methods with success and error cases
- **Multi-tenancy** (1 test): Partition key support
- **Error Handling** (1 test): Database constraint violations

**Total**: ~20 Entity API integration tests

### Advanced Query Tests (`QueryAdvanced.integration.spec.ts`)

- **Complex Query Chains** (3 tests): OR+filter+map+limit, nested transformations, multiple conditions
- **Pagination Scenarios** (3 tests): Offset-based pagination, limit only, offset only
- **Concurrent Query Execution** (2 tests): Multiple concurrent queries, concurrent map operations
- **Edge Cases** (4 tests): Empty results, long OR chains, no matches, null comparisons
- **Performance Characteristics** (2 tests): Large result sets, multiple filters
- **Type Safety** (2 tests): Types through complex chains, nested transformations
- **Real-world Scenarios** (3 tests): Recent posts query, admin emails, paginated search

**Total**: ~19 Advanced integration tests

### Helper Utilities (`database-setup.ts`)

- Connection management (Supabase/PostgREST)
- Test data creation (single/batch)
- Soft delete test data generation
- Automatic cleanup with test\_ prefix pattern

## Local Development Setup

### Option 1: Using Your Own Supabase Project (Recommended)

1. **Create a Supabase project** (or use existing one):
   - Go to [supabase.com](https://supabase.com)
   - Create a new project or select existing
   - Get your project URL and anon key from Project Settings > API

2. **Set up test schema**:

   The integration tests require specific tables in your database. We provide a complete SQL schema file:

   **Option A: Using the provided schema file**

   ```bash
   # Copy the SQL schema from test/integration/schema.sql
   # and run it in your Supabase SQL editor
   cat test/integration/schema.sql
   ```

   **Option B: Run the SQL directly**

   ```sql
   -- Create test tables in your Supabase SQL editor
   -- See test/integration/schema.sql for the complete schema

   -- Users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     age INTEGER,
     active BOOLEAN DEFAULT true,
     role TEXT,
     created_at TIMESTAMPTZ DEFAULT now(),
     deleted TIMESTAMPTZ  -- Soft delete column
   );

   -- Posts table
   CREATE TABLE posts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     content TEXT,
     author_id UUID REFERENCES users(id) ON DELETE CASCADE,
     status TEXT,
     view_count INTEGER DEFAULT 0,
     published_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT now(),
     deleted TIMESTAMPTZ  -- Soft delete column
   );

   -- Comments table
   CREATE TABLE comments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     text TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now(),
     deleted TIMESTAMPTZ  -- Soft delete column
   );

   -- Create indexes for better query performance
   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
   CREATE INDEX IF NOT EXISTS idx_users_active ON users(active) WHERE deleted IS NULL;
   CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
   CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status) WHERE deleted IS NULL;
   CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
   CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
   ```

   > **Note**: The complete schema with indexes and seed data is available in `test/integration/schema.sql`

3. **Configure environment variables**:

   ```bash
   cp .env.integration.example .env.integration
   # Edit .env.integration with your Supabase credentials:
   TEST_SUPABASE_URL=https://your-project-ref.supabase.co
   TEST_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run integration tests**:
   ```bash
   pnpm test:integration           # Run once
   pnpm test:integration:watch     # Watch mode
   pnpm test:integration:coverage  # With coverage
   ```

### Option 2: Using Supabase CLI (Local)

1. **Install Supabase CLI**:

   ```bash
   npm install -g supabase
   ```

2. **Start local Supabase**:

   ```bash
   supabase start
   ```

3. **Configure for local Supabase**:

   ```bash
   # .env.integration
   TEST_SUPABASE_URL=http://localhost:54321
   TEST_SUPABASE_ANON_KEY=your-local-anon-key  # From supabase start output
   ```

4. **Run tests**:
   ```bash
   pnpm test:integration
   ```

## Available Test Scripts

```json
{
  "test": "Run all unit tests (no database required)",
  "test:watch": "Run unit tests in watch mode",
  "test:unit": "Run unit tests only",
  "test:unit:watch": "Run unit tests in watch mode",
  "test:unit:coverage": "Run unit tests with coverage",
  "test:integration": "Run integration tests (requires database)",
  "test:integration:watch": "Run integration tests in watch mode",
  "test:integration:coverage": "Run integration tests with coverage",
  "test:ci": "Run both unit and integration tests"
}
```

## Environment Variables

### Integration Tests

- `TEST_SUPABASE_URL` - Your Supabase project URL
- `TEST_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `TEST_POSTGREST_URL` - Alternative: Direct PostgREST endpoint (for CI)
- `TEST_POSTGREST_ANON_KEY` - Alternative: JWT token for PostgREST

### Legacy Support

These environment variables are also supported for backwards compatibility:

- `SUPABASE_TEST_URL`
- `SUPABASE_TEST_ANON_KEY`

## Writing Integration Tests

Integration tests should be placed in `test/integration/` with the `.integration.spec.ts` suffix:

```typescript
// test/integration/MyFeature.integration.spec.ts
import { beforeAll, describe, expect, it } from "vitest"
import { DatabaseSetup } from "./database-setup"

describe("My Feature Integration Tests", () => {
  const dbSetup = new DatabaseSetup()

  beforeAll(async () => {
    await dbSetup.initialize()
    await dbSetup.cleanupTestData()
  })

  it("should test my feature", async () => {
    const client = dbSetup.getClient()

    // Create test data
    const testData = await dbSetup.createTestData()

    // Test your feature using the query builder
    const { data, error } = await client.from("users").select("*").eq("id", testData.userId)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
})
```

## Best Practices

1. **Use DatabaseSetup**: Always use the `DatabaseSetup` class for consistent database initialization and cleanup

2. **Clean Test Data**: Use test data prefixed with `test_` for easy cleanup:

   ```typescript
   email: "test_user@example.com"
   title: "test_my_feature"
   ```

3. **Deterministic Tests**: Avoid relying on existing database state - create your own test data

4. **Sequential Execution**: Integration tests run sequentially to avoid database conflicts

5. **Error Handling**: Always check for both `error` and `data` in responses:

   ```typescript
   const { data, error } = await client.from("table").select("*")
   expect(error).toBeNull()
   expect(data).toBeDefined()
   ```

6. **Cleanup**: The `DatabaseSetup` class automatically cleans up test data before each run

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test:unit

      - name: Run integration tests
        env:
          TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          TEST_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
        run: pnpm test:integration
```

Add your Supabase credentials as GitHub secrets:

- `TEST_SUPABASE_URL`
- `TEST_SUPABASE_ANON_KEY`

## Troubleshooting

### "Database connection failed"

- Verify your `TEST_SUPABASE_URL` and `TEST_SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active and accessible
- Ensure you're using the correct URL format: `https://your-project.supabase.co`

### "Table does not exist" errors

- Integration tests will skip gracefully if tables don't exist
- To run full integration tests, create the test schema (see setup instructions above)
- Alternatively, adjust tests to use your own database schema

### Tests failing intermittently

- Integration tests run sequentially to avoid conflicts
- If tests fail intermittently, check for leftover test data
- Run cleanup manually: Create a test file that calls `dbSetup.cleanupTestData()`

### "No environment variables" warning

- Create `.env.integration` file with your credentials
- Ensure the file is in the project root directory
- Check that file is not ignored by git (it should be in `.gitignore`)

## Performance

- **Unit Tests**: Very fast (~10-50ms per test) - no database required
- **Integration Tests**: Moderate (~100-500ms per test) - requires database connection

Unit tests should always be preferred for fast feedback. Use integration tests to verify actual database behavior and catch issues that mocks might miss.

## Security

- **Never commit** `.env.integration` or `.env.test` files to git
- Use separate Supabase projects for testing vs production
- Consider using Row Level Security (RLS) even for test projects
- Rotate anon keys periodically for test projects
