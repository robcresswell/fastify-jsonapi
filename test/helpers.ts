import { fastify, FastifyBaseLogger, FastifyInstance } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import { jsonApiPlugin } from '../src/plugin.js';
import { IncomingMessage, Server, ServerResponse } from 'node:http';
import { listResponseSchema, querySchema } from '../src/typebox.js';
import fastifySwagger from '@fastify/swagger';
import { extractPaginationFromQuery, Pagination } from '../src/index.js';

export type TestServer = FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;

const data = [
  {
    id: '1',
    name: 'one',
    createdAt: new Date('2024-01-01T01:00:00'),
    otherId: '123',
  },
  {
    id: '2',
    name: 'two',
    createdAt: new Date('2024-02-02T02:00:00'),
    otherId: '456',
  },
  {
    id: '3',
    name: 'three',
    createdAt: new Date('2024-03-03T03:00:00'),
    otherId: '789',
  },
  {
    id: '4',
    name: 'four',
    createdAt: new Date('2024-04-04T04:00:00'),
    otherId: '123',
  },
  {
    id: '5',
    name: 'five',
    createdAt: new Date('2024-05-05T05:00:00'),
    otherId: '456',
  },
];

function fakeDb(pagination: Pagination<'name' | 'createdAt'>) {
  const { field, limit, order, val } = pagination;
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
  const server = fastify()
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(fastifySwagger, { openapi: {} });

  await server.register(jsonApiPlugin, {
    setNotFoundHandler: true,
    setErrorHandler: true,
  });

  const querystring = querySchema({
    sort: ['name', 'createdAt'] as const,
    filters: {
      name: Type.Optional(Type.String()),
    },
    include: ['other', 'more'],
  });

  const response = {
    200: listResponseSchema({
      data: Type.Array(
        Type.Object({
          id: Type.String({ format: 'uuid' }),
          type: Type.Literal('item'),
          attributes: Type.Object({
            name: Type.String(),
            createdAt: Type.String(),
            otherId: Type.String(),
          }),
        }),
      ),
    }),
  };

  server.get(
    '/items',
    {
      schema: {
        querystring,
        response,
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
