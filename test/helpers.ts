import { fastify, FastifyBaseLogger, FastifyInstance } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import { jsonApiPlugin } from '../src/plugin.js';
import { IncomingMessage, Server, ServerResponse } from 'node:http';
import { parseQuery } from '../src/querystring/parse.js';
import { buildTypeboxQuerySchema } from '../src/typebox.js';

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

function fakeDb(
  field: 'name' | 'createdAt',
  limit: number,
  order: 'asc' | 'desc',
  val?: string,
) {
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

  await server.register(jsonApiPlugin, {
    setNotFoundHandler: true,
    setErrorHandler: true,
  });

  const querySchema = buildTypeboxQuerySchema({
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
      const { pagination } = parseQuery(req.query);
      const { field, limit, order, val } = pagination;
      const { items, hasMore } = fakeDb(field, limit, order, val);

      return reply.list({
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
    return reply.list({
      items: [],
      itemMapper: () => {
        return {
          type: 'item',
          id: '1',
          attributes: {},
        };
      },
      hasMore: false,
      pagination: { field: 'name', limit: 10, order: 'asc' },
    });
  });

  server.get('/throws-error', async (_req, reply) => {
    return reply.list({
      items: [{ id: '123-456-789' }],
      itemMapper: () => {
        throw new Error();
      },
      hasMore: false,
      pagination: { field: 'name', limit: 10, order: 'asc' },
    });
  });

  return server;
}
