import { addEntities, updateEntities, updateEntity } from "@/query"
import type { MultiExecution, Query, SingleExecution, WhereConditions } from "@/query/Query"
import { createQuery } from "@/query/QueryBuilder"
import type { EmptyObject, SupabaseClientType, TableInsert, TableNames, TableRow, TableUpdate } from "@/types"

import type { FPromise, List, TaskOutcome } from "functype"
import { Option } from "functype"

// Field-level type safety for queries
export type TypedRecord<T, V> = Partial<Record<keyof T, V>>

// Entity configuration
export type EntityConfig = {
  /** Soft delete filtering. true = exclude deleted items, false = include deleted items */
  softDelete: boolean
  /** Partition key for multi-tenant isolation. e.g., { tenant_id: "123" } */
  partitionKey?: Record<string, unknown>
}

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
      return taskResult.orThrow()
    },

    // Standard ExecutableQuery interface
    execute: () => promise,
    executeOrThrow: async (): Promise<List<T>> => {
      const taskResult = await promise
      return taskResult.orThrow()
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
      return taskResult.orThrow()
    },

    // Standard ExecutableQuery interface
    execute: () => promise.then((outcome: TaskOutcome<T>) => outcome.map((value: T) => Option(value))),
    executeOrThrow: async (): Promise<Option<T>> => {
      const taskResult = await promise
      const value = taskResult.orThrow()
      return Option(value)
    },
  })
  return result as MutationSingleExecution<T>
}

/**
 * Base interface for Entity instances
 */
export type IEntity<T extends TableNames> = {
  getItem(params: GetItemParams<TableRow<T>>): Query<T>
  getItems(params?: GetItemsParams<TableRow<T>>): Query<T>
  addItems(params: AddItemsParams<T>): MutationMultiExecution<TableRow<T>>
  updateItem(params: UpdateItemParams<T, TableRow<T>>): MutationSingleExecution<TableRow<T>>
  updateItems(params: UpdateItemsParams<T, TableRow<T>>): MutationMultiExecution<TableRow<T>>
}

/**
 * Creates an entity interface with methods for interacting with the given table.
 * @param client The Supabase client instance to use for queries.
 * @param name The name of the table to interact with.
 * @param config Configuration for entity behavior (required).
 * @returns An object with methods for interacting with the table.
 */
export const Entity = <T extends TableNames>(client: SupabaseClientType, name: T, config: EntityConfig): IEntity<T> => {
  type ROW = TableRow<T>

  const softDeleteMode = config.softDelete ? "exclude" : "include"

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
    const whereWithPartition = config.partitionKey ? { ...config.partitionKey, ...where, id } : { ...where, id }
    return createQuery(
      client,
      name,
      whereWithPartition as unknown as WhereConditions<TableRow<T>>,
      is,
      undefined,
      undefined,
      { mode: softDeleteMode, appliedByDefault: true },
    )
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
    const whereWithPartition = config.partitionKey ? { ...config.partitionKey, ...where } : where
    return createQuery(client, name, whereWithPartition as WhereConditions<TableRow<T>>, is, wherein, order, {
      mode: softDeleteMode,
      appliedByDefault: true,
    })
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
    getItem,
    getItems,
    addItems,
    updateItem,
    updateItems,
  }
}

/**
 * Type for an entity instance for a specific table
 * @deprecated Use IEntity<T> instead
 */
export type EntityType<T extends TableNames> = IEntity<T>
