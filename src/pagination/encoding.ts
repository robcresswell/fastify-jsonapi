const PAGE_CURSOR_SEP = '__';

function b64Encode(str: string) {
  return Buffer.from(str).toString('base64');
}

function b64Decode(str: string) {
  return Buffer.from(str, 'base64').toString('utf-8');
}

export function encodePageCursor({
  field,
  pointer,
  order,
}: {
  field: string;
  pointer: string;
  order: 'asc' | 'desc';
}) {
  const fieldWithOrder = order === 'asc' ? field : '-' + field;
  const str = fieldWithOrder + PAGE_CURSOR_SEP + pointer;

  return b64Encode(str);
}

/**
 * Decode an opaque pagination cursor into its component parts; a column name,
 * and order, and a pointer to the item to page from / to
 */
export function decodePageCursor(cursor: string): {
  field: string;
  pointer: string;
  order: 'asc' | 'desc';
} {
  const str = b64Decode(cursor);
  const [fieldNameWithOrder, pointer] = str.split(PAGE_CURSOR_SEP);

  if (!fieldNameWithOrder || !pointer) {
    throw new Error('Invalid cursor');
  }

  return fieldNameWithOrder.startsWith('-')
    ? { field: fieldNameWithOrder.slice(1), pointer, order: 'desc' }
    : { field: fieldNameWithOrder, pointer, order: 'asc' };
}
