import { Filters, type Operator } from '../types.js';
import { decodePageCursor } from '../encoding.js';
import { operators } from './filter.js';
import {
  InvalidFilterForNullOrBoolFilterError,
  InvalidFilterOperatorError,
  RangePaginationNotSupportedError,
} from '../errors.js';

type RemovePrefix<T extends string> = T extends `-${infer U}` ? U : T;

const filterKeyRegex = /filter\[(\w+)\](?:\[(\w+)?\])?/;

export function isOperator(maybeOp: string): maybeOp is Operator {
  return operators.includes(maybeOp as Operator);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ExtractFieldName<T> = T extends `filter[${infer Field}]${infer _Rest}`
  ? Field
  : never;
type FilterKeys<T> = keyof T & `filter[${string}]${string}`;
type FilterFields<T> = ExtractFieldName<FilterKeys<T>>;

type ParsedFilters<T> = Filters<FilterFields<T>>;

export function extractFiltersFromQuery<T extends Record<string, unknown>>(
  query: T,
): ParsedFilters<T> {
  const filters = {} as ParsedFilters<T>;

  for (const [queryKey, queryVal] of Object.entries(query)) {
    const regexpRes = filterKeyRegex.exec(queryKey);
    if (!regexpRes) continue;

    const filterField = regexpRes[1] as ExtractFieldName<keyof T>;
    const operator = regexpRes[2] ?? 'eq';
    if (!isOperator(operator)) {
      throw new InvalidFilterOperatorError(
        operator,
        queryKey,
        queryVal as string,
      );
    }

    // If the filter value is a special case (true, false, null), then only
    // allow eq or ne comparisons
    const value = queryVal === 'null' ? null : queryVal;
    if (value === null || typeof value === 'boolean') {
      if (!['eq', 'ne'].includes(operator)) {
        throw new InvalidFilterForNullOrBoolFilterError(
          operator,
          queryKey,
          queryVal as string,
        );
      }

      filters[filterField] = {
        field: filterField,
        operator,
        value,
      };
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      filters[filterField] = {
        field: filterField,
        operator,
        value,
      };
    }
  }

  return filters;
}

interface Pagination<TSort extends string> {
  sort: TSort | `-${TSort}`;
  'page[size]'?: number;
  'page[after]'?: string;
  'page[before]'?: string;
}

export function extractPaginationFromQuery<TSort extends string>(
  query: Pagination<TSort>,
) {
  const after = query['page[after]'];
  const before = query['page[before]'];

  if (after && before) {
    throw new RangePaginationNotSupportedError();
  }

  const pageSize = query['page[size]'];
  const limit = pageSize ?? 100;

  const cursor = after ?? before;

  // If we have a cursor, then we ignore any sort instructions and continue
  // paging with the cursor information
  if (cursor) {
    const { field, val, order } = decodePageCursor(cursor);
    const cmp: 'lte' | 'gte' | 'lt' | 'gt' =
      order === 'asc' ? (after ? 'gte' : 'lt') : after ? 'lte' : 'gt';

    return {
      limit,
      field: field as RemovePrefix<TSort>,
      order,
      val,
      cmp,
    };
  }

  const [field, order] = query.sort.startsWith('-')
    ? [query.sort.slice(1) as RemovePrefix<TSort>, 'desc' as const]
    : [query.sort as TSort, 'asc' as const];

  return {
    field,
    order,
    limit,
  };
}
