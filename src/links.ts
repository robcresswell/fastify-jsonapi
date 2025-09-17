import { encodePageCursor } from './encoding.js';
import { Pagination, ResourceObject } from './types.js';

type PaginationLinks = {
  self: string;
  prev: string | null;
  next: string | null;
} & Record<string, string | null>;

export function assembleLinks(opts: {
  self: URL;
  data: ResourceObject[];
  hasMore: boolean;
  pagination: Pagination<string>;
}): PaginationLinks {
  const { self, data, hasMore } = opts;

  const links: PaginationLinks = {
    self: self.toString(),
    prev: null,
    next: null,
  };

  if (data.length === 0) {
    return links;
  }

  const after = self.searchParams.get('page[after]');
  if (after) {
    const prevUrl = new URL(self);
    prevUrl.searchParams.delete('page[after]');
    prevUrl.searchParams.set('page[before]', after);
    links.prev = prevUrl.toString();
  }

  // If there are more items, or we're paging backwards, then we need to add a
  // next link, otherwise we can return
  if (!hasMore && !self.searchParams.has('page[before]')) return links;

  const lastItem = data[data.length - 1];

  const { field, order, limit } = opts.pagination;
  const pageSize = limit.toString();

  if (!lastItem?.attributes || !(field in lastItem.attributes)) return links;

  const val = lastItem.attributes[field];
  const nextUrl = new URL(self);
  nextUrl.searchParams.delete('page[before]');
  nextUrl.searchParams.set(
    'page[after]',
    encodePageCursor({ field, val, order }),
  );
  nextUrl.searchParams.set('page[size]', pageSize);
  links.next = nextUrl.toString();

  return links;
}
