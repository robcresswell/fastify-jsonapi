import {
  type Operator,
  SupportedFilters,
  extractFiltersFromQuery,
} from '../src/filters.js';
import { it, describe, expect } from 'vitest';
import { TSchema, Type } from '@fastify/type-provider-typebox';

describe('querystring', () => {
  describe('parses filters', () => {
    const cases: [
      supportedFilters: SupportedFilters<string>,
      filters: Record<string, string>,
      expected: Record<
        string,
        { field: string; operator: Operator; value: unknown; type?: TSchema }
      >,
    ][] = [
      [
        { name: Type.String() },
        { 'filter[name]': 'bar' },
        { name: { field: 'name', operator: 'eq', value: 'bar' } },
      ],
      [
        { id: Type.Number() },
        { 'filter[id]': 'gt(1)' },
        {
          id: { field: 'id', operator: 'gt', value: 1 },
        },
      ],
      [
        { date: Type.Date() },
        { 'filter[date]': 'lte(2022-02-22T02:00:00.000Z)' },
        {
          date: {
            field: 'date',
            operator: 'lte',
            value: new Date('2022-02-22T02:00:00.000Z'),
          },
        },
      ],
      [{ id: Type.String() }, { 'filter[]': 'foo' }, {}],
    ];

    cases.forEach(([supportedFilters, filters, expected]) => {
      it(JSON.stringify(filters), () => {
        const extracted = extractFiltersFromQuery(supportedFilters, {
          sort: 'id',
          ...filters,
        });

        expect(extracted).toEqual(expected);
      });
    });
  });

  describe('throws on invalid filters', () => {
    const cases: [
      supportedFilters: SupportedFilters<string>,
      filters: Record<string, string>,
      message: Error,
    ][] = [
      [
        { name: Type.String() },
        { 'filter[name]': '(bar)' },
        new Error(
          "Invalid value '(bar)' in filter 'filter[name]=(bar)'. Values should be in the format $OP(value), where $OP is one of 'eq', 'gte', 'gt', 'lt', 'lte', 'ne'",
        ),
      ],
      [
        { name: Type.String() },
        { 'filter[name]': 'foo(bar)' },
        new Error(
          "Invalid value 'foo(bar)' in filter 'filter[name]=foo(bar)'. Values should be in the format $OP(value), where $OP is one of 'eq', 'gte', 'gt', 'lt', 'lte', 'ne'",
        ),
      ],
      [
        { name: Type.String() },
        { 'filter[name]': 'gt(%&5)' },
        new Error(
          "Invalid value 'gt(%&5)' in filter 'filter[name]=gt(%&5)'. Values should be in the format $OP(value), where $OP is one of 'eq', 'gte', 'gt', 'lt', 'lte', 'ne'",
        ),
      ],
    ];

    cases.forEach(([supportedFilters, filters, expected]) => {
      it(JSON.stringify(filters), () => {
        expect(() =>
          extractFiltersFromQuery(supportedFilters, {
            sort: 'id',
            ...filters,
          }),
        ).toThrowError(expected);
      });
    });
  });
});
