import type { NextRequest, NextResponse } from 'next/server';

import { Config } from './config';
import type { ConfigOptions } from './config';
import {
  createSecret,
  getTokenString,
  createToken,
  verifyToken,
  utoa,
  atou
} from './util';

type CSRFMiddlewareFunction = {
  (request: NextRequest, response: NextResponse): Promise<Error | null>;
};

export default function CreateMiddleware(opts?: Partial<ConfigOptions>): CSRFMiddlewareFunction {
  const config = new Config(opts || {});

  return async (request, response) => {
    let secret: Uint8Array;
    let secretStr: string | undefined;
    
    // get secret from cookies
    secretStr = request.cookies.get(config.cookie.name)?.value

    // if secret is missing, create new secret and set cookie
    if (secretStr === undefined) {
      secret = createSecret(config.secretByteLength)
      const cookie = Object.assign({value: utoa(secret)}, config.cookie);
      response.cookies.set(cookie);
    } else {
      secret = atou(secretStr)
    }

    // verify token
    if (!config.ignoreMethods.includes(request.method)) {
      const tokenStr = await getTokenString(request, config.token.value)
      if (!await verifyToken(atou(tokenStr), secret)) {
        return new Error('csrf validation error')
      }
    }

    // create new token for response
    const newToken = await createToken(secret, config.saltByteLength)
    response.headers.set(config.token.responseHeader, utoa(newToken))

    return null
  }
}
