import { TSchema } from '@fastify/type-provider-typebox';
import { Value } from '@sinclair/typebox/value';

export type Operator = 'eq' | 'gte' | 'gt' | 'lt' | 'lte' | 'ne';
const operators: Operator[] = ['eq', 'gte', 'gt', 'lt', 'lte', 'ne'];

export type SupportedFilters<T extends string> = Record<T, TSchema>;

export type Filters<T extends string> = Record<
  T,
  {
    field: T;
    operator: Operator;
    value: unknown;
  }
>;

const filterValRegex = /(eq|gte|gt|lt|lte|ne)\(([\w-_:.]+)\)/;

/**
 * Convert validated querystring into a list of filters
 *
 * @example
 * extractFiltersFromQuery({
 *   team: { schema: Type.String() },
 *   age: { schema: Type.Number() }
 * },
 * {
 *   'filter[team]': 'foo',
 *   'filter[age]': 'gt(25)',
 * });
 *
 * // returns
 * [
 *   { field: 'team', operator: 'eq', value: 'foo' },
 *   { field: 'age', operator: 'gt', value: 25 }
 * ]
 */
export function extractFiltersFromQuery<TFilter extends string>(
  supportedFilters: Record<TFilter, TSchema>,
  query: unknown,
): Filters<TFilter> {
  const providedFilters: Filters<TFilter> = {} as Filters<TFilter>;

  if (typeof query !== 'object' || query === null) {
    return {} as Filters<TFilter>;
  }

  const namespacedFilters = Object.keys(supportedFilters).map(
    (f) => `filter[${f}]`,
  );

  Object.entries(query).forEach(([queryKey, queryVal]) => {
    // At this point a filter value should always be a string, because we wrap
    // them with comparisons like `gt(25)` or `eq(robcresswell)`
    if (typeof queryVal !== 'string') {
      return;
    }
    if (!namespacedFilters.includes(queryKey)) {
      return;
    }

    // Remove the 'filter[' prefix and ']' suffix that represent the filter
    // namespace in the JSON:API querystring
    const field = queryKey.slice(7, -1) as TFilter;

    const schema = supportedFilters[field];

    // if the filter value doesn't contain parens, it's a simple equality filter
    // i.e. filter[name]=foo or filter[id]=5
    if (!(queryVal.includes('(') && queryVal.includes(')'))) {
      const convertedVal = Value.Convert(schema, queryVal);
      if (Value.Check(schema, convertedVal)) {
        providedFilters[field] = {
          field,
          operator: 'eq',
          value: convertedVal,
        };

        return;
      }
    }

    const valMatch = filterValRegex.exec(queryVal);
    if (!valMatch) {
      throw new Error(
        `Invalid value '${queryVal}' in filter '${queryKey}=${queryVal}'. Values should be in the format $OP(value), where $OP is one of '${operators.join(
          "', '",
        )}'`,
      );
    }

    const value = valMatch[2];
    if (!field || !value) {
      throw new Error(`Invalid filter: ${queryKey}=${queryVal}`);
    }

    const operator = valMatch[1] as Operator;

    const convertedVal = Value.Convert(schema, value);
    if (Value.Check(schema, convertedVal)) {
      providedFilters[field] = {
        field,
        operator,
        value: convertedVal,
      };
      return;
    }
  });

  return providedFilters;
}
