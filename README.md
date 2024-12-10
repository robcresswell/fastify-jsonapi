# @robcresswell/fastify-jsonapi

> :warning: :warning: :warning:
>
> You're welcome to use this package, but it's very much in alpha and will
> likely churn API a lot
>
> :warning: :warning: :warning:

A collection of functions to help you build [JSON:API](https://jsonapi.org/)
compliant APIs with [Fastify](https://fastify.dev/)

The goal of this package is to be type-safe and provide good interfaces to build
APIs against the JSON:API spec. It does not aim to be a holistic solution or
framework, only a collection of functions and interfaces. These are generally
easier to use in migrations, for example, or easier to hack around if they don't
work as expected.

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

See [EXAMPLES.md](./EXAMPLES.md) for more detailed examples
