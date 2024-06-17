import { describe, expect, it } from 'vitest';
import {
  decodePageCursor,
  encodePageCursor,
} from '../src/pagination/encoding.js';

describe('encoding', () => {
  it('encodes a cursor', () => {
    const toEncode = {
      field: 'name',
      pointer: 'three',
      order: 'asc' as const,
    };

    expect(encodePageCursor(toEncode)).toEqual('bmFtZV9fdGhyZWU=');
  });

  it('decodes a cursor', () => {
    const toDecode = 'bmFtZV9fdGhyZWU=';

    expect(decodePageCursor(toDecode)).toEqual({
      field: 'name',
      pointer: 'three',
      order: 'asc',
    });
  });

  it('encodes and decodes to an identical value', () => {
    const toEncode = {
      field: 'name',
      pointer: 'three',
      order: 'asc' as const,
    };

    expect(decodePageCursor(encodePageCursor(toEncode))).toEqual(toEncode);
  });
});
