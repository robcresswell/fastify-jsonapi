import { RemovePrefix } from '../types.js';
import { decodePageCursor } from './encoding.js';
import { PaginationOpts } from './types.js';

const MAX_PAGE_SIZE = 1000;

class RangePaginationNotSupported extends Error {
  constructor() {
    super(
      'Range pagination is not supported. Please supply either a "before" or "after" cursor',
    );
  }
}

export interface QueryPagination<TSort extends string> {
  sort: TSort;
  'page[size]'?: number;
  'page[after]'?: string;
  'page[before]'?: string;
}

export function extractPaginationOptsFromQuery<TSort extends string>(
  querystring: QueryPagination<TSort>,
): PaginationOpts<RemovePrefix<TSort, '-'>> {
  if ('page[after]' in querystring && 'page[before]' in querystring) {
    throw new RangePaginationNotSupported();
  }

  const limit = querystring['page[size]'] ?? MAX_PAGE_SIZE;

  const cursor =
    'page[after]' in querystring
      ? querystring['page[after]']
      : 'page[before]' in querystring
      ? querystring['page[before]']
      : undefined;

  // If we have a cursor, then we ignore any sort instructions and continue
  // paging with the cursor information
  if (cursor) {
    const { field, pointer, order } = decodePageCursor(cursor);

    return {
      limit,
      field: field as RemovePrefix<TSort, '-'>,
      order,
      pointer,
    };
  }

  const [field, order] = querystring.sort.startsWith('-')
    ? [querystring.sort.slice(1) as RemovePrefix<TSort, '-'>, 'desc' as const]
    : [querystring.sort as RemovePrefix<TSort, '-'>, 'asc' as const];

  return {
    limit,
    field,
    order,
  };
}
