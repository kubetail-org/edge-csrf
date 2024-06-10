import type { IncomingMessage, ServerResponse } from 'http';

import * as cookielib from 'cookie';

import { CsrfError, createCsrfProtect as _createCsrfProtect, Config, TokenOptions } from '@shared/protect';
import type { ConfigOptions } from '@shared/protect';

export { CsrfError };

/**
 * Parse request body as string
 * @param {IncomingMessage} req - The node http request
 * @returns Promise that resolves to the body
 */
function getRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', (err) => reject(err));
  });
}

/**
 * Represents token options in config
 */
export class NodeHttpTokenOptions extends TokenOptions {
  responseHeader: string = 'X-CSRF-Token';

  constructor(opts?: Partial<NodeHttpTokenOptions>) {
    super(opts);
    Object.assign(this, opts);
  }
}

/**
 * Represents configuration object
 */
export class NodeHttpConfig extends Config {
  excludePathPrefixes: string[] = [];

  token: NodeHttpTokenOptions = new NodeHttpTokenOptions();

  constructor(opts?: Partial<NodeHttpConfigOptions>) {
    super(opts);
    const newOpts = opts || {};
    if (newOpts.token) newOpts.token = new NodeHttpTokenOptions(newOpts.token);
    Object.assign(this, newOpts);
  }
}

/**
 * Represents configuration options object
 */
export interface NodeHttpConfigOptions extends Omit<ConfigOptions, 'token'> {
  token: Partial<NodeHttpTokenOptions>;
}

/**
 * Represents signature of CSRF protect function to be used in node-http request handlers
 */
export type NodeHttpCsrfProtect = {
  (request: IncomingMessage, response: ServerResponse): Promise<void>;
};

/**
 * Create CSRF protection function for use in node-http request handlers
 * @param {Partial<NodeHttpConfigOptions>} opts - Configuration options
 * @returns {NodeHttpCsrfProtect} - The CSRF protect function
 * @throws {CsrfError} - An error if CSRF validation failed
 */
export function createCsrfProtect(opts?: Partial<NodeHttpConfigOptions>): NodeHttpCsrfProtect {
  const config = new NodeHttpConfig(opts);
  const _csrfProtect = _createCsrfProtect(config);

  return async (req, res) => {
    // parse cookies
    const cookies = cookielib.parse(req.headers.cookie || '');

    // init url
    const { url: originalUrl, headers: { host } } = req;
    const url = new URL(`http://${host}${originalUrl || ''}`);

    // init headers
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach((val) => headers.append(key, val));
      else if (value !== undefined) headers.append(key, value);
    });

    // init request object
    const request = new Request(url, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method || '') ? undefined : await getRequestBody(req),
    });

    // execute protect function
    const token = await _csrfProtect({
      request,
      url,
      getCookie: (name) => cookies[name],
      setCookie: (cookie) => {
        const newCookie = cookielib.serialize(cookie.name, cookie.value, cookie);
        const existingCookies = res.getHeader('Set-Cookie');
        if (Array.isArray(existingCookies)) res.setHeader('Set-Cookie', [...existingCookies, newCookie]);
        else if (typeof existingCookies === 'string') res.setHeader('Set-Cookie', [existingCookies, newCookie]);
        else res.setHeader('Set-Cookie', newCookie);
      },
    });

    // add token to response header
    if (token) res.setHeader(config.token.responseHeader, token);
  };
}
