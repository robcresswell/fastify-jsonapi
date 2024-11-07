import { Pagination } from '../types.js';
import { decodePageCursor } from '../encoding.js';
import { Operator, operators } from './filter.js';
import {
  InvalidFilterOperatorError,
  RangePaginationNotSupportedError,
} from '../errors.js';

type RemovePrefix<T extends string> = T extends `-${infer U}` ? U : T;

const filterKeyRegex = /filter\[(\w+)\](?:\[(\w+)?\])?/;

type Filters<TFilter extends string> = Record<
  TFilter,
  { field: TFilter; operator: string; value: string | number }
>;

type Query<TSort extends string, TFilter extends string> = {
  sort: TSort | `-${TSort}`;
  'page[size]'?: number;
  'page[after]'?: string;
  'page[before]'?: string;
} & {
  [k in TFilter as `filter[${k}]`]?: string | number;
} & {
  [k in TFilter as `filter[${k}][${Operator}]`]?: string | number;
};

export function parseQuery<TSort extends string, TFilter extends string>(
  query: Query<TSort, TFilter>,
): {
  pagination: Pagination<TSort>;
  filters: Filters<TFilter>;
} {
  if ('page[after]' in query && 'page[before]' in query) {
    throw new RangePaginationNotSupportedError();
  }

  const limit = query['page[size]'] ?? 1_000;

  const cursor =
    'page[after]' in query
      ? query['page[after]']
      : 'page[before]' in query
      ? query['page[before]']
      : undefined;

  // If we have a cursor, then we ignore any sort instructions and continue
  // paging with the cursor information
  if (cursor) {
    const { field, val, order } = decodePageCursor(cursor);

    return {
      pagination: {
        limit,
        field: field as RemovePrefix<TSort>,
        order,
        val,
      },
      filters: {} as Filters<TFilter>,
    };
  }

  const [field, order] = query.sort.startsWith('-')
    ? [query.sort.slice(1) as RemovePrefix<TSort>, 'desc' as const]
    : [query.sort as RemovePrefix<TSort>, 'asc' as const];

  const filters: Filters<TFilter> = {} as Filters<TFilter>;
  Object.entries(query).forEach(([queryKey, queryVal]) => {
    const regexpRes = filterKeyRegex.exec(queryKey);

    if (!regexpRes) return;

    const operator = regexpRes[2] ?? 'eq';
    if (!operators.includes(operator as Operator)) {
      throw new InvalidFilterOperatorError(operator, queryKey, queryVal);
    }

    const filterField = regexpRes[1] as TFilter | undefined;
    if (!filterField) return;

    filters[filterField] = {
      field: filterField,
      operator,
      value: queryVal,
    };
  });

  return {
    pagination: {
      field,
      order,
      limit,
    },
    filters,
  };
}
