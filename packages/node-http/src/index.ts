import type { IncomingMessage, ServerResponse } from 'http';

import * as cookielib from 'cookie';

import { Config, TokenOptions } from '@shared/config';
import type { ConfigOptions } from '@shared/config';
import { CsrfError, createCsrfProtect as _createCsrfProtect } from '@shared/protect';

export { CsrfError };

interface IncomingMessageWithBody extends IncomingMessage {
  body?: any;
}

/**
 * Parse request body as string
 * @param {IncomingMessage} req - The node http request
 * @returns Promise that resolves to the body
 */
function getRequestBody(req: IncomingMessageWithBody): Promise<string> {
  return new Promise((resolve, reject) => {
    const buffer: any[] = [];

    const onAborted = () => {
      reject(new Error('request aborted'));
    };

    const onData = (chunk: any) => {
      buffer.push(chunk);
    };

    const onEnd = () => {
      // add `body` to request for downstream readers
      req.body = Buffer.concat(buffer);

      // Convert Buffer to a string
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
          req.body = JSON.parse(req.body.toString());
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
          req.body = req.body.toString(); // Keep it as a string for form submissions
      } else {
          req.body = req.body.toString(); // Default to string conversion
      }

      resolve(req.body); // Resolve with the properly formatted body
    };

    const onErr = (err: Error) => {
      reject(err);
    };

    const onClose = () => {
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('err', onErr);
      req.removeListener('aborted', onAborted);
      req.removeListener('close', onClose);
    };

    // attach listeners
    req.on('aborted', onAborted);
    req.on('data', onData);
    req.on('end', onEnd);
    req.on('err', onErr);
    req.on('close', onClose);
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
