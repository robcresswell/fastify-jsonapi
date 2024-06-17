export type RemovePrefix<
  T extends string,
  Prefix extends string,
> = T extends `${Prefix}${infer U}` ? U : T;

export type Item = Record<string, unknown> & { id: string };
