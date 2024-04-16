import type { Handle, RequestEvent } from '@sveltejs/kit';

import { CsrfError } from '@/lib/errors';
import { createCsrfProtect as _createCsrfProtect, Config, TokenOptions } from '@/lib/protect';
import type { ConfigOptions } from '@/lib/protect';

export type SveltekitTokenOptions = TokenOptions;

export type SveltekitConfig = Config;

export type SveltekitConfigOptions = ConfigOptions;

/**
 * Represents locals added to Svelte by Edge-CSRF
 */
export interface EdgeCsrfLocals {
  csrfToken?: string;
}

/**
 * Represents signature of CSRF protect function to be used in SvelteKit handle
 */
export type SveltekitCsrfProtect = {
  (request: RequestEvent): Promise<void>;
};

/**
 * Create CSRF protection function for use in a SvelteKit handle
 * @param {Partial<SveltekitConfigOptions>} opts - Configuration options
 * @returns {SveltekitCsrfProtectFunction} - The CSRF protect function
 * @throws {CsrfError} - An error if CSRF validation failed
 */
export function createCsrfProtect(opts?: Partial<SveltekitConfigOptions>): SveltekitCsrfProtect {
  const config = new Config(opts);
  const _csrfProtect = _createCsrfProtect(config);

  return async (event) => {
    // execute protect function
    const token = await _csrfProtect({
      request: event.request,
      url: event.url,
      getCookie: (name) => event.cookies.get(name)?.valueOf(),
      setCookie: (cookie) => event.cookies.set(cookie.name, cookie.value, cookie),
    });

    // add token to locals
    if (token) Object.assign(event.locals, { csrfToken: token });
  };
}

/**
 * Create SvelteKit handle
 * @param {Partial<SveltekitConfigOptions>} opts - Configuration options
 * @returns {Handle} The SvelteKit handle
 */
export function createHandle(opts?: Partial<SveltekitConfigOptions>): Handle {
  const csrfProtect = createCsrfProtect(opts);

  return async ({ event, resolve }) => {
    try {
      await csrfProtect(event);
    } catch (err) {
      if (err instanceof CsrfError) return new Response('invalid csrf token', { status: 403 });
      throw err;
    }

    return resolve(event);
  };
}
