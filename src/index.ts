/**
 * supabase-typed-query
 * Type-safe query builder and entity patterns for Supabase
 */

// Core types
export type {
  Database,
  EmptyObject,
  SupabaseClientType,
  TableInsert,
  TableNames,
  TableRow,
  TableUpdate,
} from "./types"

// Query exports
export {
  addEntities,
  getEntities,
  getEntity,
  query,
  updateEntities,
  updateEntity,
} from "./query"

export type {
  ComparisonOperators,
  EntityQuery,
  ExecutableQuery,
  IsConditions,
  MappedQuery,
  MultiExecution,
  Query,
  QueryCondition,
  SingleExecution,
  WhereConditions,
} from "./query"

// Entity exports
export { Entity } from "./entity"

export type {
  AddGlobalItemsParams,
  AddItemsParams,
  EntityType,
  GetGlobalItemsParams,
  GetItemParams,
  GetItemsParams,
  IdParam,
  IsParams,
  OrderParams,
  TypedRecord,
  UpdateItemParams,
  UpdateItemsParams,
  WhereParams,
  WhereinParams,
} from "./entity"

// Re-export functype utilities that are commonly used with this library
export { Err, List, Ok, Option } from "functype"
export type { FPromise, TaskOutcome } from "functype"