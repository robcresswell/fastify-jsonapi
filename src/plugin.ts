import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { Pagination, ResourceObject } from './types.js';
import { assembleLinks } from './links.js';
import {
  CONTENT_TYPE,
  JSONAPI_VERSION,
  PAGINATION_PROFILE,
} from './constants.js';
import { errReply, errResponse } from './error-response.js';

declare module 'fastify' {
  export interface FastifyReply {
    obj: typeof jsonApiObjResponse;
    list: typeof jsonApiListResponse;

    notFound: (detail?: string) => void;
    unauthorized: (detail?: string) => void;
    paymentRequired: (detail?: string) => void;
    forbidden: (detail?: string) => void;
    badRequest: (detail?: string) => void;
    methodNotAllowed: (detail?: string) => void;
    notAcceptable: (detail?: string) => void;
    proxyAuthenticationRequired: (detail?: string) => void;
    requestTimeout: (detail?: string) => void;
    conflict: (detail?: string) => void;
    gone: (detail?: string) => void;
    lengthRequired: (detail?: string) => void;
    preconditionFailed: (detail?: string) => void;
    payloadTooLarge: (detail?: string) => void;
    uriTooLong: (detail?: string) => void;
    unsupportedMediaType: (detail?: string) => void;
    rangeNotSatisfiable: (detail?: string) => void;
    expectationFailed: (detail?: string) => void;
    imateapot: (detail?: string) => void;
    misdirectedRequest: (detail?: string) => void;
    unprocessableEntity: (detail?: string) => void;
    locked: (detail?: string) => void;
    failedDependency: (detail?: string) => void;
    tooEarly: (detail?: string) => void;
    upgradeRequired: (detail?: string) => void;
    preconditionRequired: (detail?: string) => void;
    tooManyRequests: (detail?: string) => void;
    requestHeaderFieldsTooLarge: (detail?: string) => void;
    unavailableForLegalReasons: (detail?: string) => void;
    internalServerError: (detail?: string) => void;
    notImplemented: (detail?: string) => void;
    badGateway: (detail?: string) => void;
    serviceUnavailable: (detail?: string) => void;
    gatewayTimeout: (detail?: string) => void;
    httpVersionNotSupported: (detail?: string) => void;
    variantAlsoNegotiates: (detail?: string) => void;
    insufficientStorage: (detail?: string) => void;
    loopDetected: (detail?: string) => void;
    bandwidthLimitExceeded: (detail?: string) => void;
    notExtended: (detail?: string) => void;
    networkAuthenticationRequired: (detail?: string) => void;
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

  fastify.decorateReply('badRequest', errReply(400));
  fastify.decorateReply('unauthorized', errReply(401));
  fastify.decorateReply('paymentRequired', errReply(402));
  fastify.decorateReply('forbidden', errReply(403));
  fastify.decorateReply('notFound', errReply(404));
  fastify.decorateReply('methodNotAllowed', errReply(405));
  fastify.decorateReply('notAcceptable', errReply(406));
  fastify.decorateReply('proxyAuthenticationRequired', errReply(407));
  fastify.decorateReply('requestTimeout', errReply(408));
  fastify.decorateReply('conflict', errReply(409));
  fastify.decorateReply('gone', errReply(410));
  fastify.decorateReply('lengthRequired', errReply(411));
  fastify.decorateReply('preconditionFailed', errReply(412));
  fastify.decorateReply('payloadTooLarge', errReply(413));
  fastify.decorateReply('uriTooLong', errReply(414));
  fastify.decorateReply('unsupportedMediaType', errReply(415));
  fastify.decorateReply('rangeNotSatisfiable', errReply(416));
  fastify.decorateReply('expectationFailed', errReply(417));
  fastify.decorateReply('imateapot', errReply(418));
  fastify.decorateReply('misdirectedRequest', errReply(421));
  fastify.decorateReply('unprocessableEntity', errReply(422));
  fastify.decorateReply('locked', errReply(423));
  fastify.decorateReply('failedDependency', errReply(424));
  fastify.decorateReply('tooEarly', errReply(425));
  fastify.decorateReply('upgradeRequired', errReply(426));
  fastify.decorateReply('preconditionRequired', errReply(428));
  fastify.decorateReply('tooManyRequests', errReply(429));
  fastify.decorateReply('requestHeaderFieldsTooLarge', errReply(431));
  fastify.decorateReply('unavailableForLegalReasons', errReply(451));
  fastify.decorateReply('internalServerError', errReply(500));
  fastify.decorateReply('notImplemented', errReply(501));
  fastify.decorateReply('badGateway', errReply(502));
  fastify.decorateReply('serviceUnavailable', errReply(503));
  fastify.decorateReply('gatewayTimeout', errReply(504));
  fastify.decorateReply('httpVersionNotSupported', errReply(505));
  fastify.decorateReply('variantAlsoNegotiates', errReply(506));
  fastify.decorateReply('insufficientStorage', errReply(507));
  fastify.decorateReply('loopDetected', errReply(508));
  fastify.decorateReply('bandwidthLimitExceeded', errReply(509));
  fastify.decorateReply('notExtended', errReply(510));
  fastify.decorateReply('networkAuthenticationRequired', errReply(511));

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
