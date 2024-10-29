import { STATUS_CODES } from 'node:http';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { Pagination, type Item } from './types.js';
import { assembleLinks } from './links.js';
import { parseQuery } from './querystring/parse.js';

const CONTENT_TYPE =
  'application/vnd.api+json; profile="https://jsonapi.org/profiles/ethanresnick/cursor-pagination"';

const PAGINATION_PROFILE =
  'https://jsonapi.org/profiles/ethanresnick/cursor-pagination';

const JSONAPI_VERSION = '1.1';

declare module 'fastify' {
  export interface FastifyRequest {
    parseQuery: typeof parseQuery;
  }

  export interface FastifyReply {
    obj: typeof jsonApiObjResponse;
    list: typeof jsonApiListResponse;
  }
}

interface Data {
  type: string;
  id: string;
  attributes: Record<string, unknown> & { id?: never };
  relationships?: Record<string, unknown>;
  links?: Record<string, string | null>;
}

async function jsonApiListResponse<T extends Item>(
  this: FastifyReply,
  opts: {
    items: T[];
    itemMapper: (arg0: T) => Data;
    hasMore: boolean;
    pagination: Pagination<string>;
  },
) {
  const { items, itemMapper, hasMore, pagination } = opts;
  const self = new URL(
    `${this.request.protocol}://${this.request.host}${this.request.url}`,
  );
  const links = assembleLinks({ self, items, hasMore, pagination });
  const data = items.map(itemMapper);

  return this.header('Content-Type', CONTENT_TYPE).send({
    jsonapi: {
      version: JSONAPI_VERSION,
      profile: [PAGINATION_PROFILE],
    },
    data,
    links,
  });
}

async function jsonApiObjResponse(
  this: FastifyReply,
  opts: {
    type: string;
    item: Item;
    relationships?: Record<string, unknown>;
    meta?: Record<string, unknown>;
    links?: Record<string, string | null>;
  },
) {
  const { type, item, relationships, links = {} } = opts;
  const { id, ...attributes } = item;

  const self = new URL(
    `${this.request.protocol}://${this.request.host}${this.request.url}`,
  );
  links.self = self.toString();

  return this.header('Content-Type', CONTENT_TYPE).send({
    jsonapi: {
      version: JSONAPI_VERSION,
      profile: [PAGINATION_PROFILE],
    },
    data: {
      type,
      id,
      attributes,
      relationships,
    },
    links,
  });
}

function errResponse(err: { statusCode?: number | string; message?: string }) {
  const status = err.statusCode?.toString() ?? 500;
  const title = STATUS_CODES[status] ?? 'Unknown Error';

  return {
    jsonapi: { version: JSONAPI_VERSION },
    errors: [
      {
        status,
        title,
        detail: err.message ?? title,
      },
    ],
  };
}

const _jsonApiPlugin: FastifyPluginAsync<{
  setErrorHandler?: boolean;
  setNotFoundHandler?: boolean;
  // eslint-disable-next-line @typescript-eslint/require-await
}> = async function (
  fastify,
  { setErrorHandler = false, setNotFoundHandler = false },
) {
  fastify.decorateRequest('parseQuery', parseQuery);
  fastify.decorateReply('list', jsonApiListResponse);
  fastify.decorateReply('obj', jsonApiObjResponse);

  if (setNotFoundHandler) {
    fastify.setNotFoundHandler((_req, reply) => {
      return reply.status(404).send(errResponse({ statusCode: 404 }));
    });
  }

  if (setErrorHandler) {
    fastify.setErrorHandler((err, _request, reply) => {
      reply.log.error({ err }, 'Unhandled error');

      return reply.status(err.statusCode ?? 500).send(errResponse(err));
    });
  }
};

export const jsonApiPlugin = fastifyPlugin(_jsonApiPlugin, {
  name: '@robcresswell/fastify-jsonapi',
});
