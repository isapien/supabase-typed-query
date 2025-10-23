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
  QueryIsParams,
  QueryOrderParams,
  QueryWhereinParams,
  QueryWhereParams,
  SingleExecution,
  SoftDeleteMode,
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
  EntityConfig,
  EntityType,
  GetGlobalItemsParams,
  GetItemParams,
  GetItemsParams,
  IdParam,
  IEntity,
  IsParams,
  MutationMultiExecution,
  MutationSingleExecution,
  OrderParams,
  TypedRecord,
  UpdateItemParams,
  UpdateItemsParams,
  WhereinParams,
  WhereParams,
} from "./entity"
export { Entity, MultiMutationQuery, SingleMutationQuery } from "./entity"

// Re-export functype utilities that are commonly used with this library
export type { FPromise, TaskOutcome } from "functype"
export { Err, List, Ok, Option } from "functype"

// Error utilities
export type { SupabaseErrorObject } from "./utils/errors"
export { SupabaseError, toError } from "./utils/errors"
