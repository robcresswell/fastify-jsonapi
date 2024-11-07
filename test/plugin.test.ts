import { it, describe, beforeEach, afterEach, expect } from 'vitest';
import { createTestServer, TestServer } from './helpers.js';
import { encodePageCursor } from '../src/encoding.js';

describe('plugin', () => {
  let server: TestServer;

  beforeEach(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('reply.obj()', () => {
    it('creates a json:api obj response', async () => {
      server.get('/item', async (_req, reply) => {
        return reply.obj({
          type: 'foobar',
          item: { id: '1', name: 'one', otherId: '123' },
          relationships: {
            other: 'http://example.org/123',
          },
        });
      });

      const res = await server.inject({
        path: '/item',
        method: 'GET',
      });

      expect(res.json()).toEqual({
        jsonapi: {
          version: '1.1',
          profile: [
            'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
          ],
        },
        data: {
          type: 'foobar',
          id: '1',
          attributes: { name: 'one', otherId: '123' },
          relationships: { other: 'http://example.org/123' },
        },
        links: { self: 'http://localhost/item' },
      });
    });
  });

  describe('reply.list()', () => {
    it('creates a json:api list response', async () => {
      const res = await server.inject({
        path: '/items',
        method: 'GET',
        query: {
          sort: 'name',
          'page[size]': '5',
        },
      });

      expect(res.json()).toEqual({
        jsonapi: {
          version: '1.1',
          profile: [
            'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
          ],
        },
        data: [
          {
            type: 'item',
            id: '5',
            attributes: {
              name: 'five',
              createdAt: '2024-05-05T04:00:00.000Z',
              otherId: '456',
            },
          },
          {
            type: 'item',
            id: '4',
            attributes: {
              name: 'four',
              createdAt: '2024-04-04T03:00:00.000Z',
              otherId: '123',
            },
          },
          {
            type: 'item',
            id: '1',
            attributes: {
              name: 'one',
              createdAt: '2024-01-01T01:00:00.000Z',
              otherId: '123',
            },
          },
          {
            type: 'item',
            id: '3',
            attributes: {
              name: 'three',
              createdAt: '2024-03-03T03:00:00.000Z',
              otherId: '789',
            },
          },
          {
            type: 'item',
            id: '2',
            attributes: {
              name: 'two',
              createdAt: '2024-02-02T02:00:00.000Z',
              otherId: '456',
            },
          },
        ],
        links: {
          self: 'http://localhost/items?sort=name&page%5Bsize%5D=5',
          prev: null,
          next: null,
        },
      });
    });

    describe('pagination links', () => {
      it('includes a next link', async () => {
        const res = await server.inject({
          path: '/items',
          method: 'GET',
          query: {
            sort: 'createdAt',
            'page[size]': '2',
          },
        });

        expect(res.json()).toEqual({
          jsonapi: {
            version: '1.1',
            profile: [
              'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
            ],
          },
          data: [
            {
              type: 'item',
              id: '1',
              attributes: {
                name: 'one',
                createdAt: '2024-01-01T01:00:00.000Z',
                otherId: '123',
              },
            },
            {
              type: 'item',
              id: '2',
              attributes: {
                name: 'two',
                createdAt: '2024-02-02T02:00:00.000Z',
                otherId: '456',
              },
            },
          ],
          links: {
            self: 'http://localhost/items?sort=createdAt&page%5Bsize%5D=2',
            prev: null,
            next: 'http://localhost/items?sort=createdAt&page%5Bsize%5D=2&page%5Bafter%5D=Y3JlYXRlZEF0X18yMDI0LTAyLTAyVDAyOjAwOjAwLjAwMFo%3D',
          },
        });
      });

      it('includes a prev link', async () => {
        const res = await server.inject({
          path: '/items',
          method: 'GET',
          query: {
            sort: 'name',
            'page[size]': '2',
            'page[after]': encodePageCursor({
              field: 'name',
              val: 'one',
              order: 'asc',
            }),
          },
        });

        expect(res.json()).toEqual({
          jsonapi: {
            version: '1.1',
            profile: [
              'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
            ],
          },
          data: [
            {
              type: 'item',
              id: '3',
              attributes: {
                name: 'three',
                createdAt: '2024-03-03T03:00:00.000Z',
                otherId: '789',
              },
            },
            {
              type: 'item',
              id: '2',
              attributes: {
                name: 'two',
                createdAt: '2024-02-02T02:00:00.000Z',
                otherId: '456',
              },
            },
          ],
          links: {
            prev: 'http://localhost/items?sort=name&page%5Bsize%5D=2&page%5Bbefore%5D=bmFtZV9fdGhyZWU%3D',
            self: 'http://localhost/items?sort=name&page%5Bsize%5D=2&page%5Bafter%5D=bmFtZV9fb25l',
            next: null,
          },
        });
      });

      it('includes a prev and next link', async () => {
        const res = await server.inject({
          path: '/items',
          method: 'GET',
          query: {
            sort: 'name',
            'page[size]': '1',
            'page[after]': encodePageCursor({
              field: 'name',
              val: 'one',
              order: 'asc',
            }),
          },
        });

        expect(res.json()).toEqual({
          jsonapi: {
            version: '1.1',
            profile: [
              'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
            ],
          },
          data: [
            {
              type: 'item',
              id: '3',
              attributes: {
                name: 'three',
                createdAt: '2024-03-03T03:00:00.000Z',
                otherId: '789',
              },
            },
          ],
          links: {
            self: 'http://localhost/items?sort=name&page%5Bsize%5D=1&page%5Bafter%5D=bmFtZV9fb25l',
            prev: 'http://localhost/items?sort=name&page%5Bsize%5D=1&page%5Bbefore%5D=bmFtZV9fdGhyZWU%3D',
            next: 'http://localhost/items?sort=name&page%5Bsize%5D=1&page%5Bafter%5D=bmFtZV9fdGhyZWU%3D',
          },
        });
      });

      it('returns null links if there are no items', async () => {
        const res = await server.inject({
          path: '/empty',
          method: 'GET',
          query: {
            sort: 'name',
            'page[size]': '2',
          },
        });

        expect(res.json()).toEqual({
          jsonapi: {
            version: '1.1',
            profile: [
              'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
            ],
          },
          data: [],
          links: {
            self: 'http://localhost/empty?sort=name&page%5Bsize%5D=2',
            prev: null,
            next: null,
          },
        });
      });

      it('returns null links if there are no other items', async () => {
        const res = await server.inject({
          path: '/items',
          method: 'GET',
          query: {
            sort: 'name',
            'page[size]': '12',
          },
        });

        expect(res.json()).toEqual({
          jsonapi: {
            version: '1.1',
            profile: [
              'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
            ],
          },
          data: [
            {
              type: 'item',
              id: '5',
              attributes: {
                name: 'five',
                createdAt: '2024-05-05T04:00:00.000Z',
                otherId: '456',
              },
            },
            {
              type: 'item',
              id: '4',
              attributes: {
                name: 'four',
                createdAt: '2024-04-04T03:00:00.000Z',
                otherId: '123',
              },
            },
            {
              type: 'item',
              id: '1',
              attributes: {
                name: 'one',
                createdAt: '2024-01-01T01:00:00.000Z',
                otherId: '123',
              },
            },
            {
              type: 'item',
              id: '3',
              attributes: {
                name: 'three',
                createdAt: '2024-03-03T03:00:00.000Z',
                otherId: '789',
              },
            },
            {
              type: 'item',
              id: '2',
              attributes: {
                name: 'two',
                createdAt: '2024-02-02T02:00:00.000Z',
                otherId: '456',
              },
            },
          ],
          links: {
            self: 'http://localhost/items?sort=name&page%5Bsize%5D=12',
            prev: null,
            next: null,
          },
        });
      });
    });
  });
});
