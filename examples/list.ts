import { fastify } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import { extractPaginationFromQuery, jsonApiPlugin } from '../src/index.js';
import { querySchema } from '../src/typebox.js';

export async function createTestServer() {
  const server = fastify()
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(jsonApiPlugin);

  const querystring = querySchema({
    sort: ['name'],
    filters: { name: Type.Optional(Type.String()) },
  });

  server.get('/', { schema: { querystring } }, async (req, reply) => {
    const pagination = extractPaginationFromQuery(req.query);

    // These would be loaded from a db, api, etc.
    const items = [
      { id: '1', name: 'one', otherId: '123' },
      { id: '2', name: 'two', otherId: '456' },
    ];

    const data = items.map(({ id, name, otherId }) => {
      return {
        type: 'foobar',
        id,
        attributes: { name },
        relationships: {
          other: {
            type: 'others',
            id: otherId,
          },
        },
      };
    });

    return reply.list({
      data,
      pagination,
      hasMore: true,
    });
  });

  return server;
}
