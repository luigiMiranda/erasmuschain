export class HttpError extends Error {
  constructor(statusCode, message, internalMessage) {
    super(message);
    this.statusCode = statusCode;
    this.internalMessage = internalMessage || message;
    this.name = 'HttpError';
  }
}

export class BadRequestError extends HttpError {
  constructor(message, internalMessage) {
    super(400, message, internalMessage);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, message, message);
    this.name = 'NotFoundError';
  }
}

export class InternalServerError extends HttpError {
  constructor(message = 'Internal server error', internalMessage) {
    super(500, message, internalMessage || message);
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message = 'Service unavailable', internalMessage) {
    super(503, message, internalMessage || message);
    this.name = 'ServiceUnavailableError';
  }
}