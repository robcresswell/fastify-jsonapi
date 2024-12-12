import { it, describe, beforeEach, afterEach, expect } from 'vitest';
import { createTestServer, TestServer } from './helpers.js';
import { encodePageCursor } from '../src/encoding.js';
import fastify from 'fastify';
import { jsonApiPlugin } from '../src/plugin.js';

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
      const res = await server.inject({
        path: '/items/4',
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
          type: 'item',
          id: '4',
          attributes: { name: 'four' },
          relationships: {
            other: {
              data: {
                id: '123',
                type: 'other',
              },
              links: {
                self: 'https://example.org/others/123',
              },
            },
          },
        },
        links: { self: 'http://localhost/items/4' },
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
              createdAt: '2024-05-05T05:00:00.000Z',
              otherId: '456',
            },
          },
          {
            type: 'item',
            id: '4',
            attributes: {
              name: 'four',
              createdAt: '2024-04-04T04:00:00.000Z',
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
        meta: { count: 5 },
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
          meta: { count: 2 },
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
            prev: 'http://localhost/items?sort=name&page%5Bsize%5D=2&page%5Bbefore%5D=bmFtZV9fb25l',
            self: 'http://localhost/items?sort=name&page%5Bsize%5D=2&page%5Bafter%5D=bmFtZV9fb25l',
            next: null,
          },
          meta: { count: 2 },
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
            prev: 'http://localhost/items?sort=name&page%5Bsize%5D=1&page%5Bbefore%5D=bmFtZV9fb25l',
            next: 'http://localhost/items?sort=name&page%5Bsize%5D=1&page%5Bafter%5D=bmFtZV9fdGhyZWU%3D',
          },
          meta: { count: 1 },
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
          meta: { count: 0 },
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
                createdAt: '2024-05-05T05:00:00.000Z',
                otherId: '456',
              },
            },
            {
              type: 'item',
              id: '4',
              attributes: {
                name: 'four',
                createdAt: '2024-04-04T04:00:00.000Z',
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
          meta: { count: 5 },
        });
      });
    });
  });

  describe('errorHandler', () => {
    it('does not support range pagination', async () => {
      const res = await server.inject({
        path: '/items',
        method: 'GET',
        query: {
          'page[size]': '5',
          'page[after]': 'YWdlX18zMA==',
          'page[before]': 'YWdlX180MA==',
        },
      });

      expect(res.statusCode).toEqual(400);
      expect(res.json()).toEqual({
        jsonapi: {
          version: '1.1',
          profile: [
            'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
          ],
        },
        errors: [
          {
            title: 'Bad Request',
            detail:
              "Range pagination is not supported. Please supply either a 'before' or 'after' cursor",
            status: '400',
          },
        ],
      });
    });

    it('rejects nonsense pagination cursor', async () => {
      const res = await server.inject({
        path: '/items',
        method: 'GET',
        query: {
          'page[size]': '5',
          'page[after]': '1_2__3456',
        },
      });

      expect(res.statusCode).toEqual(400);
      expect(res.json()).toEqual({
        jsonapi: {
          version: '1.1',
          profile: [
            'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
          ],
        },
        errors: [
          {
            title: 'Bad Request',
            detail: "Invalid pagination cursor: '1_2__3456'",
            status: '400',
          },
        ],
      });
    });

    it('rejects pagination cursor with missing value', async () => {
      const res = await server.inject({
        path: '/items',
        method: 'GET',
        query: {
          'page[size]': '5',
          'page[after]': 'Y3JlYXRlZEF0X18=',
        },
      });

      expect(res.statusCode).toEqual(400);
      expect(res.json()).toEqual({
        jsonapi: {
          version: '1.1',
          profile: [
            'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
          ],
        },
        errors: [
          {
            title: 'Bad Request',
            detail: "Invalid pagination cursor: 'Y3JlYXRlZEF0X18='",
            status: '400',
          },
        ],
      });
    });
  });

  describe('notFoundHandler', () => {
    it('returns a well-formed 404', async () => {
      const res = await server.inject({
        path: '/not-a-real-route-isit',
        method: 'GET',
      });

      expect(res.statusCode).toEqual(404);
      expect(res.json()).toEqual({
        jsonapi: {
          version: '1.1',
          profile: [
            'https://jsonapi.org/profiles/ethanresnick/cursor-pagination',
          ],
        },
        errors: [
          {
            title: 'Not Found',
            detail: 'Not Found',
            status: '404',
          },
        ],
      });
    });
  });

  describe('error responses', () => {
    it('returns a 400', async () => {
      const app = fastify();
      app.register(jsonApiPlugin);
      app.get('/', (_req, reply) => {
        reply.badRequest();
      });

      const res = await app.inject({ method: 'GET', path: '/' });

      expect(res.statusCode).toEqual(400);
    });

    it('returns a 401', async () => {
      const app = fastify();
      app.register(jsonApiPlugin);
      app.get('/', (_req, reply) => {
        reply.unauthorized();
      });

      const res = await app.inject({ method: 'GET', path: '/' });

      expect(res.statusCode).toEqual(401);
    });

    it('returns a 402', async () => {
      const app = fastify();
      app.register(jsonApiPlugin);
      app.get('/', (_req, reply) => {
        reply.paymentRequired();
      });

      const res = await app.inject({ method: 'GET', path: '/' });

      expect(res.statusCode).toEqual(402);
    });

    it('returns a 403', async () => {
      const app = fastify();
      app.register(jsonApiPlugin);
      app.get('/', (_req, reply) => {
        reply.forbidden();
      });

      const res = await app.inject({ method: 'GET', path: '/' });

      expect(res.statusCode).toEqual(403);
    });

    it('returns a 404', async () => {
      const app = fastify();
      app.register(jsonApiPlugin);
      app.get('/', (_req, reply) => {
        reply.notFound();
      });

      const res = await app.inject({ method: 'GET', path: '/' });

      expect(res.statusCode).toEqual(404);
    });

    it('returns a 500', async () => {
      const app = fastify();
      app.register(jsonApiPlugin);
      app.get('/', (_req, reply) => {
        reply.internalServerError();
      });

      const res = await app.inject({ method: 'GET', path: '/' });

      expect(res.statusCode).toEqual(500);
    });
  });
});
