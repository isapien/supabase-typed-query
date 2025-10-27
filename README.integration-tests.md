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

## Local Development Setup

### Option 1: Using Your Own Supabase Project (Recommended)

1. **Create a Supabase project** (or use existing one):
   - Go to [supabase.com](https://supabase.com)
   - Create a new project or select existing
   - Get your project URL and anon key from Project Settings > API

2. **Set up test schema** (optional - tests will skip if tables don't exist):

   ```sql
   -- Create test tables in your Supabase SQL editor
   CREATE TABLE IF NOT EXISTS users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     age INTEGER,
     active BOOLEAN DEFAULT true,
     role TEXT DEFAULT 'user',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     deleted TIMESTAMPTZ
   );

   CREATE TABLE IF NOT EXISTS posts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     content TEXT NOT NULL,
     author_id UUID REFERENCES users(id),
     status TEXT DEFAULT 'draft',
     view_count INTEGER DEFAULT 0,
     published_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     tenant_id UUID,
     deleted TIMESTAMPTZ
   );

   CREATE TABLE IF NOT EXISTS comments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     post_id UUID REFERENCES posts(id),
     user_id UUID REFERENCES users(id),
     text TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     deleted TIMESTAMPTZ
   );
   ```

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
