import { STATUS_CODES } from 'node:http';
import { JSONAPI_VERSION, PAGINATION_PROFILE } from './constants.js';
import { FastifyReply } from 'fastify';

interface HttpError {
  statusCode: string | number;
  message?: string;
}

function isHttpErr(err: unknown): err is HttpError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'statusCode' in err &&
    (typeof err.statusCode === 'string' ||
      typeof err.statusCode === 'number') &&
    (!('message' in err) ||
      ('message' in err && typeof err.message === 'string'))
  );
}

export function createErrBody(
  status: string | number = '500',
  detail?: string,
) {
  const title = STATUS_CODES[status] ?? 'Internal Server Error';

  return {
    jsonapi: { version: JSONAPI_VERSION, profile: [PAGINATION_PROFILE] },
    errors: [
      {
        status: status.toString(),
        title,
        detail: detail ?? title,
      },
    ],
  };
}

export function errResponse(err: unknown) {
  if (!isHttpErr(err)) {
    return createErrBody('500');
  }

  const status = err.statusCode.toString();

  return createErrBody(status, err.message);
}

export function errReply(status: number) {
  return function (this: FastifyReply, detail?: string) {
    return this.status(status).send(createErrBody(status, detail));
  };
}
