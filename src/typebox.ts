import {
  Kind,
  TLiteral,
  TNumber,
  TObject,
  TOptional,
  TSchema,
  TString,
  TUnsafe,
  Type,
  TypeRegistry,
} from '@fastify/type-provider-typebox';
import { operators } from './querystring/filter.js';
import { JSONAPI_VERSION } from './constants.js';

TypeRegistry.Set(
  'Sort',
  (schema: { type: 'string'; enum: string[] }, val: unknown) => {
    return typeof val === 'string' && schema.enum.includes(val);
  },
);

export function Nullable<T extends TSchema>(schema: T) {
  return Type.Union([schema, Type.Null()]);
}

type QuerySchema<TSort extends string[], TFilterKeys extends string> = TObject<
  {
    sort: TUnsafe<TSort[number] | `-${TSort[number]}`>;
    'page[size]': TOptional<TNumber>;
    'page[after]': TOptional<TString>;
    'page[before]': TOptional<TString>;
  } & { [k in TFilterKeys as `filter[${k}]`]: TString }
>;

export function querySchema<
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

export function objectResponseSchema<
  TType extends TLiteral,
  TAttributes extends TObject,
>({ type, attributes }: { type: TType; attributes: TAttributes }) {
  return Type.Object({
    jsonapi: Type.Object({
      version: Type.Literal(JSONAPI_VERSION),
    }),
    links: Type.Object({
      self: Type.String({ format: 'uri' }),
      next: Nullable(Type.String({ format: 'uri' })),
      prev: Nullable(Type.String({ format: 'uri' })),
    }),
    data: Type.Object({
      id: Type.String({ format: 'uuid' }),
      type,
      attributes,
    }),
  });
}

export function listResponseSchema<
  TType extends TLiteral,
  TAttributes extends TObject,
>({ type, attributes }: { type: TType; attributes: TAttributes }) {
  return Type.Object({
    jsonapi: Type.Object({
      version: Type.Literal(JSONAPI_VERSION),
    }),
    links: Type.Object({
      self: Type.String({ format: 'uri' }),
      next: Nullable(Type.String({ format: 'uri' })),
      prev: Nullable(Type.String({ format: 'uri' })),
    }),
    data: Type.Array(
      Type.Object({
        id: Type.String({ format: 'uuid' }),
        type,
        attributes,
      }),
    ),
  });
}
