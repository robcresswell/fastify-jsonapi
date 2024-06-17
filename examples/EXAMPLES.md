# Examples

## List With Filter

```ts
import { fastify } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import { jsonApiPlugin } from '../src/plugin';
import { buildQuerySchema } from '../src/querystring';

export async function createTestServer() {
  const server = fastify()
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(jsonApiPlugin);

  const { querySchema, queryValidator } = buildQuerySchema({
    sort: [],
    filters: { teamId: Type.String() },
  });

  server.get(
    '/users',
    { schema: { querystring: querySchema } },
    async (req, reply) => {
      const { filters } = queryValidator(req.query);

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

```

## List

```ts
import { fastify } from 'fastify';
import {
  Type,
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from '@fastify/type-provider-typebox';
import { jsonApiPlugin } from '../src/plugin';
import { buildQuerySchema } from '../src/querystring';

export async function createTestServer() {
  const server = fastify()
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(jsonApiPlugin);

  const { querySchema } = buildQuerySchema({
    sort: ['name'],
    filters: { name: Type.Optional(Type.String()) },
  });

  server.get(
    '/',
    { schema: { querystring: querySchema } },
    async (req, reply) => {
      const { pagination } = req.parseQuery<'name', 'name'>();

      return reply.list({
        items: [
          { id: '1', name: 'one', otherId: '123' },
          { id: '2', name: 'two', otherId: '456' },
        ],
        itemMapper: ({ id, name, otherId }) => {
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
        },
        pagination,
        hasMore: true,
      });
    },
  );

  return server;
}

```
