import {
  Kind,
  TArray,
  TBoolean,
  TLiteral,
  TNumber,
  TObject,
  TOptional,
  TRecord,
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
  } & Record<`filter[${TFilterKeys}]`, TString | TNumber | TBoolean> &
    Record<`filter[${TFilterKeys}][${Operator}]`, TString | TNumber | TBoolean>
>;

export function querySchema<
  TSort extends string[],
  TFilter extends string,
  TInclude extends string,
>(opts: {
  sort: TSort;
  defaultSort?: TSort[number] | `-${TSort[number]}`;
  filters: Record<TFilter, TString | TNumber | TBoolean | typeof nullFilter>;
  include?: TInclude[];
  maxPageSize?: number;
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
      'page[size]': Type.Optional(
        Type.Integer({ minimum: 1, maximum: opts.maxPageSize ?? 100 }),
      ),
      'page[after]': Type.Optional(Type.String()),
      'page[before]': Type.Optional(Type.String()),
      include,
      ...withOps(opts.filters),
    },
    { additionalProperties: false },
  ) as unknown as QuerySchema<TSort, TFilter, TInclude>;

  return querySchema;
}

type WithOperators<TFilter extends string> = Record<
  `filter[${TFilter}]`,
  TSchema
> &
  Record<`filter[${TFilter}][${Operator}]`, TSchema>;

function withOps<TFilter extends string>(
  filters: Record<TFilter, TSchema>,
): WithOperators<TFilter> {
  const filtersWithOps = {} as Record<string, TSchema>;

  for (const [filterName, schema] of Object.entries(filters) as [
    TFilter,
    TSchema,
  ][]) {
    filtersWithOps[`filter[${filterName}]`] = schema;

    for (const operator of operators) {
      filtersWithOps[`filter[${filterName}][${operator}]`] = schema;
    }
  }

  return filtersWithOps;
}

interface TResourceObject {
  type: TLiteral<string>;
  id: TString | TNumber;
  attributes?: Record<string, TSchema>;
  relationships?: Record<
    string,
    | TObject<{
        data: TObject<{
          id: TString;
          type: TLiteral;
        }>;
        links?: TObject;
      }>
    | TObject<{
        data: TArray<
          TObject<{
            id: TString;
            type: TLiteral;
            links?: TObject;
          }>
        >;
        meta?: TRecord<TString>;
      }>
  >;
  links?: Record<string, string | null>;
}

function optionalObj(obj?: Record<string, TSchema>) {
  return obj ? Type.Object(obj) : Type.Optional(Type.Object({}));
}

export function objectResponseSchema({
  data,
  meta,
  relationships,
  included,
}: {
  data: Omit<TResourceObject, 'links'>; // Resource links can just go at the top level for object responses
  meta?: Record<string, TSchema>;
  relationships?: TResourceObject['relationships'];
  included?: TResourceObject[];
}) {
  const { id, type, attributes } = data;

  return Type.Object({
    jsonapi: Type.Object({
      profile: Type.Array(Type.String()),
      version: Type.Literal(JSONAPI_VERSION),
    }),
    data: Type.Object({
      id,
      type,
      attributes: Type.Object(attributes ?? {}),
      relationships: optionalObj(relationships),
    }),
    included: Type.Optional(
      Type.Intersect(
        (included ?? []).map((inc) => {
          return Type.Array(
            Type.Object({
              id: inc.id,
              type: inc.type,
              attributes: Type.Object(inc.attributes ?? {}),
              relationships: optionalObj(inc.relationships),
            }),
          );
        }),
      ),
    ),
    links: Type.Object({
      self: Type.String({ format: 'uri' }),
      related: Type.Optional(Type.String({ format: 'uri' })),
    }),
    meta: optionalObj(meta),
  });
}

export function listResponseSchema({
  data,
  meta,
  relationships,
  included,
}: {
  data: TResourceObject;
  meta?: Record<string, TSchema>;
  relationships?: TResourceObject['relationships'];
  included?: TResourceObject[];
}) {
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
    meta: Type.Object(meta ?? { count: Type.Integer() }),
    included: Type.Optional(
      Type.Intersect(
        (included ?? []).map((inc) => {
          return Type.Array(
            Type.Object({
              id: inc.id,
              type: inc.type,
              attributes: Type.Object(inc.attributes ?? {}),
              relationships: optionalObj(inc.relationships),
            }),
          );
        }),
      ),
    ),
    relationships: optionalObj(relationships),
    data: Type.Array(
      Type.Object({
        id: data.id,
        type: data.type,
        attributes: Type.Object(data.attributes ?? {}),
        relationships: optionalObj(data.relationships),
      }),
    ),
  });
}
