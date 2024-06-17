export interface PaginationOpts<TSort extends string> {
  limit: number;
  order: 'asc' | 'desc';
  field: TSort;
  pointer?: string;
}
