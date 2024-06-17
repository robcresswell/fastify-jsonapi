import {
  Kind,
  TNumber,
  TObject,
  TOptional,
  TString,
  TUnsafe,
  Type,
  TypeRegistry,
} from '@fastify/type-provider-typebox';
import type { RemovePrefix } from './types.js';
import {
  extractPaginationOptsFromQuery,
  PaginationOpts,
  QueryPagination,
} from './pagination/index.js';
import {
  extractFiltersFromQuery,
  Filters,
  SupportedFilters,
} from './filters.js';

TypeRegistry.Set(
  'Sort',
  (schema: { type: 'string'; enum: string[] }, val: unknown) => {
    return typeof val === 'string' && schema.enum.includes(val);
  },
);

// Filter value is always string to account for values like 'gt(5)', where the
// comparison op is a string even though the value is a number
type QueryFilters<T extends string> = Record<`filter[${T}]`, string>;

export type Query<
  TSort extends string,
  TFilterKeys extends string,
> = QueryPagination<TSort> & QueryFilters<TFilterKeys>;

export function parseQuery<TSort extends string, TFilterKeys extends string>(
  query: Query<TSort, TFilterKeys>,
  supportedFilters: SupportedFilters<TFilterKeys> = {} as SupportedFilters<TFilterKeys>,
): {
  pagination: PaginationOpts<RemovePrefix<TSort, '-'>>;
  filters: Filters<TFilterKeys>;
} {
  const pagination = extractPaginationOptsFromQuery<TSort>(query);
  const filters = extractFiltersFromQuery(supportedFilters, query);

  return { pagination, filters };
}

type QuerySchema<TSort extends string[], TFilterKeys extends string> = TObject<
  {
    sort: TUnsafe<TSort[number] | `-${TSort[number]}`>;
    'page[size]': TOptional<TNumber>;
    'page[after]': TOptional<TString>;
    'page[before]': TOptional<TString>;
  } & { [k in TFilterKeys as `filter[${k}]`]: TString }
>;

export function buildQuerySchema<
  TSort extends string[],
  TFilterKeys extends string,
>(opts: { sort: TSort; filters: SupportedFilters<TFilterKeys> }) {
  const querySchema: QuerySchema<TSort, TFilterKeys> = Type.Object({
    sort: Type.Unsafe<TSort[number] | `-${TSort[number]}`>({
      [Kind]: 'Sort',
      type: 'string',
      enum: opts.sort.flatMap((value) => [value, `-${value}`]),
      default: opts.sort[0],
    }),
    'page[size]': Type.Optional(Type.Number({ min: 1 })),
    'page[after]': Type.Optional(Type.String()),
    'page[before]': Type.Optional(Type.String()),
    ...Object.fromEntries(
      Object.entries(opts.filters).map(([name, schema]) => {
        return [`filter[${name}]`, schema];
      }),
    ),
  }) as unknown as QuerySchema<TSort, TFilterKeys>;

  return { querySchema };
}
