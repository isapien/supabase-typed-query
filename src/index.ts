/**
 * supabase-typed-query
 * Type-safe query builder and entity patterns for Supabase
 */

// Core types
export type {
  Database,
  EmptyObject,
  QueryBuilder,
  SupabaseClientType,
  TableInsert,
  TableNames,
  TableRow,
  TableUpdate,
} from "./types"

// Query exports
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
} from "./query"
export {
  addEntities,
  getEntities,
  getEntity,
  isMappedQuery,
  isQuery,
  query,
  updateEntities,
  updateEntity,
} from "./query"

// Entity exports
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
  WhereinParams,
  WhereParams,
} from "./entity"
export { Entity } from "./entity"

// Re-export functype utilities that are commonly used with this library
export type { FPromise, TaskOutcome } from "functype"
export { Err, List, Ok, Option } from "functype"
