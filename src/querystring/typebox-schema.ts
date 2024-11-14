import {
  Kind,
  TNumber,
  TObject,
  TOptional,
  TSchema,
  TString,
  TUnsafe,
  Type,
  TypeRegistry,
} from '@fastify/type-provider-typebox';
import { operators } from './filter.js';

TypeRegistry.Set(
  'Sort',
  (schema: { type: 'string'; enum: string[] }, val: unknown) => {
    return typeof val === 'string' && schema.enum.includes(val);
  },
);

type QuerySchema<TSort extends string[], TFilterKeys extends string> = TObject<
  {
    sort: TUnsafe<TSort[number] | `-${TSort[number]}`>;
    'page[size]': TOptional<TNumber>;
    'page[after]': TOptional<TString>;
    'page[before]': TOptional<TString>;
  } & { [k in TFilterKeys as `filter[${k}]`]: TString }
>;

export function buildTypeboxQuerySchema<
  TSort extends string[],
  TFilter extends string,
>(opts: { sort: TSort; filters: Record<TFilter, TSchema> }) {
  const querySchema = Type.Object({
    sort: Type.Optional(
      Type.Unsafe<TSort[number] | `-${TSort[number]}`>({
        [Kind]: 'Sort',
        type: 'string',
        enum: opts.sort.flatMap((value) => [value, `-${value}`]),
        default: opts.sort[0],
      }),
    ),
    'page[size]': Type.Optional(Type.Number({ min: 1 })),
    'page[after]': Type.Optional(Type.String()),
    'page[before]': Type.Optional(Type.String()),
    ...Object.fromEntries(
      Object.entries(opts.filters).flatMap(appendOperatorToFilters),
    ),
  }) as QuerySchema<TSort, TFilter>;

  return querySchema;
}

function appendOperatorToFilters([filterName, schema]: [
  filterName: string,
  schema: unknown,
]) {
  return [
    [`filter[${filterName}]`, schema],
    ...operators.map((operator) => [
      `filter[${filterName}][${operator}]`,
      schema,
    ]),
  ];
}
