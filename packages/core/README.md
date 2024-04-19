# Core API

This is the documentation for Edge-CSRF's low-level API.

## Install

```console
npm install @edge-csrf/core
# or
pnpm add @edge-csrf/core
# or
yarn add @edge-csrf/core
```

## Documentation

The following methods are named exports in the the `@edge-csrf/core` module:

```
createSecret(length) - Create new secret (cryptographically secure)

  * @param {int} length - Byte length of secret
  * @returns {Uint8Array} - The secret

createToken(secret, saltByteLength) - Create new CSRF token (cryptographically insecure
                                      salt hashed with secret)

  * @param {Uint8Array} secret - The secret
  * @param {int} saltByteLength - Salt length in number of bytes
  * @returns {Promise<Uint8Array>} - A promise returning the token in Uint8Array format

getTokenString(request) - Get the CSRF token from the request

  * @param {Request} request - The request object
  * @returns {Promise<string>} - A promise returning the token in string format

verifyToken(token, secret) - Verify the CSRF token and secret obtained from the request

  * @param {Uint8Array} token - The CSRF token
  * @param {Uint8Array} secret - The CSRF secret
  * @returns {Promise<boolean>} - A promise returning result of verification

utoa(input) - Encode Uint8Array as base64 string

  * @param {Uint8Array} input - The data to be converted from Uint8Array to base64
  * @returns {string} The base64 encoded string

atou(input) - Decode base64 string into Uint8Array

  * @param {string} input - The data to be converted from base64 to Uint8Array
  * @returns {Uint8Array} - The Uint8Array representing the input string
```

__Note__: If you're using these methods you're probably working on a custom framework integration. If so, please consider contributing it back to this project!
