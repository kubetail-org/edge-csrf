import { NextResponse } from 'next/server';

import { initConfig } from './config';
import {
  createSecret,
  getTokenString,
  createToken,
  verifyToken,
  utoa,
  atou
} from './util';

export default function CreateMiddleware(opts) {
  const config = initConfig(opts);

  return async function csrfProtect(request, response) {
    // get secret from cookies
    let secret = request.cookies.get(config.cookie.name);

    // if secret is missing, create new secret and set cookie
    if (secret === undefined) {
      secret = createSecret(config.secretByteLength);
      response.cookies.set(config.cookie.name, utoa(secret), config.cookie);
    } else {
      secret = atou(secret);
    }

    // verify token
    if (!config.ignoreMethods.includes(request.method)) {
      const tokenStr = await getTokenString(request, config.token.value);
      if (tokenStr === null || !await verifyToken(atou(tokenStr), secret)) {
        return new Error('csrf validation error');
      }
    }

    // create new token for response
    const newToken = await createToken(secret, config.saltByteLength);
    response.headers.set(config.token.responseHeader, utoa(newToken));

    return null;
  };
}
