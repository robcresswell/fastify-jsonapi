export type Item = Record<string, unknown> & { id: string };

type RemovePrefix<T extends string> = T extends `-${infer U}` ? U : T;

export interface Pagination<TSort extends string> {
  limit: number;
  field: RemovePrefix<TSort>;
  order: 'asc' | 'desc';
  pointer?: string;
}
