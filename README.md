# @robcresswell/fastify-jsonapi

A collection of functions to help you build [JSON:API](https://jsonapi.org/)
compliant APIs with [Fastify](https://fastify.dev/)

## Getting Started

1. Install the plugin

   ```sh
   npm i @robcresswell/fastify-jsonapi
   ```

2. Register with Fastify

   ```ts
   import { fastify } from 'fastify';
   import { jsonApiPlugin } from '@robcresswell/fastify-jsonapi';

   const app = fastify();
   await app.register(jsonApiPlugin);
   ```

## Examples

See [EXAMPLES.md](./EXAMPLES.md)
