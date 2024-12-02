import { operators } from './querystring/filter.js';

export class HttpError extends Error {
  public statusCode: number;

  constructor(statusCode?: number, message?: string) {
    super(message ?? 'Internal Server Error');

    this.statusCode = statusCode ?? 500;
  }
}

export class RangePaginationNotSupportedError extends HttpError {
  constructor() {
    super(
      400,
      "Range pagination is not supported. Please supply either a 'before' or 'after' cursor",
    );

    Error.captureStackTrace(this, RangePaginationNotSupportedError);

    this.name = 'RangePaginationNotSupportedError';
  }
}

export class InvalidFilterOperatorError extends HttpError {
  constructor(operator: string, queryKey: string, queryVal: string | number) {
    const message = `Invalid operator '${operator}' in ${queryKey}=${String(
      queryVal,
    )}. Operators must be one of '${operators.join("', '")}'`;

    super(400, message);

    Error.captureStackTrace(this, InvalidFilterOperatorError);

    this.name = 'InvalidFilterOperatorError';
  }
}

export class InvalidFilterForNullOrBoolFilterError extends HttpError {
  constructor(operator: string, queryKey: string, queryVal: string | number) {
    const message = `Invalid operator '${operator}' in ${queryKey}=${String(
      queryVal,
    )}. Operators must be one either 'eq' or 'ne' for null or boolean filters`;

    super(400, message);

    Error.captureStackTrace(this, InvalidFilterForNullOrBoolFilterError);

    this.name = 'InvalidFilterForNullOrBoolFilterError';
  }
}

export class InvalidPaginationCursorError extends HttpError {
  constructor(cursor: string) {
    super(400, `Invalid pagination cursor: '${cursor}'`);

    Error.captureStackTrace(this, InvalidPaginationCursorError);

    this.name = 'InvalidPaginationCursorError';
  }
}
