import { addEntities, query, updateEntities, updateEntity } from "@/query"
import type { MultiExecution, Query, SingleExecution, WhereConditions } from "@/query/Query"
import type { EmptyObject, SupabaseClientType, TableInsert, TableNames, TableRow, TableUpdate } from "@/types"

import type { FPromise, List, TaskOutcome } from "functype"
import { Option } from "functype"

// Field-level type safety for queries
export type TypedRecord<T, V> = Partial<Record<keyof T, V>>

// Base parameter types with field-level type safety
export type WhereParams<T extends object = EmptyObject> = {
  where?: WhereConditions<T>
}

export type IsParams<T extends object = EmptyObject> = {
  is?: TypedRecord<T, null | boolean>
}

export type WhereinParams<T extends object = EmptyObject> = {
  wherein?: TypedRecord<T, unknown[]>
}

export type OrderParams<T extends object = EmptyObject> = {
  order?: [keyof T & string, { ascending?: boolean; nullsFirst?: boolean }]
}

export type IdParam = {
  id: string
}

// Composable parameter types with field-level type safety
export type GetGlobalItemsParams<T extends object = EmptyObject> = WhereParams<T> &
  IsParams<T> &
  WhereinParams<T> &
  OrderParams<T>

export type AddGlobalItemsParams<T extends TableNames> = {
  items: TableInsert<T>[]
}

export type GetItemParams<T extends object = EmptyObject> = IdParam & WhereParams<T> & IsParams<T>

export type GetItemsParams<T extends object = EmptyObject> = WhereParams<T> &
  IsParams<T> &
  WhereinParams<T> &
  OrderParams<T>

export type AddItemsParams<T extends TableNames> = {
  items: TableInsert<T>[]
}

export type UpdateItemParams<T extends TableNames, Row extends object = EmptyObject> = IdParam & {
  item: TableUpdate<T>
} & WhereParams<Row> &
  IsParams<Row> &
  WhereinParams<Row>

export type UpdateItemsParams<T extends TableNames, Row extends object = EmptyObject> = {
  items: TableUpdate<T>[]
  identity?: (keyof Row & string) | (keyof Row & string)[]
} & WhereParams<Row> &
  IsParams<Row> &
  WhereinParams<Row>

// =============================================================================
// Mutation Query Wrappers for Consistent OrThrow Pattern
// =============================================================================

/**
 * Wrapper type for multi-result mutation operations that implements standard execution interface
 */
export type MutationMultiExecution<T> = FPromise<TaskOutcome<List<T>>> & MultiExecution<T>

/**
 * Wrapper type for single-result mutation operations that implements standard execution interface
 */
export type MutationSingleExecution<T> = FPromise<TaskOutcome<T>> & SingleExecution<T>

/**
 * Creates a multi-result mutation query that implements the standard execution interface
 */
export function MultiMutationQuery<T>(promise: FPromise<TaskOutcome<List<T>>>): MutationMultiExecution<T> {
  const result = Object.assign(promise, {
    // Standard MultiExecution interface
    many: () => promise,
    manyOrThrow: async (): Promise<List<T>> => {
      const taskResult = await promise
      return taskResult.getOrThrow()
    },

    // Standard ExecutableQuery interface
    execute: () => promise,
    executeOrThrow: async (): Promise<List<T>> => {
      const taskResult = await promise
      return taskResult.getOrThrow()
    },
  })
  return result as MutationMultiExecution<T>
}

/**
 * Creates a single-result mutation query that implements the standard execution interface
 */
export function SingleMutationQuery<T>(promise: FPromise<TaskOutcome<T>>): MutationSingleExecution<T> {
  const result = Object.assign(promise, {
    // Standard SingleExecution interface
    one: () => promise.then((outcome: TaskOutcome<T>) => outcome.map((value: T) => Option(value))),
    oneOrThrow: async (): Promise<T> => {
      const taskResult = await promise
      return taskResult.getOrThrow()
    },

    // Standard ExecutableQuery interface
    execute: () => promise.then((outcome: TaskOutcome<T>) => outcome.map((value: T) => Option(value))),
    executeOrThrow: async (): Promise<Option<T>> => {
      const taskResult = await promise
      const value = taskResult.getOrThrow()
      return Option(value)
    },
  })
  return result as MutationSingleExecution<T>
}

/**
 * Creates an entity interface with methods for interacting with the given table.
 * @param client The Supabase client instance to use for queries.
 * @param name The name of the table to interact with.
 * @returns An object with methods for interacting with the table.
 */
export const Entity = <T extends TableNames>(client: SupabaseClientType, name: T) => {
  type ROW = TableRow<T>

  /**
   * Retrieve all items from the given table, optionally filtered by conditions.
   * Returns a Query<T> that can be chained with OR conditions and functional operations.
   * @param {GetGlobalItemsParams<ROW>} [params] Parameters.
   * @param {TypedRecord<ROW, unknown>} [params.where] Conditions to filter by.
   * @param {TypedRecord<ROW, null | boolean>} [params.is] Additional conditions to filter by with IS.
   * @param {TypedRecord<ROW, unknown[]>} [params.wherein] WHERE IN conditions to filter by.
   * @param {[keyof ROW & string, { ascending?: boolean; nullsFirst?: boolean }]} [params.order] Optional ordering parameters.
   * @returns {Query<T>} A chainable query that can be executed with .one(), .many(), or .first()
   */
  function getGlobalItems({ where, is, wherein, order }: GetGlobalItemsParams<ROW> = {}): Query<T> {
    return query(client, name, where, is, wherein, order)
  }

  /**
   * Adds multiple items to the given table.
   * @param {AddGlobalItemsParams<T>} params Parameters.
   * @param {TableInsert<T>[]} params.items The items to add.
   * @returns {MutationMultiExecution<ROW>} A mutation query with consistent OrThrow methods.
   */
  function addGlobalItems({ items }: AddGlobalItemsParams<T>): MutationMultiExecution<ROW> {
    return MultiMutationQuery(addEntities(client, name, items))
  }

  /**
   * Retrieve a single item from the given table by ID.
   * Returns a Query<T> that can be chained with OR conditions and functional operations.
   * @param {GetItemParams<ROW>} params Parameters.
   * @param {string} params.id The ID of the item to retrieve.
   * @param {TypedRecord<ROW, unknown>} [params.where] Additional conditions to filter by.
   * @param {TypedRecord<ROW, null | boolean>} [params.is] IS conditions to filter by.
   * @returns {Query<T>} A chainable query that can be executed with .one(), .many(), or .first()
   */
  function getItem({ id, where, is }: GetItemParams<ROW>): Query<T> {
    return query(client, name, { ...where, id } as unknown as WhereConditions<TableRow<T>>, is)
  }

  /**
   * Get a list of items from the given table filtered by the given conditions.
   * Returns a Query<T> that can be chained with OR conditions and functional operations.
   * @param {GetItemsParams<ROW>} params Optional parameters.
   * @param {TypedRecord<ROW, unknown>} [params.where] Conditions to filter by.
   * @param {TypedRecord<ROW, null | boolean>} [params.is] IS conditions to filter by.
   * @param {TypedRecord<ROW, unknown[]>} [params.wherein] WHERE IN conditions to filter by.
   * @param {[keyof ROW & string, { ascending?: boolean; nullsFirst?: boolean }]} [params.order] Optional ordering parameters.
   * @returns {Query<T>} A chainable query that can be executed with .one(), .many(), or .first()
   */
  function getItems({ where, is, wherein, order }: GetItemsParams<ROW> = {}): Query<T> {
    return query(client, name, where as WhereConditions<TableRow<T>>, is, wherein, order)
  }

  /**
   * Adds multiple items to the given table.
   * @param {AddItemsParams<T>} params Parameters.
   * @param {TableInsert<T>[]} params.items The items to add.
   * @returns {MutationMultiExecution<ROW>} A mutation query with consistent OrThrow methods.
   */
  function addItems({ items }: AddItemsParams<T>): MutationMultiExecution<ROW> {
    return MultiMutationQuery(addEntities(client, name, items))
  }

  /**
   * Update a single item in the given table.
   * @param {UpdateItemParams<T, ROW>} params Parameters.
   * @param {string} params.id The ID of the item to update.
   * @param {Partial<TableUpdate<T>>} params.item The item to update.
   * @param {TypedRecord<ROW, unknown>} [params.where] Additional conditions to filter by.
   * @param {TypedRecord<ROW, null | boolean>} [params.is] IS conditions to filter by.
   * @param {TypedRecord<ROW, unknown[]>} [params.wherein] WHERE IN conditions to filter by.
   * @returns {MutationSingleExecution<ROW>} A mutation query with consistent OrThrow methods.
   */
  function updateItem({ id, item, where, is, wherein }: UpdateItemParams<T, ROW>): MutationSingleExecution<ROW> {
    return SingleMutationQuery(
      updateEntity(client, name, item, { ...where, id } as unknown as WhereConditions<TableRow<T>>, is, wherein),
    )
  }

  /**
   * Update multiple items in the given table.
   * @param {UpdateItemsParams<T, ROW>} params Parameters.
   * @param {TableUpdate<T>[]} params.items The items to update.
   * @param {keyof ROW & string | (keyof ROW & string)[]} [params.identity="id"] The column(s) to use as the identity.
   * @param {TypedRecord<ROW, unknown>} [params.where] Additional conditions to filter by.
   * @param {TypedRecord<ROW, null | boolean>} [params.is] IS conditions to filter by.
   * @param {TypedRecord<ROW, unknown[]>} [params.wherein] WHERE IN conditions to filter by.
   * @returns {MutationMultiExecution<ROW>} A mutation query with consistent OrThrow methods.
   */
  function updateItems({
    items,
    identity = "id" as keyof ROW & string,
    where,
    is,
    wherein,
  }: UpdateItemsParams<T, ROW>): MutationMultiExecution<ROW> {
    return MultiMutationQuery(updateEntities(client, name, items, identity, where, is, wherein))
  }

  return {
    getGlobalItems,
    addGlobalItems,
    getItem,
    getItems,
    addItems,
    updateItem,
    updateItems,
  }
}

/**
 * Type for an entity instance for a specific table
 */
export type EntityType<T extends TableNames> = ReturnType<typeof Entity<T>>
