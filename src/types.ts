export interface ResourceObject {
  type: string;
  id: string;
  attributes?: Record<string, unknown> & { id?: never };
  relationships?: Record<
    string,
    {
      data?:
        | Pick<ResourceObject, 'id' | 'type'>
        | Pick<ResourceObject, 'id' | 'type' | 'links'>[];
      links?: Record<string, string>;
    }
  >;
  links?: Record<string, string | null>;
  meta?: Record<string, unknown>;
}

type RemovePrefix<T extends string> = T extends `-${infer U}` ? U : T;

export interface Pagination<TSort extends string> {
  limit: number;
  field: RemovePrefix<TSort>;
  order: 'asc' | 'desc';
  val?: string;
}

// Use `| undefined` instead of `Partial<Record<...>>` because TS can't handle
// it well when using Object.values() etc.
// See https://stackoverflow.com/questions/73708429/why-do-object-values-for-a-partial-record-have-undefined-typings
export type Filters<TFilter extends string> = Record<
  TFilter,
  | {
      field: TFilter;
      operator: Operator;
      value: string | boolean | number | null;
    }
  | undefined
>;

export type Operator = 'eq' | 'gte' | 'gt' | 'lt' | 'lte' | 'ne';
