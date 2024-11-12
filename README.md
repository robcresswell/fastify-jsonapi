# @robcresswell/fastify-jsonapi

A collection of functions to help you build [JSON:API](https://jsonapi.org/)
compliant APIs with [Fastify](https://fastify.dev/) and
[TypeBox](https://github.com/sinclairzx81/typebox)

## Getting Started

1. Install the plugin

   ```sh
   npm i @robcresswell/fastify-jsonapi
   ```

2. Register with Fastify

   ```ts
   import { fastify } from 'fastify';
   import {
     TypeBoxTypeProvider,
     TypeBoxValidatorCompiler,
   } from '@fastify/type-provider-typebox';
   import { jsonApiPlugin } from '@robcresswell/@robcresswell/fastify-jsonapi';

   const app = fastify()
     .withTypeProvider<TypeBoxTypeProvider>()
     .setValidatorCompiler(TypeBoxValidatorCompiler);

   await app.register(jsonApiPlugin);
   ```

## Examples

See [EXAMPLES.md](./EXAMPLES.md)
