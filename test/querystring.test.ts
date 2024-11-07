import { encodePageCursor } from '../src/encoding.js';
import { parseQuery } from '../src/querystring/parse.js';
import { describe, expect, it } from 'vitest';

describe('querystring parser', () => {
  it('returns db params for pagination', () => {
    const querystring = {
      sort: 'id',
      'page[size]': 17,
    };

    const { pagination } = parseQuery(querystring);

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

    const { pagination } = parseQuery(querystring);

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

    expect(() => parseQuery(querystring)).toThrow();
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
    const { pagination } = parseQuery(querystring);

    expect(pagination).toEqual({
      limit: 1000,
      field: 'id',
      order: 'desc',
      val: id,
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
    const { pagination } = parseQuery(querystring);

    expect(pagination).toEqual({
      limit: 1000,
      field: 'name',
      order: 'asc',
      val: name,
    });
  });

  it('handles paging backawards', () => {
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
    const { pagination } = parseQuery(querystring);

    expect(pagination).toEqual({
      limit: 1000,
      field: 'name',
      order: 'asc',
      val: name,
    });
  });

  describe('parses filters', () => {
    const cases: [
      filters: Record<string, string | number>,
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

    cases.forEach(([filters, expected]) => {
      it(JSON.stringify(filters), () => {
        const parsed = parseQuery({
          sort: 'id',
          ...filters,
        });

        expect(parsed.filters).toEqual(expected);
      });
    });
  });

  describe('throws on invalid filters', () => {
    const cases: [filters: Record<string, string>, message: Error][] = [
      [
        { 'filter[name][bar]': '5' },
        new Error(
          "Invalid operator 'bar' in filter[name][bar]=5. Operators must be one of 'eq', 'gte', 'gt', 'lt', 'lte', 'ne'",
        ),
      ],
    ];

    cases.forEach(([filters, expected]) => {
      it(JSON.stringify(filters), () => {
        expect(() =>
          parseQuery({
            sort: 'id',
            ...filters,
          }),
        ).toThrowError(expected);
      });
    });
  });
});
