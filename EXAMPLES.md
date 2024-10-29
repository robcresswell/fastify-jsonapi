# Examples

See the [JSON:API website](https://jsonapi.org/) for detailed examples on the spec itself

## List With Filter

```ts
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
} from '@robcresswell/fastify-jsonapi';

export async function createTestServer() {
  const server = fastify()
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(jsonApiPlugin);

  const querySchema = buildTypeboxQuerySchema({
    sort: [],
    filters: { teamId: Type.String() },
  });

  server.get(
    '/users',
    { schema: { querystring: querySchema } },
    async (req, reply) => {
      const { pagination, filters } = parseQuery(req.query);

      const users = getUsers();

      const items = users.filter(
        (user) => user.teamId === filters.teamId.value,
      );

      return reply.list({
        items,
        itemMapper: ({ id, teamId }) => ({
          type: 'users',
          id,
          attributes: {},
          relationships: {
            team: {
              links: {
                self: `https://my-website/teams/${teamId}`,
              },
              data: {
                type: 'teams',
                id: teamId,
              },
            },
          },
          links: {
            self: 'https://my-website/users',
          },
        }),
        pagination,
        hasMore: true,
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
```

## List

```ts
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
} from '@robcresswell/fastify-jsonapi';

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
```
