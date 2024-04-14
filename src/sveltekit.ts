import type { Handle } from '@sveltejs/kit';

import { Config } from './config';
import type { ConfigOptions } from './config';
import {
  createSecret,
  getTokenString,
  createToken,
  verifyToken,
  utoa,
  atou,
} from './util';

export interface EdgeCsrfLocals {
  csrfToken?: string;
}

export function createHandle(opts?: Partial<ConfigOptions>): Handle {
  const config = new Config(opts || {});

  return async ({ event, resolve }) => {
    // check excludePathPrefixes
    for (const pathPrefix of config.excludePathPrefixes) {
      if (event.url.pathname.startsWith(pathPrefix)) return resolve(event);
    }

    // get secret from cookies
    const secretStr = event.cookies.get(config.cookie.name)?.valueOf();

    let secret: Uint8Array;

    // if secret is missing, create new secret and set cookie
    if (secretStr === undefined) {
      secret = createSecret(config.secretByteLength);
      event.cookies.set(config.cookie.name, utoa(secret), config.cookie);
    } else {
      secret = atou(secretStr);
    }

    // verify token
    if (!config.ignoreMethods.includes(event.request.method)) {
      const tokenStr = await getTokenString(event.request, config.token.value);

      if (!await verifyToken(atou(tokenStr), secret)) {
        return new Response('invalid csrf token', { status: 403 });
      }
    }

    // create new token for response
    const newToken = await createToken(secret, config.saltByteLength);
    Object.assign(event.locals, { csrfToken: utoa(newToken) });

    // resolve event
    return resolve(event);
  };
}
