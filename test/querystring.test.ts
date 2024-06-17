import { buildQuerySchema, Query } from '../src/querystring.js';
import { Type } from '@fastify/type-provider-typebox';
import { SupportedFilters } from '../src/filters.js';
import { describe, expect, it } from 'vitest';

// describe('querystring', () => {
//   const testCases: {
//     name: string;
//     args: { sort: string[]; filters: SupportedFilters<string> };
//     query: Query<string, string>;
//     expected: {
//       filters: Record<
//         string,
//         {
//           field: string;
//           operator: string;
//           value: unknown;
//         }
//       >;
//       pagination: {
//         field: string;
//         limit: number;
//         order: string;
//         pointer?: string;
//       };
//     };
//   }[] = [
//     {
//       name: 'sort only',
//       args: {
//         sort: ['updatedAt'],
//         filters: {},
//       },
//       query: { sort: '-updatedAt' },
//       expected: {
//         filters: {},
//         pagination: {
//           field: 'updatedAt',
//           limit: 1000,
//           order: 'desc',
//         },
//       },
//     },

//     {
//       name: 'no operator',
//       args: {
//         sort: ['age'],
//         filters: { age: Type.Number() },
//       },
//       query: { sort: 'age', 'filter[age]': '40' },
//       expected: {
//         filters: {
//           age: {
//             field: 'age',
//             operator: 'eq',
//             value: 40,
//           },
//         },
//         pagination: {
//           field: 'age',
//           limit: 1000,
//           order: 'asc',
//         },
//       },
//     },

//     {
//       name: 'lte',
//       args: {
//         sort: ['age'],
//         filters: { age: Type.Number() },
//       },
//       query: { sort: 'age', 'filter[age]': 'lte(40)' },
//       expected: {
//         filters: {
//           age: {
//             field: 'age',
//             operator: 'lte',
//             value: 40,
//           },
//         },
//         pagination: {
//           field: 'age',
//           limit: 1000,
//           order: 'asc',
//         },
//       },
//     },

//     {
//       name: 'date schema',
//       args: {
//         sort: ['name'],
//         filters: { createdAt: Type.Date() },
//       },
//       query: {
//         sort: 'name',
//         'filter[createdAt]': 'gt(2024-06-16T09:00:00.000Z)',
//       },
//       expected: {
//         filters: {
//           createdAt: {
//             field: 'createdAt',
//             operator: 'gt',
//             value: new Date('2024-06-16T09:00:00.000Z'),
//           },
//         },
//         pagination: {
//           field: 'name',
//           limit: 1000,
//           order: 'asc',
//         },
//       },
//     },
//   ];

//   testCases.forEach(({ name, args, query, expected }) => {
//     it(name, () => {
//       const { queryValidator } = buildQuerySchema(args);

//       const validated = queryValidator(query);

//       expect(validated).toEqual(expected);
//     });
//   });
// });

// describe('querystring parser', () => {
//   it('returns db params for pagination', () => {
//     const querystring = {
//       sort: 'id',
//       'page[size]': 17,
//     };

//     const { pagination } = parseQuery(querystring);

//     assert.deepEqual(pagination, {
//       limit: 17,
//       column: 'id',
//       order: 'asc',
//     });
//   });

//   it('supports reversing the pagination order', () => {
//     const querystring = {
//       sort: '-id', // Note the "-" prefix
//       'page[size]': 17,
//     };

//     const { pagination } = parseQuery(querystring);

//     assert.deepEqual(pagination, {
//       limit: 17,
//       column: 'id',
//       order: 'desc',
//     });
//   });

//   it('does not support range pagination', () => {
//     const querystring = {
//       sort: 'name',
//       'page[before]': '654321',
//       'page[after]': '123456',
//     };

//     assert.throws(() => parseQuery(querystring));
//   });

//   it('converts a cursor into pagination params (desc)', () => {
//     const id = '123456';
//     const cursor = b64Encode(`-id__${id}`);
//     const querystring = {
//       sort: 'name',
//       'page[after]': cursor,
//     };
//     const { pagination } = parseQuery(querystring);

//     assert.deepEqual(pagination, {
//       limit: 1000,
//       column: 'id',
//       order: 'desc',
//       pointer: id,
//     });
//   });

//   it('converts a cursor into pagination params (asc)', () => {
//     const name = 'foobar';
//     const cursor = b64Encode(`name__${name}`);
//     const querystring = {
//       sort: 'name',
//       'page[after]': cursor,
//     };
//     const { pagination } = parseQuery(querystring);

//     assert.deepEqual(pagination, {
//       limit: 1000,
//       column: 'name',
//       order: 'asc',
//       pointer: name,
//     });
//   });

//   it('handles paging backawards', () => {
//     const name = 'foobar';
//     const cursor = b64Encode(`name__${name}`);
//     const querystring = {
//       sort: 'name',
//       'page[before]': cursor,
//     };
//     const { pagination } = parseQuery(querystring);

//     assert.deepEqual(pagination, {
//       limit: 1000,
//       column: 'name',
//       order: 'asc',
//       pointer: name,
//     });
//   });
// });
