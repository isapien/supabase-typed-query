# supabase-typed-query

Type-safe query builder and entity pattern for Supabase with TypeScript.

## Features

- 🔒 **Full TypeScript type safety** - Leverage your database types for compile-time safety
- 🔗 **Chainable query API** - Build complex queries with OR conditions and functional operations
- 🎯 **Entity pattern** - Consistent CRUD operations across all tables
- 🚀 **Functional programming** - Built with functype for robust error handling
- ⚡ **Zero runtime overhead** - All type checking happens at compile time
- 🔄 **Composable queries** - Mix and match conditions, filters, and transformations

## Installation

```bash
npm install supabase-typed-query functype
# or
pnpm add supabase-typed-query functype
# or
yarn add supabase-typed-query functype
```

## Quick Start

### 1. Set up your database types

First, generate your database types from Supabase:

```bash
npx supabase gen types typescript --project-id your-project-id > database.types.ts
```

### 2. Create a typed client

```typescript
import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

const supabase = createClient<Database>("your-supabase-url", "your-anon-key")
```

### 3. Use the Query Builder

```typescript
import { query } from "supabase-typed-query"

// Simple query
const user = await query(supabase, "users", { id: "123" }).one()

// Query with OR conditions
const posts = await query(supabase, "posts", { status: "published" }).or({ status: "draft", author_id: userId }).many()

// Query with functional operations
const titles = await query(supabase, "posts", { status: "published" })
  .map((post) => post.title)
  .filter((title) => title.length > 10)
  .many()
```

### 4. Use the Entity Pattern

```typescript
import { Entity } from "supabase-typed-query"

// Create an entity for your table
const PostEntity = Entity(supabase, "posts")

// Get all posts
const posts = await PostEntity.getGlobalItems({
  where: { status: "published" },
  order: ["created_at", { ascending: false }],
}).many()

// Get a single post
const post = await PostEntity.getItem({
  id: "post-123",
  where: { status: "published" },
}).one()

// Add posts
const newPosts = await PostEntity.addItems({
  items: [{ title: "New Post", content: "Content here", status: "draft" }],
}).execute()

// Update a post
const updated = await PostEntity.updateItem({
  id: "post-123",
  item: { status: "published" },
}).execute()
```

## Advanced Usage

### Comparison Operators

```typescript
// Greater than / Less than
const recentPosts = await query(supabase, "posts", {
  created_at: { gte: new Date("2024-01-01") },
}).many()

// Pattern matching
const searchResults = await query(supabase, "posts", {
  title: { ilike: "%typescript%" },
}).many()

// IN queries
const selectedPosts = await query(supabase, "posts", {
  id: { in: ["id1", "id2", "id3"] },
}).many()

// IS NULL checks
const drafts = await query(supabase, "posts", {
  published_at: { is: null },
}).many()
```

### Chaining OR Conditions

```typescript
const results = await query(supabase, "users", { role: "admin" })
  .or({ role: "moderator" })
  .or({ role: "editor", active: true })
  .many()
```

### Error Handling

The library uses functype's `TaskOutcome` for error handling:

```typescript
// Using TaskOutcome (recommended for explicit error handling)
const result = await query(supabase, "users", { id: userId }).one()

if (result.isOk()) {
  const maybeUser = result.get()
  if (maybeUser.isSome()) {
    console.log("User found:", maybeUser.get())
  }
} else {
  console.error("Query failed:", result.error)
}

// Using OrThrow methods (simpler but throws errors)
try {
  const user = await query(supabase, "users", { id: userId }).oneOrThrow()
  console.log("User:", user)
} catch (error) {
  console.error("Query failed:", error)
}
```

### Type Safety

All operations are fully type-safe based on your database schema:

```typescript
// TypeScript will enforce correct field names and types
const posts = await query(supabase, "posts", {
  // ✅ TypeScript knows these fields exist and their types
  title: "My Post",
  published: true,
  view_count: { gte: 100 },

  // ❌ TypeScript error: property doesn't exist
  nonexistent_field: "value",
}).many()
```

## API Reference

### Query Methods

- `one()` - Execute query expecting exactly one result
- `many()` - Execute query expecting zero or more results
- `first()` - Execute query expecting first result from potentially multiple
- `oneOrThrow()` - Like `one()` but throws if not found
- `manyOrThrow()` - Like `many()` but throws on error
- `firstOrThrow()` - Like `first()` but throws if not found

### Query Composition

- `or(conditions)` - Add OR conditions to the query
- `map(fn)` - Transform results with a mapping function
- `filter(fn)` - Filter results with a predicate
- `limit(n)` - Limit the number of results
- `offset(n)` - Skip the first n results

### Entity Methods

- `getGlobalItems(params)` - Get all items with optional filters
- `addGlobalItems({ items })` - Add multiple items
- `getItem({ id, where?, is? })` - Get a single item by ID
- `getItems(params)` - Get filtered items
- `addItems({ items })` - Add multiple items
- `updateItem({ id, item, where?, is? })` - Update a single item
- `updateItems({ items, identity?, where?, is? })` - Update multiple items

## Requirements

- TypeScript 5.0+
- Supabase JS Client v2
- functype 0.14+

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
