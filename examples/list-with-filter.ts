import { fastify } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import { jsonApiPlugin } from '../src/plugin.js';
import { buildQuerySchema } from '../src/querystring.js';

export async function createTestServer() {
  const server = fastify()
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(jsonApiPlugin);

  const { querySchema } = buildQuerySchema({
    sort: [],
    filters: { teamId: Type.String() },
  });

  server.get(
    '/users',
    { schema: { querystring: querySchema } },
    async (req, reply) => {
      const { filters } = req.parseQuery();

      const users = getUsers();

      const items = users.filter(
        (user) => user.teamId === filters.teamId.value,
      );

      return reply.list({
        type: 'users',
        items: items,
        relationshipBuilder: ({ teamId }) => {
          return { team: `https://my-website/teams/${teamId}` };
        },
        links: {
          self: 'https://my-website/users',
        },
      });
    },
  );

  return server;
}

// This would be a DB call, network call, etc.
function getUsers() {
  const users = [
    {
      id: '123',
      teamId: '1',
    },
    {
      id: '456',
      teamId: '2',
    },
  ];

  return users;
}
