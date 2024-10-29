import { Item } from './types.js';
import { encodePageCursor } from './encoding.js';
import { Pagination } from './types.js';

/**
 * Convert a pointer, such as a specific date in an updatedAt field, into a
 * string to be encoded as part of a pagination cursor
 */
function stringifyPointer(pointer: unknown) {
  // there's a better word than pointer for this, but my brain is failing me
  if (pointer === null || pointer === undefined) {
    throw new Error('unexpected null or undefined field in pagination pointer');
  }

  if (typeof pointer === 'string') {
    return pointer;
  }

  if (pointer instanceof Date) {
    return pointer.toISOString();
  }

  if (typeof pointer === 'number') {
    return String(pointer);
  }

  throw new Error(
    `unexpected field type: ${typeof pointer} in pagination pointer`,
  );
}

export function assembleLinks<T extends Item>(opts: {
  self: URL;
  items: T[];
  hasMore: boolean;
  pagination: Pagination<string>;
}): Record<string, string | null> {
  const { self, items, hasMore } = opts;

  const links: Record<string, string | null> = {
    self: self.toString(),
    prev: null,
    next: null,
  };

  if (items.length === 0) {
    return links;
  }

  const { field, order } = opts.pagination;
  const pageSize = opts.pagination.limit.toString();

  if (self.searchParams.has('page[after]')) {
    const item = items[0];

    if (item) {
      const prevUrl = new URL(self);
      prevUrl.searchParams.delete('page[after]');
      prevUrl.searchParams.set(
        'page[before]',
        encodePageCursor({
          field,
          pointer: stringifyPointer(item[field]),
          order,
        }),
      );
      prevUrl.searchParams.set('page[size]', pageSize);
      links.prev = prevUrl.toString();
    }
  }

  if (hasMore) {
    const lastItem = items[items.length - 1];

    if (lastItem) {
      const nextUrl = new URL(self);
      nextUrl.searchParams.set(
        'page[after]',
        encodePageCursor({
          field,
          pointer: stringifyPointer(lastItem[field]),
          order,
        }),
      );
      nextUrl.searchParams.set('page[size]', pageSize);
      links.next = nextUrl.toString();
    }
  }

  return links;
}
