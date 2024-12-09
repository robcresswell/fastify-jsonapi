import { fastify, FastifyBaseLogger, FastifyInstance } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import { jsonApiPlugin } from '../src/plugin.js';
import { IncomingMessage, Server, ServerResponse } from 'node:http';
import {
  listResponseSchema,
  objectResponseSchema,
  querySchema,
} from '../src/typebox.js';
import fastifySwagger from '@fastify/swagger';
import { extractPaginationFromQuery, Pagination } from '../src/index.js';

export type TestServer = FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;

function getData() {
  const data = [
    {
      id: '1',
      name: 'one',
      createdAt: new Date('2024-01-01T01:00:00Z'),
      otherId: '123',
    },
    {
      id: '2',
      name: 'two',
      createdAt: new Date('2024-02-02T02:00:00Z'),
      otherId: '456',
    },
    {
      id: '3',
      name: 'three',
      createdAt: new Date('2024-03-03T03:00:00Z'),
      otherId: '789',
    },
    {
      id: '4',
      name: 'four',
      createdAt: new Date('2024-04-04T04:00:00Z'),
      otherId: '123',
    },
    {
      id: '5',
      name: 'five',
      createdAt: new Date('2024-05-05T05:00:00Z'),
      otherId: '456',
    },
  ];

  return data;
}

function fakeDb(pagination: Pagination<'name' | 'createdAt'>) {
  const { field, limit, order, val } = pagination;
  const data = getData();
  const sorted = data.sort((a, b) => (a[field] > b[field] ? 1 : -1));

  if (order === 'desc') sorted.reverse();

  if (!val) {
    return { items: sorted.slice(0, limit), hasMore: data.length > limit };
  }

  const startFrom = sorted.findIndex((item) => item[field] === val) + 1;
  const paged = sorted.slice(startFrom);

  return {
    items: paged.slice(0, limit),
    hasMore: paged.length > limit,
  };
}

export async function createTestServer() {
  const server = fastify({
    logger: { level: process.env.LOG_LEVEL ?? 'fatal' },
  })
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(fastifySwagger, { openapi: { openapi: '3.1.1' } });

  await server.register(jsonApiPlugin, {
    setNotFoundHandler: true,
    setErrorHandler: true,
  });

  const listQuerystring = querySchema({
    sort: ['name', 'createdAt'] as const,
    filters: {
      name: Type.Optional(Type.String()),
    },
    include: ['other', 'more'],
  });

  const listResponse = {
    200: listResponseSchema({
      data: {
        id: Type.String({ format: 'uuid' }),
        type: Type.Literal('item'),
        attributes: {
          name: Type.String(),
          createdAt: Type.String(),
          otherId: Type.String(),
        },
      },
      meta: {
        count: Type.Integer(),
      },
    }),
  };

  server.get(
    '/items',
    {
      schema: {
        querystring: listQuerystring,
        response: listResponse,
      },
    },
    async (req, reply) => {
      const pagination = extractPaginationFromQuery(req.query);
      const { items, hasMore } = fakeDb(pagination);

      const data = items.map((item) => ({
        type: 'item',
        id: item.id,
        attributes: {
          name: item.name,
          createdAt: item.createdAt,
          otherId: item.otherId,
        },
      }));

      return reply.list({
        data,
        hasMore,
        pagination,
      });
    },
  );

  const objResponse = {
    200: objectResponseSchema({
      data: {
        id: Type.String({ format: 'uuid' }),
        type: Type.Literal('item'),
        attributes: { name: Type.String() },
      },
      relationships: {
        other: Type.Object({
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            type: Type.Literal('other'),
          }),
          links: Type.Object({ self: Type.String({ format: 'uri' }) }),
        }),
      },
    }),
  };

  server.get(
    '/items/:id',
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
        response: objResponse,
      },
    },
    async (req, reply) => {
      const { items } = fakeDb({ limit: 100, field: 'name', order: 'asc' });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const data = items.find((item) => item.id === req.params.id)!;

      return reply.obj({
        id: data.id,
        type: 'item',
        attributes: { name: data.name },
        relationships: {
          other: {
            data: {
              id: data.otherId,
              type: 'other',
            },
            links: {
              self: 'https://example.org/others/' + data.otherId,
            },
          },
        },
      });
    },
  );

  server.get('/empty', async (_req, reply) => {
    return reply.list({
      data: [],
      hasMore: false,
      pagination: { field: 'name', limit: 10, order: 'asc' },
    });
  });

  server.get('/throws-error', async (_req, reply) => {
    return reply.list({
      data: [],
      hasMore: false,
      pagination: { field: 'name', limit: 10, order: 'asc' },
    });
  });

  return server;
}
