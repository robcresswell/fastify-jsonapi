import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { Pagination, type Item } from './types.js';
import { assembleLinks } from './links.js';
import { parseQuery } from './querystring/parse.js';
import {
  CONTENT_TYPE,
  JSONAPI_VERSION,
  PAGINATION_PROFILE,
} from './constants.js';
import { errResponse } from './error-response.js';
import { HttpError } from './errors.js';

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
    itemMapper: (value: T, index: number, array: T[]) => Data;
    hasMore: boolean;
    pagination: Pagination<string>;
    meta?: Record<string, unknown>;
  },
) {
  try {
    const { items, itemMapper, hasMore, pagination, meta = {} } = opts;
    const self = new URL(
      `${this.request.protocol}://${this.request.host}${this.request.url}`,
    );
    const links = assembleLinks({ self, items, hasMore, pagination });
    const data = items.map(itemMapper);

    if (!('count' in meta)) {
      meta.count = data.length;
    }

    return await this.header('Content-Type', CONTENT_TYPE).send({
      jsonapi: {
        version: JSONAPI_VERSION,
        profile: [PAGINATION_PROFILE],
      },
      data,
      links,
      meta,
    });
  } catch (err: unknown) {
    return errResponse(
      err instanceof HttpError
        ? err
        : { statusCode: 500, message: 'Internal Server Error' },
    );
  }
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
  try {
    const { type, item, relationships, links = {} } = opts;
    const { id, ...attributes } = item;

    const self = new URL(
      `${this.request.protocol}://${this.request.host}${this.request.url}`,
    );
    links.self = self.toString();

    return await this.header('Content-Type', CONTENT_TYPE).send({
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
  } catch (err: unknown) {
    return errResponse(
      err instanceof HttpError
        ? err
        : { statusCode: 500, message: 'Internal Server Error' },
    );
  }
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
