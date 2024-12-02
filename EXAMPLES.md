# Examples

See the [JSON:API website](https://jsonapi.org/) for detailed examples on the
spec itself

## List With Filter

```ts
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
} from '@robcresswell/fastify-jsonapi';
import { querySchema } from '@robcresswell/fastify-jsonapi/typebox';

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
      .filter((user) => user.teamId === filters.teamId.value)
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

```

## List

```ts
import { fastify } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import { extractPaginationFromQuery, jsonApiPlugin } from '@robcresswell/fastify-jsonapi';
import { querySchema } from '@robcresswell/fastify-jsonapi/typebox';

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

```
