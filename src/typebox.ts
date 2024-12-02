import {
  Kind,
  TArray,
  TLiteral,
  TNumber,
  TObject,
  TOptional,
  TSchema,
  TString,
  TUnion,
  TUnsafe,
  Type,
  TypeRegistry,
} from '@fastify/type-provider-typebox';
import { operators } from './querystring/filter.js';
import { JSONAPI_VERSION } from './constants.js';
import { Operator } from './types.js';

TypeRegistry.Set(
  'StringEnum',
  (schema: { type: 'string'; enum: string[] }, val: unknown) => {
    return typeof val === 'string' && schema.enum.includes(val);
  },
);

export function Nullable<T extends TSchema>(schema: T) {
  return Type.Union([schema, Type.Null()]);
}

export const nullFilter = Type.Literal('null');

type QuerySchema<
  TSort extends string[],
  TFilterKeys extends string,
  TInclude extends string,
> = TObject<
  {
    sort: TUnsafe<TSort[number] | `-${TSort[number]}`>;
    'page[size]': TOptional<TNumber>;
    'page[after]': TOptional<TString>;
    'page[before]': TOptional<TString>;
    include: TOptional<TArray<TUnion<TLiteral<TInclude>[]>>>;
  } & { [k in TFilterKeys as `filter[${k}]`]: TOptional<TString> } & {
    [k in TFilterKeys as `filter[${k}][${Operator}]`]: TOptional<TString>;
  }
>;

export function querySchema<
  TSort extends string[],
  TFilter extends string,
  TInclude extends string,
>(opts: {
  sort: TSort;
  defaultSort?: TSort[number] | `-${TSort[number]}`;
  filters: Record<TFilter, TSchema>;
  include?: TInclude[];
}) {
  const include = Type.Optional(
    Type.Unsafe<TInclude[number]>({
      [Kind]: 'StringEnum',
      type: 'string',
      enum: opts.include,
    }),
  );

  const sort = Type.Optional(
    Type.Unsafe<TSort[number] | `-${TSort[number]}`>({
      [Kind]: 'StringEnum',
      type: 'string',
      enum: opts.sort.flatMap((value) => [value, `-${value}`]),
      default: opts.defaultSort ?? opts.sort[0],
    }),
  );

  const querySchema = Type.Object(
    {
      sort,
      'page[size]': Type.Optional(Type.Number({ minimum: 1 })),
      'page[after]': Type.Optional(Type.String()),
      'page[before]': Type.Optional(Type.String()),
      include,
      ...Object.fromEntries(
        Object.entries(opts.filters).flatMap(appendOperatorToFilters),
      ),
    },
    { additionalProperties: false },
  ) as QuerySchema<TSort, TFilter, TInclude>;

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

export function listResponseSchema(opts: {
  data: TArray<TObject>;
  meta?: TObject;
  // relationships?: TObject;
  included?: TOptional<TArray<TObject>>;
}) {
  const {
    data,
    meta = Type.Record(Type.String(), Type.Unknown()),
    included = Type.Optional(Type.Never()),
  } = opts;

  return Type.Object({
    jsonapi: Type.Object({
      profile: Type.Array(Type.String()),
      version: Type.Literal(JSONAPI_VERSION),
    }),
    links: Type.Object({
      self: Type.String({ format: 'uri' }),
      next: Nullable(Type.String({ format: 'uri' })),
      prev: Nullable(Type.String({ format: 'uri' })),
    }),
    meta,
    included,
    // relationships: relationships ?? Type.Object({}),
    data,
  });
}
