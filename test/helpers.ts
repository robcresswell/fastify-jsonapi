import { fastify, FastifyBaseLogger, FastifyInstance } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import { jsonApiPlugin } from '../src/plugin.js';
import { IncomingMessage, Server, ServerResponse } from 'node:http';
import { buildQuerySchema, parseQuery } from '../src/querystring.js';

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
    createdAt: new Date('2024-10-10T01:00:00'),
    otherId: '123',
  },
  {
    id: '2',
    name: 'two',
    createdAt: new Date('2024-11-11T02:00:00'),
    otherId: '456',
  },
  {
    id: '3',
    name: 'three',
    createdAt: new Date('2024-12-12T03:00:00'),
    otherId: '789',
  },
];

function fakeDb(
  field: 'name' | 'createdAt',
  limit: number,
  order: 'asc' | 'desc',
  pointer?: string,
) {
  const sorted = data.sort((a, b) => {
    const sortVal = a[field] > b[field] ? 1 : -1;
    return order === 'asc' ? sortVal : sortVal * -1;
  });

  if (!pointer) {
    return { items: sorted.slice(0, limit), hasMore: data.length > limit };
  }

  const startFrom = sorted.findIndex((item) => item[field] === pointer) + 1;
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

  await server.register(jsonApiPlugin);

  const { querySchema } = buildQuerySchema({
    sort: ['name', 'createdAt'] as const,
    filters: { name: Type.Optional(Type.String()) },
  });

  server.get(
    '/items',
    {
      schema: {
        querystring: querySchema,
      },
    },
    async (req, reply) => {
      const { pagination } = parseQuery(req.query, {});
      const { field, limit, order, pointer } = pagination;
      const { items, hasMore } = fakeDb(field, limit, order, pointer);

      reply.list({
        items,
        itemMapper: (item) => ({
          type: 'item',
          id: item.id,
          attributes: {
            name: item.name,
            createdAt: item.createdAt,
            otherId: item.otherId,
          },
        }),
        hasMore,
        pagination,
      });
    },
  );

  server.get('/empty', async (_req, reply) => {
    reply.list({
      items: [],
      itemMapper: () => {
        return { type: 'item', id: '1', attributes: {} };
      },
      hasMore: false,
      pagination: { field: 'name', limit: 10, order: 'asc' },
    });
  });

  return server;
}
