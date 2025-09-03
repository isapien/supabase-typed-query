import type { FPromise, TaskOutcome } from "functype"
import { Err, List, Ok } from "functype"

import type { EmptyObject, SupabaseClientType, TableInsert, TableNames, TableRow, TableUpdate } from "@/types"

import type { Query, WhereConditions } from "./Query"
import { createQuery } from "./QueryBuilder"

// Re-export query types
export type {
  ComparisonOperators,
  EntityQuery,
  ExecutableQuery,
  IsConditions,
  MappedQuery,
  MultiExecution,
  Query,
  QueryBuilderConfig,
  QueryCondition,
  SingleExecution,
  WhereConditions,
} from "./Query"

// Re-export type guards
export { isMappedQuery, isQuery } from "./Query"

// Local type for IS conditions
type IsConditionsLocal<T extends object = EmptyObject> = Partial<Record<keyof T, null | boolean>>

// Helper to wrap async operations with error handling
const wrapAsync = <T>(fn: () => Promise<TaskOutcome<T>>): FPromise<TaskOutcome<T>> => {
  return fn() as unknown as FPromise<TaskOutcome<T>>
}

/**
 * Retrieves a single entity from the specified table.
 * @template T - The table name
 * @param client - The Supabase client instance
 * @param table - The table to query
 * @param where - Conditions to filter by
 * @param is - IS conditions to filter by
 * @returns A promise resolving to the entity if found
 */
export const getEntity = <T extends TableNames>(
  client: SupabaseClientType,
  table: T,
  where: WhereConditions<TableRow<T>>,
  is?: IsConditionsLocal<TableRow<T>>,
): FPromise<TaskOutcome<TableRow<T>>> =>
  wrapAsync(async () => {
    try {
      const baseQuery = client.from(table).select("*").match(where)

      const queryWithIs = is
        ? List(Object.entries(is)).foldLeft(baseQuery)((query, [column, value]) =>
            query.is(column as keyof TableRow<T> & string, value as boolean | null),
          )
        : baseQuery

      const { data, error } = await queryWithIs.single()

      if (error) {
        return Err<TableRow<T>>(error)
      }

      return Ok(data as TableRow<T>)
    } catch (error) {
      return Err<TableRow<T>>(error as Error)
    }
  })

/**
 * Retrieves multiple entities from the specified table.
 * @template T - The table name
 * @param client - The Supabase client instance
 * @param table - The table to query
 * @param where - Conditions to filter by
 * @param is - IS conditions to filter by
 * @param wherein - WHERE IN conditions to filter by
 * @param order - Optional ordering parameters
 * @returns A promise resolving to the entities if found
 */
export const getEntities = <T extends TableNames>(
  client: SupabaseClientType,
  table: T,
  where: WhereConditions<TableRow<T>> = {},
  is?: IsConditionsLocal<TableRow<T>>,
  wherein?: Partial<Record<keyof TableRow<T>, unknown[]>>,
  order: [keyof TableRow<T> & string, { ascending?: boolean; nullsFirst?: boolean }] = [
    "id" as keyof TableRow<T> & string,
    { ascending: true },
  ],
): FPromise<TaskOutcome<List<TableRow<T>>>> =>
  wrapAsync(async () => {
    try {
      const baseQuery = client.from(table).select("*").match(where)

      const queryWithIn = wherein
        ? List(Object.entries(wherein)).foldLeft(baseQuery)((query, [column, values]) =>
            query.in(column, values as never),
          )
        : baseQuery

      const queryWithIs = is
        ? List(Object.entries(is)).foldLeft(queryWithIn)((query, [column, value]) =>
            query.is(column as keyof TableRow<T> & string, value as boolean | null),
          )
        : queryWithIn

      const queryOrderBy = queryWithIs.order(order[0], order[1])

      const { data, error } = await queryOrderBy

      if (error) {
        return Err<List<TableRow<T>>>(error as Error)
      }

      return Ok(List(data as TableRow<T>[]))
    } catch (error) {
      return Err<List<TableRow<T>>>(error as Error)
    }
  })

/**
 * Adds multiple entities to the specified table.
 * @template T - The table name
 * @param client - The Supabase client instance
 * @param table - The table to insert into
 * @param entities - The entities to add
 * @returns A promise resolving to the added entities
 */
export const addEntities = <T extends TableNames>(
  client: SupabaseClientType,
  table: T,
  entities: TableInsert<T>[],
): FPromise<TaskOutcome<List<TableRow<T>>>> =>
  wrapAsync(async () => {
    try {
      const { data, error } = await client
        .from(table)
        .insert(entities as never)
        .select()

      if (error) {
        return Err<List<TableRow<T>>>(error as Error)
      }

      return Ok(List(data as unknown as TableRow<T>[]))
    } catch (error) {
      return Err<List<TableRow<T>>>(error as Error)
    }
  })

/**
 * Updates a single entity in the specified table.
 * @template T - The table name
 * @param client - The Supabase client instance
 * @param table - The table to update
 * @param entities - The entity data to update
 * @param where - Conditions to filter by
 * @param is - IS conditions to filter by
 * @param wherein - WHERE IN conditions to filter by
 * @returns A promise resolving to the updated entity
 */
export const updateEntity = <T extends TableNames>(
  client: SupabaseClientType,
  table: T,
  entities: TableUpdate<T>,
  where: WhereConditions<TableRow<T>>,
  is?: IsConditionsLocal<TableRow<T>>,
  wherein?: Partial<Record<keyof TableRow<T>, unknown[]>>,
): FPromise<TaskOutcome<TableRow<T>>> =>
  wrapAsync(async () => {
    try {
      const baseQuery = client
        .from(table)
        .update(entities as never)
        .match(where)

      const queryWithIn = wherein
        ? List(Object.entries(wherein)).foldLeft(baseQuery)((query, [column, values]) =>
            query.in(column, values as never),
          )
        : baseQuery

      const queryWithIs = is
        ? List(Object.entries(is)).foldLeft(queryWithIn)((query, [column, value]) =>
            query.is(column as keyof TableRow<T> & string, value as boolean | null),
          )
        : queryWithIn

      const { data, error } = await queryWithIs.select().single()

      if (error) {
        return Err<TableRow<T>>(error)
      }

      return Ok(data as TableRow<T>)
    } catch (error) {
      return Err<TableRow<T>>(error as Error)
    }
  })

/**
 * Updates multiple entities in the specified table.
 * @template T - The table name
 * @param client - The Supabase client instance
 * @param table - The table to update
 * @param entities - The entities to update
 * @param identity - The column(s) to use as the identity
 * @param where - Conditions to filter by
 * @param is - IS conditions to filter by
 * @param wherein - WHERE IN conditions to filter by
 * @returns A promise resolving to the updated entities
 */
export const updateEntities = <T extends TableNames>(
  client: SupabaseClientType,
  table: T,
  entities: TableUpdate<T>[],
  identity: (keyof TableRow<T> & string) | (keyof TableRow<T> & string)[] = "id" as keyof TableRow<T> & string,
  where?: WhereConditions<TableRow<T>>,
  is?: IsConditionsLocal<TableRow<T>>,
  wherein?: Partial<Record<keyof TableRow<T>, unknown[]>>,
): FPromise<TaskOutcome<List<TableRow<T>>>> =>
  wrapAsync(async () => {
    try {
      const onConflict = Array.isArray(identity) ? identity.join(",") : identity

      const baseQuery = client
        .from(table)
        .upsert(entities as never, { onConflict })
        .match(where ?? {})

      const queryWithIn = wherein
        ? List(Object.entries(wherein)).foldLeft(baseQuery)((query, [column, values]) =>
            query.in(column, values as never),
          )
        : baseQuery

      const queryWithIs = is
        ? List(Object.entries(is)).foldLeft(queryWithIn)((query, [column, value]) =>
            query.is(column as keyof TableRow<T> & string, value as boolean | null),
          )
        : queryWithIn

      const { data, error } = await queryWithIs.select()

      if (error) {
        return Err<List<TableRow<T>>>(error as Error)
      }

      return Ok(List(data as TableRow<T>[]))
    } catch (error) {
      return Err<List<TableRow<T>>>(error as Error)
    }
  })

/**
 * Creates a new Query for the specified table with initial conditions.
 * This is the new Query-based API that supports OR chaining and functional operations.
 *
 * @template T - The table name
 * @param client - The Supabase client instance
 * @param table - The table to query
 * @param where - Initial WHERE conditions to filter by
 * @param is - Initial IS conditions to filter by
 * @param wherein - Initial WHERE IN conditions to filter by
 * @param order - Optional ordering parameters
 * @returns A Query<T> instance that supports chaining and lazy evaluation
 *
 * @example
 * // Simple query
 * const user = await query(client, "users", { id: "123" }).one()
 *
 * @example
 * // Query with OR logic
 * const users = await query(client, "users", { role: "admin" })
 *   .or({ role: "moderator" })
 *   .many()
 *
 * @example
 * // Query with functional operations
 * const names = await query(client, "users", { active: true })
 *   .map(user => user.name)
 *   .filter(name => name.startsWith('A'))
 *   .many()
 */
export const query = <T extends TableNames>(
  client: SupabaseClientType,
  table: T,
  where: WhereConditions<TableRow<T>> = {},
  is?: IsConditionsLocal<TableRow<T>>,
  wherein?: Partial<Record<keyof TableRow<T>, unknown[]>>,
  order?: [keyof TableRow<T> & string, { ascending?: boolean; nullsFirst?: boolean }],
): Query<T> => {
  return createQuery(client, table, where, is, wherein, order)
}
