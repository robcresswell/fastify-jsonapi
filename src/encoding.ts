import { InvalidPaginationCursorError } from './errors.js';

const PAGE_CURSOR_SEPARATOR = '__';

export function encodePageCursor({
  field,
  val,
  order,
}: {
  field: string;
  val: unknown;
  order: 'asc' | 'desc';
}) {
  const fieldWithOrder = order === 'asc' ? field : '-' + field;
  const str = fieldWithOrder + PAGE_CURSOR_SEPARATOR + stringifyVal(val);

  return b64Encode(str);
}

/**
 * Decode an opaque pagination cursor into its component parts; a column name,
 * and order, and a val to the item to page from / to
 */
export function decodePageCursor(cursor: string): {
  field: string;
  val: string;
  order: 'asc' | 'desc';
} {
  const str = b64Decode(cursor);
  const [fieldNameWithOrder, val] = str.split(PAGE_CURSOR_SEPARATOR);

  if (!fieldNameWithOrder || !val) {
    throw new InvalidPaginationCursorError(cursor);
  }

  return fieldNameWithOrder.startsWith('-')
    ? { field: fieldNameWithOrder.slice(1), val, order: 'desc' }
    : { field: fieldNameWithOrder, val, order: 'asc' };
}

function b64Encode(str: string): string {
  return Buffer.from(str).toString('base64');
}

function b64Decode(str: string): string {
  return Buffer.from(str, 'base64').toString('utf-8');
}

function stringifyVal(val: unknown): string {
  if (val === null || val === undefined) {
    throw new Error('unexpected null or undefined field in pagination value');
  }

  if (typeof val === 'string') {
    return val;
  }

  if (val instanceof Date) {
    return val.toISOString();
  }

  if (typeof val === 'number') {
    return String(val);
  }

  throw new Error(`unexpected field type: ${typeof val} in pagination value`);
}
