import { Item } from './types.js';
import { encodePageCursor } from './encoding.js';
import { Pagination } from './types.js';

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

  const { field, order, limit } = opts.pagination;
  const pageSize = limit.toString();

  if (self.searchParams.has('page[after]')) {
    const item = items[0];

    if (item) {
      const prevUrl = new URL(self);
      prevUrl.searchParams.delete('page[after]');
      prevUrl.searchParams.set(
        'page[before]',
        encodePageCursor({
          field,
          val: item[field],
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
          val: lastItem[field],
          order,
        }),
      );
      nextUrl.searchParams.set('page[size]', pageSize);
      links.next = nextUrl.toString();
    }
  }

  return links;
}
