import { operators } from './querystring/filter.js';

export class RangePaginationNotSupportedError extends Error {
  constructor() {
    super(
      'Range pagination is not supported. Please supply either a "before" or "after" cursor',
    );

    Error.captureStackTrace(this, RangePaginationNotSupportedError);

    this.name = 'RangePaginationNotSupportedError';
  }
}

export class InvalidFilterOperatorError extends Error {
  constructor(operator: string, queryKey: string, queryVal: string | number) {
    const message = `Invalid operator '${operator}' in ${queryKey}=${String(
      queryVal,
    )}. Operators must be one of '${operators.join("', '")}'`;

    super(message);

    Error.captureStackTrace(this, InvalidFilterOperatorError);

    this.name = 'InvalidFilterOperatorError';
  }
}
