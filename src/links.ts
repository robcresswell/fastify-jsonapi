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

  // If the list is empty, we can't page in either direction; return early
  const firstItem = data[0];
  if (!firstItem) {
    return links;
  }

  const { field, order, limit } = opts.pagination;
  const pageSize = limit.toString();

  // We need to assemble a base pagination URL that will be used to generate the
  // prev and next links. Maintain the same page size and any filter parameters,
  // but pagination parameters will be derived from the data
  const basePaginationUrl = new URL(self.pathname, self.origin);
  basePaginationUrl.searchParams.set('page[size]', pageSize);
  self.searchParams.forEach((value, key) => {
    if (key.startsWith('filter[')) {
      basePaginationUrl.searchParams.set(key, value);
    }
  });

  // There's a few cases to determine whether the page we're moving to has a
  // prev link. First we need to check if the pagination data is valid and set
  // on the first item. Then we do checks depending on paging direction. If
  // we're paging forward, there _must_ be a previous page, because we were just
  // on it. If we're paging backwards, then we can use the hasMore flag because
  // the sort order is reversed.
  const calculatePrevLink =
    opts.pagination.direction === 'forward' ||
    (opts.pagination.direction === 'backward' && hasMore);

  if (
    calculatePrevLink &&
    firstItem.attributes &&
    field in firstItem.attributes
  ) {
    const prevUrl = new URL(basePaginationUrl);
    prevUrl.searchParams.set(
      'page[before]',
      encodePageCursor({ field, val: firstItem.attributes[field], order }),
    );
    links.prev = prevUrl.toString();
  }

  // Slightly different for the next link. If we're paging backwards, we already
  // know there's a next page. Otherwise, check if there are more items
  const calculateNextLink = opts.pagination.direction === 'backward' || hasMore;

  if (!calculateNextLink) return links;

  const lastItem = data[data.length - 1];

  if (!lastItem?.attributes || !(field in lastItem.attributes)) return links;

  const nextUrl = new URL(basePaginationUrl);
  nextUrl.searchParams.delete('page[before]');
  nextUrl.searchParams.set(
    'page[after]',
    encodePageCursor({ field, val: lastItem.attributes[field], order }),
  );
  links.next = nextUrl.toString();

  return links;
}
