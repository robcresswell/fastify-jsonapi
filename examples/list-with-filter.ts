import { fastify } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import {
  extractFiltersFromQuery,
  extractPaginationFromQuery,
  jsonApiPlugin,
} from '../src/index.js';
import { querySchema } from '../src/typebox.js';

export async function createTestServer() {
  const server = fastify()
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(jsonApiPlugin);

  const querystring = querySchema({
    sort: [],
    filters: { teamId: Type.String() },
  });

  server.get('/users', { schema: { querystring } }, async (req, reply) => {
    const pagination = extractPaginationFromQuery(req.query);
    const filters = extractFiltersFromQuery(req.query);

    const users = getUsers();

    const data = users
      .filter((user) => {
        // If there's a teamId filter, use it, otherwise return all users
        return filters.teamId ? user.teamId === filters.teamId.value : true;
      })
      .map(({ id, teamId }) => {
        return {
          type: 'users',
          id,
          attributes: {},
          relationships: {
            team: {
              links: {
                self: `https://my-website/teams/${teamId}`,
              },
              type: 'teams',
              id: teamId,
            },
          },
          links: {
            self: 'https://my-website/users',
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
