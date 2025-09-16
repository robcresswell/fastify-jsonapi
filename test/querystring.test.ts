import { encodePageCursor } from '../src/encoding.js';
import {
  extractFiltersFromQuery,
  extractPaginationFromQuery,
} from '../src/querystring/parse.js';
import { describe, expect, it } from 'vitest';

describe('querystring parser', () => {
  it('returns db params for pagination', () => {
    const querystring = {
      sort: 'id',
      'page[size]': 17,
    };

    const pagination = extractPaginationFromQuery(querystring);

    expect(pagination).toEqual({
      limit: 17,
      field: 'id',
      order: 'asc',
    });
  });

  it('supports reversing the pagination order', () => {
    const querystring = {
      sort: '-id', // Note the "-" prefix
      'page[size]': 17,
    };

    const pagination = extractPaginationFromQuery(querystring);

    expect(pagination).toEqual({
      limit: 17,
      field: 'id',
      order: 'desc',
    });
  });

  it('does not support range pagination', () => {
    const querystring = {
      sort: 'name',
      'page[before]': '654321',
      'page[after]': '123456',
    };

    expect(() => extractPaginationFromQuery(querystring)).toThrow();
  });

  it('converts a cursor into pagination params (desc)', () => {
    const id = '123456';
    const cursor = encodePageCursor({
      field: 'id',
      order: 'desc',
      val: id,
    });
    const querystring = {
      sort: 'name',
      'page[after]': cursor,
    };
    const pagination = extractPaginationFromQuery(querystring);

    expect(pagination).toEqual({
      limit: 100,
      field: 'id',
      order: 'desc',
      val: id,
      direction: 'forward',
    });
  });

  it('converts a cursor into pagination params (asc)', () => {
    const name = 'foobar';
    const cursor = encodePageCursor({
      field: 'name',
      order: 'asc',
      val: name,
    });
    const querystring = {
      sort: 'name',
      'page[after]': cursor,
    };
    const pagination = extractPaginationFromQuery(querystring);

    expect(pagination).toEqual({
      limit: 100,
      field: 'name',
      order: 'asc',
      val: name,
      direction: 'forward',
    });
  });

  it('handles paging backwards', () => {
    const name = 'foobar';
    const cursor = encodePageCursor({
      field: 'name',
      order: 'asc',
      val: name,
    });
    const querystring = {
      sort: 'name',
      'page[before]': cursor,
    };
    const pagination = extractPaginationFromQuery(querystring);

    expect(pagination).toEqual({
      limit: 100,
      field: 'name',
      order: 'asc',
      val: name,
      direction: 'backward',
    });
  });

  describe('parses filters', () => {
    const cases: [
      filters: Record<string, string | number | boolean>,
      expected: Record<
        string,
        { field: string; operator: string; value: unknown }
      >,
    ][] = [
      [
        { 'filter[name]': 'bar' },
        { name: { field: 'name', operator: 'eq', value: 'bar' } },
      ],
      [
        { 'filter[id][gt]': 1 },
        {
          id: { field: 'id', operator: 'gt', value: 1 },
        },
      ],
      [
        { 'filter[closedAt]': 'null' },
        {
          closedAt: { field: 'closedAt', operator: 'eq', value: null },
        },
      ],
      [
        { 'filter[open][ne]': true },
        {
          open: { field: 'open', operator: 'ne', value: true },
        },
      ],
      [
        { 'filter[date][lte]': '2022-02-22T02:00:00.000Z' },
        {
          date: {
            field: 'date',
            operator: 'lte',
            value: '2022-02-22T02:00:00.000Z',
          },
        },
      ],
      [{ 'filter[]': 'foo' }, {}],
    ];

    cases.forEach(([queryFilters, expected]) => {
      it(JSON.stringify(queryFilters), () => {
        const filters = extractFiltersFromQuery(queryFilters);

        expect(filters).toEqual(expected);
      });
    });
  });

  describe('throws on invalid filters', () => {
    const cases: [filters: Record<string, string>, message: Error][] = [
      [
        { 'filter[name][bar]': '5' },
        new Error(
          "Invalid operator 'bar' in filter[name][bar]=5. Operators must be one of 'eq', 'gte', 'gt', 'lt', 'lte', 'ne', 'like'",
        ),
      ],
      [
        { 'filter[closedAt][gte]': 'null' },
        new Error(
          "Invalid operator 'gte' in filter[closedAt][gte]=null. Operators must be one either 'eq' or 'ne' for null or boolean filters",
        ),
      ],
    ];

    cases.forEach(([queryFilters, expected]) => {
      it(JSON.stringify(queryFilters), () => {
        expect(() => extractFiltersFromQuery(queryFilters)).toThrowError(
          expected,
        );
      });
    });
  });
});
