import * as cookielib from 'cookie';
import type { Request as ExpressRequest, Response as ExpressResponse, RequestHandler as ExpressRequestHandler } from 'express';

import { CsrfError, createCsrfProtect as _createCsrfProtect, Config, TokenOptions } from '@shared/protect';
import type { ConfigOptions } from '@shared/protect';

export { CsrfError };

/**
 * Represents token options in config
 */
export class ExpressTokenOptions extends TokenOptions {
  responseHeader: string = 'X-CSRF-Token';

  constructor(opts?: Partial<ExpressTokenOptions>) {
    super(opts);
    Object.assign(this, opts);
  }
}

/**
 * Represents configuration object
 */
export class ExpressConfig extends Config {
  excludePathPrefixes: string[] = [];

  token: ExpressTokenOptions = new ExpressTokenOptions();

  constructor(opts?: Partial<ExpressConfigOptions>) {
    super(opts);
    const newOpts = opts || {};
    if (newOpts.token) newOpts.token = new ExpressTokenOptions(newOpts.token);
    Object.assign(this, newOpts);
  }
}

/**
 * Represents configuration options object
 */
export interface ExpressConfigOptions extends Omit<ConfigOptions, 'token'> {
  token: Partial<ExpressTokenOptions>;
}

/**
 * Represents signature of CSRF protect function to be used in Express middleware
 */
export type ExpressCsrfProtect = {
  (request: ExpressRequest, response: ExpressResponse): Promise<void>;
};

/**
 * Create CSRF protection function for use in Express middleware
 * @param {Partial<ExpressConfigOptions>} opts - Configuration options
 * @returns {ExpressCsrfProtectFunction} - The CSRF protect function
 * @throws {CsrfError} - An error if CSRF validation failed
 */
export function createCsrfProtect(opts?: Partial<ExpressConfigOptions>): ExpressCsrfProtect {
  const config = new ExpressConfig(opts);
  const _csrfProtect = _createCsrfProtect(config);

  return async (req, res) => {
    // parse cookies
    const cookies = cookielib.parse(req.headers.cookie || '');

    // init url
    const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);

    // init headers
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach((val) => headers.append(key, val));
      else if (value !== undefined) headers.append(key, value);
    });

    let body: URLSearchParams | string | undefined;
    if (!['GET', 'HEAD'].includes(req.method)) {
      const contentType = headers.get('content-type') || 'text/plain';
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (typeof req.body === 'object' && ['application/json', 'application/ld+json'].includes(contentType)) {
        body = JSON.stringify(req.body);
      } else {
        body = new URLSearchParams(req.body);
      }
    }

    // init request object
    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    // execute protect function
    const token = await _csrfProtect({
      request,
      url,
      getCookie: (name) => cookies[name],
      setCookie: (cookie) => res.cookie(cookie.name, cookie.value, cookie),
    });

    // add token to response header
    if (token) res.setHeader(config.token.responseHeader, token);
  };
}

/**
 * Create Express middleware function
 * @param {Partial<ExpressConfigOptions>} opts - Configuration options
 * @returns Express Middleware function
 */
export function createCsrfMiddleware(opts?: Partial<ExpressConfigOptions>): ExpressRequestHandler {
  const csrfProtect = createCsrfProtect(opts);

  return async (req, res, next) => {
    // csrf protection
    try {
      await csrfProtect(req, res);
    } catch (err) {
      if (err instanceof CsrfError) {
        res.statusCode = 403;
        res.send('invalid csrf token');
        res.end();
        return;
      }
      throw err;
    }

    next();
  };
}
