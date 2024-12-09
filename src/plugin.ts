import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { Pagination, ResourceObject } from './types.js';
import { assembleLinks } from './links.js';
import {
  CONTENT_TYPE,
  JSONAPI_VERSION,
  PAGINATION_PROFILE,
} from './constants.js';
import { errResponse } from './error-response.js';

declare module 'fastify' {
  export interface FastifyReply {
    obj: typeof jsonApiObjResponse;
    list: typeof jsonApiListResponse;
  }
}

async function jsonApiListResponse(
  this: FastifyReply,
  opts: {
    data: ResourceObject[];
    hasMore: boolean;
    pagination: Pagination<string>;
    meta?: Record<string, unknown>;
    included?: ResourceObject[];
  },
) {
  const { data, hasMore, pagination, meta = {}, included } = opts;
  const self = new URL(
    `${this.request.protocol}://${this.request.host}${this.request.url}`,
  );
  const links = assembleLinks({ self, data, hasMore, pagination });

  if (!('count' in meta)) {
    meta.count = data.length;
  }

  return this.status(200)
    .header('Content-Type', CONTENT_TYPE)
    .send({
      jsonapi: {
        version: JSONAPI_VERSION,
        profile: [PAGINATION_PROFILE],
      },
      data,
      links,
      meta,
      included,
    });
}

async function jsonApiObjResponse(
  this: FastifyReply,
  opts: { data: ResourceObject; links?: Record<string, string | null> },
) {
  const { data, links = {} } = opts;

  if (!links.self) {
    const self = new URL(
      `${this.request.protocol}://${this.request.host}${this.request.url}`,
    );
    links.self = self.toString();
  }

  return await this.header('Content-Type', CONTENT_TYPE).send({
    jsonapi: {
      version: JSONAPI_VERSION,
      profile: [PAGINATION_PROFILE],
    },
    data,
    links,
  });
}

const _jsonApiPlugin: FastifyPluginAsync<{
  setErrorHandler?: boolean;
  setNotFoundHandler?: boolean;
  // eslint-disable-next-line @typescript-eslint/require-await
}> = async function (
  fastify,
  { setErrorHandler = false, setNotFoundHandler = false },
) {
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
