import { fastify } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import {
  jsonApiPlugin,
  buildTypeboxQuerySchema,
  parseQuery,
} from '../src/index.js';

export async function createTestServer() {
  const server = fastify()
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(jsonApiPlugin);

  const querySchema = buildTypeboxQuerySchema({
    sort: ['name'],
    filters: { name: Type.Optional(Type.String()) },
  });

  server.get(
    '/',
    { schema: { querystring: querySchema } },
    async (req, reply) => {
      const { pagination } = parseQuery(req.query);

      return reply.list({
        items: [
          { id: '1', name: 'one', otherId: '123' },
          { id: '2', name: 'two', otherId: '456' },
        ],
        itemMapper: ({ id, name, otherId }) => ({
          type: 'foobar',
          id,
          attributes: { name },
          relationships: {
            other: {
              type: 'others',
              id: otherId,
            },
          },
        }),
        pagination,
        hasMore: true,
      });
    },
  );

  return server;
}
